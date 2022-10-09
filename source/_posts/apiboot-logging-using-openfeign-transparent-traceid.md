---
id: apiboot-logging-using-openfeign-transparent-traceid
title: ApiBoot Logging使用SpringCloud Openfeign透传链路信息
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: true
news: true
tags:
  - ApiBoot
categories:
  - ApiBoot
keywords: apiboot,logging,openfeign
description: 'ApiBoot Logging使用SpringCloud Openfeign透传链路信息'
date: 2019-11-05 15:47:14
article_url:
---
`ApiBoot Logging`可以无缝整合`SpringCloud`来采集请求日志，目前支持`RestTemplate`、`Openfeign`两种方式，我们本章来讲解下在使用`Openfeign`完成服务之间请求相互调用的一条链路请求日志是否可以都采集到。
<!--more-->

## 搭建Eureka Server
我们先来搭建一个`Eureka Server`，请访问【{% post_path eureka-server %}】文章内容查看具体搭建流程。
## 搭建Logging Admin
我们需要搭建一个`Logging Admin`用于接收`Logging Client`上报的请求日志，请访问【[ApiBoot Logging整合SpringCloud Eureka负载均衡上报日志](http://localhost:4000/apiboot-logging-integrates-eureka-report-logs.html#%E5%B0%86Logging-Admin%E6%B3%A8%E5%86%8C%E5%88%B0Eureka)】查看具体的搭建流程。

我们本章来模拟**提交订单**的业务逻辑，涉及到两个服务，分别是：`商品服务`、`订单服务`，接下来我们需要来创建这两个服务。

**本章源码采用`Maven`多模块的形式进行编写，请拉至文章末尾查看下载本章源码。**

## 添加ApiBoot & SpringCloud统一版本

由于是采用`Maven 多模块`项目，存在**继承**关系，我们只需要在`root`模块添加版本依赖即可，其他子模块就可以直接使用，如下所示：

```xml
<properties>
  <java.version>1.8</java.version>
  <!--ApiBoot版本号-->
  <api.boot.version>2.1.5.RELEASE</api.boot.version>
  <!--SpringCloud版本号-->
  <spring.cloud.version>Greenwich.SR3</spring.cloud.version>
</properties>
<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>org.minbox.framework</groupId>
      <artifactId>api-boot-dependencies</artifactId>
      <version>${api.boot.version}</version>
      <type>pom</type>
      <scope>import</scope>
    </dependency>
    <dependency>
      <groupId>org.springframework.cloud</groupId>
      <artifactId>spring-cloud-dependencies</artifactId>
      <version>${spring.cloud.version}</version>
      <type>pom</type>
      <scope>import</scope>
    </dependency>
  </dependencies>
</dependencyManagement>
```



## 创建公共Openfeign接口定义

学习过`Openfeign`的同学应该都知道，`Openfeign`可以继承实现，我们只需要创建一个公共的**服务接口定义**，在实现该接口的服务进行业务实现，在调用该接口的地方直接注入即可。
下面我们创建一个名为`common-openfeign`的公共依赖项目，`pom.xml`添加依赖如下所示：

```xml
<dependencies>
  <!--SpringBoot Web-->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <optional>true</optional>
  </dependency>
  <!--Openfeign-->
  <dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-openfeign</artifactId>
    <optional>true</optional>
  </dependency>
</dependencies>
```

在提交订单时我们简单模拟需要获取商品的单价，所以在`common-openfeign`项目内我们要提供一个查询商品单价的服务接口，创建一个名为`GoodClient`的接口如下所示：

```java
package org.minbox.chapter.common.openfeign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * 商品服务接口定义
 *
 * @author 恒宇少年
 */
@FeignClient(name = "good-service")
@RequestMapping(value = "/good")
public interface GoodClient {
    /**
     * 获取商品价格
     *
     * @param goodId 商品编号
     * @return
     */
    @GetMapping(value = "/{goodId}")
    Double getGoodPrice(@PathVariable("goodId") Integer goodId);
}
```

**注解解释：**

- `@FeignClient`：`SpringCloud Openfeign`提供的接口客户端定义注解，通过`value`或者`name`来指定`GoodClient`访问的具体`ServiceID`，这里我们配置的`value`值为`good-service`项目`spring.application.name`配置参数（`ServiceID` = `spring.application.name`）。

> 这样当我们通过注入`GoodClient`接口调用`getGoodPrice`方法时，底层通过`Openfeign`的`Http`代理访问`good-service`的对应接口。

## 创建商品服务

下面我们再来创建一个名为`good-service`的`SpringBoot`项目。
### 添加相关依赖

在`pom.xml`项目配置文件内添加如下依赖：

```xml
<dependencies>
  <!--ApiBoot Logging Client-->
  <dependency>
    <groupId>org.minbox.framework</groupId>
    <artifactId>api-boot-starter-logging</artifactId>
  </dependency>

  <!--SpringBoot Web-->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
  </dependency>

  <!--Eureka Client-->
  <dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
  </dependency>

  <!--公共Openfeign接口定义依赖-->
  <dependency>
    <groupId>org.minbox.chapter</groupId>
    <artifactId>common-openfeign</artifactId>
    <version>0.0.1-SNAPSHOT</version>
  </dependency>
</dependencies>
```

可以看到我们在`good-service`项目依赖内添加了我们在上面创建的`common-openfeign`依赖模块，因为`GoodClient`服务接口的实现是在`good-service`项目内，我们需要添加`common-openfeign`依赖后创建对应的`XxxController`并实现`GoodClient`接口完成对应的业务逻辑实现。

### 商品业务实现

这里我们简单做个示例，将价格固定返回，实现`GoodClient`的控制器如下所示：

```java
package org.minbox.chapter.good.service;

import org.minbox.chapter.common.openfeign.GoodClient;
import org.springframework.web.bind.annotation.RestController;

/**
 * 商品服务接口实现
 *
 * @author 恒宇少年
 * @see GoodClient
 */
@RestController
public class GoodController implements GoodClient {
    @Override
    public Double getGoodPrice(Integer goodId) {
        if (goodId == 1) {
            return 15.6;
        }
        return 0D;
    }
}
```

### 注册到Eureka Server

我们需要将`good-service`注册到`Eureka Server`，修改`application.yml`配置文件如下所示：

```yaml
# ServiceID
spring:
  application:
    name: good-service
# 端口号
server:
  port: 8082
# Eureka Config
eureka:
  client:
    service-url:
      defaultZone: http://127.0.0.1:10000/eureka/
  instance:
    prefer-ip-address: true
```

### 配置上报的Logging Admin

我们需要将`good-service`的请求日志上报到`Logging Admin`，采用`SpringCloud ServiceID`的方式配置，修改`application.yml`配置文件如下所示：

```yaml
api:
  boot:
    logging:
      # 控制台打印日志
      show-console-log: true
      # 美化打印日志
      format-console-log-json: true
      # 配置Logging Admin 服务编号
      discovery:
        service-id: logging-admin
```

### 启用Eureka Client & Logging

最后我们在`XxxApplication`入口类添加注解来启用`Eureka Client`以及`Logging Client`，如下所示：

```java
/**
 * 商品服务
 *
 * @author 恒宇少年
 */
@SpringBootApplication
@EnableLoggingClient
@EnableDiscoveryClient
public class GoodServiceApplication {
    /**
     * logger instance
     */
    static Logger logger = LoggerFactory.getLogger(GoodServiceApplication.class);

    public static void main(String[] args) {
        SpringApplication.run(GoodServiceApplication.class, args);
        logger.info("{}服务启动成功.", "商品");
    }
}
```

> 至此我们的商品服务已经准备完成.

## 创建订单服务
创建一个名为`order-service`的`SpringBoot`项目（建议参考源码，本章采用Maven多模块创建）。
### 添加相关依赖
修改`pom.xml`添加相关依赖如下所示：
```xml
<dependencies>
  <!--ApiBoot Logging Client-->
  <dependency>
    <groupId>org.minbox.framework</groupId>
    <artifactId>api-boot-starter-logging</artifactId>
  </dependency>

  <!--SpringBoot Web-->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
  </dependency>

  <!--Eureka Client-->
  <dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
  </dependency>

  <!--Openfeign-->
  <dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-openfeign</artifactId>
  </dependency>

  <!--公共Openfeign接口定义依赖-->
  <dependency>
    <groupId>org.minbox.chapter</groupId>
    <artifactId>common-openfeign</artifactId>
    <version>0.0.1-SNAPSHOT</version>
  </dependency>
</dependencies>
```
### 订单业务实现

我们来模拟一个**提交订单**的场景，创建一个名为`OrderController`的控制器，如下所示：

```java
/**
 * 订单控制器
 *
 * @author 恒宇少年
 */
@RestController
@RequestMapping(value = "/order")
public class OrderController {
    /**
     * 商品接口定义注入
     * {@link GoodClient}
     */
    @Autowired
    private GoodClient goodClient;

    @PostMapping
    public String submit(Integer goodId, Integer buyCount) {
        Double goodPrice = goodClient.getGoodPrice(goodId);
        Double orderAmount = goodPrice * buyCount;
        //...
        return "订单提交成功，订单总金额：" + orderAmount;
    }
}
```



### 注册到Eureka Server

将我们创建的`order-service`注册到`Eureka Server`，修改`application.yml`配置文件如下所示：

```yaml
spring:
  application:
    name: order-service
server:
  port: 8081
# Eureka Config
eureka:
  client:
    service-url:
      defaultZone: http://127.0.0.1:10000/eureka/
  instance:
    prefer-ip-address: true
```

### 配置上报的Logging Admin

我们需要将`order-service`的请求日志上报到`Logging Admin`，采用`SpringCloud ServiceID`的方式配置，修改`application.yml`配置文件如下所示：

```yaml
api:
  boot:
    logging:
      # 控制台打印日志
      show-console-log: true
      # 美化打印日志
      format-console-log-json: true
      # 配置Logging Admin 服务编号
      discovery:
        service-id: logging-admin
```

### 启用Eureka Client & Logging

修改`order-service`入口类`OrderServiceApplication`，添加启用`Eureka Client`、`Logging Client`的注解，如下所示：

```java
/**
 * 订单服务
 *
 * @author 恒宇少年
 */
@SpringBootApplication
@EnableDiscoveryClient
@EnableLoggingClient
@EnableFeignClients(basePackages = "org.minbox.chapter.common.openfeign")
public class OrderServiceApplication {
    /**
     * logger instance
     */
    static Logger logger = LoggerFactory.getLogger(OrderServiceApplication.class);

    public static void main(String[] args) {
        SpringApplication.run(OrderServiceApplication.class, args);
        logger.info("{}服务启动成功.", "");
    }
}
```

**注解解释：**

- `@EnableFeignClients`：该注解是`Openfeign`提供的启用自动扫描`Client`的配置，我们通过`basePackages`（基础包名）的方式进行配置扫描包下配置`@FeignClient`注解的接口，并为**每个接口**生成对应的`代理实现`并添加到`Spring IOC`容器。

  `org.minbox.chapter.common.openfeign`包名在`common-openfeign`项目内。

## 运行测试

依次启动项目，`eureka-server` > `logging-admin` > `good-service` > `order-service`。

通过`curl`命令访问`order-service`内的提交订单地址：`/order`，如下所示：

```bash
➜ ~ curl -X POST http://localhost:8081/order\?goodId\=1\&buyCount\=3
订单提交成功，订单总金额：46.8
```

> 可以看到我们已经可以成功的获取订单的总金额，我们在`/order`请求方法内调用`good-service`获取商品的单价后计算得到订单总金额。

### 测试点：链路信息传递

我们通过控制台输出的日志信息来确认下链路信息（traceId、spanId）的透传是否正确。

**收到order-service上报的日志**

```json
Receiving Service: 【order-service -> 127.0.0.1】, Request Log Report，Logging Content：[
	{
		"endTime":1573009439840,
		"httpStatus":200,
		"requestBody":"",
		"requestHeaders":{
			"host":"localhost:8081",
			"user-agent":"curl/7.64.1",
			"accept":"*/*"
		},
		"requestIp":"0:0:0:0:0:0:0:1",
		"requestMethod":"POST",
		"requestParam":"{\"buyCount\":\"3\",\"goodId\":\"1\"}",
		"requestUri":"/order",
		"responseBody":"订单提交成功，订单总金额：46.8",
		"responseHeaders":{},
		"serviceId":"order-service",
		"serviceIp":"127.0.0.1",
		"servicePort":"8081",
		"spanId":"241ef717-b0b3-4fcc-adae-b63ffd3dbbe4",
		"startTime":1573009439301,
		"timeConsuming":539,
		"traceId":"3e20cc72-c880-4575-90ed-d54a6b4fe555"
	}
]
```



**收到good-service上报的日志**

```json
Receiving Service: 【good-service -> 127.0.0.1】, Request Log Report，Logging Content：[
	{
		"endTime":1573009439810,
		"httpStatus":200,
		"parentSpanId":"241ef717-b0b3-4fcc-adae-b63ffd3dbbe4",
		"requestBody":"",
		"requestHeaders":{
			"minbox-logging-x-parent-span-id":"241ef717-b0b3-4fcc-adae-b63ffd3dbbe4",
			"minbox-logging-x-trace-id":"3e20cc72-c880-4575-90ed-d54a6b4fe555",
			"host":"10.180.98.156:8082",
			"connection":"keep-alive",
			"accept":"*/*",
			"user-agent":"Java/1.8.0_211"
		},
		"requestIp":"10.180.98.156",
		"requestMethod":"GET",
		"requestParam":"{}",
		"requestUri":"/good/1",
		"responseBody":"15.6",
		"responseHeaders":{},
		"serviceId":"good-service",
		"serviceIp":"127.0.0.1",
		"servicePort":"8082",
		"spanId":"6339664e-097d-4a01-a734-935de52a7d44",
		"startTime":1573009439787,
		"timeConsuming":23,
		"traceId":"3e20cc72-c880-4575-90ed-d54a6b4fe555"
	}
]
```

 **结果分析：**

- 请求日志的入口为`order-service`所以并不存在`parentSpanId`（上级单元编号），而`spanId`（单元编号）、`traceId`（链路编号）也是新生成的。

- 本次请求会经过`good-service`服务，因此`parentSpanId`则是`order-service`生成的`spanId`，`traceId`同样也是`order-service`生成的，透传HttpHeader方式进行传递，表示在同一条请求链路上。

## 敲黑板，划重点

`ApiBoot Logging`支持使用`Openfeign`传递链路信息，内部通过`Openfeign`拦截器实现，源码详见：`org.minbox.framework.logging.client.http.openfeign.LoggingOpenFeignInterceptor`。

将`traceId`（链路编号）、`parentSpanId`（单元编号）通过`HttpHeader`的形式传递到目标访问服务，服务通过请求日志拦截器进行提取并设置链路绑定关系。

- `traceId`传递时HttpHeader名称为：`minbox-logging-x-trace-id`.
- `parentSpanId`传递时HttpHeader名称为：`minbox-logging-x-parent-span-id`

## 代码示例
如果您喜欢本篇文章请为源码仓库点个`Star`，谢谢！！！
本篇文章示例源码可以通过以下途径获取，目录为`apiboot-logging-using-openfeign-transparent-traceid`：

- Gitee：[https://gitee.com/minbox-projects/api-boot-chapter](https://gitee.com/minbox-projects/api-boot-chapter)
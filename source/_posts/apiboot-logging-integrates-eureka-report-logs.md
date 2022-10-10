---
id: apiboot-logging-integrates-eureka-report-logs
title: ApiBoot Logging整合SpringCloud Eureka负载均衡上报日志
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: true
news: true
tags: [ApiBoot,日志组件]
categories: [ApiBoot]
keywords: 'SpringCloud,SpringBoot,恒宇少年,微服务'
description: 'ApiBoot Logging整合SpringCloud Eureka负载均衡上报日志'
date: 2019-11-04 16:33:12
article_url:
---
`ApiBoot Logging`支持整合`服务注册中心`（Eureka、Consul、Nacos Discovery、Zookeeper...）进行上报请求日志，`Logging Client`会从服务注册中心内找到指定`ServiceID`的`Logging Admin`具体可用实例，通过`SpringCloud Discovery`内部的负载均衡策略返回`Logging Admin`的部署`服务器IP`以及`端口号`，这样`Logging Client`就可以完成请求日志的上报流程。

<!--more-->
## 搭建Eureka Server
我们先来搭建一个`Eureka Server`，请访问【{% post_path eureka-server %}】文章内容查看具体搭建流程。

## 将Logging Admin注册到Eureka
既然使用的是`服务注册中心`，我们需要将之前章节将的`Logging Admin`进行简单的改造，添加`Eureka`客户端相关的依赖，并在`application.yml`配置文件内添加`Eureka Server`的相关配置，如果对`Logging Admin`不了解的同学可以访问【{% post_path apiboot-report-logs-by-logging-to-admin %}】查看文章内容，文章底部有源码。
### 添加Eureka Client依赖
我们需要将`Logging Admin`注册到`Eureka Server`，对于`Eureka Server`而言`Logging Admin`是一个`客户端`（Eureka Client）角色。

我们在`pom.xml`文件内添加如下配置：

```xml
<!--Eureka Client-->
<dependency>
  <groupId>org.springframework.cloud</groupId>
  <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
</dependency>
```

### 启用Eureka Client

添加依赖后我们还需要在`XxxApplication`入口类添加`@EnableDiscoveryClient`注解来启用`Eureka Client`的相关功能，如下所示：

```java
@SpringBootApplication
@EnableLoggingAdmin
@EnableDiscoveryClient
public class LoggingAdminApplication {
    /**
     * logger instance
     */
    static Logger logger = LoggerFactory.getLogger(LoggingAdminApplication.class);

    public static void main(String[] args) {
        SpringApplication.run(LoggingAdminApplication.class, args);
        logger.info("{}服务启动成功.", "日志管理中心");
    }
}
```



### 配置注册到Eureka Server

我们在`application.yml`配置文件内添加连接到`Eureka Server`的相关配置信息，如下所示：

```yaml
# Eureka Config
eureka:
  client:
    service-url:
      defaultZone: http://127.0.0.1:10000/eureka/
  instance:
    prefer-ip-address: true
```

## 将Logging Client注册到Eureka

`Logging Client`其实就是我们的业务服务，不要被名称误导，我们在本章源码内创建一个`user-service`模块来作为测试的业务服务，我们也需要将`user-service`作为客户端注册到`Eureka Server`，可参考【[使用ApiBoot Logging进行统一管理请求日志](https://blog.minbox.org/apiboot-unified-manage-request-logs.html)】文章内容创建项目。

### 添加Eureka Client依赖

在`pom.xml`配置文件内添加如下依赖：

```xml
<!--Eureka Client-->
<dependency>
  <groupId>org.springframework.cloud</groupId>
  <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
</dependency>
```

### 启用Eureka Client

添加依赖后同样需要启用`Eureak Client`，这是必不可少的步骤，在我们的入口类`XxxApplication`上添加如下所示：

```java
@SpringBootApplication
@EnableDiscoveryClient
@EnableLoggingClient
public class UserServiceApplication {
    /**
     * logger instance
     */
    static Logger logger = LoggerFactory.getLogger(UserServiceApplication.class);

    public static void main(String[] args) {
        SpringApplication.run(UserServiceApplication.class, args);
        logger.info("{}服务启动成功.", "用户");
    }
}
```



### 配置注册到Eureka Server

我们在`application.yml`配置文件内添加`Eureka Server`的相关配置信息，如下所示：

```yaml
# Eureka Config
eureka:
  client:
    service-url:
      defaultZone: http://127.0.0.1:10000/eureka/
  instance:
    prefer-ip-address: true
```

### 配置Logging Admin服务信息

这是本章的核心内容，我们在之前都是通过`api.boot.logging.admin.server-address`参数进行配置`Logging Admin`的`IP地址`以及`服务端口号`，而本章我们就要借助`服务注册中心`（Eureka Server）来从实例列表中获取`Logging Admin`服务信息，`ApiBoot Logging`提供了一个配置参数`api.boot.logging.discovery.service-id`进行配置`Logging Admin`的`ServiceID`，也就是`spring.application.name`参数对应的值，如下所示：

```yaml
# ApiBoot Config
api:
  boot:
    logging:
      discovery:
        # Logging Admin ServiceID
        service-id: logging-admin
      show-console-log: true
      format-console-log-json: true
```

> 每当我们发起请求时，Logging Client就会从`Eureak Server`内获取`ServiceID = logging-admin`的服务列表，负载均衡筛选后获取一个**可用的实例**信息进行上报日志。

## 运行测试

我们将本章源码内用到的三个服务`eureka-server`、`logging-admin`、`user-service`依次启动。

通过`curl`命令访问`user-service`提供的`Controller`地址，如下所示：

```bash
➜ ~ curl http://localhost:9090/test\?name\=admin
你好：admin
```

我们可以在`logging-admin`控制台看到`user-service`上报的请求日志信息，如下所示：

```json
Receiving Service: 【user-service -> 127.0.0.1】, Request Log Report，Logging Content：[
	{
		"endTime":1572921905360,
		"httpStatus":200,
		"requestBody":"",
		"requestHeaders":{
			"host":"localhost:9090",
			"user-agent":"curl/7.64.1",
			"accept":"*/*"
		},
		"requestIp":"0:0:0:0:0:0:0:1",
		"requestMethod":"GET",
		"requestParam":"{\"name\":\"admin\"}",
		"requestUri":"/test",
		"responseBody":"你好：admin",
		"responseHeaders":{},
		"serviceId":"user-service",
		"serviceIp":"127.0.0.1",
		"servicePort":"9090",
		"spanId":"d97c515f-a147-4f89-9c59-398905c95a73",
		"startTime":1572921905336,
		"timeConsuming":24,
		"traceId":"5e6c0357-1625-4a28-af18-cacdddba146a"
	}
]
```

自此我们已经成功的整合`Eureka`与`ApiBoot Logging`。

## 敲黑板，划重点

`ApiBoot Logging`内部提供的两种获取`Logging Admin`服务信息的方式，分别是：`service-id`、`server-address`，都是比较常用的，使用`service-id`方式可以无缝整合`SpringCloud`进行使用，而链路信息可以通过`Openfeign`、`RestTemplate`进行传递，这会在我们后期的知识点中讲到。

## 代码示例
如果您喜欢本篇文章请为源码仓库点个`Star`，谢谢！！！
本篇文章示例源码可以通过以下途径获取，目录为`apiboot-logging-integrates-eureka-report-logs`：

- Gitee：[https://gitee.com/minbox-projects/api-boot-chapter](https://gitee.com/minbox-projects/api-boot-chapter)

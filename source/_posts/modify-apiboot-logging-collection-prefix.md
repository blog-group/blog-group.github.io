---
id: modify-apiboot-logging-collection-prefix
title: 修改ApiBoot Logging日志采集的前缀
article_type: 原创
article_author: 于起宇
enable_comment: true
news: true
tags: [ApiBoot, 日志组件]
categories: [ApiBoot]
keywords: apiboot,springboot,logging
date: 2019-10-28 21:11:02
article_url:
description: '修改ApiBoot Logging日志采集的前缀'
---
`ApiBoot Logging`支持指定单个或者多个路径的前缀进行采集，也就是我们可以指定`/user/**`或者`/order/**`下的**单个**或者**同时指定多个**路径进行采集请求日志，其他不符合`Ant`表达式的路径就会被忽略掉。
<!--more-->

## 创建示例项目

使用`idea`创建`SpringBoot`项目。

### 添加ApiBoot Logging依赖

创建项目后在`pom.xml`配置文件内添加依赖如下所示：

```xml
<dependencies>
  <!--Web-->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
  </dependency>
  <!--ApiBoot Logging-->
  <dependency>
    <groupId>org.minbox.framework</groupId>
    <artifactId>api-boot-starter-logging</artifactId>
  </dependency>
</dependencies>
<!--ApiBoot版本依赖-->
<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>org.minbox.framework</groupId>
      <artifactId>api-boot-dependencies</artifactId>
      <version>2.1.4.RELEASE</version>
      <scope>import</scope>
      <type>pom</type>
    </dependency>
  </dependencies>
</dependencyManagement>
```



### 默认拦截路径

`ApiBoot Logging`默认的拦截路径是`/**`，可以访问`org.minbox.framework.api.boot.autoconfigure.logging.ApiBootLoggingProperties`属性配置类查看源码。

### 配置采集拦截器前缀

`ApiBoot Logging`提供了在`application.yml`配置文件内修改的配置参数`api.boot.logging.logging-path-prefix`，该配置参数接收的类型为`java.lang.String[]`，所以我们可以使用`,`逗号隔开配置多个路径，如下所示：

```yaml
spring:
  application:
    name: modify-apiboot-logging-collection-prefix
server:
  port: 8080

api:
  boot:
    # ApiBoot Logging 相关配置
    logging:
      # 修改采集日志的前缀
      logging-path-prefix: /user/**,/order/**
      # 控制台打印日志
      show-console-log: true
      # 美化控制台打印的日志
      format-console-log-json: true
```



### 启用ApiBoot Logging Client

配置已经完成，下面我们在`入口类（XxxApplication）`或者`配置类（XxxConfiguration）`上添加`@EnableLoggingClient`注解来启用`ApiBoot Logging`的功能，如下所示：

```java
/**
 * 入口类
 *
 * @author 恒宇少年
 */
@SpringBootApplication
@EnableLoggingClient
public class ModifyApibootLoggingCollectionPrefixApplication {

    public static void main(String[] args) {
        SpringApplication.run(ModifyApibootLoggingCollectionPrefixApplication.class, args);
    }

}
```

## 运行测试

使用`idea`的Application或者`java -jar xxx.jar`的形式来运行本章源码，本章源码的端口号配置为`8080`，我们需要从下面几个点进行测试。

### 测试点：匹配/user/**路径

添加测试控制器类`UserController`如下所示：

```java
@RestController
@RequestMapping(value = "/user")
public class UserController {
    /**
     * 测试日志拦截路径接口
     *
     * @param name
     * @return
     */
    @GetMapping
    public String welcome(@RequestParam("name") String name) {
        return "hello, " + name;
    }
}
```



通过如下命令访问测试接口：

```bash
➜ ~ curl http://localhost:8080/user\?name\=hengboy
hello, hengboy
```

`/user`路径匹配`/user/**`表达式，**所以我们在控制台可以看到请求日志的打印**。

### 测试点：匹配/order/**路径

添加测试控制器类`OrderController`如下所示：

```java
@RestController
@RequestMapping(value = "/order")
public class OrderController {

    @PostMapping
    public String submit() {
        return "订单：" + UUID.randomUUID().toString() + "，提交成功.";
    }
}
```



通过如下命令访问测试接口：

```bash
➜ ~ curl -X POST http://localhost:8080/order       
订单：24a24d24-539e-4da9-9272-e68fd592313c，提交成功.
```

`/order`路径匹配`/order/**`表达式，**所以我们在控制台也可以看到请求日志的打印**。

### 测试点：其他路径

添加测试控制器类`OtherController`如下所示：

```java
@RestController
public class OtherController {

    @GetMapping(value = "/other")
    public String other() {
        return "this is other path";
    }
}
```



通过如下命令访问测试接口：

```bash
➜ ~ curl http://localhost:8080/other         
this is other path
```

由于`/other`路径并不匹配`/user/**`或者`/order/**`表达式，**所以我们在控制台并没有看到日志的打印**。

## 敲黑板，划重点

`ApiBoot Logging`支持单个或者多个路径配置来进行过滤指定路径前缀来采集日志，让日志采集不再不可控，更精准的定位到业务请求的日志采集。

## 本章源码
本篇文章示例源码可以通过以下途径获取，目录为`SpringBoot2.x/modify-apiboot-logging-collection-prefix`：

- Gitee：https://gitee.com/hengboy/spring-boot-chapter
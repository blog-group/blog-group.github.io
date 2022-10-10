---
id: eureka-server
title: 搭建Eureka服务注册中心
article_type: 原创
article_author: 于起宇
enable_comment: true
news: true
tags: [微服务,Spring Cloud,Eureka]
categories: [微服务]
date: 2019-09-30 17:00:46
keywords: eureka,SpringCloud,恒宇少年
description: '搭建Eureka服务注册中心'
---

`Eureka`服务注册中心是`netflix`开源组织提供的一个`服务高可用`的解决方案，在前端时间一直在疯传的`2.0开源流产`的问题，其实并不影响我们的使用，`netflix`只不过是不再维护`2.0`分支的开源代码，所以做出了免责声明，不过对于我们使用者来说确实比较担心这一点，还有不少人更换服务注册中心，比如：`zookeeper`、`consul`。
<!--more-->

当然对于`Eureka 2.0 流产`这件事情就当做一场闹剧来对待吧，因为`SpringCloud.Finchley.SR1`版本依赖的`Eureka`是`1.9.3`，根本不需要考虑到这一点了。
我们还是来关心我们的`分布式`微服务架构系统该怎么去设计。


### 构建项目
跟我们之前构建项目一样， 使用`idea`工具直接创建一个新的`SpringBoot`项目，在选择依赖的界面勾选`Cloud Discovert -> Eureka Server`依赖，创建完成后的`pom.xml`配置文件内容如下：
```xml
<properties>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
    <java.version>1.8</java.version>
    <!--SpringCloud最新稳定版本-->
    <spring-cloud.version>Finchley.SR1</spring-cloud.version>
</properties>

<dependencies>

    <!--Netflix Eureka依赖-->
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-netflix-eureka-server</artifactId>
    </dependency>
</dependencies>

<!--SpringCloud依赖版本管理-->
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-dependencies</artifactId>
            <version>${spring-cloud.version}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```
我们在创建新的项目时，如果选择了相关`SpringCloud`的依赖，则会自动在`pom.xml`配置文件内添加`SpringCloud`最新稳定版本依赖配置。
`spring-cloud-dependencies`这个依赖是`SpringCloud`内所需要依赖的`版本维护`，在`maven`项目内如果被`<dependencyManagement>`内修饰的`<dependency>`，子项目或者本项目在使用时可以不用设置版本号，默认使用`<dependencyManagement>`下`<dependency>`内设置的版本信息。
正因如此，这也是为什么我们添加了`spring-cloud-dependencies`依赖后，在使用相关`SpringCloud`插件时可以不用添加`version`标签设置导入指定版本的依赖。
### Eureka Server的配置
添加`spring-cloud-starter-netflix-eureka-server`依赖后，我们就来看看怎么开启`Eureka Server`服务。开启`Eureka`的注册中心服务端比较简单，只需要修改注意两个地方。
- 第一个地方是在入口类上添加启用`Eureka Server`的注解`@EnableEurekaServer`，如下所示：
```java
@SpringBootApplication
@EnableEurekaServer
public class SpringCloudEurekaApplication {
    // main method
}
```
- 第二个地方是application.yml/application.properties文件内添加配置基本信息,如下所示：
```yaml
# 服务名称
spring:
  application:
    name: hengboy-spring-cloud-eureka
# 服务端口号
server:
  port: 10000

#Eureka 相关配置
eureka:
  client:
    service-url:
      defaultZone: http://localhost:${server.port}/eureka/
    # 是否从其他的服务中心同步服务列表
    fetch-registry: false
    # 是否把自己作为服务注册到其他服务注册中心
    register-with-eureka: false

```
- spring.application.name：服务名称
- server.port：服务端口号
- eureka.client.service-url.defaultZone：Eureka默认的服务地址空间信息配置
- eureka.client.fetch-registry：是否从其他Eureka注册中心同步服务列表（单节点无需配置启用）.
- eureka.client.register-with-eureka：是否将自己作为服务注册到其他Eureka服务注册中心（单节点无需配置启用）.

### 运行测试
上面的步骤我们已经把`Eureka`服务端所需要的依赖以及配置进行了集成，接下来我们来运行测试看下效果，`Eureka`给我们提供了一个漂亮的`管理界面`，这样我们就可以通过`管理界面`来查看注册的`服务列表`以及`服务状态`等信息。

> 测试步骤：
> 1. 通过`Application`方式进行启动`Eureka Server`
> 2. 在本地浏览器访问`http://localhost:10000`，10000端口号是我们在`application.yml`配置文件内设置的`server.port`的值。
> 3. 成功访问到`Eureka Server`管理界面

界面如下所示：
![服务注册管理界面](/images/post/eureka-server.png)

对于界面我们可以看到一些`Eureka Server`的健康数据以及基本信息，比如：
- `server-uptime`：已经启动的耗时
- `current-memory-usage`：当前占用的内存总量
- `Instances currently registered with Eureka`：注册到该中心的服务列表
- `ipAddr`：当前`Eureka Server`的IP地址，如果没有配置`eureka.instance.ip-address`那么这里使用默认的IP地址。
...
### 总结
本章介绍了`Eureka`作为`Server`的配置，配置的步骤比较简单，没有那么多繁琐的地方，当然这只是`Eureka`单个`服务节点`的配置方式，更多高级的使用方式请查看后续文章。

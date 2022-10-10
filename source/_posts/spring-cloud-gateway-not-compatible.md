---
id: spring-cloud-gateway-not-compatible
title: ApiBoot v2.2.5版本无法兼容Hoxton.SR5的SpringCloud Gateway
sort_title: spring-cloud-gateway-not-compatible
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: false
news: true
disable_toc: false
customize: false
tags: [SpringCloud,网关]
categories: [微服务]
keywords: 'apiboot,springcloud,兼容性'
date: 2020-06-19 22:04:58
description: 'ApiBoot v2.2.5整合SpringCloud Gateway时发生reactory-netty版本兼容性问题.'
article_url:

---

使用`ApiBoot`最新发布的`v2.2.5`版本整合`SpringCloud Gateway`的`Hoxton.SR5`版本时导致项目无法启动，控制台抛出的错误如下所示：

```java
***************************
APPLICATION FAILED TO START
***************************

Description:

An attempt was made to call a method that does not exist. The attempt was made from the following location:

    org.springframework.boot.web.embedded.netty.NettyReactiveWebServerFactory.lambda$createHttpServer$0(NettyReactiveWebServerFactory.java:158)

The following method did not exist:

    reactor.netty.tcp.TcpServer.bindAddress(Ljava/util/function/Supplier;)Lreactor/netty/tcp/TcpServer;

The method's class, reactor.netty.tcp.TcpServer, is available from the following locations:

    jar:file:/Users/yuqiyu/.m2/repository/io/projectreactor/netty/reactor-netty/0.9.6.RELEASE/reactor-netty-0.9.6.RELEASE.jar!/reactor/netty/tcp/TcpServer.class

The class hierarchy was loaded from the following locations:

    reactor.netty.tcp.TcpServer: file:/Users/yuqiyu/.m2/repository/io/projectreactor/netty/reactor-netty/0.9.6.RELEASE/reactor-netty-0.9.6.RELEASE.jar


Action:

Correct the classpath of your application so that it contains a single, compatible version of reactor.netty.tcp.TcpServer
```

从控制台打印的错误信息我们可以发现这是版本不兼容的问题导致的，`reactor-netty`作为`SpringCloud Gateway`的重要组成部分之一，为什么会出现版本不兼容的问题呢？

### reactor-bom

我们在构建项目时，`SpringBoot`使用最新发布的`v2.3.1`，在`v2.3.1`版本的`spring-boot-dependencies`固化版本依赖模块内定义`reactor-bom`的依赖，如下所示：

```xml
<dependency>
  <groupId>io.projectreactor</groupId>
  <artifactId>reactor-bom</artifactId>
  <version>${reactor-bom.version}</version>
  <type>pom</type>
  <scope>import</scope>
</dependency>
```

`${reactor-bom}`占位符对应的使用版本为`Dysprosium-SR8`，通过查看`reactor-bom`内定义的依赖列表发现了`reactor-netty`的踪迹，而它对应的版本为`v0.9.8`，如下所示：

```xml
<dependency>
  <groupId>io.projectreactor.netty</groupId>
  <artifactId>reactor-netty</artifactId>
  <version>0.9.8.RELEASE</version>
</dependency>
```



那为什么我们在启动项目时控制台抛出了使用`v0.9.6`版本的`reactor-netty`导致**不兼容的问题**呢？

### 项目依赖的reactor-netty版本	

查看`idea`开发工具内项目的`External Libraries`发现，项目编译时使用的`reactor-netty`的版本确实是为`v0.9.6`，如下图所示：

![](https://blog.minbox.org/images/post/spring-cloud-gateway-not-compatible-1.png)



### SpringCloud Gateway依赖的reactor-netty版本

`Hoxton.SR5`版本的`spring-cloud-dependencies`依赖内使用的`spring-cloud-gateway`版本为`2.2.3.RELEASE`，我们从`GitHub`拉取`spring-cloud-gateway`源码到本地，使用`idea`工具打开项目并切换到`2.2.x`分支后发现`External Libraries`依赖列表内所使用的`reactory-netty`版本为`v0.9.7`，**这是编译spring-cloud-gateway时所依赖的版本**。

> `spring-cloud-gateway`仓库在`GitHub`的地址为：`git@github.com:spring-cloud/spring-cloud-gateway.git`



### 问题分析

1. 从上面的分析步骤中我们发现，`spring-cloud-gateway`编译时所使用的`reactory-netty`版本为`v0.9.7`，而`v2.3.1`版本的`SpringBoot`所使用的`reactory-netty`版本为`v0.9.8`，依赖的版本是支持向下兼容的，所以这样不会出现什么问题。

2. **但是**我们项目在编译时使用的`reactory-netty`版本却为`v0.9.6`，版本肯定是不支持向上兼容的，所以才导致了项目启动时控制台打印的不兼容异常。



### 问题定位

在`ApiBoot`的固化版本依赖`api-boot-dependencies`内默认添加了`SpringCloud`的依赖，为了方便项目集成`SpringCloud`时使用组件，不过这也导致了这个问题的发生。

`v2.2.5`版本的`ApiBoot`内集成的`SpringCloud`版本为`Hoxton.RELEASE`，要比`Hoxton.SR5`版本发布的更早，它所使用的`reactory-netty`依赖版本为`v0.9.6`。

### 解决问题

既然找到了问题，对症下药，解决起来就容易了，我们只需要把项目中所依赖的`reactory-netty`版本修改为`v0.9.6`以上版本即可，在项目的`pom.xml`内添加如下依赖：

```xml
<dependencyManagement>
  <!--省略其他依赖-->
  <dependencies>
    <dependency>
      <groupId>io.projectreactor.netty</groupId>
      <artifactId>reactor-netty</artifactId>
      <version>0.9.8</version>
    </dependency>
  </dependencies>
</dependencyManagement>
```


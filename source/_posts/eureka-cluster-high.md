---
id: eureka-cluster-high
article_type: 原创
article_author: 于起宇
enable_comment: true
news: true
tags: 
  - SpringCloud
  - Eureka
categories: 
  - SpringCloud
keywords: eureka,SpringCloud,SpringBoot
date: 2018-10-05 11:12:47
title: SpringCloud下使用Eureka高可用集群部署
description: 'SpringCloud下使用Eureka高可用集群部署'
---

我们在之前的章节{% post_path eureka-server 搭建Eureka服务注册中心 %}学习到了单个`服务注册中心`的创建，不过单模式的部署方式在实战中确实不太提倡，因为有很多种原因可能会导致`服务注册中心`宕机，如果宕机就会有一些灾难性的问题出现，所以保证`服务注册中心`处于`活着运行状态`显得尤为重要！！！
<!--more-->
### 本章目标
高可用集群部署`Eureka`服务注册中心。
### 构建项目
使用`idea`开发工具创建一个`SpringBoot`项目，添加`Eureka Server`依赖即可，`pom.xml`配置文件如下所示：
```xml
<properties>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
    <java.version>1.8</java.version>
    <spring-cloud.version>Finchley.SR1</spring-cloud.version>
</properties>

<dependencies>
    <!--Eureka Server-->
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-netflix-eureka-server</artifactId>
    </dependency>

    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```
我们本章主要是完成`Eureka Server`的集群配置，所以只需要添加`spring-cloud-starter-netflix-eureka-server`依赖即可。

### 启用Eureka Server
在入口类`XxxApplication`上添加`@EnableEurekaServer`注解来启用`Eureka Server`服务以及实例化一些依赖，修改如下所示：
```java
@SpringBootApplication
@EnableEurekaServer
public class SpringCloudEurekaHighApplication {
    //....
}
```

### Eureka服务配置
依赖已经添加完成，接下来我们就需要在`application.yml`内编写相关配置信息，因为测试环境都在我们本机，有两种方式可以模拟测试同时运行：
- 创建两个不同的项目
- 使用一个项目进行根据`spring.profiles.active`设置运行不同环境

为了方便演示，我们使用的第二种方式，主要是感觉再去创建一个项目没有必要，那我们的`profiles`环境该怎么配置呢？请继续往下看。
### Profile多环境配置
我们在`src/main/resources`目录下创建名为`application-node1.yml`的配置文件，在该配置文件内添加如下配置：
```yaml
# Eureka 客户端配置
eureka:
  client:
    service-url:
      defaultZone: http://node2:10002/eureka/
  instance:
    # 配置通过主机名方式注册
    hostname: node1
    # 配置实例编号
    instance-id: ${eureka.instance.hostname}:${server.port}:@project.version@
  # 集群节点之间读取超时时间。单位：毫秒
  server:
    peer-node-read-timeout-ms: 1000
# 服务端口号
server:
  port: 10001
```
继续在`src/main/resources`下创建一个名为`application-node2.yml`的配置文件，内容如下所示：
```yaml
# Eureka 客户端配置
eureka:
  client:
    service-url:
      defaultZone: http://node1:10001/eureka/
  instance:
    # 配置通过主机名方式注册
    hostname: node2
    # 配置实例编号
    instance-id: ${eureka.instance.hostname}:${server.port}:@project.version@
  # 集群节点之间读取超时时间。单位：毫秒
  server:
    peer-node-read-timeout-ms: 1000
server:
  port: 10002
```
下面我们先来说下`node1`、`node2`主机名的配置方式，然后再说下为什么实现了集群的效果？

### 主机名设置
- `Mac`或者`Linux`配置方式
如果你使用的是`osx`系统。可以找到`/etc/hosts`文件并添加如下内容：
```
127.0.0.1       node1
127.0.0.1       node2
```
一般情况下配置完成后就会生效，如果你的配置并没有生效，你可以尝试重启。
- `Windows`配置方式
如果你使用的是`windows`系统，你可以修改`C:\Windows\System32\drivers\etc\hosts`文件，添加内容与`Mac`方式一致。

### Eureka Sever相互注册
- `application-node1.yml`

`eureka.client.service-url.defaultZone`这个配置参数的值，配置的是`http://node2:10002/eureka/`，那这里的`node2`是什么呢？其实一看应该可以明白，这是们在`hosts`文件内配置的`hostname`，而`端口号`我们配置的则是`10002`，根据`hostname`以及`port`我们可以看出，环境`node1`注册到了`node2`上。

- `application-node2.yml`

在`node2`环境内配置`eureka.client.service-url.defaultZone`是指向的`http://node1:10001/eureka/`，同样`node2`注册到了`node1`上。

> 通过这种相互注册的方式牢靠的把两个`服务注册中心`绑定在了一块。

### 运行测试
我们先来运行测试下`Eureka Server`的集群是否可行？下一章节我们再来讲解`把服务提供者注册到Eureka集群`，测试步骤如下：
> 1. clean && package 本项目（diea工具自带maven常用操作命令快捷方式，右侧导航栏`Maven Projects -> Lifecycle`）
> 2. 打开终端`cd`项目`target`目录
> 3. 通过如下命令启动`node1`环境：
```
 java -jar hengboy-spring-cloud-eureka-high-0.0.1-SNAPSHOT.jar --spring.profiles.active=node1
```
> 4. 再打开一个终端，同样是`cd`项目的`target`目录下，通过如下命令启动`node2`环境：
```
 java -jar hengboy-spring-cloud-eureka-high-0.0.1-SNAPSHOT.jar --spring.profiles.active=node2
```
> 5. 访问`http://node1:10001`查看`node1`环境的`Eureka`管理中心
> 6. 访问`http://node2:10002`查看`node2`环境的`Eureka`管理中心

效果如下图所示：
![集群相互注册效果](/images/post/eureka-cluster-high.png)

### 总结

本章讲解了`集群环境`下怎么构建让`Eureka Server`更健壮，在下一章我们来看看怎么把`服务提供者`注册到`Eureka Server集群`内。
> 建议：在实战环境中建议把`Eureka Server`节点放在不同的服务器下，并且通过主机名或者内网方式进行相互注册。

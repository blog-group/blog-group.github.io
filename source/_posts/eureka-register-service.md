---
id: eureka-register-service
title: 将服务注册到Eureka
article_type: 原创
article_author: 于起宇
enable_comment: true
news: true
tags: [微服务,Spring Cloud,Eureka]
categories: [微服务]
date: 2019-09-29 14:03:29
keywords: eureka,SpringCloud,SpringBoot
description: '将服务注册到Eureka'
---
`Eureka`提供了`Server`当然也提供了`Client`，如果你对`Eureka Server`不了解，通过{% post_path spring-cloud-eureka 搭建Eureka服务注册中心 %}阅读文章查看具体的编码实现。
<!--more-->
本章构建的项目其实是一个`Eureka Client`，因为是向`Eureka Server`注册的服务，相对于`Eureka Server`来说相当于一个客户端的形式存在。

我们使用`spring-cloud-starter-netflix-eureka-client`可以快速的构建`Eureka Client`项目，简单的配置就可以完成`Client`与`Server`之间的通信以及绑定，下面我们来看下具体是怎么向`Eureka Server`注册服务。

### 构建项目
同样的是采用`idea`开发工具创建一个`SpringBoot`项目，在依赖选择界面对应的添加`Web`以及`Eureka Discovery`依赖，直接完成创建项目。
项目的`pom.xml`内容如下所示：
```xml

<properties>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
    <java.version>1.8</java.version>
    <spring-cloud.version>Finchley.SR1</spring-cloud.version>
</properties>

<dependencies>
    <!--Web依赖-->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <!--Eureka Client 依赖-->
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
    </dependency>

    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>

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
....//省略部分配置
```
跟`Eureka Server`项目不同依赖的选择的地方是`Client`项目需要添加`spring-cloud-starter-netflix-eureka-client`，通过该依赖可以完成服务的注册以及服务之间的通信等。

> 添加`spring-boot-starter-web`依赖的目的是为了简单创建一个`Controller`请求示例，在后面章节我们需要用到该依赖。

### Eureka Client的配置
`Eureka Client`的配置步骤与`Eureka Server`几乎是一致的，不过采用的注解不同以及配置信息有出入，同样是两步完成配置：
- 第一步入口类添加注解`@EnableDiscoveryClient`
我们在配置`Client`时通常会采用通用的客户端注解配置，也就是`@EnableDiscoveryClient`注解，当然如果`服务注册中心`确定采用的是`Eureka`也可以使用`@EnableEurekaClient`注解来完成配置，至于这两个的区别后续章节细讲。
```java
@SpringBootApplication
@EnableDiscoveryClient
public class SpringCloudEurekaProviderApplication {
    /**
     * logger instance
     */
    static Logger logger = LoggerFactory.getLogger(SpringCloudEurekaProviderApplication.class);

    public static void main(String[] args) {
        SpringApplication.run(SpringCloudEurekaProviderApplication.class, args);
        logger.info("「「「「「Eureka服务提供者启动完成.」」」」」");
    }
}
```
- 第二步`application.yml`配置文件添加配置信息
我比较喜欢`ymal`这种配置风格，所以删除了创建项目时创建的`application.properties`配置文件，自行创建了`application.yml`，因为层级的原因可以更清晰明了的看清配置，配置内容如下所示：
```yaml
# 服务名称
spring:
  application:
    name: hengboy-spring-cloud-eureka-provider

# 服务提供者端口号
server:
  port: 20000

# 配置Eureka Server 信息
eureka:
  client:
    service-url:
      defaultZone: http://localhost:10000/eureka/
```
- `spring.application.name`：配置服务的名称
- `server.port`：服务端口号
- `eureka.client.service-url`：配置`Eureka Server`服务注册中心地址

### 运行测试
我们已经完成了`Eureka Client`的相关配置信息，接下来我们按照下面的步骤进行执行测试。

> 1. 启动服务注册中心`Eureka Server`
> 2. 启动本章项目
> 3. 查看控制台日志输出信息
> 4. 查看服务注册中心管理界面`服务列表`

运行过程中本章项目控制台输出内容如下所示：
```
......
DiscoveryClient_HENGBOY-SPRING-CLOUD-EUREKA-PROVIDER/192.168.1.75:hengboy-spring-cloud-eureka-provider:20000: registering service...
DiscoveryClient_HENGBOY-SPRING-CLOUD-EUREKA-PROVIDER/192.168.1.75:hengboy-spring-cloud-eureka-provider:20000 - registration status: 204
......
```
可以看到控制台打印了向我们配置的服务注册中心进行`registering service`，既然控制台并没有给我抛出相关的异常信息，那么我们猜想是不是`Eureka Server`服务注册中心的服务列表已经存在了该条记录了呢？
### 查看Eureka Server 服务列表
我们带着这个疑问打开`Eureka Server`管理界面地址：`http://localhost:10000`。
![Eureka Server 管理界面](https://upload-images.jianshu.io/upload_images/4461954-14283095fbbc3be5.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

在`管理界面`我们可以看到本章的服务已经注册到了`Eureka Server`服务注册中心，而且是`UP`状态也就是`正常运行状态`。

在服务注册的过程中，`SpringCloud Eureka`为每一个服务节点都提供默认且唯一的`实例编号`(InstanceId)
- `实例编号`默认值：`${spring.cloud.client.ipAddress}:${spring.application.name}:${spring.application.instance_id:${server.port}}`
- 本章服务注册时的`实例编号`：`192.168.1.75:hengboy-spring-cloud-eureka-provider:20000`

> 如果你想要随心所欲的自定义这个实例编号，那么好可以满足你，不过要注意自定义时要保证唯一性！！！

### 自定义InstanceId

我们可以来考虑考虑根据什么格式来自定义这个`实例编号`可以更好的帮助我们定位问题？

一般来说我们在线上运行着的服务来说，我要知道`服务的名称`这是肯定的，还有就是`端口号`，因为如果你同一台服务器部署多个相同的服务肯定端口号要有所变动，当然如果你还想要知道当前运行代码的`版本号`，那要更有利于你`分析`并`定位`解决运行中遇到的问题，那既然这样，我们就可以采用这种方式进行自定义。
`application.yml`配置文件内修改`实例编号`后内容如下所示:
```yaml
# 配置Eureka Server 信息
eureka:
  client:
    service-url:
      defaultZone: http://localhost:10000/eureka/
  # 自定义实例编号
  instance:
    instance-id: ${spring.application.name}:${server.port}:@project.version@
```
- `@project.version@`
源码的`版本号`我们是采用了获取`pom.xml`配置文件内设置的`version`来设置的值，通过`@xxx@`的方式就可以得到`maven`的一些相关配置信息来直接使用。
既然修改了那么我们来看下效果，`重启我们本章的项目`，启动完成后再次打开`Eureka Server`的管理界面，查看服务列表，如下图所示：
![修改后的实例编号](https://upload-images.jianshu.io/upload_images/4461954-9d976d6e27653626.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

可以看到正在`UP`状态服务的`实例编号`是`hengboy-spring-cloud-eureka-provider:20000:v1.0`，也就是我们自定义`eureka.instance.instance-id`的值，至于`DOWN`状态的服务时间久了就会被`Eureka Server`所剔除，不会影响我们服务的正常使用。
### 总结
本章通过一个`SpringBoot`项目来讲解了怎么将自定义的`服务`注册到`Eureka Server`(服务注册中心)，简单的两个步骤就可以完成这个注册、绑定、生效的过程，在这个过程中我们还了解到了怎么去自定义服务注册时的`实例编号`。
---
title: Nacos 作为配置中心 & 读取Properties配置信息
article_type: 原创
article_author: 于起宇
enable_comment: true
news: true
tags: 
    - SpringCloud
    - Nacos
categories: 
    - SpringCloud
date: 2019-03-02 16:53:15
id: nacos-config-properties
keywords: nacos,config,springboot
description: 'Nacos 作为配置中心 & 读取Properties配置信息'
---
`SpringCloud Alibaba`是`阿里巴巴`致力于对`微服务`的`管理`、`配置`、`注册`等一整套的解决方案，内部主要是`Nacos`相关的依赖进行实现，本系列文章主要来讲解下`Nacos Config`在`SpringCloud`环境下的运用。
<!--more-->
### 简介
`Nacos` 提供用于存储配置和其他元数据的 `K-V` 存储，为分布式系统中的外部化配置提供服务器端和客户端支持。使用 Spring Cloud Alibaba Nacos Config，可以在 Nacos Server 集中管理你 Spring Cloud 应用的外部属性配置。

`Nacos Config`支持多种方式的配置格式，比如：`TEXT`、`JSON`、`XML`、`YAML`、`HTML`、`PROPERTIES`等。
我们本章先来看下是怎么读取`外部Properties`类型的配置。
### 前提
本地需要安装`Nacos Server`，具体安装步骤访问`Nacos`官网文档，[Nacos Server 安装](https://nacos.io/zh-cn/docs/quick-start.html)
### 创建项目
使用`idea`工具创建一个`SpringCloud`项目。
#### 添加依赖 
添加依赖在`pom.xml`配置文件如下所示：
```xml
//...
<properties>
    <java.version>1.8</java.version>
    <spring-cloud.version>Greenwich.RELEASE</spring-cloud.version>
    <spring-cloud-alibaba.version>0.2.1.RELEASE</spring-cloud-alibaba.version>
</properties>

<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <!--alibaba nacos config-->
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
    </dependency>
</dependencies>

<dependencyManagement>
    <dependencies>
        <!--SpringCloud-->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-dependencies</artifactId>
            <version>${spring-cloud.version}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
        <!--SpringCloud Alibaba-->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-alibaba-dependencies</artifactId>
            <version>${spring-cloud-alibaba.version}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
//...
```
#### bootstrap引导配置
`Nacos Config`相关的配置必须在`bootstrap.yml`或者`bootstrap.properties`文件内添加。
配置内容如下所示：
```yaml
spring:
  application:
    name: alibaba-nacos-config-client
  # nacos config  
  cloud:
    nacos:
      config:
        server-addr: 127.0.0.1:8848

```
- `spring.application.name`
`spring-cloud-starter-alibaba-nacos-config`依赖默认会使用该值的内容作为`DATA-ID`来匹配读取`Nacos Config`,读取规则下面介绍。
- `spring.cloud.nacos.config.server-addr`
配置`nacos server`的地址信息，`nacos server`本地安装访问[Nacos Server 安装](https://nacos.io/zh-cn/docs/quick-start.html)
### 读取Nacos配置
在启动类内添加读取`Nacos Config`部分代码，为了跟下一步做铺垫来测试自动更新，我们间隔`1秒`后再次读取配置内容，编码如下所示：
```java
/**
 * Nacos Config Properties方式
 *
 * @author：恒宇少年 - 于起宇
 * <p>
 * DateTime：2019-03-01 11:20
 * Blog：https://blog.yuqiyu.com
 * WebSite：http://www.jianshu.com/u/092df3f77bca
 * Gitee：https://gitee.com/hengboy
 * GitHub：https://github.com/hengyuboy
 */
@SpringBootApplication
public class SpringCloudAlibabaNacosConfigPropertiesApplication {
    /**
     * logger instance
     */
    static Logger logger = LoggerFactory.getLogger(SpringCloudAlibabaNacosConfigPropertiesApplication.class);

    public static void main(String[] args) throws Exception {
        ConfigurableApplicationContext applicationContext = SpringApplication.run(SpringCloudAlibabaNacosConfigPropertiesApplication.class, args);
        while (true) {
            //当动态配置刷新时，会更新到 Enviroment中，因此这里每隔一秒中从Enviroment中获取配置
            String userName = applicationContext.getEnvironment().getProperty("hengboy.name");
            String userAge = applicationContext.getEnvironment().getProperty("hengboy.age");
            logger.info("配置信息，名称：{}，年龄：{}", userName, userAge);
            TimeUnit.SECONDS.sleep(1);
        }
    }
}
```
### 测试
接下来我们来测试是否可以从`Nacos Config`内读取相关的配置信息，我们需要访问`Nacos Console`控制台来添加配置信息。
访问：[Nacos Console](http://127.0.0.1:8848/nacos/#/login)，默认`用户名/密码`为：`nacos/nacos`。
#### 添加 Nacos Config
通过`配置列表`内添加配置信息，添加时`DATA-ID`的组成部分为：`{spring.application.name}.{file-extension}`。
`file-extension`文件后缀名默认为`properties`，如果需要修改，在`bootstrap`文件内进行修改配置`spring.cloud.nacos.config.file-extension`的值。
添加的配置信息如下所示：
```
DATA ID : alibaba-nacos-config-client.properties
Group : DEFAULT_GROUP
配置内容 : 
hengboy.name=admin-properties
hengboy.age=11
```
#### 输出 Nacos Config
一切就绪，我们通过`Application`方式启动项目，查看控制台打印内容如下所示：
```
Loading nacos data, dataId: 'alibaba-nacos-config-client.properties', group: 'DEFAULT_GROUP'
Located property source: CompositePropertySource {name='NACOS', propertySources=[NacosPropertySource {name='alibaba-nacos-config-client.properties'}]}
配置信息，名称：admin-properties，年龄：11
```

### 自动更新配置

在上面的步骤中我们已经可以从`Nacos Config`内读取到对应的`properties`配置文件内容信息。
那我们如果通过`Nacos Console`进行修改了配置内容后，我们的应用程序是不是可以立马获取到修改后的值呢？

我们带着这个疑问，去`Nacos Console`找到`DATA-ID = alibaba-nacos-config-client.properties`的配置信息，修改`hengboy.age`的值为`25`，重新发布配置信息后查看我们的应用程序的控制台输出内容如下所示：
```
Loading nacos data, dataId: 'alibaba-nacos-config-client.properties', group: 'DEFAULT_GROUP'
Located property source: CompositePropertySource {name='NACOS', propertySources=[NacosPropertySource {name='alibaba-nacos-config-client.properties'}]}
Refresh keys changed: [hengboy.age]
配置信息，名称：admin-properties，年龄：25
```
可以看到输出的内容，我们修改完`外部的配置信息`后，`Nacos Client`会自动刷新所修改的配置文件内容，始终让配置内容保持与`Nacos Config`内配置一致。
我们通过`Nacos Console`修改的当前`DATA-ID`下的任何参数都会在控制台`Refresh keys changed: [xxx,xxx]`打印。

### 总结
本章简单的讲解了`SpringCloud Alibaba`的配置中心`读取配置信息方式`以及`自动更新配置信息`实现，在开头我们说了`Nacos Config`所支持的配置文件的格式不仅仅是`properties`这一种，不过这是默认的一种方式，在下一章我们来讲解下`YAML`方式的配置信息读取。
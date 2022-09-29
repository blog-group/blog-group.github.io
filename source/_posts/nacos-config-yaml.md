---
title: Nacos 作为配置中心 & 读取Yaml配置信息
article_type: 原创
article_author: 于起宇
enable_comment: true
news: true
tags: 
    - SpringCloud
    - Nacos
categories: 
    - SpringCloud
date: 2019-03-02 17:04:47
id: nacos-config-yaml
keywords: nacos,config,springboot
description: 'Nacos 作为配置中心 & 读取Yaml配置信息'
---
通过本系列的前篇文章：
- {% post_link nacos-config-properties Nacos 作为配置中心 & 读取Properties配置信息%}
在之前文章中我们学习到了`SpringCloud Alibaba`读取`Nacos Config`内定义的`properties`类型的配置文件信息，并且使用`Nacos Console`进行修改配置信息后可以在应用程序内实时更新。
<!--more-->
### 本章目标
`Nacos Config`所支持的配置文件类型既然有多种，那我们该怎么配置才能读取不同的配置类型的内容呢？
### 快速入门
我们还是先来通过`Nacos Console`来添加本章所使用的配置信息，要注意配置的后缀名改为`yaml`。
#### Nacos Server
需要在本地安装`Nacos Server`才能完成本章的内容讲解，具体的安装步骤访问[Nacos 官方文档](https://nacos.io/zh-cn/docs/quick-start.html)
#### 创建配置
配置信息如下所示：
![](/images/post/4461954-e8e0fa16560b5af6.png)

#### 创建应用
我们在`Nacos Console`已经添加了本章所使用的`Yaml`类型的配置信息，下面通过`Idea`开发工具创建一个`SpringBoot`项目，并添加`SpringCloud Alibaba`、`SpringCloud`版本的依赖，`pom.xml`配置文件内容如下所示：
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
#### 配置文件扩展名
在之前讲到过默认的配置文件扩展名为`properties`，既然我们本章是读取的`yaml`类型的文件，那肯定需要修改这个配置参数，`application.yml`配置文件如下所示：
```yaml
spring:
  application:
    name: hengboy-spring-cloud
  # nacos config
  cloud:
    nacos:
      config:
        server-addr: 127.0.0.1:8848
        # 配置文件后缀名为yaml
        file-extension: yaml
```
通过`spring.cloud.nacos.config.file-extension`参数进行修改默认的`Nacos Config`所匹配的默认文件扩展名。
> 在上面的配置文件内要注意的时，`hengboy-spring-cloud`要与`Nacos Console`内添加的配置`data-id`前部分匹配，也就是匹配：`hengboy-spring-cloud.yaml`。

#### 读取配置

下面我们通过简单的几个步骤来读取我们配置的`yaml`配置内容。

**第一步：创建一个配置读取的`Controller`** 

创建一个名为`ConfigController`的配置查询控制器，并且类上配置`@RequestMapping("/config")`。

**第二步：通过@Value注解读取配置信息** 

我们在之前章节通过`applicationContext#getEnvironment#getProperty`方法可以直接获取对应的`Nacos Config`的配置信息，当然`SpringCloud Alibaba`也同样支持通过`@Value`注解来获取配置信息，如下所示：
```java
@RestController
@RequestMapping(value = "/config")
@RefreshScope
public class ConfigController {
    /**
     * 读取hengboy.name配置信息
     */
    @Value(value = "${hengboy.name:}")
    private String userName;
    /**
     * 读取hengboy.age配置信息
     */
    @Value(value = "${hengboy.age:}")
    private String userAge;

    /**
     * 获取配置内容
     *
     * @return
     */
    @RequestMapping(value = "/get")
    public String getConfig() {
        return userName + ":" + userAge;
    }

}
```
> 解释：`${hengboy.name:}`表示需要从全局的配置内容中读取`hengboy.name`的配置信息，如果没有找到则使用 `冒号（:）` 后的内容，当然这里我们没有添加任何的默认值，如果没有配置则为`空字符串`。

**第三步：通过@RefreshScope注解实时刷新配置信息** 
我们在`ConfigController`控制器上添加了注解`@RefreshScope`主要目的是来实时同步通过`Nacos Console`修改的配置内容。

`@RefreshScope`注解是`SpringCloud`内部提供，用于`配置热加载`。


**第四步：运行测试**

启动应用程序，我们通过`curl http://localhost:8080/config/get`可以获取我们在`Nacos Console`添加的配置内容：`admin:25`

**第五步：实时更新测试**

通过`Nacos Console`我们修改下两个参数的内容并且`重新发布配置信息`：
```
hengboy.name : admin -> admin-change-after
hegnboy.age : 25 -> 30
```
再次通过`curl http://localhost:8080/config/get`命令访问，我们已经可以得到更新后的配置内容：`admin-change-after:30`
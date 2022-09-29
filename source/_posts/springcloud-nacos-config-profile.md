---
title: Nacos Config的多环境（Profile）配置信息读取 
article_type: 原创
article_author: 于起宇
enable_comment: true
news: true
tags: 
	- SpringCloud
	- Nacos
categories: 
	- SpringCloud
keywords: SpringCloud,SpringBoot,恒宇少年,nacos
date: 2019-03-05 10:29:32
id: springcloud-nacos-config-profile
description: 'Nacos Config的多环境（Profile）配置信息读取 '
---
## 本章目标
读取`Profile`多环境下`Nacos Config`的配置信息，了解多环境下相同的配置优先级加载问题。
<!--more-->

在之前文章中我们学习到了`SpringCloud Alibaba`读取`Nacos Config`内定义的`properties`、`Yaml`类型的配置文件信息，并且使用`Nacos Console`进行修改配置信息后可以在应用程序内实时更新。


在我之前的`SpringBoot`系列教程中有提到`Profile（多环境）`相关的概念，有兴趣的同学可以去查看{% post_link springboot-active-profiles 激活项目配置的多环境(profiles) %}文章，既然应用程序存在`Profile`分离的概念， `Nacos Config`同样为我们提供了这一概念，接下来我们来看看是如何进行`Profile`的配置信息`切换使用`、`优先级替换`。


## 快速入门
我们还是先来通过`Nacos Console`来添加本章所使用的配置信息，要注意配置的后缀名改为`yaml`。
### Nacos Server
需要在本地安装`Nacos Server`才能完成本章的内容讲解，具体的安装步骤访问[Nacos 官方文档](https://nacos.io/zh-cn/docs/quick-start.html)
### 添加配置
通过`Nacos`控制台添加本项目所使用的配置信息，之前又讲到过`SpringCloud Alibaba`默认使用`spring.application.name`作为`DATA-ID`，本章的`spring.application.name = hengboy-spring-cloud-config-profile`，所以我们添加如下两个配置信息：

- hengboy-spring-cloud-config-profile.yaml
  ![](/images/post/hengboy-spring-cloud-config-profile-1.png)
  这个配置是不参与任何`profile`环境的基础配置，其定位其实跟`application.yml`差不多。
- hengboy-spring-cloud-config-profile-dev.yaml
  ![](/images/post/hengboy-spring-cloud-config-profile-2.png)
  这个配置则是`profile=dev`环境的配置信息，其定位跟`application-dev.yml`差不多。

### 创建应用
通过`idea`开发工具来创建一个`SpringCloud`项目，并添加`SpringCloud 版本依赖`、`SpringCloud Alibaba 版本依赖`，`pom.xml`配置内容如下所示：
``` xml
//...
<properties>
        <java.version>1.8</java.version>
        <spring-cloud.version>Greenwich.RELEASE</spring-cloud.version>
        <spring-cloud-alibaba.version>0.2.1.RELEASE</spring-cloud-alibaba.version>
    </properties>

    <dependencies>
        <!--spring cloud alibaba config-->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
    </dependencies>

    <dependencyManagement>
        <!--SpringCloud-->
        <dependencies>
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
### 配置bootstrap.yml
之前有说过，`SpringCloud Alibaba`所需要的配置信息，需要在引导配置`bootstrap.yml`文件内添加，如下所示：
``` yaml
# application name
spring:
  application:
    name: hengboy-spring-cloud-config-profile
  # profile
  profiles:
    active: dev
  # nacos config
  cloud:
    nacos:
      config:
        server-addr: 127.0.0.1:8848
        # nacos配置扩展类型为yaml
        file-extension: yaml

```
我们本章用到的配置文件的格式为`yaml`所以需要通过`spring.cloud.nacos.config.file-extension`进行配置，该参数默认为`properties`。

### 读取配置
我们创建一个`SpringMvc Controller`来读取配置信息，`ConfigController`如下所示：
``` java
//...
@RestController
@RequestMapping(value = "/config")
@RefreshScope
public class ConfigController {
    /**
     * 读取data-id对应的配置信息
     */
    @Value(value = "${hengboy.name:}")
    private String name;

    @RequestMapping(value = "/get")
    public String getConfig() {
        return this.name;
    }
}
```

**运行测试**

通过`Application`方式启动应用程序后，打开终端访问通过如下命令行：

``` bash
curl -X GET http://localhost:8080/config/get
输出内容：xxx-xxx-dev
```
看到输出内容你应该会感觉到不可思议，按照我们之前说的这里应该去找`spring.application.name`所对应的配置信息，也就是`hengboy-spring-cloud-config-profile.yaml`的配置信息，在上面步骤中我们在`hengboy-spring-cloud-config-profile.yaml`内添加的配置信息不是`xxx-xxx-dev`而是`xxx-xxx-xx`。

### 多环境配置的优先级

上面出现的情况，其实一点也不奇怪，`Nacos Config`所被应用到`SpringBoot`、`SpringCloud`项目时，如果项目内存在`Profile`多环境的配置，就会自动去找`spring.profile.actives`所激活的`profile`配置文件，如下所示：
```
# 激活dev profile时
spring.profile.actives=dev -> hengboy-spring-cloud-config-profile-dev.yaml
```

我们激活`spring.profile.actives=dev`时，`Nacos Config`会自动去找两个配置文件，分别是：`hengboy-spring-cloud-config-profile.yaml`、`hengboy-spring-cloud-config-profile-dev.yaml`。

这也就对应上面说的`application`配置文件与`Nacos Config`配置文件的对应关系：
```
# 默认的配置
application.yml -> hengboy-spring-cloud-config-profile.yaml
# 激活profile=dev的配置
application-dev.yml -> hengboy-spring-cloud-config-profile-dev.yaml
```
我们之前在学习`SpringBoot`时讲到过，`profile`多环境下的配置如果与`默认配置（application.yml）`相同时会自动被覆盖掉，如下所示：
``` yaml
# application.yml
server:
    port: 8000
spring:
    profile:
        actives: dev
# application-dev.yml
server:
    port: 9000
```
> 根据上面的额配置的项目，在启动时会使用`9000`作为启动端口。

`Nacos Config`也是同样的概念设计，这一点可能是不想改变太多相关`SpringBoot、SpringCloud`的习惯，让开发者更方面的集成使用。

**结论**

根据上面的解释，我们在访问`/config/get`时你就明白为什么返回的是`xxx-xxx-dev`了。

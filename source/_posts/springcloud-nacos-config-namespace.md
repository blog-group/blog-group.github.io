---
title: Nacos Config 使用自定义的NameSpace & Group
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
date: 2019-03-05 16:03:56
id: springcloud-nacos-config-namespace
description: 'Nacos Config 使用自定义的NameSpace & Group'
---
在之前的章节中，我们并没有对`SpringCloud Alibaba Nacos Config`的`NameSpace`、`Group`做过修改，都是使用的默认值，默认值分别是：`Public`、`DEFAULT_GROUP`，我们本章来看下如何自定义这两项参数。
<!--more-->
### 回顾
通过本系列的前篇文章：
- {% post_link nacos-config-properties Nacos 作为配置中心 & 读取Properties配置信息 %}
- {% post_link nacos-config-yaml Nacos 作为配置中心 & 读取Yaml配置信息 %}

在之前文章中我们学习到了`SpringCloud Alibaba`读取`Nacos Config`内定义的`properties`、`Yaml`类型的配置文件信息、配置信息实时更新、`Profile`环境下的配置信息读取优先级等。

## 开始本章

本章同样需要在`Nacos Console`控制台添加我们需要的配置信息。

### Nacos Server
需要在本地安装`Nacos Server`才能完成本章的内容讲解，具体的安装步骤访问[Nacos 官方文档](https://nacos.io/zh-cn/docs/quick-start.html)
### 添加配置
我们通过访问本地的`Nacos Console`控制台添加本章所需要的配置信息。
#### 添加自定义的NameSpace
不过在添加配置之前我们需要先来自定义一个`namespace`，如下图所示：
![](/images/post/hengboy-sca-nacos-config-namespace-1.png)

添加完成后在命名空间列表内有一个我们需要用到的参数`命名空间ID`，这个参数需要配置到我们的应用程序内，下面进行讲解。
回到`配置列表`后在顶部我们点击`测试命名空间`就可以查看该`NameSpace`下所有的配置列表。
添加本章使用的配置信息如下图所示：

![](/images/post/hengboy-sca-nacos-config-namespace-2.png)

在上图中我们定义的`Group`为`hengboy`，该参数也需要接下来配置在应用程序内。
### 创建应用
**第一步：创建应用程序**
通过`Idea`开发工具创建一个`SpringBoot`项目并添加本章使用的依赖信息，`pom.xml`如下所示：
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
```
**第二步：bootstrap.yml配置**
创建`bootstrap.yml`配置文件，添加如下配置信息：
``` yaml
spring:
  application:
    name: hengboy-sca-nacos-config-namespace
  cloud:
    nacos:
      config:
        server-addr: 127.0.0.1:8848
        file-extension: yaml
        # 自定义namespace
        namespace: 52cfe0c1-746c-4f82-b161-a8799af1b1e9
        # 自定义分组
        group: hengboy
```

- `spring.cloud.nacos.config.namespace`
配置自定义的`namespace`的`ID`，该值可以在`Nacos Console`控制台`命名空间列表`中获得。

- `spring.cloud.nacos.config.group`
配置自定义的`group`，该值是在添加配置信息时输入的值，也就是`hengboy`。

**第三步：读取配置信息**
我们通过一个`单元测试`来读取配置信息，如下所示：
``` java
@RunWith(SpringRunner.class)
@SpringBootTest
public class ConfigNameSpaceTest {
    /**
     * logger instance
     */
    static Logger logger = LoggerFactory.getLogger(ConfigNameSpaceTest.class);
    /**
     * 配置信息
     */
    @Value(value = "${hengboy.name:}")
    private String name;

    @Test
    public void getConfig() {
        logger.info("获取配置信息：{}", name);
    }
}
```

**第四步：运行测试**
执行`ConfigNameSpaceTest#getConfig`单元测试方法，查看控制台输出内容如下所示：
```
2019-03-05 15:55:17.388  INFO 81736 --- [           main] c.y.c.s.a.n.c.n.ConfigNameSpaceTest      : 获取配置信息：yuqiyu
```

### 总结
自定义配置`NameSpace`、`Group`对于`SpringCloud Alibaba Nacos Config`来说是比较简单的，只需要简单的配置就可以，如果你的系统模块较多，建议使用`namespace`、`group`来进行划分，这样就可以更好的管理配置信息。
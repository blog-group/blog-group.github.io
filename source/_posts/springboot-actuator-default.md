---
id: springboot-actuator-default
article_type: 原创
enable_comment: true
article_author: 于起宇
copyright: true
tags: [SpringBoot,Actuator]
categories: SpringBoot
keywords: actuator,springboot,springcloud
date: 2018-10-22 15:12:59
title: 探究Actuator的默认开放节点 & 详细健康状态
description: '探究SpringBoot Actuator的默认开放节点 & 详细健康状态'
---
系统的`监控`在分布式的设计中显得尤为重要，因为分开部署的缘故，并不能及时的了解到`程序运行的实时状况`，之所以重要所以`SpringBoot`也给我提供了一套自动监控的`API`，可以无缝整合`spring-boot-admin`来完成图形化的展示，我们本章先来介绍下`actuator`系统监控相关内容。
<!--more-->

### 本章目标
通过`spring-boot-actuator`完成系统运行监控，实时了解程序运行的环境是否健康。

### 构建项目
使用`idea`开发工具创建`SpringBoot`项目并添加`spring-boot-starter-actuator`以及`spring-boot-starter-web`（如果缺少`web`依赖会导致本章项目无法启动(没有内部集成的`web容器`无法运行.)，`pom.xml`文件部分内容如下所示：
``` xml
<dependencies>
    <!--Web-->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <!--Actuator-->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-actuator</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```

### 配置绑定映射类
> 有关本章开放节点的配置都被映射到属性配置类`org.springframework.boot.actuate.autoconfigure.endpoint.web.WebEndpointProperties`中，通过`@ConfigurationProperties`注解自动映射`application.yml`配置文件内以前缀`management.endpoints.web`的属性配置信息。

### 默认开放的节点
`Actuator`默认开放了两个节点信息，分别是：
- `health`：健康监测节点
健康节点我们在访问时`默认`只可以查看当前系统的`运行状态`，如下所示：
``` json
{
    "status": "UP"
}
```
如果不开放相关的配置无法查看详细的`运行健康信息`，比如：硬盘等。
- `info`：基本信息查看节点

> 我们在属性类`WebEndpointProperties`内也并没有看到`health`、`info`作为初始化的值赋值给`exposure.include`，那么是怎么进行赋值的呢？

#### 元数据配置文件
`spring-configuration-metadata.json`(元数据配置文件)位于`spring-boot-actuator-autoconfigure-2.0.6.jar`依赖的`META-INF`目录下，主要作用是对应`WebEndpointProperties`等属性配置类的`字段类型`、`描述`、`默认值`、`对应目标字段`的定义，具体的实现我在`自定义starter`的文章内有讲到，我们找到`name`为`management.endpoints.web.exposure.include`的配置如下：
``` json
.....
{
  "sourceType": "org.springframework.boot.actuate.autoconfigure.endpoint.web.WebEndpointProperties$Exposure",
  "defaultValue": [
    "health",
    "info"
  ],
  "name": "management.endpoints.web.exposure.include",
  "description": "Endpoint IDs that should be included or '*' for all.",
  "type": "java.util.Set<java.lang.String>"
},
.....
```
通过配置的`defaultValue`来自动映射到`WebEndpointProperties`属性配置类的`Exposure#include`字段，下面简单介绍上面的字段：
- `sourceType`：该配置字段所关联`配置类`的类型（全限定名）
- `defaultValue`：默认值，根据`type`来设置，如上`java.util.Set<java.lang.String>`类型的默认值就可以通过`["health","info"]`设置
- `name`：字段的名称，对应`配置类`内的`field`名称
- `description`：该配置字段的描述信息，可以是中文，填写后`idea`工具会自动识别并提示
- `type`：该字段的类型的全限定名，如：`java.lang.String`

### 查看详细健康状态
开启查看详细健康状态比较简单，通过配置参数`management.endpoint.health.show-details`来进行修改，该参数的值由`org.springframework.boot.actuate.health.ShowDetails`枚举提供配置值，`ShowDetails`源码如下所示：
``` java
/**
 * Options for showing details in responses from the {@link HealthEndpoint} web
 * extensions.
 *
 * @author Andy Wilkinson
 * @since 2.0.0
 */
public enum ShowDetails {

	/**
	 * Never show details in the response.
	 */
	NEVER,

	/**
	 * Show details in the response when accessed by an authorized user.
	 */
	WHEN_AUTHORIZED,

	/**
	 * Always show details in the response.
	 */
	ALWAYS

}
```
在`spring-configuration-metadata.json`元数据文件内，配置的`showDetails`的默认值为`never`，也就是不显示详细信息，配置如下所示：
```json
{
  "sourceType": "org.springframework.boot.actuate.autoconfigure.health.HealthEndpointProperties",
  "defaultValue": "never",
  "name": "management.endpoint.health.show-details",
  "description": "When to show full health details.",
  "type": "org.springframework.boot.actuate.health.ShowDetails"
}
```
我们修改`management.endpoint.health.show-details`参数为`always`后重新项目再次访问`/actuator/health`就可以获取如下的信息：
```json
{
    "status": "UP",
    "details": {
        "diskSpace": {
            "status": "UP",
            "details": {
                "total": 250790436864,
                "free": 77088698368,
                "threshold": 10485760
            }
        }
    }
}
```

### 自定义节点访问前缀
`actuator`默认的所有节点的访问前缀都是`/actuator`，在`application.yml`配置文件内设置`management.endpoints.web.basePath`参数进行修改，如下所示：
```yaml
# 管理节点配置
management:
  endpoints:
    web:
      # actuator的前缀地址
      base-path: /
```

> `basePath`字段位于`WebEndpointProperties`属性配置类内，修改完成重启项目就可以使用修改后的路径进行访问，我们上述直接映射到了`/`下。

### 总结
通过本章的讲解我们明白了`spring-boot-actuator`默认开放了`health`、`info`两个节点，通过配置健康检查详细信息可以查看硬盘相关的运行健康状态。
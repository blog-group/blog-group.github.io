---
id: springboot-actuator-change-mapping
article_type: 原创
article_author: 于起宇
enable_comment: true
news: true
tags: [SpringBoot]
categories: [SpringBoot]
keywords: actuator,springboot,springcloud
date: 2018-10-26 14:40:22
title: Actuator自定义节点路径 & 监控服务自定义配置
description: 'Actuator自定义节点路径 & 监控服务自定义配置'
---
既然`Actuator`给我们内置提供了节点映射，我们为什么还需要进行修改呢？
> 正因为如此我们才需要进行修改！！！

路径都是一样的，很容易就会`暴露出去`，导致信息泄露，发生一些无法估计的事情，如果我们可以`自定义节点的映射路径`或者`自定义监控服务的管理信息`，这样就不会轻易的暴露出去，`Actuator`已经为了们提供了对应的方法来解决这个问题，下面我们来看下吧。
<!--more-->

### 本章目标
自定义`Actuator`节点映射路径、`监控服务`配置信息等，提高监控服务的安全性。
### 构建项目
最近这几篇有关`Actuator`的文章使用的源码都是同一个，源码已经上传了码云，点击下载[源码汇总](https://gitee.com/hengboy/spring-boot-chapter)
，源码位置：`SpringBoot2.x/hengboy-spring-boot-actuator`，本章也使用之前创建的项目，下载后通过`idea`工具打开，在原来基础上进行修改。

### 自定义监控节点映射路径
之前章节讲到了`Actuator`为我们提供了`org.springframework.boot.actuate.autoconfigure.endpoint.web.WebEndpointProperties`类，用于配置监控管理`web`端的信息，映射路径也在该配置类中，通过修改`management.endpoints.web.path-mapping`配置来修改指定的`节点映射路径`，如下所示：
```yaml
# 管理节点配置
management:
  endpoints:
    web:
      # 自定义路径映射
      path-mapping:
        # key=>value形式，原映射路径=>新映射路径
        health: healthcheck
```
`path-mapping`参数值需要`key->value`形式接收，在`WebEndpointProperties`类内是以`Map<String, String>`类型定义的。
- `key`：原`监控节点映射路径`，如：`health`
- `value`，新的`监控节点映射路径`，如：`healthcheck`

修改后我们就可以通过访问`/actuator/healthcheck`访问监控的健康信息。
> 如果你修改了`management.endpoints.web.base-path`,那么前缀为你修改后得值，具体可以访问{% post_path springboot-actuator-default 探究Actuator的默认开放节点 & 详细健康状态 %}了解详情。

#### 运行测试
启动本章项目，打开`浏览器`或者`终端`，如下为终端示例：
```
➜ ~ curl http://localhost:8080/healthcheck
{"status":"UP","details":{"diskSpace":{"status":"UP","details":{"total":250790436864,"free":75346001920,"threshold":10485760}}}}
```
通过访问`/healthcheck`可以查询到详细的信息。

### 自定义监控端口号
默认`Actuator`监控服务的`端口号`跟`项目端口号`一致，本章项目的端口号为`8080`所以我们通过`http://localhost:8080`前缀就可以访问到`监控节点`，那我们该怎么修改`监控节点端口号`呢？

#### ManagementServerProperties
`Acutator`内置了配置类`org.springframework.boot.actuate.autoconfigure.web.server.ManagementServerProperties`来进行自定义设置`监控服务`基本信息，该配置类内包含了`端口号(port)`、`服务地址(address)`、`安全SSL（ssl）`等。
我们通过修改`management.server.port`进行自定义`监控端口号`，如下所示：
```yaml
# 管理节点配置
management:
  # 修改监控服务端的端口号
  server:
    port: 8001
```

#### 运行测试
修改完成后，重启本章项目，然后通过如下命令访问：
```json
➜  ~ curl http://localhost:8001/healthcheck
{"status":"UP","details":{"diskSpace":{"status":"UP","details":{"total":250790436864,"free":75105476608,"threshold":10485760}}}}
```
通过`8001`端口已经可以访问到开放的监控节点，修改后再次访问同项目端口号的地址会出现`404`错误信息。

### 总结
本章介绍了自定义`Actuator`开放的`监控节点`的`映射路径`，还简单介绍了通过修改`management.server.port`参数进行自定义`监控服务`的`管理端口号`。

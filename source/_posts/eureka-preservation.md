---
id: eureka-preservation
article_type: 原创
article_author: 于起宇
enable_comment: true
news: true
tags:
    - SpringCloud
    - Eureka
categories: 
    - SpringCloud
date: 2018-10-08 17:26:09
title: Eureka服务注册中心的失效剔除与自我保护机制
keywords: eureka,SpringCloud,SpringBoot
description: 'Eureka服务注册中心的失效剔除与自我保护机制'
---
`Eureka`作为一个成熟的`服务注册中心`当然也有合理的内部`维护服务节点`的机制，比如我们本章将要讲解到的`服务下线`、`失效剔除`、`自我保护`，也正是因为内部有这种维护机制才让`Eureka`更健壮、更稳定。
<!--more-->

### 本章目标
了解`Eureka`是怎么保证`服务相对较短时长内`的有效性。

### 服务下线
`迭代更新`、`终止访问`某一个或者多个`服务节点`时，我们在`正常关闭服务节点`的情况下，`Eureka Client`会通过`PUT`请求方式调用`Eureka Server`的`REST`访问节点`/eureka/apps/{appID}/{instanceID}/status?value=DOWN`请求地址，告知`Eureka Server`我要下线了，`Eureka Server`收到请求后会将该`服务实例`的`运行状态`由`UP`修改为`DOWN`，这样我们在`管理平台`服务列表内看到的就是`DOWN`状态的服务实例。

> 有关`Eureka Server`内部的`REST`节点地址，请访问{% post_path eureka-rest Eureka服务注册中心内置的REST节点列表 %}来了解详情。

### 失效剔除
`Eureka Server`在启动完成后会创建一个定时器每隔`60秒`检查一次`服务健康状况`，如果其中一个服务节点超过`90秒`未检查到心跳，那么`Eureka Server`会自动从`服务实例列表`内将该服务`剔除`。

> 由于非正常关闭不会执行`主动下线`动作，所以才会出现`失效剔除`机制，该机制主要是应对非正常关闭服务的情况，如：`内存溢出`、`杀死进程`、`服务器宕机`等`非正常流程`关闭服务节点时。


### 自我保护

`Eureka Server`的`自我保护机制`会检查最近`15分钟`内所有`Eureka Client`正常心跳的占比，如果低于`85%`就会被触发。
我们如果在`Eureka Server`的管理界面发现如下的红色内容，就说明已经触发了`自我保护机制`。
```
EMERGENCY! EUREKA MAY BE INCORRECTLY CLAIMING INSTANCES ARE UP WHEN THEY'RE NOT. RENEWALS ARE LESSER THAN THRESHOLD AND HENCE THE INSTANCES ARE NOT BEING EXPIRED JUST TO BE SAFE.
```

当触发`自我保护机制`后`Eureka Server`就会`锁定服务列表`，不让服务列表内的服务`过期`，不过这样我们在访问服务时，得到的服务很有可能是`已经失效的实例`，如果是这样我们就会无法访问到期望的资源，会导致服务调用失败，所以这时我们就需要有对应的`容错机制`、`熔断机制`，我们在接下来的文章内会详细讲解这块知识点。

我们的服务如果是采用的`公网IP地址`，出现`自我保护机制`的几率就会`大大增加`，所以这时更要我们部署多个相同`InstanId`的服务或者建立一套完整的`熔断机制`解决方案。

#### 自我保护开关

如果在本地测试环境，建议关掉`自我保护机制`，这样方便我们进行测试，也更准备的保证了`服务实例`的`有效性`！！！

> `关闭自我保护`只需要修改`application.yml`配置文件内参数`eureka.server.enable-self-preservation`将值设置为`false`即可。

### 总结

我们通过本章的讲解，了解到了`Eureka Server`对服务的治理，其中包含`服务下线`、`失效剔除`、`自我保护`等，对`自我保护机制`一定要谨慎的处理，防止出现服务失效问题。
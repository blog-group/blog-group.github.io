---
id: springboot-actuator-exposure-include
article_type: 原创
article_author: 于起宇
enable_comment: true
news: true
tags: [SpringBoot,Actuator]
categories: SpringBoot
keywords: actuator,springboot,springcloud
date: 2018-10-22 17:28:23
title: 你了解Actuator开放指定监控节点吗？
description: '你了解SpringBoot Actuator开放指定监控节点吗？'
---
之前章节{% post_link springboot-actuator-default 探究Actuator的默认开放节点 & 详细健康状态 %}讲解了`spring-boot-actuator`默认开放的节点以及如何修改查看详细的健康信息，那我们怎么设置`开放指定的节点`访问呢？
<!--more-->
### 本章目标
开放`spring-boot-actuator`的指定节点访问。
### 构建项目
由于我们在[SpringBoot核心技术：探究Actuator的默认开放节点 & 详细健康状态]{% post_link springboot-actuator-default 探究Actuator的默认开放节点 & 详细健康状态 %}已经创建了项目，之前章节的源码已经上传到`码云`，访问：[SpringBoot源码汇总](https://gitee.com/hengboy/spring-boot-chapter)下载源码，下载完成后使用`idea`工具打开即可，我们在之前的基础上修改。

### 开放指定节点
`management.endpoints.web.exposure.include`的配置字段我们已经了解到了在`org.springframework.boot.actuate.autoconfigure.endpoint.web.WebEndpointProperties`属性配置类内，而且`exposure.include`的值默认为`["health","info"]`。

除此之外通过`spring-configuration-metadata.json`元数据配置文件内还知道了`management.endpoints.web.exposure.include`配置参数的类型为`java.util.Set<java.lang.String>`，这样我们就知道了该如何进行修改配置了，修改`application.yml`配置文件如下所示：
```yaml
# 管理节点配置
management:
  endpoints:
    web:
      # actuator的前缀地址
      base-path: /
      # 开放指定节点
      exposure:
        include:
          - health
          - info
          - mappings
          - env
```
由于`management.endpoints.web.exposure.include`是`java.util.Set<java.lang.String>`类型，那么我就可以采用`中横线换行`形式进行配置(这是SpringBoot采用yaml配置文件风格的约定)，
一个`- xxx`代表一个配置的值。

当然我们采用`数组的形式`也是可以的，如下所示：
```yaml
# 管理节点配置
management:
  endpoints:
    web:
      # actuator的前缀地址
      base-path: /
      # 开放指定节点
      exposure:
        include: ["health","info","mappings","env"]
```

### 开放全部节点
如果不做节点的开放限制，可以将`management.endpoints.web.exposure.include`配置为`*`，那么这样就可以开放全部的对外`监控的节点`，如下所示：
```yaml
# 管理节点配置
management:
  endpoints:
    web:
      # actuator的前缀地址
      base-path: /
      # 开放指定节点
      exposure:
        include: "*"
```
### 内置节点列表
`开放全部节点后`在项目启动时，控制台会打印已经映射的路径列表，`spring-boot-actuator`内置了丰富的常用监控节点，详见如下表格：

|节点|节点描述|是否默认启用|
|---|---|---|
|auditevents|公开当前应用程序的审核事件信息。|是|
|beans|显示应用程序中所有Spring bean的完整列表。|是|
|conditions|显示在配置和自动配置类上评估的条件以及它们匹配或不匹配的原因。|是|
|configprops|显示所有的整理列表@ConfigurationProperties。|是|
|env|露出Spring的属性ConfigurableEnvironment。|是|
|health|显示应用健康信息。|是|
|httptrace|显示HTTP跟踪信息（默认情况下，最后100个HTTP请求 - 响应交换）。|是|
|info|显示任意应用信息。|是|
|loggers|显示和修改应用程序中记录器的配置。|是|
|metrics|显示当前应用程序的“指标”信息。|是|
|mappings|显示所有@RequestMapping路径的整理列表。|是|
|scheduledtasks|显示应用程序中的计划任务。|是|
|shutdown|允许应用程序正常关闭。|否|
|threaddump|执行线程转储。|是|
|sessions|允许从Spring Session支持的会话存储中检索和删除用户会话。使用Spring Session对响应式Web应用程序的支持时不可用。|是|

### 总结
通过本章详细你应该可以知道你需要开发的节点了，根据具体的业务需求开放不同的节点。

> 注意：节点开放一定要慎重，不要过度开放接口，也不要方便盲目填写`*`开放全部节点。
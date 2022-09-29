---
id: springboot-actuator-remote-shutdown
article_type: 原创
article_author: 于起宇
enable_comment: true
news: true
tags: [SpringBoot,Actuator]
categories: SpringBoot
keywords: actuator,springboot,springcloud
date: 2018-10-24 17:09:33
title: Actuator远程关闭服务“黑科技”
description: 'SpringBoot Actuator远程关闭服务“黑科技”'
---
之前章节介绍了`Actuator`对服务系统监控相关的知识点，了解到了开放指定`监控节点`、`查看详细健康信息`，我们本章来介绍下`Actuator`的黑科技，远程关闭应用服务。
<!--more-->
### 本章目标
通过配置`Actuator`完成`服务远程关闭`。
### 构建项目
本章同样使用之前章节的源码基础上修改，访问[源码汇总](https://gitee.com/hengboy/spring-boot-chapter)下载`SpringBoot2.x/hengboy-spring-boot-actuator`章节源码，通过`idea`工具进行打开。

### 配置远程关闭服务
由于`Autuator`内置了`远程关闭服务`功能，所以我们可以很简单的开启这一项`“黑科技”`,修改`application.yml`配置文件，如下所示：
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
          - shutdown
    # 开启远程关闭服务
    shutdown:
      enabled: true
```
通过`management.endpoint.shutdown.enabled`参数来进行设置，默认为`false`，默认不会开启`远程关闭服务`功能，然后把`shutdown`节点进行开放，否则无法发送`远程关机`请求。

> 注意：在{% post_link springboot-actuator-exposure-include 你了解Actuator开放指定监控节点吗？ %}文章内我们说到了`Actuator`内置的`监控节点列表`，当我们访问`shutdown`节点时必须发送`POST`类型请求，否则无法执行关机操作。

### 测试
打开`终端`或者`postman`工具进行测试关机请求，如下是`终端`命令测试结果：
```
curl -X POST http://localhost:8080/shutdown
```
通过`curl`命令发送`POST`请求类型到`http://localhost:8080/shutdown`，发送完成后会响应一段信息：
```json
{"message":"Shutting down, bye..."}
```
我们去查看对应的`服务实例运行状态`时可以发现已经停止了。
### 总结
本章配置比较简单，通过修改两个地方开启了`远程关闭服务`的操作。

> 不过建议没事不要打开，打开后也不要对公网开放，`黑科技`都是比较危险的。

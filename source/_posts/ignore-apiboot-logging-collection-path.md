---
id: ignore-apiboot-logging-collection-path
title: ApiBoot Logging忽略路径不进行采集日志
article_type: 原创
article_author: 于起宇
enable_comment: true
news: true
tags: [ApiBoot,日志组件]
categories: [ApiBoot]
keywords: apiboot,springboot,logging
date: 2019-10-29 09:02:51
article_url:
description: 'ApiBoot Logging忽略路径不进行采集日志'
---
`ApiBoot Logging`支持排除指定路径不参与日志的采集，当我们的服务集成`actuator`时，会**不断的重复调用内置的路径**导致大量采集到一些无关业务的日志信息，当然这只是一个例子，集成其他的第三方组件时也可能出现定时重复调用接口的场景。
<!--more-->
## 创建示例项目

本章所使用的示例项目请访问【{% post_path modify-apiboot-logging-collection-prefix %}】文章底部访问源码下载后导入`idea`工具。

## 配置排除路径

`ApiBoot Logging`提供了配置参数`api.boot.logging.ignore-paths`，该配置参数的数据类型为`java.lang.String[]`，可以使用`,`逗号隔开配置多个`忽略采集日志`的路径。

修改`application.yml`配置文件内容如下所示：

```yaml
api:
  boot:
    # ApiBoot Logging 相关配置
    logging:
      # 修改采集日志的前缀
      logging-path-prefix: /user/**,/order/**
      # 控制台打印日志
      show-console-log: true
      # 美化控制台打印的日志
      format-console-log-json: true
      # 排除/user/info路径不进行采集日志
      ignore-paths: /user/info
```

在上面配置中排除了`/user/info`路径采集日志。

## 运行测试

导入`idea`的源码并没有添加`/user/info`路径请求方法，下面我们修改`UserController`类如下所示：

```java
/**
  * 用户信息
  * /user/info
  *
  * @return
  */
@GetMapping(value = "/info")
public String info() {
  return "this is user info";
}
```

使用`Application`方式启动本章源码，通过`curl`方式访问`/user/info`路径，如下所示：

```bash
➜ ~ curl http://localhost:8080/user/info
this is user info
```

访问成功后，查看控制台并未发现有请求日志输出，证明了`/user/info`路径被排除了。

## 敲黑板，划重点

`api.boot.logging.ignore-paths`配置参数与`api.boot.logging.logging-path-prefix`可以`组合使用`，可以`进行重叠`，排除的路径是在`org.minbox.framework.logging.client.interceptor.web.LoggingWebInterceptor#checkIgnore`方法内进行判断，支持`Ant`风格路径过滤。

## 本章源码
本篇文章示例源码可以通过以下途径获取，目录为`SpringBoot2.x/modify-apiboot-logging-collection-prefix`：

- Gitee：https://gitee.com/hengboy/spring-boot-chapter
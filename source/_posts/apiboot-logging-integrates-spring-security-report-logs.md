---
id: apiboot-logging-integrates-spring-security
title: ApiBoot Logging整合Spring Security安全上报日志
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: true
news: true
tags:
  - ApiBoot
categories:
  - ApiBoot
keywords: apiboot,logging,security
description: 'ApiBoot Logging整合Spring Security安全上报日志'
date: 2019-11-03 21:34:14
article_url:
---
`ApiBoot Logging`在上报日志时虽然是一般通过内网的形式部署，不过安全方面还是主要依赖于服务器的`安全策略`（防火墙），为了提高日志上报的安全性，`ApiBoot Logging`支持了整合`Spring Security`来使用`Basic Auth`的形式上传日志信息。
<!--more-->

## 创建Logging Admin项目
我们需要在集成`ApiBoot Logging Admin`项目内添加`Spring Security`相关依赖来完成安全配置，我们需要创建一个`Logging Admin`项目，可参考【{% post_path apiboot-report-logs-by-logging-to-admin %}】文章内容。
### 集成Spring Security
在`Logging Admin`项目`pom.xml`文件内添加`Spring Security`依赖，如下所示：
```xml
<!--SpringBoot Security-->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>
```
### 配置Spring Security认证用户

我们使用`SpringBoot`集成`Spring Security`提供的配置文件的方式配置`Basic User`信息，这种方式使用的是内存方式，用户信息被存储在内存中，如果你需要从数据库内读取，可以查看`Spring Security`的`UserDetails`具体使用方法。

**application.yml**文件添加如下配置：

```yaml
spring:
  # 配置内存方式Spring Security用户信息
  security:
    user:
      name: admin
      password: admin123
```



## 创建Logging Client项目

我们的业务服务需要集成`ApiBoot Logging`依赖（作为`Logging Client`进行上报请求日志），可参考【{% post_path apiboot-unified-manage-request-logs %}】文章内容创建项目。

### 配置安全上报

如果使用过`Eureka`的小伙伴应该对**路径**配置`Basic User`的方式不陌生，格式为：`username:password@ip:port`。

**application.yml**修改上报的`Logging Admin`路径如下所示：

```yaml
api:
  boot:
    logging:
      # 美化打印日志
      format-console-log-json: true
      # 控制台显示打印日志
      show-console-log: true
      # 配置Logging Admin
      admin:
        server-address: admin:admin123@127.0.0.1:8081
```

我们在`Logging Admin`配置的用户名为：`admin`，密码为：`admin123`，而`@`符号后面就是`Logging Admin`的`IP地址`以及`端口号`。

## 测试

下面我们进行测试`Spring Security`是否起到了作用。

依次启动`Logging Admin`、`Logging Client`，通过以下命令访问接口：

```bash
➜ ~ curl http://localhost:8080/test\?name\=admin 
你好：admin
```

在`Logging Admin`控制台可以看到上报的请求日志信息时，证明我们已经**安全的上报了日志**，如果`Logging Client`控制台打印`401 Exception`认证错误信息，请检查`Logging Client`配置的路径`Basic User`是否正确。

## 敲黑板，划重点

请求日志是用来检查接口的稳定性、排除一些请求异常问题的主要凭据，所以我们尽可能要保证数据的有效性、安全性，建议搭配`Spring Security`一块使用`ApiBoot Logging`。

## 代码示例
如果您喜欢本篇文章请为源码仓库点个`Star`，谢谢！！！
本篇文章示例源码可以通过以下途径获取，目录为`apiboot-logging-integrates-spring-security`：

- Gitee：[https://gitee.com/minbox-projects/api-boot-chapter](https://gitee.com/minbox-projects/api-boot-chapter)
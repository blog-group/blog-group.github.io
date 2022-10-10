---
id: apiboot-quartz-job-storage-away
title: 分布式任务调度框架ApiBoot Quartz内的两种任务存储方式
sort_title: 分布式任务调度框架ApiBoot Quartz内的两种任务存储方式
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: false
news: true
disable_toc: false
customize: false
tags: [ApiBoot,Quartz]
categories: [ApiBoot]
keywords: quartz,apiboot
description: '分布式任务调度框架ApiBoot Quartz内的两种任务存储方式'
date: 2020-01-09 09:49:56
article_url:
---

## 前言

`Quartz`是一款比较优秀的分布式任务调度框架，`ApiBoot`对其封装之前就有两种任务存储方式，分别是：`memory`（内存方式）、`jdbc`（数据库方式），不过我们需要编写一些繁琐的代码配置，`ApiBoot`实现了集成后，可快速应用到项目中，而且还提供了 [ApiBootQuartzService](https://gitee.com/minbox-projects/api-boot/blob/master/api-boot-project/api-boot-plugins/api-boot-plugin-quartz/src/main/java/org/minbox/framework/api/boot/plugin/quartz/ApiBootQuartzService.java) 接口用于操作任务的状态、有效性、新任务创建等，提供了一些常用方法，使用时只需要注入即可，因为该类在 [ApiBootQuartzAutoConfiguration](https://gitee.com/minbox-projects/api-boot/blob/master/api-boot-project/api-boot-autoconfigure/src/main/java/org/minbox/framework/api/boot/autoconfigure/quartz/ApiBootQuartzAutoConfiguration.java) 自动化配置类中已经做了实例化。
<!--more-->
## 任务存储

之前有提到`Quartz`提供了两种任务存储的方式，这两种存在什么区别呢？

- **内存方式**：将任务临时存储到内存中，仅支持单项目部署，项目重启后任务会失效，不支持由调度器控制任务漂移，不建议使用。
- **数据库方式**：`Quartz`提供了多种数据库的所需表结构脚本，它内部通过`DataSource`来操作数据，支持分布式方式部署、支持任务漂移，项目重启后任务不会丢失，直到任务执行完成后才会被从数据库内清除。

## 默认方式

`ApiBoot`在整合`Quartz`之后将`内存方式`（memory）作为默认的任务存储方式，默认方式下不需要一行代码的配置就可以实现集成，通过`ApiBootQuartzService#newJob`方法就可以实现任务的初始化运行，还可以指定`Once`、`Loop`、`Cron`三种方式的任意一种来运行任务，使用方式详见：[分布式调度框架Quartz衍生出的三种任务类型，你用过几个？](https://blog.minbox.org/apiboot-quartz-job-types.html)

## 数据库方式

`Quartz`针对不同数据库类型提供了代理接口`DriverDelegate`，不同数据库类型都会有该代理接口的实现类，而我们平时所用到的则为`StdJDBCDelegate`，该类内包含了`Quartz`操作数据库表内数据的全部方法。

### 数据脚本

`Quartz`针对不同类型的数据库分别提供了 [建表语句](https://gitee.com/minbox-projects/api-boot/tree/master/api-boot-samples/api-boot-sample-quartz/src/main/resources/schemas)，使用时请按照脚本名称自行选择。

### ApiBoot Quartz启用数据库方式

启用的方式很简单，只需要在`application.yml/application.properties`文件内添加如下配置：

```yaml
api:
  boot:
    quartz:
      # 配置使用Jdbc方式存储任务
      job-store-type: jdbc
```

> 注意事项：既然启用**数据库方式**，那么你的项目中必须要有`数据源`、`数据库驱动`、`实例化数据源`（实例化`DataSource`的工作一般是ORM框架来担任，如：[ApiBoot MyBatis Enhance](https://apiboot.minbox.org/zh-cn/docs/api-boot-mybatis-enhance.html)）等依赖。

## 敲黑板，划重点

本章主要介绍了`ApiBoot`整合`Quartz`后的任务存储方式配置方式以及提供的不同数据库的对应建表脚本。

> 如果你对`ApiBoot`开源框架在使用方面感觉不顺手，欢迎提出您的宝贵 [意见](https://gitee.com/minbox-projects/api-boot/issues)，让开源框架走更远的路、服务更多的开发者！！！
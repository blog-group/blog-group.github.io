---
id: message-pipe-release-1-0-2
title: 顺序消息管道《Message Pipe》v1.0.2版本发布
sort_title: message-pipe-release-1-0-2
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: false
news: true
disable_toc: false
customize: false
tags:
  - 技术杂谈
categories:
  - 技术杂谈
keywords: 'redisson,消息管道,顺序消息'
description: 它是`minbox`开源组织内的新成员，`Message Pipe`从字面的意思上理解为 "消息管道"，它确实是一个消息管道的定位，是基于`Redis`实现的分布式顺序消息管道。
date: 2020-09-07 11:16:13
article_url:
---

## Message Pipe是什么？

它是`minbox`开源组织内的新成员，`Message Pipe`从字面的意思上理解为 "消息管道"，它确实是一个消息管道的定位，是基于`Redis`实现的分布式顺序消息管道。

## 源码地址

目前`Message Pipe`开源平台：

- GitHub：https://github.com/minbox-projects/message-pipe
- Gitee：https://gitee.com/minbox-projects/message-pipe

另外ApiBoot对它进行了集成，可以通过配置文件的形式快速把`message-pipe`加入到项目中，详见：https://github.com/minbox-projects/api-boot。
集成相关代码：https://github.com/minbox-projects/api-boot/tree/master/api-boot-project/api-boot-autoconfigure/src/main/java/org/minbox/framework/api/boot/autoconfigure/message/pipe

## 可以解决什么问题？

它主要是来解决分布式系统下消息的顺序消费的方案，内部通过`Redisson`的分布式锁以及分布式队列的特性来完成消息的处理，消息的分发则是由`Grpc`来完成的。

消息分发时支持常见的负载均衡策略，比如：随机策略、IP轮询方式等。

由于内部采用的是分布式锁的方式实现，所以支持多个`Server`同时就行消息的轮询获取以及分发操作。

## 更新日志

详见：https://github.com/minbox-projects/message-pipe/releases/tag/1.0.2.RELEASE



## ✨   New Features

- [ [#75](https://github.com/minbox-projects/message-pipe/issues/75) ] 每个消息管道新增 ”MessagePipeDistributor“，用于自动分发管道内的消息

## 🐛  Fix Bugs

- [ [#77](https://github.com/minbox-projects/message-pipe/issues/77) ] 如果消息管道的数量超出配置上限，抛出异常提醒

## 🎨  Optimizations

- [ [#68](https://github.com/minbox-projects/message-pipe/issues/68) ] Server分发消息逻辑重构，优化线程池内线程占用CPU的使用率
- [ [#70](https://github.com/minbox-projects/message-pipe/issues/70) ] 废除 “MessageDistributionExecutor” 概念，修改为 “MessageScheduler”
- [ [#71](https://github.com/minbox-projects/message-pipe/issues/71) ] 废除 "MessagePipeMonitor" 公共消息管道监听器，为每个消息管道内的消息添加 "MessageMonitor"
- [ [#72](https://github.com/minbox-projects/message-pipe/issues/72) ] 重构消息管道 "MessagePipe" ，内聚操作管道内消息的方法



## 快速上手

为了快速上手，提供了`message-pipe`使用的示例项目，项目源码：[https://github.com/minbox-projects/message-pipe-example](https://github.com/minbox-projects/message-pipe-example)。

### 安装Redis

由于`message-pipe`基于`Redis`实现，所以我们首先需要在本机安装`Redis`，下面是使用`Docker`方式安装步骤：

```sh
# 拉取Redis镜像
docker pull redis
# 创建一个名为"redis"的后台运行容器，端口号映射宿主机6379
docker run --name redis -d -p 6379:6379 redis
```

### 查看Redis数据

```sh
# 运行容器内命令
docker exec -it redis /bin/sh
# 运行Redis客户端
redis-cli
# 选择索引为1的数据库
select 1
# 查看全部的数据
keys *
```

### 启动示例项目

```sh
# 下载源码
git clone https://github.com/minbox-projects/message-pipe-example.git
# 进入项目目录
cd message-pipe-example
# 运行Client与Server合并示例项目
cd client-server-merge
# 运行项目
mvn spring-boot:run
```
---
id: message-pipe-release-1-0-1
title: 顺序消息管道《Message Pipe》v1.0.1版本发布
sort_title: 顺序消息管道《Message Pipe》v1.0.1版本发布
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: false
news: true
disable_toc: false
customize: false
tags: [技术杂谈]
categories: [技术杂谈]
keywords: 'redisson,消息管道,顺序消息'
description: 它是`minbox`开源组织内的新成员，`Message Pipe`从字面的意思上理解为 "消息管道"，它确实是一个消息管道的定位，是基于`Redis`实现的分布式顺序消息管道。
date: 2020-08-31 10:06:54
article_url:
---

## Message Pipe是什么？

它是`minbox`开源组织内的新成员，`Message Pipe`从字面的意思上理解为 "消息管道"，它确实是一个消息管道的定位，是基于`Redis`实现的分布式顺序消息管道。

## 源码地址

目前`Message Pipe`开源平台以`GitHub`为主，`Gitee`则是一个同步库。

- GitHub：https://github.com/minbox-projects/message-pipe
- Gitee：https://gitee.com/minbox-projects/message-pipe

## 可以解决什么问题？

它主要是来解决分布式系统下消息的顺序消费的方案，内部通过`Redisson`的分布式锁以及分布式队列的特性来完成消息的处理，消息的分发则是由`Grpc`来完成的。

消息分发时支持常见的负载均衡策略，比如：随机策略、IP轮询方式等。

由于内部采用的是分布式锁的方式实现，所以支持多个`Server`同时就行消息的轮询获取以及分发操作。

## 特性

- 自动注册
- 心跳检查
- 消息分发
- 顺序消费
- 读写分离
- 线程安全
- 负载均衡
- 自动剔除
- ...

## 更新日志

详见：https://github.com/minbox-projects/message-pipe/releases/tag/1.0.1.RELEASE

## ✨ New Features

- [ [#39](https://github.com/minbox-projects/message-pipe/issues/39) ] Client通过 "Cglib动态代理" 的方式实现动态绑定管道
- [ [#40](https://github.com/minbox-projects/message-pipe/issues/40) ] Client/Server 通过正则表达式进行匹配 "pipeName"
- [ [#41](https://github.com/minbox-projects/message-pipe/issues/41) ] 禁用Server接收注册请求后根据每一个"Pipe Name"创建消息管道
- [ [#47](https://github.com/minbox-projects/message-pipe/issues/47) ] 使用Jackson代替fastjson转换实体与json字符串之间的相互转换方式
- [ [#51](https://github.com/minbox-projects/message-pipe/issues/51) ] MessageProcessor新增正则表达式方式处理消息，并为每个匹配的表达式管道建立一个Porxy代理类
- [ [#59](https://github.com/minbox-projects/message-pipe/issues/59) ] Server启动时自动加载Redis内的消息管道列表，并自动创建MessagePipe实例
- [ [#64](https://github.com/minbox-projects/message-pipe/issues/64) ] 重构Client连接Server的实现方式，新增支持Nacos NamingService方式

## 🐛 Fix Bugs

- [ [#45](https://github.com/minbox-projects/message-pipe/pull/45) ] 修复Client启动时一直重试注册到Server，导致阻塞主线程
- [ [#48](https://github.com/minbox-projects/message-pipe/issues/48) ] 删除客户端ReceiveMessageService处理消息时使用线程池
- [ [#53](https://github.com/minbox-projects/message-pipe/issues/53) ] 修复Redisson在高并发下出现的解锁异常
- [ [#55](https://github.com/minbox-projects/message-pipe/issues/55) ] 修复获取MessageProcessors实例时可能出现线程安全性问题
- [ [#57](https://github.com/minbox-projects/message-pipe/issues/57) ] 消息分发时，只有存在客户端列表才进行处理消息发送逻辑
- [ [#61](https://github.com/minbox-projects/message-pipe/issues/61) ] Server运行过程中CPU飙升
- [ [#65](https://github.com/minbox-projects/message-pipe/issues/65) ] Client注册时偶尔会出现获取IP地址为 "127.0.0.1"的情况

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

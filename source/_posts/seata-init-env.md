---
id: seata-init-env
title: 阿里巴巴分布式事务利器Seata环境准备
article_type: 原创
article_author: 于起宇
enable_comment: true
news: true
tags:
  - SpringCloud
  - Seata
categories:
  - SpringCloud
date: 2019-10-10 11:02:52
keywords: seata,springcloud,springboot
description: '阿里巴巴分布式事务利器Seata环境准备'
---

阿里巴巴自从跟SpringCloud共同发起创建微服务开源社区时，开启了`SpringCloud Alibaba`分支，而且在生态内提供了一款适用于分布式应用程序（`Dubbo`、`SpringCloud`等）的事务框架`Seata`，该框架经过多个大版本的发布，已经支持`MySQL`、`Oracle`这两种数据库事务回滚（`Rollback`）以及提交（`Commit`）控制，每次发版都会修复一些用户反馈的`Issue`以及添加一些新特性。
<!--more-->

## 安装Seata Server

`Seata`目前在`github`托管开源源代码，源码地址：<a href="https://github.com/seata/seata" target="_blank">https://github.com/seata/seata</a>

`Seata`每次发版都会提供`Server`在不同系统下的执行脚本，可以在`Linux/Mac/Windows`系统环境下直接执行脚本来启动。

#### 下载Seata Server

我们通过`github`的`releases`界面下载`seata`最新发布的`server`编译后的启动程序，下载地址：<a href="https://github.com/seata/seata/releases" target="_blank">https://github.com/seata/seata/releases</a>

根据系统运行环境下载不同的压缩文件，`Mac/Linux`可以选择下载`seata-server-xxx.tar.gz`，`Windows`可以选择下载`seata-server-xxx.zip`。

#### 解压Seata Server

在`Mac/Linux`系统下我们通过以下命令来解压`tar.gz`压缩文件：

```bash
~ tar -xvf seata-server-xxx.tar.gz
~ cd seata
~ ls
bin  conf  lib  LICENSE
```

解压完成后我们得到了几个文件夹。

- **bin**

  存放各个系统的`seata server`启动脚本

- **conf**

  存在`seata server`启动时所需要的配置信息、数据库模式下所需要的建表语句

- **lib**

  运行`seata server`所需要的依赖包列表

## 配置Seata Server

`seata server`所有的配置都在`conf`文件夹内，该文件夹内有两个文件我们必须要详细介绍下。

`seata server`默认使用`file`（文件方式）进行存储`事务日志`、`事务运行信息`，我们可以通过`-m db`脚本参数的形式来指定，目前仅支持`file`、`db`这两种方式。

- **file.conf**

  该文件用于配置`存储方式`、`透传事务信息的NIO`等信息，默认对应`registry.conf`文件内的`file`方式配置。

- **registry.conf**

  `seata server`核心配置文件，可以通过该文件配置`服务注册方式`、`配置读取方式`。

  注册方式目前支持file 、nacos 、eureka、redis、zk、consul、etcd3、sofa等方式，默认为`file`，对应读取`file.conf`内的注册方式信息。

  读取配置信息的方式支持file、nacos 、apollo、zk、consul、etcd3等方式，默认为`file`，对应读取`file.conf`文件内的配置。

## 启动Seata Server

启动`seata server`的脚本位于`bin`文件内，`Linux/Mac`环境使用**seata-server.sh**脚本启动，`Windows`环境使用**seata-server.bat**脚本启动。

`Linux/Mac`启动方式示例如下所示：

```bash
nohup sh seata-server.sh -p 8091 -h 127.0.0.1 -m file &> seata.log &
```

通过`nohup`命令让`seata server`在系统后台运行。

脚本参数：

- **-p**

  指定启动`seata server`的端口号。

- **-h**

  指定`seata server`所绑定的`主机`，这里配置要注意**指定的主机IP要与业务服务内的配置文件保持一致**，如：`-h 192.168.1.10`，业务服务配置文件内应该配置`192.168.1.10`，即使在同一台主机上也要保持一致。

- **-m**

  事务日志、事务执行信息存储的方式，目前支持`file`（文件方式）、`db`（数据库方式，建表语句请查看`config/db_store.sql`、`config/db_undo_log.sql`）

### 查看启动日志

执行完启动脚本后要查看日志来确认是否启动成功，使用如下命令：

```bash
~ tail -1000f seata.log
.....
2019-10-10 14:33:51.340 INFO [main]io.seata.core.rpc.netty.AbstractRpcRemotingServer.start:156 -Server started ... 
```

当我们看到`-Server started`时并未发现其他错误信息，我们的`seata server`已经启动成功。
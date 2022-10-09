---
id: git-gitolite-server
article_type: 原创
article_author: 于起宇
enable_comment: true
news: true
tags: 
    - 技术杂谈
categories: 
    - 技术杂谈
keywords: SpringCloud,SpringBoot,恒宇少年,微服务,Git
date: 2018-10-19 17:18:14
title: 在Ubuntu下部署Gitolite服务端
description: '在Ubuntu下部署Gitolite服务端'
---
`代码版本控制服务`最常用的有两种，分别是：`SVN`、`Git`，如果你在为你团队的`Git`代码服务部署搭建而犯愁可以通过本章的内容进行完成搭建部署，快速的进行添加开发者以及仓库信息维护、权限控制等。
<!--more-->
### 本章目标
在`Linux / Ubuntu18.04`系统搭建`Git`服务端。
### 安装Git
在搭建`Git`服务端的前提当然就是需要安装`Git`，当然本章虽然是基于`Ubuntu18.04`进行搭建的环境，如果你是`Ubuntu`其他版本也是可以的，不过安装之前建议更新下`apt-get`仓库源信息。
#### 更新系统软件仓库源
```
sudo apt-get update
```
#### 执行安装Git
如果你系统之前没有安装`open-ssh`相关依赖环境需要一并进行安装，命令如下所示： 
```
sudo apt-get install git openssh-server openssh-client
```
在上述安装过程中使用默认的配置即可，下面我们需要添加一个管理`Git Server`的系统用户，需要通过该用户进行配置一些服务端信息。
### 添加Git管理用户
执行如下命令添加`git`系统用户：
```
sudo adduser --system --shell /bin/bash --gecos 'Git Server User' --group --disabled-password --home /home/git git
```
创建一个名为`git`的系统用户，并且创建将`git`用户的根目录指定到`/home/git`，设置禁用密码方式登录，自动创建与用户同名的`git`用户组，将该用户加入到该用户组。

系统用户创建完成后我们需要`切换到该用户`进行安装`Gitolite`以及对`Gitolite`进行初始化，命令如下所示：
```
sudo su git
```
### 安装Gitolite
用户我们已经创建完成，接下来我们就需要进行安装`gitolite`了，如果你对`gitolite`不了解，可以去[https://github.com/sitaramc/gitolite](https://github.com/sitaramc/gitolite)查看官方文档。
目前我们已经登录了`git`用户，我们进入`git`用户的`home`目录，执行下载`gitolite`安装源码文件，如下所示：
```
// 进入git用户根目录
cd $HOME
// git clone gitolite源码
git clone https://github.com/sitaramc/gitolite
```
`clone`完成后，我们创建一个存放`gitolite`执行文件的目录，该目录用于后期的初始化以及设置，执行如下命令创建目录：
```
mkdir -p ${HOME}/bin
```
接下来我们需要将`gitolite`的执行命令都安装到`${HOME}/bin`目录下，如下所示：
```
${HOME}/gitolite/install -to ${HOME}/bin
```
执行完成后我们可以查看`%{HOME}/bin`目录下的内容，执行文件`gitolite`已经给我初始化好了：
```
git@code-server:~/bin$ ls
commands  gitolite  gitolite-shell  lib  syntactic-sugar  triggers  VERSION  VREF
```
到目前这一步我们差不多已经完成了`Gitolite Server`的配置，不过我们需要设置一个`管理员权限的客户端`，详见{% post_path git-gitolite-manage 在Ubuntu下为Gitolite添加管理端 %}。
### 总结
本章简单完成了`Gitolite`的安装，在接下来的章节会对仓库创建、权限控制等进行更新。
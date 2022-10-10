---
id: git-gitolite-client
article_type: 原创
article_author: 于起宇
enable_comment: true
news: true
copyright: true
tags: [Git]
categories: [Git]
keywords: SpringCloud,SpringBoot,恒宇少年,微服务,Git
date: 2018-10-20 14:27:31
title: 在Ubuntu下为Gitolite添加客户端
description: '在Ubuntu下为Gitolite添加客户端'
---
在之前的章节完成了`服务端`、`管理客户端`的配置，基础的配置已经完成，下面就可以开始把团队的开发人员添加到`服务端`了，`客户端`的配置要比`管理客户端`更简单一些，只需要把`客户端`生成的`公钥`上传到`服务端`即可。
<!--more-->
相关文章：
- {% post_path git-gitolite-server 在Ubuntu下部署Gitolite服务端 %}
- {% post_path git-gitolite-manage 在Ubuntu下为Gitolite添加管理端 %}

### 本章目标
完成`客户端`的`gitolite`配置。

### 前置条件
客户端需要安装`Git`客户端，可以去`Git`官网进行下载对应系统的安装文件，点击下载[https://git-scm.com/downloads](https://git-scm.com/downloads)

### 客户端的SSH KEY
在上传`公钥`之前，客户端需要先生成`公钥`文件才可以，同样是使用`ssh-keygen`命令来完成`RSA`方式的`公钥秘钥`生成。
#### Windows系统生成
如果你的客户端是使用`Windows`系统进行开发，安装完成`Git`客户端后在鼠标右键的功能菜单会出现一个`Git Bash Here`选项，点击该选项会弹出`Git命令终端`，在终端内执行如下命令：
``` bash
ssh-keygen -t rsa
```
一路回车过后，文件会出现在当前用户文件下，自动创建隐藏`.ssh`文件夹存放。如：`C:\Users\hengboy\.ssh`

#### Linux/Mac系统生成
在`Linux`/`Mac`系统上相对来说更简单一些，直接在`终端`输入上面的命令即可（前提：需要安装open-ssh相关依赖），一路回车后文件默认会被保存到`~/.ssh`目录下。
### 上传客户端公钥
将`.ssh`目录下的`id_rsa.pub`文件进行重命名，尽量使用开发人员的`姓名全拼`来命名，这样方便管理。

> 将新客户端的`公钥`上传到`gitolite-admin/keydir`的方式有很多种，可以通过`fileZiller`工具上传，也可以通过`scp`命令上传。

### 提交管理仓库
`公钥`上传到`管理客户端`的`gitolite-admin/keydir`仓库目录后，需要把变动进行`Push`到`Git服务端`才能生效，在管理端执行命令进入`gitolite-admin`仓库目录下后，执行如下命令：
``` bash
// add
yuqiyu@code-server:~/gitolite-admin$ git add .
// commit
yuqiyu@code-server:~/gitolite-admin$ git commit -m 'add developer users'
// push
yuqiyu@code-server:~/gitolite-admin$ git push origin master
```
上传完成后，这时`gitolite-admin/keydir`目录新添加的`客户端`就已经生效，可以进行操作配置的对应仓库。

### 总结
本章完成了`gitolite`的`客户端`添加，让`git`管理团队的代码更简单，简简单单的通过`公钥`、`秘钥`方式进行操作仓库。

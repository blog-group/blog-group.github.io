---
id: linux-without-password
title: Mac/Linux下配置远程Linux服务器免密登录
article_type: 原创
article_author: 于起宇
enable_comment: true
news: true
tags: [技术杂谈,Linux]
categories: [Linux]
date: 2019-09-29 14:14:25
keywords: Linux,Ubuntu,openssh
---
你还在为你每次打开`测试环境`、`生产环境`需要登录而犯愁吗？
登录是必须的，但密码是可或缺的！！！

因为前两章讲到了`Gitolite`服务端的配置，配置客户端时是采用的`SSH`方式授权登录的`Git Server`，如果你看过我的文章应该对`open-ssh`有一定的了解，我们本章的内容同样也是需要`open-ssh`的支持。
<!--more-->
## 本章目标
访问`Linux/Ubuntu`免密码`SSH`方式登录。

### 安装openssh-server
如果你的`服务器`并没有安装`openssh-server`需要执行下面的命令进行安装：
```bash
ubuntu@yuqiyu:~$ sudo apt-get install openssh-server
```
### 安装openssh-client
`Mac`系统自带`openssh`，所以不需要再次安装。
如果你是`Linux`系统作为`client`，执行如下命令安装：
```bash
client@other:~$ sudo apt-get install openssh-client
```

### Mac下生成SSH KEY
打开`Mac`系统自带的`终端`，通过`ssh-keygen`命令来进行生成`ssh key`信息，命令如下所示：
```bash
ssh-keygen -t rsa
```
不需要自定义配置信息，所有的询问通过回车跳过即可。
生成的文件去了哪里？之前也讲过位置，在这里再简单的说下，默认的位置在当前用户根目录下的`.ssh`隐藏目录内：
```bash
// 执行查看命令
ls ~/.ssh
// 文件列表
id_rsa   id_rsa.pub
```

### 远程Linux服务器授权公钥
先通过`用户名密码`的方式登录远程`Linux`服务器，把我们上一步生成的`id_rsa.pub`文件的内容复制到`authorized_keys`文件内，如下所示：
```
ubuntu@yuqiyu:~$ echo "公钥内容" >> ~/.ssh/authorized_keys 
```
- `公钥内容`：在上面命令中`公钥内容`就是生成的`id_rsa.pub`文件内容

### 测试免密登录
在本地终端输入如下命令测试是否可以直接连接到`远程服务器`：
```bash
ssh ubuntu@192.168.1.75
```
- `ubuntu`：访问远程服务器的用户名
- `192.168.1.75`：你的远程服务器的IP地址，根据实际情况而定

如果配置没有问题是直接可以访问到远程服务器的，这样是不是很简单？
### SSH Config
> 那如果你感觉通过`ssh user@ip`的方式比较麻烦（因为平时服务器较多的情况下会出现记错的情况而导致无法登录），我们还有更简单的方式。

通过修改本机的`.ssh/config`文件可以进行配置访问远程服务器的基本信息，下面是我的配置：
```config
Host owner
HostName 192.168.1.75
User ubuntu
IdentitiesOnly yes
```
配置文件保存退出，我们再次在终端输入如下命令进行测试免密登录：
```bash
ssh owner
```
发现同样可以免密进行登录，在这里的`owner`就是我们在`~/.ssh/config`配置文件的`Host`值，我们通过执行`ssh owner`，`ssh`就会去找配置该`owner`的`Host`信息，然后再次访问远程服务器。
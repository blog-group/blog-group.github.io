---
id: git-gitolite-manage
article_type: 原创
article_author: 于起宇
enable_comment: true
news: true
tags: [Git]
categories: [Git]
keywords: SpringCloud,SpringBoot,恒宇少年,微服务,Git
date: 2018-10-20 13:27:35
title: 在Ubuntu下为Gitolite添加管理端
description: '在Ubuntu下为Gitolite添加管理端'
---
在之前章节已经完成了服务端的配置，可以访问{% post_path git-gitolite-server 在Ubuntu下部署Gitolite服务端 %}查看配置步骤，因为`gitolite`的管理是通过一个名为`gitolite-admin`的仓库进行的，我们本章来主要讲解下这个仓库。
<!--more-->
### 本章目标
了解`gitolite-admin`仓库组成。

### 注意事项
> 注意：本章（除设置管理用户）操作用户并不是`git`（`git`用户是我们为服务端专属创建的用户），如果你是连续阅读{% post_path git-gitolite-server 在Ubuntu下部署Gitolite服务端 %}进行配置，请执行`exit`退出`git`用户。

### 生成SSH KEY
`Gitolite`的管理端可以跟`Server`是一个系统也可以是分开的系统，本章我们使用相同的系统来进行配置，后期我们创建的客户端用户也可以`授权管理权限`。

我们通过`ssh-keygen`命令来生成管理端的公私对秘钥，采用`RSA`加密方式进行生成，执行如下命令：
```
yuqiyu@code-server:~$ ssh-keygen -t rsa
```
这一步我们不用输入任何内容，敲回车跳过步骤直到生成结束，生成文件默认会到当前用户根目录下的`.ssh`目录内，查看命令如下：
```
yuqiyu@code-server:~$ cd ~/.ssh/
yuqiyu@code-server:~/.ssh$ ls
id_rsa  id_rsa.pub  
```
我们通过执行`ssh-keygen`命令已经生成了`公钥`、`秘钥`文件，接下来我们需要将`公钥`文件上传到`服务端`来完成管理端的配置。

### 上传公钥到服务端
在上传`公钥`之前，为了后期方便区分，我们来给`id_rsa.pub`文件修改下名称，命令如下所示：
```
yuqiyu@code-server:~/.ssh$ mv id_rsa.pub yuqiyu.pub
```
如果你的客户端与服务端在同一台服务器上，你可以直接把文件从`.ssh`复制到`服务端`，那如果不在同一台服务器上，只能通过`scp`命令进行远程复制，我们这里直接使用远程复制，同样适用于同一台服务器的场景，命令如下所示：
```
yuqiyu@code-server:~$ scp ~/.ssh/yuqiyu.pub yuqiyu@192.168.1.75:/tmp
```
上面的`scp`命令分解解释：
- `~/.ssh/yuqiyu.pub`：需要复制的文件
- `yuqiyu`：ssh复制时登录`服务端`的用户名
- `192.168.1.75`：服务端IP地址
- `/tmp`：文件复制目标目录

命令执行完成后，文件会自动复制到`服务端`的`/tmp`目录。

### 设置管理用户
公钥文件上传到`服务端`后我们需要把`持有该公钥文件`的用户设置为`管理用户`，首先我们需要登录`git`用户，如下所示：
```
yuqiyu@code-server:~$ sudo su git
```
然后执行`设置管理用户`的命令如下所示：
```
git@code-server:~$ ${HOME}/bin/gitolite setup -pk /tmp/yuqiyu.pub
```
执行完成后在终端会输出初始化管理仓库的消息，如下所示：
```
Initialized empty Git repository in /home/git/repositories/gitolite-admin.
Initialized empty Git repository in /home/git/repositories/testing.git/
	WARNING: /home/git/.ssh missing; creating a new one
	    (this is normal on a brand new install)
	WARNING: /home/git/.ssh/authorized_keys missing; creating a new one
	    (this is normal on a brand new install)
```
这样我们的管理用户已经设置完成了，也就是把我们的`yuqiyu`用户设置成为了`服务端`的管理用户，只有`yuqiyu`用户才可以操作`gitolite-admin`仓库内容。

### 克隆管理仓库
我们再次将用户切换到`yuqiyu`，由于我们目前在`git`用户下，需要执行`exit`命令退出`git`用户，到`yuqiyu`的根目录下执行`clone`管理仓库`gitolite-admin`，如下所示：
```
yuqiyu@code-server:/home$ cd ~
yuqiyu@code-server:~$ git clone git@192.168.1.75:gitolite-admin.git
Cloning into 'gitolite-admin'...
	remote: Counting objects: 6, done.
	remote: Compressing objects: 100% (4/4), done.
	Receiving objects: 100% (6/6), 719 bytes | 0 bytes/s, done.
	remote: Total 6 (delta 0), reused 0 (delta 0)
	Checking connectivity... done.
yuqiyu@code-server:~$ cd gitolite-admin/
yuqiyu@code-server:~/gitolite-admin$ ls
conf  keydir    
```
- `192.168.1.75`：`服务端`的IP地址
- `gitolite-admin.git`：管理仓库的名称，位置在`/home/git/repositories/`
- `conf`：`gitolite-admin`配置文件存放目录
- `keydir`：`gitolite-admin`公钥存放目录，我们之前配置的`yuqiyu.pub`也就是我们管理用户`yuqiyu`的公钥也会自动复制到该目录下。

### Gitolite Admin简介
`gitolite-admin`用于`gitolite`为了管理用户秘钥、仓库信息、用户授权等操作的仓库，通过简单的`git push origin master`命令就可以完成信息的修改，下面我们来简单看下配置文件的内容。
#### 配置文件
`clone`后，在`conf`目录下有一个名为`gitolite.conf`的配置文件，在该文件配置仓库的信息以及授权信息，如下所示：
```
repo gitolite-admin
        RW+     =   yuqiyu
repo testing
        RW+     =   @all
```
- `repo`：声明一个仓库，上面示例中仓库名为`gitolite-admin`、`testing`
- `RW+`：有读写的权限且可以强制推送
- `@all`：表示所有人、任何人

在仓库`tesing`的权限配置为所有人都有读写的权限，而`gitolite-admin`则是仅仅`yuqiyu`这个客户端有读写权限。

`gitolite`内权限的基本定义有如下几种：
- `C`：创建权限
- `R`：只读权限
- `RW+`：读写权限，可以强制推送
- `RWC`或`RW+C`：读写 + 创建
- `RWD`或`RW+D`：读写 + 删除
- `RWCD`或`RW+CD`：读写 + 创建删除

#### 公钥目录
在`gitolite-admin`内有一个名为`keydir`的目录，该目录存放了所有`客户端的公钥`，当然`管理端`其实也是一个客户端，`管理端的公钥`也存放在该目录，如果你想添加用户可以把公钥存放到该目录然后配置该用户对应的权限，创建客户端详见{% post_path git-gitolite-client 在Ubuntu下为Gitolite添加客户端 %}

### 总结
通过本章我们完成了对`gitolite`添加管理客户端，可以通过管理客户端来维护仓库信息、仓库授权等。
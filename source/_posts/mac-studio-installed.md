---
id: mac-studio-installed
title: 程序员新入手MacStudio的装机环境
sort_title: 程序员新入手MacStudio的装机环境
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: true
customize: false
tags:
  - 开发环境
categories:
  - 技术杂谈
keywords: 恒宇少年,MacStudio,程序员,开发环境安装
description: mac-studio-installed
date: 2022-10-18 21:28:18
---

最近新入手了苹果推出的造梦空间（`MacStudio`），该主机采用了Arm架构的M1 Max芯片，性能强劲，散热很棒，多核跑分是我那2019款16寸Mac Pro好几倍。

<!--more-->

首先我要感谢我老婆的大力支持，定不负期望，努力造梦！！！

今天我来说下程序员新入手`MacStudio`后要做的事情有哪些，尤其是从`intel`架构的Mac升级过来遇到一些坑的规避。

![Apple芯片跑分](/images/post/mac-studio-installed-1.png)

我从网上找到了苹果自研芯片M系列的评分对比，M1 Max的性能在全部芯片之中排行第二，其实也算是第一，因为`M1 Ultra`是**两块M1 Max拼接而成**的，性能自然会翻倍。

## 1. 拆箱

废话不多说，先上图。

<img src="/images/post/mac-studio-installed-2.jpg" style="float:left;width:50%"/>

<img src="/images/post/mac-studio-installed-3.jpg" style="float:left;width:50%"/>

<img src="/images/post/mac-studio-installed-6.jpg" style="float:left;width:50%"/>

<img src="/images/post/mac-studio-installed-7.jpg" style="float:left;width:50%"/>

<img src="/images/post/mac-studio-installed-5.jpg" style="float:left;width:50%"/>

<img src="/images/post/mac-studio-installed-4.jpg" style="width:50%"/>

跟其他Mac一样全金属机身，触摸时有一丝丝凉意。

## 2. 激活 & 数据迁移

**第一个坑：**

把显示器、电源线接上后按下电源按钮，一声浑厚的开机声音传入耳朵，当我看到屏幕上的提示让我连接`妙控键盘`及`妙控鼠标`时我傻眼了，难道是强制性绑定消费？我平时不用苹果官方出的键盘鼠标配件，不如机械键盘用起来有感觉。

这时不要慌，拿出尘封已久的有线键盘、有线鼠标连接电脑后就可以进行激活了。

<img src="/images/post/mac-studio-installed-8.jpg" style="width:60%"/>

选择语言后进入数据迁移的阶段，苹果系统提供了`迁移助理`来进行数据同步，可以将旧设备的数据同步到新设备，不过这个数据同步的速度不太快，也可能是我的文件数量比较多。

<img src="/images/post/mac-studio-installed-10.jpg" style="width:60%"/>

**第二个坑：**

满怀期望等了两小时终于同步完了，开机后崩溃了，因为架构变了（`intel -> Apple`），大多数软件不适配，而且最重要的是`Git`也不能用了，`Git`不能用导致无法使用`brew`安装软件，无法使用`brew`就会导致无法更新`Git`，成了一个死循环！！！

> 尝试了各种办法最后还是放弃了，把硬盘数据抹了重新安装了一遍系统，这次没有使用数据迁移，而是作为一个新的电脑激活的。

## 3. 开发环境

电脑激活成功后，下一步就是安装开发环境了，把各种项目所需要的开发环境都配置好。

### 3.1 安装brew & 管理环境

首先先来安装`brew`，该项目在GitHub开源地址：[https://github.com/Homebrew/brew](https://github.com/Homebrew/brew)，官网安装命令如下所示：

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

我使用`brew`所管理的软件：

- `Git`：管理项目源码
- `htop`：可以监控软件内存以及CPU使用情况。
- `jsonpp`：自动格式化接口返回json数据，与curl是好搭档
- `nodejs`：可以安装多个版本的`nodejs`然后使用`link`的方式来切换版本

### 3.2 安装sdkman & 管理环境

`sdkman`是Java研发人员的福音，支持多种软件并且每一种还支持多个版本任意切换，尤其是针对JDK版本，官网：[https://sdkman.io/](https://sdkman.io/)，安装命令如下所示：

```bash
curl -s "https://get.sdkman.io" | bash
```

```bash
# 输出全部厂家全部版本可使用的jdk
sdk list java
```

![JDK列表](/images/post/mac-studio-installed-12.png)

使用`sdk use`命令即可轻松切换版本，使用`sdk default`命令还可以修改默认使用的版本，如下所示：

```bash
# 使用Semeru提供的11.0.15版本JDK
sdk use java 11.0.15-sem
# 修改Temurin提供的11.0.16版本为默认JDK
sdk default java 11.0.16-tem
```

- [sdkman所支持的JDK列表](https://sdkman.io/jdks)
- [sdkmain所支持的SDK列表](https://sdkman.io/sdks)

我使用sdkmain所管理的软件：

- `JDK`：jdk8/jdk11/jdk17
- `Maven`

### 3.3 安装oh my zsh

新版本的MacOS使用`zsh`作为默认的shell，`oh my zsh`是开源项目用来管理以及配置`zsh`，GitHub地址：[https://github.com/ohmyzsh/ohmyzsh](https://github.com/ohmyzsh/ohmyzsh)

官方提供了多种安装方式，如下所示：

| 安装方式  | 命令                                                         |
| --------- | ------------------------------------------------------------ |
| **curl**  | `sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"` |
| **wget**  | `sh -c "$(wget -O- https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"` |
| **fetch** | `sh -c "$(fetch -o - https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"` |



## 4. 必备软件

### 4.1 开发工具

- `IntelliJ IDEA`：Java项目开发工具
- `DataGrip`：数据库管理工具
- `WebStorm`：前端项目开发工具
- `AppBox`：JetBrains的软件管理工具
- `Redis Desktop Manager`：Redis管理工具
- `Mongo Compass`：MongoDB管理工具
- `Docker Desktop`：Docker桌面客户端
- `Typora`：Markdown编辑器，很轻，很适合，源码与预览一起
- `Sublimt Text`：文本编辑器，比记事本功能强大多了，可以用来手写Java类。
- `Wireshark`：网络抓包工具
- `Postman`：接口调试工具

### 4.2 办公软件

- `Xmind`：思维导图工具，发散思维的好工具
- `MicroSoft TODO`：待办工作计划提醒工具
- `Chrome`：程序员必备的浏览器
- `WPS`：集Word/Excel/PPT于一体的文档工具
- `钉钉`：公司所需
- `腾讯会议`：远程视频会议工具
- `印象笔记`：多端同步的笔记管理软件
- `Teambition`：企业多人协同软件，可计划迭代版本的任务列表
- `阿里云盘`：存储必要文件到云端
- `阿里邮箱`：企业内部工作交流

### 4.3 休闲娱乐

- 微信
- QQ
- QQ音乐
- 腾讯视频
- 喜马拉雅

### 4.4 其他

- `ClashX`：科学上网客户端
- `Logi Options+`：罗技Master3鼠标管理软件

## 5. 多设备数据同步

### 5.1 使用iCloud同步数据

我平时在家里与公司所使用的电脑都是`MacOS`系统所以可以通过`iCloud`来实现文件的同步，将文件上传到云端，多台设备可以实现自动同步，不过如果是太大的文件还是建议放到云盘。

`iCloud`默认提供了5GB的存储容量，对于日常所需并不太够，可以升级成50GB，每月的资费为6元，`iCloud`目前是由国内`云上贵州`运营的，不用考虑文件上传、下载速度的问题。

### 5.2 使用Google云盘同步数据

`Google云盘`也支持多设备数据同步，可配置需要同步的目录，默认提供15G的容量，不过有个前提需要科学上网才可以。

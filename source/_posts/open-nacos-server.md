---
id: open-nacos-server
title: 长期免费开放一台Nacos Server服务
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: true
news: true
customize: false
tags:
  - SpringCloud
categories:
  - SpringCloud
keywords: 'nacos,服务注册,配置中心'
date: 2019-11-27 17:12:12
article_url:
description: '长期免费开放一台Nacos Server服务'
---
恒宇少年准备着手更新`SpringCloud Alibaba`系列文章教程，为了方便大家的学习特意免费长期开放了一台`Nacos Server`，可以用来当做`服务注册中心`使用，也可以当做`配置中心`使用。

<!--more-->

### 注意事项
1. 请使用本Nacos Server作为测试环境（由于是公开的，所以建议不要用作生产环境）
2. 请不要对本Nacos Server进行压力测试，服务器配置有限
3. 如果出现无法访问的情况请联系作者的微信公众号「程序员恒宇少年」
4. 已禁用修改密码功能（公共服务不允许修改）

### 如何使用？

管理地址：http://open.nacos.yuqiyu.com/nacos

- 当作服务注册中心，请在`application.properties`配置文件内添加`spring.cloud.nacos.discovery.server-add=open.nacos.yuqiyu.com:80`
- 当作配置中心，请在`application.properties`配置文件内添加`spring.cloud.nacos.config.server-addr=open.nacos.yuqiyu.com:80`

> 如果你使用的是`Eureka`，可以使用另外一台开放的`Eureka Server`，{% post_link open-eureka-server %}。

### 登录信息
使用`Nacos`默认的用户名：`nacos`，密码：`nacos`即可登陆。

**1.登录界面**

![](/images/post/open-nacos-server-1.png)

**2. 服务列表**

![](/images/post/open-nacos-server-2.png)


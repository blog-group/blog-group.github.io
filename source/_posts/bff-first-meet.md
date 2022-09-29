---
id: bff-first-meet
title: 初识BFF架构设计
article_type: 原创
article_author: 于起宇
enable_comment: true
news: true
hot: true
tags:
  - 技术杂谈
categories:
  - 技术杂谈
date: 2019-10-03 20:24:11
keywords: bff,SpringCloud,SpringBoot
description: 'BFF是（Backends For Frontends）单词的缩写，主要是用于服务前端的后台应用程序，来解决多访问终端业务耦合问题'
---

BFF是（Backends For Frontends）单词的缩写，主要是用于服务前端的后台应用程序，来解决多访问终端业务耦合问题。

<!--more-->

最近在公司的微服务架构中遇到了一些多终端访问接口的问题，不同的终端拥有不同的接口服务，有不同的操作数据的能力，针对这种业务场景做出了调研，我们是否可以在不同的访问层进行业务逻辑处理，获取不同的数据内容呢？

早在微服务出现的初期就已经存在类似的业务需求出现，而且衍生出了一套成熟的解决方案，那就是`BFF`，可以针对不用业务场景来提供对应的服务接口，每一种业务场景之间完全独立。

## 演进过程

> 在传统的应用程序中，我们一般只将接口提供给一种类型的终端使用。

### 单端调用基础服务

![](/images/post/bff-first-meet-1.png)

传统的应用程序内提供的接口是有业务针对性的，这种类型的接口如果独立出来再提供给别的系统再次使用是一件比较麻烦的事情，设计初期的`高耦合`就决定了这一点。

### 多端直接调用基础服务

![](/images/post/bff-first-meet-2.png)

如果我们的接口同时提供给`web`、`移动端`使用，`移动端`仅用来采集数据以及数据的展示，而`web`端大多数场景是用来管理数据，因为不同端点的业务有所不同每一个端的接口复用度不会太高。

### 多端共用一个BFF

![](/images/post/bff-first-meet-3.png)

针对多端共用服务接口的场景，我们将基础的`数据服务`与`BFF`进行了**分离**，`数据服务`仅提供数据的`增删改查`，并不过多涉及业务的判断处理，所有业务判断处理都交给`BFF`来把控，遇到的一些`业务逻辑异常`也同样由`BFF`格式化处理后展示给访问端点。

这种设计方式同样存在一定的问题，虽然`基础服务`与`BFF`进行了分离，我们只需要在`BFF`层面进行业务判断处理，但是多个端共用一个`BFF`，也会导致代码`编写复杂度增高`、`代码可阅读性降低`、`多端业务耦合`。

### 每个端提供一个BFF

![](/images/post/bff-first-meet-4.png)

如果我们为每一个端点都提供一个`BFF`，每个端点的`BFF`处理自身的业务逻辑，需要数据时从`基础服务`内获取，然后在接口返回之前进行组装数据用于实例化返回对象。



这样基础服务如果有新功能添加，`BFF`几乎不会受到影响，而我们如果后期把`App`端点进行拆分成`Android`、`IOS`时我们只需要将`app-bff`进行拆分为`android-bff`、`ios-bff`，基础服务同样也不会受到影响

![](/images/post/bff-first-meet-5.png)



这样每当新增一个访问端点时，我们需要修改的地方也只有`网关的转发`以及`添加一个BFF`即可，`基础服务`内提供的服务接口我们完全可以复用，因为`基础服务`提供的接口都是没有业务针对性的！！！



## 总结

在微服务架构设计中，`BFF`起到了一个业务聚合的关键作用，可以 通过`openfeign`、`restTemplate`调用`基础服务`来获取数据，将获取到的数据进行组装返回结果对象，`BFF`解决了业务场景问题，也同样带来了一些问题，如下所示：

- 响应时间延迟（服务如果是内网之间访问，延迟时间较低）
- 编写起来较为浪费时间（因为在基础服务上添加的一层转发，所以会多写一部分代码）
- 业务异常处理（统一格式化业务异常的返回内容）
- 分布式事务（微服务的通病）
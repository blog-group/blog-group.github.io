---
id: deploy-drone-with-docker
title: 使用Docker部署自动化CI/CD平台Drone
sort_title: 使用Docker部署自动化CI/CD平台Drone
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: true
customize: false
tags:
  - CI/CD
  - Drone
categories:
  - Docker
keywords: Docker,恒宇少年,Drone,CI/CD
description: deploy-drone-with-docker
date: 2022-10-19 17:24:52
---

## Drone简介

[Drone](https://drone.io) 是一个现代化的持续集成平台，能够使用强大的云原生管道引擎自动化他们的构建、测试和发布工作流程，让我们不再关注程序如何发布而是如何去实现，去更好的实现。

### Drone运行架构

`Drone`并不是一个服务组成的，分为管理端（`Drone UI`）、运行节点（`Drone Runner`），管理端只需要部署一套即可，而运行节点可以部署多套，这个根据实际业务场景而定，如果在使用过程中同时构建的项目较多可以考虑增加运行节点。

### 支持的代码托管平台

- [GitHub](https://github.com)
- [Gitee](https://gitee.com)
- [Gitea](https://gitea.io/zh-cn/)
- [GitLab](https://about.gitlab.com/)
- [Gogs](https://gogs.io/)

下面我们使用自行搭建的`Gitea`私服平台来部署`Drone`，实现项目持久化构建。

> `Drone`是根据代码托管平台的代码仓库状态变动来触发自动构建，如果想通过互联网的代码托管平台使用的话需要将`Drone`部署在互联网上，代码托管平台可以访问到才行。

## 搭配Gitea平台使用

[Gitea](https://gitea.io/zh-cn/) 是一个开源社区驱动的轻量级代码托管解决方案，后端采用 [Go](https://golang.org/) 编写，提供多种部署方式，支持Docker部署，支持将数据存储至SQLite3、MySQL、PostgreSQL、外挂卷等。

有关Docker方式搭建`Gitea`可以参考详细的部署文档：[https://docs.gitea.io/en-us/install-with-docker/](https://docs.gitea.io/en-us/install-with-docker/)

### 创建Gitea OAuth2应用 

![创建OAuth2应用](/images/post/deploy-drone-with-docker-1.png)

在上图中重定向地址为`Drone`登录地址，`Gitea`必须要访问到才可以。

![查看OAuth2应用](/images/post/deploy-drone-with-docker-2.png)

`Gitea`的准备工作已经做完了，下面我们来部署管理端（`Drone UI`）以及运行节点（`Drone Runner`）。

## 部署Drone UI

### 拉取镜像

```bash
# 拉取最新版本的drone
docker pull drone/drone:latest
```

### 启动管理端

```bash
docker run -p 8080:80 -p 10443:443 --name=drone --volume=/usr/local/docker/drone/gitea/data:/data 
--env=DRONE_GITEA_SERVER=https://git.xxx.com 
--env=DRONE_GITEA_CLIENT_ID=742d414c-464c-4e08-90b1-228e07f0b5fa 
--env=DRONE_GITEA_CLIENT_SECRET=fq6r0pvmIS5tyRmItqYskJl5RFqI5cTnhzdJe8MmGSc=  
--env=DRONE_RPC_SECRET=hengboy
--env=DRONE_SERVER_HOST=drone.xxx.xxx.com 
--env=DRONE_USER_CREATE=username:hengboy,admin:true 
--env=DRONE_SERVER_PROTO=https 
--env=DRONE_LOGS_TRACE=true --detach=true --restart=always drone/drone:latest
```



更多配置参数详见：[https://docs.drone.io/server/reference/](https://docs.drone.io/server/reference/)。

## 部署Drone Runner

## 配置Drone

## 使用Drone自动构建项目

## 使用Drone Cloud




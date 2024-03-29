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

[Drone](https://drone.io) 是一个现代化的持续集成平台，能够使用强大的云原生管道引擎自动化他们的构建、测试和发布工作流程，让我们不再关注程序如何发布而是如何去实现，去更好的实现。

`Drone`并不是一个服务组成的，它分为管理端（`Drone UI`）、运行节点（`Drone Runner`），需要部署一套管理端，而运行节点可以部署多套，这个根据实际业务场景而定，如果在使用过程中同时构建的项目较多可以考虑增加运行节点。

<!--more-->

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
--env=DRONE_GITEA_SERVER=https://code.yuqiyu.com
--env=DRONE_GITEA_CLIENT_ID=742d414c-464c-4e08-90b1-228e07f0b5fa 
--env=DRONE_GITEA_CLIENT_SECRET=fq6r0pvmIS5tyRmItqYskJl5RFqI5cTnhzdJe8MmGSc=  
--env=DRONE_RPC_SECRET=hengboy
--env=DRONE_SERVER_HOST=drone.yuqiyu.com
--env=DRONE_USER_CREATE=username:hengboy,admin:true 
--env=DRONE_SERVER_PROTO=https 
--env=DRONE_LOGS_TRACE=true --detach=true --restart=always drone/drone:latest
```

启动参数：

- **DRONE_GITEA_SERVER**：配置`Gitea`服务的地址，支持http/https协议地址，如：`https://code.yuqiyu.com`
- **DRONE_GITEA_CLIENT_ID**：配置在`Gitea`开通的OAuth应用的`ClientId`
- **DRONE_GITEA_CLIENT_SECRET**：配置在`Gitea`开通的OAuth应用的ClientSecret
- **DRONE_RPC_SECRET**：配置与`Drone Runner`之间通信的秘钥，启动`Drone Runner`时必须提供一样的秘钥
- **DRONE_SERVER_HOST**：配置部署`Drone`服务的地址，支持使用域名或IP地址，如：`drone.yuqiyu.com`
- **DRONE_SERVER_PROTO**：配置部署`Drone`服务的协议，可选`http`或`https`。
- **DRONE_USER_CREATE**：启动时创建的账号并配置该账号用于管理员的权限，可以直接配置`Gitea`内的用户。

更多配置参数详见：[https://docs.drone.io/server/reference/](https://docs.drone.io/server/reference/)。

启动成功后我们访问地址就可以看到如下界面：

![](/images/post/deploy-drone-with-docker-3.png)

点击`CONTINUE`按钮可以跳转到`Gitea`服务来进行`OAuth`应用的认证，认证成功后会跳转到在OAuth应用配置的`回调地址`，首页如下所示：

![](/images/post/deploy-drone-with-docker-4.png)

第一次登录时会自动同步账号下所拥有权限的仓库列表，如果后续新增了仓库可以通过点击`SYNC`同步按钮进行同步。

## 部署Drone Runner

### 拉取镜像

```bash
# 拉取最新的Drone Runner镜像
docker pull drone/drone-runner-docker:latest
```

### 启动Runner

```bash
docker run -d -v /var/run/docker.sock:/var/run/docker.sock 
-e DRONE_RPC_PROTO=https 
-e DRONE_RPC_HOST=drone.yuqiyu.com
-e DRONE_RPC_SECRET=hengboy 
-e DRONE_RUNNER_CAPACITY=2 
-e DRONE_RUNNER_NAME=drone-runner 
-e DRONE_LOGS_TRACE=true 
-p 3000:3000 --restart always --name drone-runner drone/drone-runner-docker:latest
```

启动参数：

- **DRONE_RPC_HOST**：配置连接`Drone`服务端的地址，以接收执行消息
- **DRONE_RPC_PROTO**：配置连接`Drone`服务端的协议，可选`http`或`https`
- **DRONE_RPC_SECRET**：配置与`Drone`服务端的通信秘钥，必须与`Drone`服务端启动参数配置一致
- **DRONE_RUNNER_CAPACITY**：配置并发执行管道的数量，默认为：2
- **DRONE_RUNNER_NAME**：配置`Runner`的名称，便于追溯

更多配置参数详见：[https://docs.drone.io/runner/docker/configuration/reference/](https://docs.drone.io/runner/docker/configuration/reference/)

### 验证Runner是否启动成功

```bash
# 查看runner运行日志
docker logs -f drone-runner

time="2022-08-16T01:51:12Z" level=debug msg="successfully pinged the docker daemon"
time="2022-08-16T01:51:12Z" level=info msg="starting the server" addr=":3000"
time="2022-08-16T01:51:13Z" level=info msg="successfully pinged the remote server"
time="2022-08-16T01:51:13Z" level=info msg="polling the remote server" arch=amd64 capacity=2 endpoint="https://drone.yuqiyu.com" kind=pipeline os=linux type=docker
```



## Drone自动构建项目

在上面我们已经将`Drone`的管理端以及运行节点配置好了，下面我们来根据步骤实现项目的自动构建。

### 步骤1：期望触发构建条件

我们期望项目源码一旦`Push`到远程`git`仓库后自动触发编译，而且仅限于`develop`分支。

### 步骤2：配置Drone

如果想要项目支持`Drone`，那么我们需要再项目根目录下新增`.drone.yml`配置文件，内容如下所示：

```yaml
kind: pipeline
name: minbox-datasource-switch
steps:
  - name: build
    image: maven:3.6.3-jdk-11
    commands:
      - mvn clean
    when:
      branch: develop
      event: [ push ]
```

上面的配置就可以满足我们的期望，当检测到代码`push`后会自动触发`minbox-datasource-switch`流水线的全部满足条件的`steps`，`steps`允许配置多个步骤，会根据配置步骤的顺序依次执行。

### 步骤3：激活Drone项目

还剩下最重要的一步，我们需要再`Drone`管理端激活项目，才可以进行处理构建项目，如下图所示：

![](/images/post/deploy-drone-with-docker-5.png)

项目激活后，一旦收到符合条件的变动通知就会进行构建，如下图所示：

![](/images/post/deploy-drone-with-docker-6.png)

点击每条构建记录时都可以查看详细的构建日志，如下图所示：

![](/images/post/deploy-drone-with-docker-7.png)

## Drone Cloud

`Drone Cloud`是部署在云端在线的管理端，该管理端是免费的，可以授权`GitHub`来实现项目的构建，不过`GitHub`也推出了自己的构建工具`GitHub Action`，对于`GitHub`代码库而言所支持的功能应该会比`Drone`更多、更细，但是`Drone`不仅面向`GitHub`还有多个平台可供选择，如有需要可以访问：[https://cloud.drone.io/](https://cloud.drone.io/)，了解并使用。

## 总结

程序员最可贵的是编写高质量的代码，对于持续部署这种事情交由一个放心的工具去做，可以很大的提高编码效率，从而有更多的时间去学习新的知识，`Drone`搭配私有化部署的代码平台很完美，它所能做的还远远不止上述描述的那样。


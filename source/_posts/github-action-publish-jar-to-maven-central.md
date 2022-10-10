---
id: github-action-publish-jar-to-maven-central
title: 使用GitHub Actions编译项目并将Jar发布到Maven Central仓库
sort_title: 使用GitHub Actions发布Jar到Maven Central
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: true
news: true
disable_toc: false
customize: false
tags: [技术杂谈,GitHub,GitHub Action]
categories: [技术杂谈]
keywords: 'GitHub Actions,发布Jar到Maven,持续集成服务'
description: 使用GitHub Actions编译项目并将Jar发布到Maven Central仓库
date: 2020-08-09 14:49:52
article_url:
---

在上一篇 [GitHub Actions使用入门](https://blog.minbox.org/github-action-getting-started.html) 文章中，我们了解到了该怎么去启用`GitHub Actions`功能，本篇文章来介绍下使用`GitHub Actions`怎么将我们的开源项目自动化构建后发布到`Maven Central`仓库中。
<!--more-->
## 推荐阅读
- [SpringBoot2.x 教程汇总](https://blog.minbox.org/spring-boot-2-x-articles.html)

## 新建workflow文件

本篇文章以我的开源框架 [ApiBoot](https://github.com/minbox-projects/api-boot) 为例，大家有兴趣的也可以去了解下这个开源框架，详情请访问：[ApiBoot是什么？](https://blog.minbox.org/apiboot-all-articles.html)

在上一篇文章中我们提到过，`GitHub Actions`所需要的工作流文件要在`.github/workflows`文件夹内创建，那么接下来我们创建一个名为`deploy.yml`的工作流配置文件，配置`name`为该工作流的名称，如下所示：

```yaml
# This is a basic workflow to help you get started with Actions

name: Publish package to the Maven Central Repository
```

## 配置触发的分支

我们还需要配置当前工作流在什么情况进行触发自动构建的事件，在`deploy.yml`配置文件内添加触发事件，如下所示：

```yaml
# Controls when the action will run. Triggers the workflow on push or pull request
# events but only for the master branch
on:
  push:
    branches:
        - master
        - 2.3.x
  pull_request:
    branches:
        - master
        - 2.3.x
```

在上面我们配置了两种触发工作流程的事件，分别是：`push`、`pull_request`，也就是仓库收到推送更新以及`pull_request`时就会触发该工作流程，实现自动化构建。

`GitHub Actions`其实为我们提供了多种触发工作流程的事件，访问 [触发工作流程的事件](https://docs.github.com/cn/actions/reference/events-that-trigger-workflows) 了解详情。

## 配置工作任务

触发事件配置完成后我们就需要来配置当前工作流程所需要的`系统环境`以及`每一个步骤`所需要做的事情了。

### 构建系统

`GitHub Actions`支持针对工作流程中的每一个任务（`Job`）进行配置独立的构建系统版本，我们选择最新版本的`Ubuntu`来作为本次任务的运行系统环境，配置内容如下所示：

```yaml
# A workflow run is made up of one or more jobs that can run sequentially or in parallel
jobs:
  # This workflow contains a single job called "build"
  build:
    # The type of runner that the job will run on
    runs-on: ubuntu-latest
```

我们今天文章的主题是`Jar发布到Maven Central仓库`，根据分析我们大约需要三个步骤来完成这一工作。

### Step1：检出代码

首先我们需要将项目的源码检出到构建环境中，这时我们就可以借助`GitHub Actions`官方提供的`actions/checkout`来完成这一步骤，Action源码：[https://github.com/actions/checkout](https://github.com/actions/checkout)

### Step2：安装环境

[ApiBoot](https://github.com/minbox-projects/api-boot) 是一个**Java**项目（`JDK1.8+`），而且采用`Maven`进行构建项目，所以我们需要在构建的环境中安装相关的环境支持，`GitHub Actions`官方同样提供了相关的`Action`，名为：`actions/setup-java`，Action源码：[https://github.com/actions/setup-java](https://github.com/actions/setup-java)

### Step3：执行发布

最后一步我们就需要通过`mvn deploy`命令来完成发布`Jar`，由于项目发布到`Release`仓库时需要`GPG`秘钥的支持，而我们期望的只是自动发布快照版本，所以可以通过`-Dgpg.skip`来排除`GPG`插件的介入。

全部步骤的配置内容如下所示：

```yaml
# A workflow run is made up of one or more jobs that can run sequentially or in parallel
jobs:
    # Steps represent a sequence of tasks that will be executed as part of the job
    steps:
      # Checkout source code
      - uses: actions/checkout@v2
      # Install Java 1.8
      - uses: actions/setup-java@v1
        with:
          server-id: hengyu
          java-version: 1.8
          server-username: MAVEN_USERNAME
          server-password: MAVEN_PASSWORD
      # Publish to Apache Maven Central
      - run: mvn -B deploy -Dgpg.skip
        env:
          MAVEN_USERNAME: ${{ secrets.MAVEN_CENTER_USER_NAME }}
          MAVEN_PASSWORD: ${{ secrets.MAVEN_CENTER_PASSWORD }}
```

> 注意事项：使用`Action`时，需要指定版本号，通过`@v?`的这种方式，其实这个版本号是仓库源码的`标签`。

## 配置GitHub Secrets

`actions/setup-java@v1`在执行时会创建Maven所需要的`settings.xml`文件，而在该文件内我们可以通过配置`server-username`、`server-password`来指定发布的目标仓库的用户名、密码。

由于该工作流配置文件是公开的，**我们肯定不会明文进行配置**，`GitHub`针对这一点，提供了`Secrets`配置的方式，我们需要将存在安全性的变量进行配置，使用时注意变量名称的对应即可。

![](https://blog.minbox.org/images/post/github-action-publish-jar-to-maven-central-1.png)

`Secrets`在使用时需要根据约定的格式配置：

```yaml
${{ secrets.MAVEN_CENTER_USER_NAME }}
```

> `secrets`为前缀，而后面的变量名必须与`GitHub`内的配置一致，如果你的相关`Secrets`配置需要用于多个项目，可以在组织下进行配置。

## 推送更新

到目前为止，我们的项目已经完成了`GitHub Actions`的配置，接下来需要将该工作流程配置文件推送()`push`)到目标仓库，推送后我们查看项目的`Actions`标签页的内容，如下所示：

![](https://blog.minbox.org/images/post/github-action-publish-jar-to-maven-central-2.png)

**每当我们推送代码时都会自动触发构建工作流程的事件，一个工作流程的任务都会有完整的日志记录**，如下所示：

![](https://blog.minbox.org/images/post/github-action-publish-jar-to-maven-central-3.png)

> 当一个任务的全部步骤都执行成功后，当前任务也算是真正的执行成功，如果一个工作流程文件内配置了多个任务，则是需要多个任务都构建成功后才算成功。

## 槽点

目前针对`GPG`的支持确实有点问题，`GitHub`官方所提供的`Action`也是会有一些问题，导致无法完成通过`GPG`的方式完成构建项目，如果这一点可以解决，就可以实现在`GitHub`仓库创建发布版本时触发工作事件，实现自动上传`Jar`到`Release`仓库，省去了在本地发布的工作。

## 示例

本文的`workflow`配置文件内容可以访问：[https://github.com/minbox-projects/api-boot/blob/2.3.x/.github/workflows/deploy.yml](https://github.com/minbox-projects/api-boot/blob/2.3.x/.github/workflows/deploy.yml) 。
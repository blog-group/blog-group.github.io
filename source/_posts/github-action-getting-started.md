---
id: github-action-getting-started
title: GitHub Actions使用入门
sort_title: GitHub Actions使用入门
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: true
news: true
disable_toc: false
customize: false
tags:
  - 技术杂谈
categories:
  - 技术杂谈
keywords: '持续交付,GitHub Actions'
description: GitHub Actions是GitHub推出的一款持续集成服务
date: 2020-08-08 10:52:02
article_url:
---

## 简介

[GitHub Actions](https://github.com/features/actions) 是由`GitHub`在**2018**年推出的一款持续集成的服务方案，对于`GitHub`上托管的开源项目来说比较友好，集成使用简单，个人感觉比 [Travis-CI](https://www.travis-ci.org/github/minbox-projects/api-boot) 玩法要更多，而且还是可以自己去编写`Actions`在构建的过程中使用。

## 推荐阅读
- [SpringBoot2.x 教程汇总](https://blog.yuqiyu.com/spring-boot-2-x-articles.html)

## 基本概念

`GitHub Actions`内有一些概念性的定义，如下所示：

- **workflow**：顾名思义这是工作流程，在`GitHub Actions`中每执行一次就是一个工作流程。
- **job**：工作流程中的一个任务，一个工作流程可以配置多个任务
- **step**：工作任务中的步骤，根据配置的先后顺序执行，一个任务内可以配置多个步骤
- **action**：每个步骤所使用的构建动作，可以使用`GitHub`官方提供的动作实现，也可以自动编写。

## 使用GitHub Actions

![](https://blog.yuqiyu.com/images/post/github-action-getting-started-1.png)

当我们打开项目的主页时可以看到`Actions`功能标签页，这就是该仓库的`GitHub Actions`，如果你的仓库没有添加过`workflow`文件，看到的效果如下所示：

![](https://blog.yuqiyu.com/images/post/github-action-getting-started-2.png)

## 配置Workflow YML

每一个工作流都是由一个`YML`文件进行配置的，在该文件内我们可以配置仓库的`GitHub Actions`所相关的全部内容，`GitHub`针对文件所处的目录进行了约定，必须在仓库根下的`.github/workflows`目录内。

### 方式一：直接在GitHub页面上添加

在上面的截图中，我们点击`set up a workflow yourself ->`回跳转添加`workflow`文件的页面，在该页面中我们可以修改文件名，也可以修改`workflow`文件的配置内容，如下所示：

![](https://blog.yuqiyu.com/images/post/github-action-getting-started-3.png)

### 方式二：项目源码中添加后推送

我们也可以在项目源码中添加后进行推送，首先在项目的根目录下创建`.github/workflows`目录，然后在新创建的目录下添加一个名为`deploy.yml`的工作流配置文件，将修改提交后`push`到`GitHub`仓库即可。

## GitHub提供的Actions

`GitHub`官方所提供的`Actions`都是开源的，而且都位于 [https://github.com/actions](https://github.com/actions) 开源组织下，比较常用到的`Actions`：

1. `checkout`：用于checkout一个仓库源码到构建环境中
2. `setup-java`：用于安装`Maven`、`JDK`等构建项目的依赖到构建环境中
3. `setup-node`：用于安装`nodeJs`到构建环境中
4. ...
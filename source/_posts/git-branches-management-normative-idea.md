---
id: git-branches-management-normative-idea
title: Git分支管理规范构思
sort_title: Git分支管理规范构思
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: true
customize: false
tags:
  - 分支管理
categories:
  - Git
keywords: SpringCloud,SpringBoot,ApiBoot,恒宇少年,微服务
description: git-branches-management-normative-idea
date: 2022-10-14 09:51:13
---

最近对于公司项目源码分支管理有一些规范构思，对于同一个项目而言，`不同环境`的源码管理、`自动化部署`方式、以及`接口数据隔离`等我们是否可以满足现状？

对于基础项目源码分支而言，一般有`develop`、`master`两个，`develop`来研发功能并测试没有问题后合并到`master`再发布到生产环境。

<!--more-->

## 分支示意图

![分支管理规范示意图](/images/post/git-branches-management-normative-idea-1.png)

## 特性分支（feature）

如果项目比较大，协同人员比较多，每个研发人员的分工比较明确，针对这种情况我们如果还是简单的使用`develop/master`两个分支就不太能满足需求了，针对这个情况我们如何去规范化管理呢？

`特性分支`一般是基于`develop`开发分支衍生创建的，而且是`本地分支`（Local Branches），不太建议一个特性任务多个人同时使用，如果必须是多人协同的任务，那么该特性分支则会变成`远程分支`（Remote Branches），特性分支的任务完成后需要合并到`develop`分支并后续提交给测试人员进行测试。

任务分配到具体研发人员后，研发人员可以在本地创建`特性分支`，如果分支较多为了区分方便，我们可以定义一个分支名称的前缀，如：`feature-`，如果给我分配了用户管理的任务，那么我就可以在本地创建`feature-user`特性分支来研发。



## 紧急缺陷修复分支（bugfix）

如果代码已经发布，在运行过程中遇到了一个紧急的缺陷，针对这个缺陷我们需要怎么去修复呢？

首先我们需要基于`master`分支来衍生创建`缺陷修复分支`，该分支也应该是`本地分支`（Local Branches）不应该被推送到远程目标仓库，我们可以以`bugfix-`作为缺陷修复分支的前缀，如：`bugfix-register-error`。

缺陷一旦修复完成后需要将`bugfix-xxx`分支的代码变动合并到`master`以及`develop`：

- `为什么合并到develop？`

  > 遇到的缺陷不仅是`master`分支存在，因为`master`分支的代码是从`develop`合并而来的，所以我们需要同步合并到`develop`防止后续发版再次出现相同的问题。

- `为什么合并到master？`

  > 因为该缺陷是生产环境发现的，虽然我们合并到了`develop`分支，但是不保证距下次发版生产环境不再出现紧急的缺陷所以我们需要将代码合并到`master`。

## 下一个版本分支（next-version）

如果项目是有规划根据迭代版本循序渐进的，那么建议使用`next-version`分支，那么为什么这么做呢？

顾名思义，`next-version`是**下一个版本**，**当前版本源码**一般存放于`develop`分支，而且当前版本是跟任务规划来的，不会涉及`next-version`分支的源码，这样就做到了版本之间的源码隔离，当前版本准备发布时防止发布下个版本未完成的功能。

`next-version`是基于`develop`分支衍生创建的，`develop`是当前版本，那么`next-version`就是下一个当前版本，`develop`一旦合并到`master`发布后就需要将`next-version`的代码合并到`develop`作为当前版本继续做后续研发。

## 支持自动化部署的分支

自动化部署可以极大的提高`CI/CD`效率，研发人员只需要关心业务功能怎么去实现，无需考虑代码怎么去部署，代码一旦被提交就可以触发自动化部署的程序，实现流水线的自动化部署业务。

开发环境自动化部署可以考虑使用[Drone](https://www.drone.io/)来配置，它很轻量级，在根目录下创建一个名为`.drone.yml`的文件即可搞定配置流程，它还可以结合支持私有部署的`Git`源码仓库：[Gitea](https://gitea.io/zh-cn/) 实现钩子回调，部署也很简单使用`docker`部署一个管理端、一个运行节点即可。

参与自动化部署的分支一般为：`develop`、`next-version`。

`master`分支则是建议手动触发的方式来部署，可以使用`Jenkins`。

## 常见问题

- **功能还未研发完成，临时接到紧急任务，我怎么把未完成的工作保存并切换分支？**

  > 可以使用`git stash`暂存工作空间的文件变动，暂存后就可以切换到其他分支做相关工作了，处理完成后返回未完成的分支执行`git stash pop`恢复暂存即可，`git stash`还有很多用法，可以参考官网文档：[git-stash](https://git-scm.com/docs/git-stash)

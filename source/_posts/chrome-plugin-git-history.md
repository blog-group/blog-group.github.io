---
id: chrome-plugin-git-history
title: GitHub标星超1万的Chrome插件，助你轻松查看文件Git历史
sort_title: 了解下11k标星的开源Chrome插件？
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: true
news: true
disable_toc: false
customize: false
tags: [技术杂谈]
categories: [技术杂谈]
keywords: chrome插件,git-history,github
date: 2020-01-03 09:43:35
article_url:
description: 'GitHub标星超1万的Chrome插件，助你轻松查看文件Git历史'
---

## 前言

之前给大家介绍过一款好用的`GitHub`代码层级阅读浏览器插件`Octotree`，该插件直接可以读取`GitHub`源码仓库的全部文件并生成树形层级关系，省去了连续不断地点击进入目录的操作。
<!--more-->
## GitHistory Chrome Plugin

有些时候我们需要查看源码仓库中某一个文件的修改历史记录，方便我们做一些变动的追溯，在`GitHub`上还真有一款大神级别的浏览器插件，该插件可以界面图形化查看某一个文件的全部修改历史记录，很是方便，今天推荐给大家。

该插件在`Chrome`商店内可以找到，名为：`Git History Browser Extension`，由`Luis Reinoso`提供。

![](https://blog.minbox.org/images/post/chrome-plugin-git-history-1.png)

它是一款开源的浏览器插件，仓库地址：[https://github.com/pomber/git-history](https://github.com/pomber/git-history/)，目前Star已经超过11k。

## 怎么使用？

通过`Chrome`商店安装完成后，这时我们打开`GitHub`的任意仓库（这里以[ApiBoot](https://github.com/minbox-projects/api-boot)仓库为例），找到某一个文件点击后，效果如下：

![](https://blog.minbox.org/images/post/chrome-plugin-git-history-2.png)



可以看到在工具栏多出了一个名为`Open in Git History`的按钮，我们点击该按钮会跳转到 `https://github.githistory.xyz/` ，效果如下图所示：

![](https://blog.minbox.org/images/post/chrome-plugin-git-history-3.png)

> 在地址栏中除了域名以外，后面的地址与访问`GitHub`时是一样的。

该页面分了两部分：

1. 顶部横向滚动条

   初次访问该页面时默认是最新的提交的历史文件内容，在顶部会列出该文件的全部的提交记录，当我们点击任意一个记录时，在下面都会显示属于这个文件这次提交的内容。

2. 底部文件历史内容

   对应顶部的提交信息当前文件的变动内容。



## 不能访问Chome商店？

由于网络访问受限，我们无法直接访问`Chrome`商店，我在之前文章中推荐了一款科学上网的神器，`GHelper`也是一款浏览器插件（该插件可直接通过源码方式安装）。

> 关注 "程序员恒宇少年"微信公众号，回复"Google"获取`GHelper`源码方式安装包。
![](/images/mp.jpg)

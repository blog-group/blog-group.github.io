---
id: git-chapter-core-directory
title: Git托管项目的.git目录下都有什么？
sort_title: Git托管项目的.git目录下都有什么？
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: false
news: true
disable_toc: false
customize: false
tags: [Git]
categories: [Git]
keywords: '学习Git基本知识'
description: git-chapter-core-directory
date: 2022-05-29 10:15:56
article_url:
---

我们在使用`git`托管项目代码时，如果是新建项目需要通过`git init`命令在项目根目录下初始化`.git`目录来实现后续的代码托管管理，如果直接从代码仓库拉取代码则会自动创建`.git`目录与远程仓库进行绑定。

<!--more-->
## .git目录结构

首先我们先来看看`.git`这个目录的结构是什么样子的，如下所示：

```bash
⋊> ~/s/g/.git on master ⨯ pwd                                                                                                                                                                                                                                                                          10:24:08
/Users/yuqiyu/study/git-chapter/.git
⋊> ~/s/g/.git on master ⨯ ll                                                                                                                                                                                                                                                                           10:24:09
total 64
-rw-r--r--    1 yuqiyu  staff    16B May 26 13:51 COMMIT_EDITMSG
-rw-r--r--    1 yuqiyu  staff    91B May 27 11:20 FETCH_HEAD
-rw-r--r--    1 yuqiyu  staff    23B May 26 13:33 HEAD
-rw-r--r--    1 yuqiyu  staff    41B May 26 13:50 ORIG_HEAD
drwxr-xr-x    2 yuqiyu  staff    64B May 19 09:07 branches/
-rw-r--r--    1 yuqiyu  staff   361B May 29 09:31 config
-rw-r--r--    1 yuqiyu  staff    73B May 19 09:07 description
drwxr-xr-x   13 yuqiyu  staff   416B May 19 09:07 hooks/
-rw-r--r--    1 yuqiyu  staff   751B May 26 13:51 index
drwxr-xr-x    3 yuqiyu  staff    96B May 19 09:07 info/
drwxr-xr-x    4 yuqiyu  staff   128B May 19 09:08 logs/
drwxr-xr-x  127 yuqiyu  staff   4.0K May 27 11:20 objects/
drwxr-xr-x    6 yuqiyu  staff   192B May 25 16:17 refs/
-rw-r--r--@   1 yuqiyu  staff   174B May 27 11:20 sourcetreeconfig
⋊> ~/s/g/.git on master ⨯  
```

### HEAD文件

`HEAD`是当前活动分支的游标指向，我们可以查看下该文件的内容：

```bash
⋊> ~/s/g/.git on master ⨯ cat HEAD                                                                                                                                                                                                                                                                     11:17:22
ref: refs/heads/master
```

可以看到`HEAD`文件目前指向`master`分支，而`master`分支则位于`refs/heads`目录下，我们接下来可以去`refs`目录下看看都有哪些内容。

### refs目录

`refs`目录存储了一些引用指向，我们在使用`branch`、`tag`时大多数都是引用到该目录下，然后再指向具体的`objects`。

`refs`目录结构如下所示：

```bash
⋊> ~/s/g/.g/refs on master ⨯ pwd                                                                                                                                                                                                                                                                       11:26:27
/Users/yuqiyu/study/git-chapter/.git/refs
⋊> ~/s/g/.g/refs on master ⨯ ll                                                                                                                                                                                                                                                                        11:26:28
total 8
drwxr-xr-x  3 yuqiyu  staff    96B May 26 13:51 heads/
drwxr-xr-x  3 yuqiyu  staff    96B May 25 16:17 remotes/
-rw-r--r--  1 yuqiyu  staff    41B May 19 10:12 stash
drwxr-xr-x  3 yuqiyu  staff    96B May 29 09:36 tags/
```

> `refs`内全部目录的文件都是存储的`objects`引用，我们下面以`heads`目录为例

#### heads

该目录下存放该项目在本地全部的分支，每个分支文件存储了`commit id`，如下所示：

```bash
⋊> ~/s/g/.g/refs on master ⨯ cd heads/                                                                                                                                                                                                                                                                 09:01:37
⋊> ~/s/g/.g/r/heads on master ⨯ ls                                                                                                                                                                                                                                                                     09:03:13
master
⋊> ~/s/g/.g/r/heads on master ⨯ cat master                                                                                                                                                                                                                                                             09:03:13
33248b733e36a495ea3691f2d1291c5e77633229
```

通过`cat master`命令我们可以查看该文件的内容，发现该文件的内容是一长串的字符编号，如果想要知道这个一长串字符编号是什么我们可以通过`git cat-file`命令来查看类型以及详细内容，如下所示：

```bash
# -t 参数查看文件的类型
⋊> ~/s/g/.g/r/heads on master ⨯ git cat-file -t 33248b733e36a495ea3691f2d1291c5e77633229                                                                                                                                                                                                               09:32:11
commit
# -p 参数查看该文件的详细内容
⋊> ~/s/g/.g/r/heads on master ⨯ git cat-file -p 33248b733e36a495ea3691f2d1291c5e77633229                                                                                                                                                                                                               09:59:48
tree 026567e8fe35ef942c1ea7f833799f26027d964f
parent d78e592e663b2a34da826810303bd75f671a84af
author 恒宇少年 <39233436+hengboy@users.noreply.github.com> 1653544281 +0800
committer 恒宇少年 <39233436+hengboy@users.noreply.github.com> 1653544281 +0800

添加默认值

```

通过`git cat-file -t`命令我们发现`33248b733e36a495ea3691f2d1291c5e77633229`文件是一个`commit`类型的`objects`，通过`git cat-file -p`命令就可以查看该文件的详细内容了。

我们从文件内容来看可以猜测出该文件应该是对应的`master`分支的最后一次提交的`commit`，我们可以通过`git branch -av`命令来查看每个分支的情况，如下所示：

```bash
⋊> ~/s/g/.g/r/heads on master ⨯ git branch -av                                                                                                                                                                                                                                                         09:07:59
* master                33248b7 添加默认值
  remotes/origin/master 33248b7 添加默认值
```

发现本地`master`分支指向了`33248b7`，也就是我们刚才`cat master`内容`33248b733e36a495ea3691f2d1291c5e77633229`的缩写，这样我们就明白了，`master`文件内存储了最新提交的指向。

#### tags

该目录下存储了全部的tag文件，每个tag文件也是存储了`objects`指向，一般`tag`是基于`commit`来打的所以指向跟`commit`一致。

我们项目中有个`temp`的`tag`，我们可以查看下该文件的类型以及内容：

```bash
⋊> ~/s/g/.g/refs on master ⨯ cd tags/                                                                                                                                                                                                                                                                  10:13:42
⋊> ~/s/g/.g/r/tags on master ⨯ ls                                                                                                                                                                                                                                                                      10:13:43
temp
⋊> ~/s/g/.g/r/tags on master ⨯ cat temp                                                                                                                                                                                                                                                                10:13:44
33248b733e36a495ea3691f2d1291c5e77633229
⋊> ~/s/g/.g/r/tags on master ⨯ git cat-file -t 33248b733e36a495ea3691f2d1291c5e77633229                                                                                                                                                                                                                10:13:46
commit
```

我们发现`temp`分支文件内存储的指向也是`33248b733e36a495ea3691f2d1291c5e77633229`，`temp`标签是基于`master`分支最新`commit`打的，所以`tag`的`objects`指向与`master`分支的指向是一致的。

### config文件

在`.git`目录下有个`config`文件，存放了该仓库的配置信息，内容如下：

```
[core]
        repositoryformatversion = 0
        filemode = true
        bare = false
        logallrefupdates = true
        ignorecase = true
        precomposeunicode = true
[remote "origin"]
        url = git@gitee.com:hengboy/git-chapter.git
        fetch = +refs/heads/*:refs/remotes/origin/*
[branch "master"]
        remote = origin
        merge = refs/heads/master
```

该文件内定义了一些核心参数配置、远程分支信息、本地分支列表等，我们通过`git config  --local` 也可以为该仓库配置参数，如下所示：

```bash
git config --local user.name '恒宇少年'
git config --local user.email 'jnyuqy@gmail.com'
```

通过上面命令配置后再`.git/config`文件内就会添加对应的配置内容：

```
[user]
        name = 恒宇少年
        email = jnyuqy@gmail.com
```



## 总结

`git`远比我们想的强大，本文章是一个入门篇，应对工作中遇到的各种问题后续针对`git`还回详谈，熟练的运用`git`让我们在协同开发过程中不再有**冲突恐惧症**。

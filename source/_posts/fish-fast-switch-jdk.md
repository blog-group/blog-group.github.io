---
id: fish-fast-switch-jdk
title: MacOS系统fish终端快速切换JDK版本
sort_title: fish终端快速切换JDK版本
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
keywords: 'fish,切换JDK版本'
description: fish-fast-switch-jdk
date: 2021-12-28 10:24:34
article_url:
---
倘若装有多个版本，特别是从 8 跨到 9 这个分界线，如果是基于 IDE，那么一般使用 IDE 提供的 JDK 设置来指定就可以了。
但如果是直接命令执行，那就需要来个方便切换版本的方法。

<!--more-->
对于 MacOS，只需要设定 `JAVA_HOME` 这个环境变量就可以了，甚至不必要把这个路径添加到 `PATH` 中。

同时，在 MacOS 中，JAVA 相关有个好用的内置工具：`/usr/libexec/java_home`
```shell
yuqiyu@hengyu ~> /usr/libexec/java_home -h
Usage: java_home [options...]
    Returns the path to a Java home directory from the current user's settings.

Options:
    [-v/--version   <version>]       Filter versions (as if JAVA_VERSION had been set in the environment).
    [-a/--arch      <architecture>]  Filter architecture (as if JAVA_ARCH had been set in the environment).
    [-F/--failfast]                  Fail when filters return no JVMs, do not continue with default.
    [   --exec      <command> ...]   Execute the $JAVA_HOME/bin/<command> with the remaining arguments.
    [-X/--xml]                       Print full JVM list and additional data as XML plist.
    [-V/--verbose]                   Print full JVM list with architectures.
    [-h/--help]                      This usage information.
```

所以，通过 `/usr/libexec/java_home -v 1.8` 这样的形式即可把 JDK 切到指定版本。
> 这里是 8，当然，需要先安装对应的版本

### 查看可以切换的JDK列表
```shell
yuqiyu@hengyu ~> /usr/libexec/java_home -V
Matching Java Virtual Machines (4):
    17.0.1 (x86_64) "Oracle Corporation" - "OpenJDK 17.0.1" /Users/yuqiyu/Library/Java/JavaVirtualMachines/openjdk-17.0.1/Contents/Home
    11.0.8 (x86_64) "Oracle Corporation" - "Java SE 11.0.8" /Library/Java/JavaVirtualMachines/jdk-11.0.8.jdk/Contents/Home
    1.8.0_312 (x86_64) "Amazon" - "Amazon Corretto 8" /Users/yuqiyu/Library/Java/JavaVirtualMachines/corretto-1.8.0_312/Contents/Home
    1.8.0_231 (x86_64) "Oracle Corporation" - "Java SE 8" /Library/Java/JavaVirtualMachines/jdk1.8.0_231.jdk/Contents/Home
/Users/yuqiyu/Library/Java/JavaVirtualMachines/openjdk-17.0.1/Contents/Home
```

### 创建切换JDK的fish函数
```shell
function setjdk
    set -g -x JAVA_HOME (/usr/libexec/java_home -v $argv)
    echo (java -version)
end
```
在 `~/.config/fish/functions/` 下添加一个 `setjdk.fish`，填写以下内容，那么就可以在终端中使用 setjdk 1.8 / setjdk 9 的形式来切换到 JDK8 和 JDK9 了。

**切换效果：**
```shell
yuqiyu@hengyu ~> java -version
openjdk version "17.0.1" 2021-10-19
OpenJDK Runtime Environment (build 17.0.1+12-39)
OpenJDK 64-Bit Server VM (build 17.0.1+12-39, mixed mode, sharing)

yuqiyu@hengyu ~> setjdk 1.8
openjdk version "1.8.0_312"
OpenJDK Runtime Environment Corretto-8.312.07.1 (build 1.8.0_312-b07)
OpenJDK 64-Bit Server VM Corretto-8.312.07.1 (build 25.312-b07, mixed mode)

yuqiyu@hengyu ~> setjdk 11
java version "11.0.8" 2020-07-14 LTS
Java(TM) SE Runtime Environment 18.9 (build 11.0.8+10-LTS)
Java HotSpot(TM) 64-Bit Server VM 18.9 (build 11.0.8+10-LTS, mixed mode)
```
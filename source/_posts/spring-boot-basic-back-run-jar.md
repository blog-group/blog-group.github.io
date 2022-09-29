---
id: spring-boot-basic-back-run-jar
title: SpringBoot2.x基础篇：Linux后台运行Jar以及Jvm参数调优
sort_title: Linux后台运行Jar以及Jvm参数调优
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: true
news: true
disable_toc: false
customize: false
tags:
  - SpringBoot
categories:
  - SpringBoot
keywords: 'nohup,jar,jvm调优'
date: 2020-02-20 15:42:30
article_url:
description: 'SpringBoot2.x基础篇：Linux后台运行Jar以及Jvm参数调优'
---
我们将编写的应用程序打包为`Jar`可执行文件后，如果在`Linux`服务器环境下，可直接使用`java -jar xxx.jar`命令运行应用程序，不过当我们关闭命令窗口后`启动中`的应用程序也会停止，那我们需要通过什么方式才可以成为后台服务方式运行呢？

## 推荐阅读
- [SpringBoot2.x 教程汇总](http://blog.yuqiyu.com/spring-boot-2-x-articles.html)

<!--more-->
## Nohup命令
`Linux`系统或者`OS X`都提供了一个解决应用程序后台运行的命令，那就是`nohup`，我们使用该命令可以直接将要`执行的任务`放置在**后台运行**，想要停止运行时需要通过结束`pid`的方式，使用方式如下所示：
```bash
➜  developing-first-application git:(2.x) ✗ nohup java -jar target/service-application-0.0.1-SNAPSHOT.jar &
[1] 2349
appending output to nohup.out
```
我们通过以上的命令执行后可以看到控制台输出了本次运行程序的`PID`为 **2349**，我们可以使用`kill`命令杀死这个`PID`，从而达到了结束进程的效果。

> 注意事项：`appending output to nohup.out`这句话很有必要了解下，要知道我们之前通过`java -jar xxx.jar`直接运行应用程序时会有运行日志输出到控制台的，我们通过`nohup`方式运行时我们貌似并没有发现日志的输出，日志去了哪里呢？

## 运行日志

当你看到`appending output to nohup.out`这句话在控制台打印时，应该可以猜测到了，日志的内容已经输出到了名为`nohup.out`的文件内，该文件所处的位置就是我们**运行nohup命令的同级目录**（`注意：不是jar文件的目录`），我们可以通过`tail -1000f nohup.out`命令查看运行日志内容，如下所示：

```
➜  developing-first-application git:(2.x) ✗ tail -1000f nohup.out 

  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::        (v2.2.4.RELEASE)
 ...
 2020-02-21 14:31:42.614  INFO 2349 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat started on port(s): 8080 (http) with context path ''
2020-02-21 14:31:42.617  INFO 2349 --- [           main] o.m.c.d.f.a.DevelopingFirstApplication   : Started DevelopingFirstApplication in 1.437 seconds (JVM running for 1.75)
```

> 通过`nohup`执行的命令所产生的日志都会输出到默认`nohup.out`文件内。

### 指定日志文件

在同一台服务器上、同一个目录下可能会存在多个需要运行的`Jar`文件，为了区分每个应用程序的日志输出，这时我们就需要指定日志输出的文件名，如下所示：

```bash
➜  developing-first-application git:(2.x) ✗ nohup java -jar target/service-application-0.0.1-SNAPSHOT.jar &> service-application-0.0.1.log & 
[1] 2579
```

这时我们在`nohup`命令执行的同级目录下就可以看到创建了一个名为`service-application-0.0.1.log`的日志文件。

> 建议：日志文件的名称格式：`Service ID + Service Version`，相同`ServiceID`的服务可能存在部署不同版本的情况。

## JVM Server模式

在`JVM`内有一个模式的概念，开发环境中一般使用的是`client`模式，不过生产服务器上一般都是使用`server`模式，我们要怎么选择呢？

推荐开发环境使用`client`模式，因为它启动快，可以**提高**一部分`开发效率`，节省每一次项目启动的时间，而生产环境则是推荐使用`server`模式，内部使用了代号为`C2`的**重量级编译器**，这样虽然导致应用程序`启动时间有所提高`，不过`编译的比较彻底`，服务在运行期间相对于`client`性能高一些。

设置使用`server`模式也比较简单，我们只需要执行`java -server`命令即可，如下所示：

```bash
➜  developing-first-application git:(2.x) ✗ nohup java -server -jar target/service-application-0.0.1-SNAPSHOT.jar &> service-application-0.0.1.log &
[1] 2707
```



## 初始内存(-Xms)

`JVM`在`client`模式下运行，默认`Xms`大小为`1M`，而在`server`模式下默认`Xms`大小为`128M`，可以根据实际情况进行修改分配，如下所示：

```bash
➜  developing-first-application git:(2.x) ✗ nohup java -server -Xms256M -jar target/service-application-0.0.1-SNAPSHOT.jar &> service-application-0.0.1.log &
[1] 2846
```

通过`-Xms256M`，修改初始化分配的内存为`256M`。

## 最大内存(-Xmx)

`JVM`在`client`模式下运行，默认`Xmx`大小为`64M`，而在`server`模式下默认`Xmx`大小为`1024M`，可以根据实际情况进行修改分配，如下所示：

```bash
➜  developing-first-application git:(2.x) ✗ nohup java -server -Xms256M -Xmx2048M -jar target/service-application-0.0.1-SNAPSHOT.jar &> service-application-0.0.1.log &
[1] 2340
```

通过`-Xmx2048M`，修改最大分配内存为`2048M`。

## JVM调优脚本

`JVM`的调优尤为最重，服务器的配置有限，可使用的资源我们则是要珍惜，做出最大的贡献！！！

为了每次部署服务的便利性，我把启动服务的命令进行了封装，并命名为`boot-jar.sh`，内容如下所示：

```bash
#!/bin/bash
# author 恒宇少年 - 于起宇
# http://blog.yuqiyu.com
nohup java -server -XX:MetaspaceSize=128m -XX:MaxMetaspaceSize=128m -Xms256m -Xmx1024m -Xmn256m -Xss256k -XX:SurvivorRatio=8 -XX:+UseConcMarkSweepGC -jar "$1" > "$1.log" 2>&1 &
tail -1000f "$1.log"
```

> 使用`touch boot-jar.sh`创建启动脚本，创建完成后将上面内容复制到脚本内，并通过`chmod u+x boot-jar.sh`命令修改权限为可执行文件。

`boot-jar.sh`脚本使用如下：

```bash
➜  developing-first-application git:(2.x) ✗ ./boot-jar.sh target/service-application-0.0.1-SNAPSHOT.jar
```

由于脚本内添加了`tail`命令，应用程序启动后会自动输出运行日志。

> 建议：`boot-jar.sh`应用程序启动脚本位置尽量放在与`Jar`同级目录下。


---
id: know-openj9-jvm
title: 微服务中使用 OpenJ9 JVM 内存占用降60%(相对HotSpot)
sort_title: OpenJ9 JVM 内存占用降60%
article_type: 转载
article_author: 陈一乐
enable_comment: true
hot: false
news: true
disable_toc: false
customize: false
tags: [微服务,Spring Cloud,Jvm]
categories: [微服务]
keywords: 'SpringCloud,SpringBoot,恒宇少年,Openj9'
description: know-openj9-jvm
date: 2022-08-12 10:06:22
article_url: https://chenyongjun.vip/articles/117
---
随着微服务的普及，许多企业踏上微服务之旅。

微服务化后，应用数量可能高一个数量级。一般企业，以前三五个应用能支撑业务，微服务化之后应用数量可能多达几十个。
每个微服务往往独立部署，内存的消耗自然也高居不下，以前两台8核16G机器指不定就能跑起来，现两台16核64G还不一定够用，同时由于多套环境的存在加上容器编排工具(如K8s)所需的资源，硬件资源的投入自然是成倍增加。
<!--more-->
在 Web 应用开发中，为了降低内存消耗，你是否尝试过：

- **去除不必要的组件，减少代码体积**
- **更换 Web 容器，如将 Tomcat 更换为Undertow**
- **优化Docker基础镜像，减少镜像体积**

这些效果往往不是很理想。本篇介绍 OpenJ9 JVM，通过将 HotSpot 更换为 OpenJ9，内存占用能降低至少 60%，而启动时间也能快 40% 以上，效果立竿见影。

## OpenJ9 简介

OpenJ9 的前身是IBM的 J9 Java 虚拟机，主要服务于IBM企业级软件产品，是一款高性能的JVM。

2017年9月，IBM 将 J9 JVM 捐献给 Eclipse 基金会，并更名 Eclipse OpenJ9，开启开源之旅。

OpenJ9 擅长于内存管理，同时针对容器化做了很多工作，按官方说法是： more container-aware 。

下面摘自 OpenJ9 的 [Release History](https://www.eclipse.org/openj9/oj9_whatsnew.html)，选择了部分内容，可快速一览：

- 2017.11 支持使用 OpenJDK8 构建 OpenJ9

- 2018.3 发布 0.8.0：OpenJ9 开始支持各平台(Mac、Linux、Windows等) 的 OpenJDK 8，宣布在JDK8中，比HotSpot 42% faster startup and a footprint at least 60% smaller

- 2018.8 发布 0.9.0：支持 OpenJDK 10；对Docker容器支持更友好；在运行一些Eclipse性能测试时，比HotSpot JVM快 43%，少用42%的内存.

- 2018.10 发布 0.10.0：支持 OpenJDK 11，开始适配 HotSpot JVM的一些参数配置

- 2018.10 发布 0.11.0：改善AOT性能、针对运行在容器中的应用内存优化、 “pause-less” GC mode for response-time sensitive, large heap applications

- 2019.2 发布 0.12.1 ：提示RSA算法加密性能；性能进一步提升

- 2019.3 发布 0.13.0：支持OpenJDK 12; 支持jps命令；支持将Java dump 文件写入STDOUT/STDERR



## 官方性能报告
下面是 OpenJ9官方的基准测试结果(完整报告)，包含启动时间、响应时间、吞吐量等指标。

**66% smaller footprint after startup**

由于减少内存占用的重要性，OpenJ9 对云负载(cloud wordloads)做了深度优化，在应用启动后，占用内存比HotSpot 约少 66%。

**66% smaller footprint after startup**

由于减少内存占用的重要性，OpenJ9 对云负载(cloud wordloads)做了深度优化，在应用启动后，占用内存比HotSpot 约少 66%。

[![img](https://blog-1256695615.cos.ap-shanghai.myqcloud.com/2019/07/20/2.png)](https://blog-1256695615.cos.ap-shanghai.myqcloud.com/2019/07/20/2.png)

**63% smaller footprint during ramp up**

应用负载增加时，内存都会骤增。但状态稳定后，使用 OpenJ9 的OpenJDK 8 比使用 HotSpot 的 OpenJDK 8 **减少了约 63% 的物理内存**。

[![img](https://blog-1256695615.cos.ap-shanghai.myqcloud.com/2019/07/20/3.png)](https://blog-1256695615.cos.ap-shanghai.myqcloud.com/2019/07/20/3.png)

**42% faster startup time**

**Shared classes** 和 **Ahead-of-Time(AOT)** 技术的应用显著减少了应用启动时间。通过使用 **-Xquickstart** 参数(启用AOT)，**启动时间可以减少高达42%**。

[![img](https://blog-1256695615.cos.ap-shanghai.myqcloud.com/2019/07/20/4.png)](https://blog-1256695615.cos.ap-shanghai.myqcloud.com/2019/07/20/4.png)

**Comparable throughput**

在做吞吐量对比时，二者峰值吞吐量差不多，但使用OpenJ9 的 OpenJDK 8 大约快1分钟达到峰值。

[![img](https://blog-1256695615.cos.ap-shanghai.myqcloud.com/2019/07/20/5.png)](https://blog-1256695615.cos.ap-shanghai.myqcloud.com/2019/07/20/5.png)

**Faster ramp-up time in the cloud**

在云环境下，虚拟化技术被广泛使用，一台大的机器经常被切割成若干小的虚拟机，这些虚拟机往往做了资源限制。OpenJ9 在单核CPU上用了8.5分钟达到峰值吞吐量，而 HotSpot用了30分钟。对于在资源受限的环境下(如云环境)跑 short-lived VMs，能够更快的完成更多工作就显得更为重要。

资源受限的一大副作用就是 **Java应用花费更长的启动时间(受JIT影响)**。

> 笔者注：内存限制时，应用甚至会无法启动，导致不断重启。

[![img](https://blog-1256695615.cos.ap-shanghai.myqcloud.com/2019/07/20/6.png)](https://blog-1256695615.cos.ap-shanghai.myqcloud.com/2019/07/20/6.png)

## 性能测试

创建一个 Spring Boot Web 应用并打成jar包，分别使用 HotSpot、OpenJ9 虚拟机的 Open JDK8 结合Docker来做测试。

基于OpenJ9的Dockerfile

```
FROM adoptopenjdk/openjdk8-openj9:alpine-slim
COPY target/app.jar /app.jar
ENTRYPOINT java $JAVA_OPTS -Xshareclasses -Xquickstart -jar /app.jar
```

基于HotSpot的Dockerfile

```
FROM openjdk:8u181-jre-slim-stretch
COPY target/app.jar /app.jar
ENTRYPOINT java $JAVA_OPTS -jar /app.jar
```

启动容器后，`docker stats openj9 hotspot` 查看容器资源使用情况如下：

[![img](https://blog-1256695615.cos.ap-shanghai.myqcloud.com/2019/07/20/1.png)](https://blog-1256695615.cos.ap-shanghai.myqcloud.com/2019/07/20/1.png)

OpenJ9 是 50.89M；HotSpot 是235.7M，差异非常大。

下面是我们测试环境中的一个普通应用(使用Docker运行)的测试结果。

基于 Open JDK8 (HotSpot) 时内存消耗稳定在 **1G左右**。

[![img](https://blog-1256695615.cos.ap-shanghai.myqcloud.com/2019/07/21/2.png)](https://blog-1256695615.cos.ap-shanghai.myqcloud.com/2019/07/21/2.png)

基于 OpenJDK8(OpenJ9)时内存消耗稳定在 **300M左右**。

[![img](https://blog-1256695615.cos.ap-shanghai.myqcloud.com/2019/07/21/3.png)](https://blog-1256695615.cos.ap-shanghai.myqcloud.com/2019/07/21/3.png)

## 该怎么切换到 OpenJ9 ？

如果使用Docker，直接更换基础镜像即可，容器场景下更能发挥 OpenJ9 的作用。

如果JDK直接安装在服务器上，可以直接在 [AdoptOpenJDK](https://adoptopenjdk.net/releases.html?variant=openjdk8&jvmVariant=openj9) 上下载相应的介质。

对于 [JVM Options](https://www.eclipse.org/openj9/docs/cmdline_migration/)，可以参考做一些调整。

## 对开发人员的影响有哪些？

大家一般接触的都是HotSpot VM，且对于其理论、JVM参数、命令行工具甚至性能调优等相对比较熟悉，这块资料也比较丰富。

OpenJ9 以前更多的是支持IBM企业级的商业产品，大家了解相对较少，连日用命令行工具暂时都只提供了jps、jstack，不过可以使用像阿里 [arthas](https://alibaba.github.io/arthas/) 这类Java应用诊断工具，效果也是一样的。

对于小企业来说，JVM一般不是瓶颈，而更换JVM所带来的IT成本投入减少确是实实在在的，尤其是对于初创团队，自然是能省则省。

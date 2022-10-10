---
id: spring-boot-basic-packaging-executable-jar
title: SpringBoot2.x基础篇：将应用程序打包为可执行Jar
sort_title: 将SpringBoot2.x应用程序打包为可执行Jar
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: true
news: true
disable_toc: false
customize: false
tags: [SpringBoot2.x]
categories: [SpringBoot]
keywords: 'springboot,打包,jar运行'
date: 2020-02-20 09:56:18
article_url:
description: 'SpringBoot2.x基础篇：将应用程序打包为可执行Jar'
---

应用程序在编写完成后，有一个重要的阶段就是发布，当我们发布时需要将应用程序进行打包，那通过`SpringBoot`编写的应用程序该如何打包呢？

## 推荐阅读
- [SpringBoot2.x 教程汇总](http://blog.yuqiyu.com/spring-boot-2-x-articles.html)

## 打包方式

应用程序的发布一般有两种形式。

比较传统的方式是外置`Tomcat`，将应用程序打包成一个`xx.war`文件，该文件内只有应用程序源码编译后的`.class`以及`配置文件`。

而`SpringBoot`还提供了另外一种高效率的打包方式，在`pom.xml`内通过配置`maven plugin`，执行`mvn package`打包命令时会将`src/main/java`、`src/main/resources`目录下的全部文件进行打包，最终生成一个`xx.jar`的文件，由于`SpringBoot`打包时默认会将`Tomcat`的相关依赖一并放入到`xx.jar`内，所以通过`java -jar xx.jar`命令行的方式可以直接运行。

## 打包插件

我们通过`IDEA`创建`SpringBoot`项目时，一般在`pom.xml`文件内默认已经添加了打包`maven plugin`，如下所示：

```xml
<build>
  <plugins>
    <plugin>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-maven-plugin</artifactId>
    </plugin>
  </plugins>
</build>
```

> **注意事项：**如果你不是通过`spring-boot-starter-parenter`方式构建的`SpringBoot`应用程序，需要手动配置`<executions>`，有关插件的使用文档，详见 [Spring Boot Maven Plugin](https://docs.spring.io/spring-boot/docs/2.2.4.RELEASE/maven-plugin//usage.html)

## 执行打包

使用`Maven`构建的`SpringBoot`应用程序打包方式很简单，我们只需要通过命令在应用程序的`根目录`下执行`mvn package`即可，如下所示：

```bash
➜  developing-first-application git:(2.x) mvn package           
[INFO] Scanning for projects...
[INFO] 
[INFO] ----------< org.minbox.chapter:developing-first-application >-----------
[INFO] Building developing-first-application 0.0.1-SNAPSHOT
[INFO] --------------------------------[ jar ]---------------------------------
省略部分编译日志......
[INFO] --- maven-jar-plugin:3.1.2:jar (default-jar) @ developing-first-application ---
[INFO] Building jar: /Users/yuqiyu/study/article-source-code/spring-boot-chapter/developing-first-application/target/developing-first-application-0.0.1-SNAPSHOT.jar
[INFO] 
[INFO] --- spring-boot-maven-plugin:2.2.4.RELEASE:repackage (repackage) @ developing-first-application ---
[INFO] Replacing main artifact with repackaged archive
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  4.711 s
[INFO] Finished at: 2020-02-20T15:02:24+08:00
[INFO] ------------------------------------------------------------------------

```

当控制台出现`BUILD SUCCESS`时，证明我们本次`package`已经成功了，当前应用程序的可执行`Jar`也已经生成，位于`target`目录下。

## 打包文件命名

`spring-boot-maven-plugin`插件打包完成后生成的文件名默认的格式为：`<artifactId> + <version>.jar`，如：`developing-first-application-0.0.1-SNAPSHOT.jar`，如果这并不是你想要的格式化，可以通过如下方式进行自定义：

```xml
<build>
  <finalName>service-application-${version}</finalName>
</build>
```

> **注意事项：**`<finalName>`与`<plugins>`是同级的配置，可以使用占位符属性`${属性名}`的方式来进行格式化命名内容，这只是文件的名称，在打包完成后后缀名`.jar`会自动追加。

## 跳过测试

项目在打包过程中会`自动运行测试`，来检查项目是否可以通过运行测试以及测试脚本的执行是否有效，一般这个过程是需要一定时间的，项目内容越多需要的时间就会越久，如果你想跳过这个测试过程，只需要添加一个很简单的`<properties>`属性配置即可，如下所示：

```xml
<properties>
  <maven.test.skip>true</maven.test.skip>
</properties>
```

这样我们再运行`mvn package`时，就会跳过测试步骤。

## 运行Jar

要运行该应用程序，可以使用`java -jar`命令，如下所示：

```bash
➜  developing-first-application git:(2.x) ✗ java -jar target/service-application-0.0.1-SNAPSHOT.jar 

  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::        (v2.2.4.RELEASE)

2020-02-20 15:29:39.615  INFO 3208 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat initialized with port(s): 8080 (http)
2020-02-20 15:29:39.626  INFO 3208 --- [           main] o.apache.catalina.core.StandardService   : Starting service [Tomcat]
2020-02-20 15:29:39.626  INFO 3208 --- [           main] org.apache.catalina.core.StandardEngine  : Starting Servlet engine: [Apache Tomcat/9.0.30]
2020-02-20 15:29:39.953  INFO 3208 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat started on port(s): 8080 (http) with context path ''
2020-02-20 15:29:39.955  INFO 3208 --- [           main] o.m.c.d.f.a.DevelopingFirstApplication   : Started DevelopingFirstApplication in 1.539 seconds (JVM running for 1.868)

```

> 如果想要退出该应用程序，请按`Ctrl + C`。


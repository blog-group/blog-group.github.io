---
id: spring-boot-basic-developing-first-application
title: SpringBoot2.x基础篇：开发你的第一个SpringBoot应用程序
sort_title: 开发你的第一个SpringBoot2.x应用程序
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
keywords: springboot,应用程序,恒宇少年
date: 2020-02-18 14:34:58
article_url:
description: 'SpringBoot2.x基础篇：开发你的第一个SpringBoot应用程序'
---

**本篇文章是2020年的开篇之作，希望能带给你不一样的阅读体验，能带给给你清晰的阅读思路。**

## 推荐阅读
- [SpringBoot2.x 教程汇总](http://blog.yuqiyu.com/spring-boot-2-x-articles.html)

<!--more-->

> 我从2017年开始一直在编写相关`SpringBoot`的技术点使用文章，最开始的版本还是`1.5.2`，由于`SpringBoot`大小版本发布的速度太快，旧版本的文章与新版本`SpringBoot`构建的应用程序存在一定差异，为了让大家更快的入门学习`SpringBoot 2.x`版本的核心技术点，会陆续更新一些基础知识点的使用文章，基础文章命名格式：`SpringBoot2.x基础篇：文章标题...`

## 开发环境
`SpringBoot2.x`版本是基于`Java8`来编写的，由于内部使用到了很多新的特性，比如：`lambda`、`interface default`...，所以需要本地开发环境有`java8`的支持。

不仅如此，`SpringBoot`在构建项目时默认使用`Maven`方式，所以本地开发环境也需要配置`Maven`环境变量。

```bash
~ java -version
java version "1.8.0_231"
Java(TM) SE Runtime Environment (build 1.8.0_231-b11)
Java HotSpot(TM) 64-Bit Server VM (build 25.231-b11, mixed mode)
```

```bash
~ mvn -version          
Apache Maven 3.6.3 (cecedd343002696d0abb50b32b541b8a6ba2883f)
Maven home: /Users/yuqiyu/soft/apache-maven-3.6.3
Java version: 1.8.0_231, vendor: Oracle Corporation, runtime: /Library/Java/JavaVirtualMachines/jdk1.8.0_231.jdk/Contents/Home/jre
Default locale: zh_CN, platform encoding: UTF-8
OS name: "mac os x", version: "10.15.3", arch: "x86_64", family: "mac"
```

> 如果你更喜欢使用`Gradle`方式来构建项目，那么本地就应该`Gradle`环境变量支持。

构建工具版本限制使用如下表所示：

| 构建工具 | 版本       |
| -------- | ---------- |
| Maven    | 3.3+       |
| Gradle   | 5.x 或 6.x |



## 新的项目

创建一个新`SpringBoot`应用程序的方式有多种：

1. 使用IDEA内置的`Spring Initializr`创建（File -> New -> Project -> Spring Initializr）
2. 创建基础Maven项目，修改`pom.xml`添加`spring-boot-parent`
3. 访问 [https://start.spring.io](https://start.spring.io/) 选择依赖后，生成项目并下载

我一般采用第一种方式，这种方式比较快捷，`IDEA`内部也是通过 [https://start.spring.io](https://start.spring.io/) 这种方式将构建完成的`zip`文件下载到本地然后解压，所以你需要连接互联网才可以创建项目。

新项目的`pom.xml`文件内容如下所示：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>2.2.4.RELEASE</version>
    <relativePath/> <!-- lookup parent from repository -->
  </parent>
  <groupId>org.minbox.chapter</groupId>
  <artifactId>developing-first-application</artifactId>
  <version>0.0.1-SNAPSHOT</version>
  <name>developing-first-application</name>
  <description>Demo project for Spring Boot</description>

  <properties>
    <java.version>1.8</java.version>
  </properties>

  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter</artifactId>
    </dependency>
    <!--添加你需要的依赖...-->
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-test</artifactId>
      <scope>test</scope>
      <exclusions>
        <exclusion>
          <groupId>org.junit.vintage</groupId>
          <artifactId>junit-vintage-engine</artifactId>
        </exclusion>
      </exclusions>
    </dependency>
  </dependencies>

  <build>
    <plugins>
      <plugin>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-maven-plugin</artifactId>
      </plugin>
    </plugins>
  </build>

</project>

```



新创建的应用程序会自动`spring-boot-parent`作为`父项目`，这时我们就拥有了一些默认的资源配置、默认的依赖版本、默认的插件配置等。

## 添加依赖

当我们需要项目支持`SpringMvc`时，修改`pom.xml`文件在添加如下依赖即可：

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```

> 添加`spring-boot-starter-web`依赖主要目的是演示`Hello World`输出。

## 示例代码

要完成我们的应用程序，需要来创建一个`Java`文件，默认情况下`Maven`会编译`src/main/java`目录下的源代码，我们可以在该目录下创建`package`来进行源代码的归类，下面我们来创建一个名为`HelloExample.java`的示例源代码文件，内容如下所示：

```java
package org.minbox.chapter.developing.first.application;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Hello Example
 *
 * @author 恒宇少年
 */
@RestController
public class HelloExample {

    @GetMapping
    public String hello() {
        return "hello world!";
    }
}

```



## 运行示例
到目前为止，我们新创建的应用程序应该可以工作了，由于应用程序的`parent`是`spring-boot-parent`，因此具有了可运行的内置环境支持，可以直接通过命令行的方式来运行应用程序，当我们在应用程序的根目录下输入命令：

```bash
~ developing-first-application ✗ mvn spring-boot:run
```

通过`Maven`会将相关的依赖下载到本地默认的依赖仓库（~/.m2/repository），编译通过后自动运行项目，控制台输出如下所示：

```
 .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::  (v2.2.4.RELEASE)
....... . . .
....... . . . (log output here)
....... . . .
........ Started Example in 2.222 seconds (JVM running for 6.514)
```



当看到上面的内容在控制台输出时，我们的应用程序就已经运行成功了，在浏览器访问 [http://localhost:8080](http://localhost:8080) 地址可以看到如下输出内容：

```
hello world!
```

> 如果想要退出运行中的应用程序，使用`Crtl + C`。

## 代码示例
如果您喜欢本篇文章请为源码仓库点个`Star`，谢谢！！！
本篇文章示例源码可以通过以下途径获取，源码分支为`2.x`，目录为`developing-first-application`：
- Gitee：[https://gitee.com/hengboy/spring-boot-chapter](https://gitee.com/hengboy/spring-boot-chapter)
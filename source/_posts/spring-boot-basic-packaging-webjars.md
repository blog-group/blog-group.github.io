---
id: spring-boot-basic-packaging-webjars
title: SpringBoot2.x基础篇：将静态资源打包为WebJars
sort_title: 将静态资源打包为WebJars
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: true
news: true
disable_toc: false
customize: false
tags: [SpringBoot2.x]
categories: [SpringBoot]
keywords: 'webjars,静态资源,springboot'
date: 2020-04-15 17:26:53
article_url:
description: 'SpringBoot2.x基础篇：将静态资源打包为WebJars'
---

## 概述

我们在编写前后分离项目时，前端的项目一般需要静态资源（`Image`、`CSS`、`JavaScript`...）来进行渲染界面，而如果我们对外采用依赖的方式提供使用时，我们的静态资源文件也应该放入打包文件内，这样才能更便捷的提供我们的功能，在我的开源分布式日志框架 [minbox-logging](https://gitee.com/minbox-projects/minbox-logging) 内提供了管理界面的功能，就是采用的这种方式实现，将静态资源以及**编译后**的`HTML`页面存放到`minbox-logging-admin-ui`依赖内，下面我们来看下具体的实现方式。


## 推荐阅读
- [SpringBoot2.x 教程汇总](http://blog.yuqiyu.com/spring-boot-2-x-articles.html)

## 了解Resources Static Locations

在我们打包静态资源前，首先来了解下`SpringBoot`提供的`spring.resources.static-locations`配置默认值，该配置用于配置`ResourceHandler`，项目启动后会将该参数的`配置值列表`作为**直接可访问**的静态目录进行`映射`，通过这种方式我们就可以直接访问到我们需要的静态资源内容。

`spring.resources.static-locations`配置位于`org.springframework.boot.autoconfigure.web.ResourceProperties`配置类内，其默认值是使用本类内的静态常量`CLASSPATH_RESOURCE_LOCATIONS`的值，如下所示：

```java
private static final String[] CLASSPATH_RESOURCE_LOCATIONS = { "classpath:/META-INF/resources/",
                                                              "classpath:/resources/", "classpath:/static/", "classpath:/public/" };

/**
	 * Locations of static resources. Defaults to classpath:[/META-INF/resources/,
	 * /resources/, /static/, /public/].
	 */
private String[] staticLocations = CLASSPATH_RESOURCE_LOCATIONS;
```

通过查看源码我们得知，`classpath:/META-INF/resources/`目录下的资源是可以直接通过默认的映射绑定关系访问到的，通过这一点，我们可以将静态资源依赖内的资源文件存放到`META-INF/resources`目录下。

## 资源打包

我们使用`Maven`方式构建一个普通的项目，在`pom.xml`文件内添加`资源目录`配置，在`编译`过程中将`src/main/resources`目录下的文件全部复制到`META-INF/resources`下，如下所示：

```xml
<build>
  <resources>
    <resource>
      <directory>src/main/resources</directory>
      <targetPath>META-INF/resources</targetPath>
    </resource>
  </resources>
</build>
```

> 为了验证资源访问，我们在`src/main/resources`目录下存放一个名为`head.jpg`的图片。

我们为了本地演示使用，将`Maven`项目通过`mvn install`命令安装到本地仓库，以便于提供给其他项目使用。

## 使用WebJars依赖

我们来创建一个`SpringBoot`项目，在项目的`pom.xml`文件内添加如下依赖：

```xml
<dependencies>
  <!--静态资源的访问映射绑定需要web依赖-->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
  </dependency>
  <dependency>
    <groupId>org.example</groupId>
    <artifactId>webjars-sample</artifactId>
    <version>1.0-SNAPSHOT</version>
  </dependency>
</dependencies>
```

由于我们在之前通过`mvn install`命令将`静态资源项目`安装到了本地仓库，所以我们可以使用依赖。

通过`IDEA`工具我们可以查看`webjars-sample`依赖内的资源文件，如下图所示：

![](https://blog.yuqiyu.com/images/post/spring-boot-basic-packaging-webjars-1.png)

由于`SpringBoot`提供的`spring.resources.static-locations`参数默认值，会将`classpath:/META-INF/resources`目录作为静态资源映射，所以我们可以直接进行访问`head.jpg`文件。

运行`SpringBoot`项目，通过访问 [http://localhost:8080/head.jpg](http://localhost:8080/head.jpg)，效果如下图：

![](https://blog.yuqiyu.com/images/post/spring-boot-basic-packaging-webjars-2.png)

## 静态资源访问前缀

我们在访问静态资源的时候并没有直接加前缀，而是通过`ip:port/head.jpg`直接访问，这主要是`SpringBoot`还提供了另外一个配置`spring.mvc.static-path-pattern`，其作用是用来配置`静态资源的访问前缀`，默认值为`/**`，如果需要修改直接在`application.yml`文件内进行赋值即可，

**application.yml**配置文件，如下所示：

```yaml
spring:
  application:
    name: example
  mvc:
    static-path-pattern: /static/**
```

我们修改了`spring.mvc.static-path-pattern`配置的值为`/static/**`，当我们重启项目后需要通过  [http://localhost:8080/static/head.jpg](http://localhost:8080/static/head.jpg) 才可以访问到资源。



## 总结

如果你有一些资源不希望被别人修改，让使用者更加便利的集成时，可以采用这种方式来封装自己的`webjars`，只需要添加依赖引用就可以访问到静态资源，也可以将静态`HTML`网页通过这种方式打包。
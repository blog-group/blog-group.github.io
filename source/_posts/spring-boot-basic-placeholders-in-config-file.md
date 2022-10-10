---
id: spring-boot-basic-placeholders-in-config-file
title: SpringBoot2.x基础篇：配置文件中占位符的使用
sort_title: SpringBoot配置文件中占位符的使用
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: true
news: true
disable_toc: false
customize: false
tags: [SpringBoot2.x]
categories: [SpringBoot]
keywords: ‘占位符,springboot,配置文件’
date: 2020-03-23 10:54:24
article_url:
description: 'SpringBoot2.x基础篇：配置文件中占位符的使用'
---

## 概念

`占位符`是一种灵活的配置方式，可以让我们很灵活的使用配置参数，`@Value`注解的配置也是占位符的一种体现方式，这种方式可以从`Environment`内获取对应的`配置值`。
<!--more-->
## 推荐阅读
- [SpringBoot2.x 教程汇总](http://blog.minbox.org/spring-boot-2-x-articles.html)

## 配置方式

在`application.yml/properties`配置文件内可以直接使用`占位符`来进行配置的相互引用，如下所示：

```yaml
system:
  name: ${spring.application.name}
spring:
  application:
    name: project-sample
```

在上面的配置中，`name`配置直接引用了`spring.application.name`的配置值，这样我们在系统中通过`@Value("${name}")`或者通过`@ConfigurationProperties`方式使用时，得到的值都为`project-sample`。

```java
// @Value方式
@Value("${system.name}")
private String name;

// @ConfigurationProperties方式
@Configuration
@ConfigurationProperties(prefix = "system")
static class LoadConfig {
  private String name;

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }
}
```

> 这样方式**极大地减少了相同的配置**出现，让我们在`配置文件`中也可以实现类似于`常量`的定义。

## 使用默认值

当我们使用`@Value`注解来注入配置参数时，如果所引入的配置为**NULL**，启动项目时会抛出异常，项目无法正常启动，所以我们有必要添加一个默认值，如下所示：

```yaml
system:
  name: ${spring.application.name:default}
#spring:
#  application:
#    name: project-sample
```

在上面配置中把`spring.application.name`注释掉，当我们使用`${spring.application.name}`占位符时其实并未引用到有效的值，通过`${xxx:defaultValue}`的形式可以配置默认值，当占位符所引用的配置为`NULL`时，将会使用默认值（**默认值的类型要对配置匹配**）。

也可以通过`@Value("${system.name:default}")`这种方式配置默认值，不建议使用这种方式，默认值有变动时，我们还要一个一个修改，太麻烦了，不要给自己找事干...

> 当然对于配置的注入还是推荐使用`@ConfigurationProperties`，完全遵循`OOP`设计方式，在应用程序启动时进行赋值，就算是引用的配置为`NULL`没有默认值，也不会出现启动异常的问题。

## “短”命令行参数

如果你对命令行参数不熟悉，可以访问 [SpringBoot2.x基础篇：灵活的使用外部化配置信息](https://blog.minbox.org/spring-boot-basic-externalized-configuration.html) 学习。

在实际部署应用程序时，有很多的配置是动态的，`命令行`参数是一个不错的方式，不过`SpringBoot`所提供的配置参数名称都比较长，对此我们完全可以利用`占位符`配置方式实现自定义。

`占位符`是从`Environment`内读取对应的配置值，而`命令行参数`在应用程序启动时会被一并加入到`Environment`中，因此也就实现了`占位符`动态配置，其实这个“短”的含义，是你定义的新的配置名称比较短而已。

假设我们的端口号需要动态指定，配置文件中可以通过如下的方式配置：

```yaml
server:
  port: ${port:8080}
```

`port`是我们定义的“短”`占位符`，在应用程序启动时并未指定则使用默认值`8080`。

```java
java -jar project-sample.jar --port=9090
```

通过`--port=9090`命令行参数，应用程序启动时端口号就变为了`9090`。
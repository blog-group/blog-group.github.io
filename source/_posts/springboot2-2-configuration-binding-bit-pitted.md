---
id: springboot2.2-configuration-binding-bit-pitted
title: SpringBoot2.2版本配置绑定是不是有点坑了？
sort_title: SpringBoot2.2升级使用遇到的坑
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: true
news: true
customize: false
tags:
  - SpringBoot
categories:
  - SpringBoot
keywords: springboot,属性绑定,properties
date: 2019-12-02 12:07:01
article_url:
description: 'SpringBoot2.2版本配置绑定是不是有点坑了？'
---

`SpringBoot`版本升级兼容性一直做的不是多么的美丽，各个大分支之间由于底层使用的`Srping`版本不同，才导致的这种问题出现，而升级到`2.2.1.RELEASE`版本之后又遇到一个`配置绑定`的坑。

<!--more-->

## 问题描述

`SpringBoot`在升级到`2.2.1.RELEASE`版本后遇到了`属性配置`绑定的问题，我去找到`SpringBoot`版本发布的页面（[Spring-Boot-2.2-Release-Notes](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-2.2-Release-Notes)）才了解到从`2.2.1.RELEASE`版本开始`@SpringBootApplication`注解已经不再添加`@ConfigurationPropertiesScan`支持，需要手动进行配置，这一点我们从源码上可以更清楚的看到。

### 2.2.0.RELEASE

`SpringBoot` **2.2.0.RELEASE**版本中`@SpringBootApplication`注解部分源码如下所示：

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
@SpringBootConfiguration
@EnableAutoConfiguration
@ComponentScan(excludeFilters = { @Filter(type = FilterType.CUSTOM, classes = TypeExcludeFilter.class),
		@Filter(type = FilterType.CUSTOM, classes = AutoConfigurationExcludeFilter.class) })
@ConfigurationPropertiesScan
public @interface SpringBootApplication {
  //...
}
```

通过源码我们可以看到**2.2.0.RELEASE**版本的`@SpringBootApplication`注解默认添加了`ConfigurationPropertiesScan`注解，也就是默认开启了扫描`@ConfigurationProperties`注解的配置类，然后根据`prefix`进行属性绑定。

### 2.2.1.RELEASE

`SpringBoot` **2.2.1.RELEASE**版本中`@SpringBootApplication`注解部分源码如下所示：

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
@SpringBootConfiguration
@EnableAutoConfiguration
@ComponentScan(excludeFilters = { @Filter(type = FilterType.CUSTOM, classes = TypeExcludeFilter.class),
		@Filter(type = FilterType.CUSTOM, classes = AutoConfigurationExcludeFilter.class) })
public @interface SpringBootApplication {
	//...
}
```

我们发现在`SpringBoot`**2.2.1.RELEASE**版本的`@SpringBootApplication`注解中已经不再默认添加`@ConfigurationPropertiesScan`注解的支持了，也就是我们无法通过默认的配置实现扫描`@ConfigurationProperties`注解的类，也无法将`application.yml/application.properties`文件的配置内容与实体类内的属性进行绑定。

## 解决问题

`SpringBoot`官方给出的解决方法是手动在`@SpringBootApplication`注解的类上手动添加`@ConfigurationPropertiesScan`即可，如下所示：

```java
/**
 * 2.2.1.RELEASE版本属性绑定问题解决
 *
 * @author 恒宇少年
 */
@SpringBootApplication
@ConfigurationPropertiesScan
public class SpringbootConfigurationBindingBitPittedApplication {

    public static void main(String[] args) {
        SpringApplication.run(SpringbootConfigurationBindingBitPittedApplication.class, args);
    }

}
```



## 敲黑板，划重点

`SpringBoot`的每次中大版本升级往往会删除或者新增一些功能，建议大家关注`SpringBoot`的动态，以免出现类似今天这篇文章的问题，根据官方的文档及时做出调整。

## 代码示例
如果您喜欢本篇文章请为源码仓库点个`Star`，谢谢！！！
本篇文章示例源码可以通过以下途径获取，源码分支为`2.x`，目录为`springboot2-2-configuration-binding-bit-pitted`：
- Gitee：[https://gitee.com/hengboy/spring-boot-chapter](https://gitee.com/hengboy/spring-boot-chapter)
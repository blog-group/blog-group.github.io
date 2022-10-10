---
id: use-consumer-banner
title: 自定义项目的启动Banner
article_type: 原创
article_author: 于起宇
enable_comment: true
news: true
tags: [技术杂谈,SpringBoot]
categories: [SpringBoot]
date: 2019-09-29 15:12:17
keywords: SpringCloud,SpringBoot,恒宇少年,banner
description: '自定义SpringBoot项目的启动Banner'
---
``Banner``是``SpringBoot``框架一个特色的部分，其设计的目的无非就是一个框架的标识，其中包含了版本号、框架名称等内容，既然``SpringBoot``为我们提供了这个模块，它肯定也是可以更换的这也是``Spring``开源框架的设计理念。
<!--more-->
# 本章目标
修改``SpringBoot``启动``Banner``内容.

# 构建项目
本章不涉及业务逻辑相关内容，简单创建一个``SpringBoot``框架即可。

## Banner的隐藏
隐藏的方式``SpringBoot``提供了两种，不过其中``application.properties``方式已经被抛弃掉了，我们下面介绍下修改``SpringBootApplication``配置的方式。具体代码如下所示：
```java
package com.yuqiyu.chapter33;

import org.springframework.boot.Banner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Chapter33Application {

	public static void main(String[] args) {
		/**
		 * 隐藏banner启动方式
		 */
		SpringApplication springApplication = new SpringApplication(Chapter33Application.class);
		//设置banner的模式为隐藏
		springApplication.setBannerMode(Banner.Mode.OFF);
		//启动springboot应用程序
		springApplication.run(args);

		//原启动方式
		/*SpringApplication.run(Chapter33Application.class, args);*/
	}
}
```
配置完成后，我们启动项目在控制台你就会发现``Banner``已经隐藏不见了，当然我们也是可以更换``Banner``内容的。

## Banner的更换
更换``Banner``相对于隐藏要简单一些，我们只需要在``src/main/resource``下添加一个名叫``banner.txt``的文件，将需要修改的内容写入到该文件内就可以了，具体``Banner``内容如下所示：
```
${AnsiColor.BRIGHT_RED}                      !                      天地山青   ${AnsiColor.BRIGHT_YELLOW}                      !
${AnsiColor.BRIGHT_RED}                     /^\                        ${AnsiColor.BRIGHT_YELLOW}道法无常                     /^\
${AnsiColor.BRIGHT_RED}                   /     \                   天地无极   ${AnsiColor.BRIGHT_YELLOW}                   /     \
${AnsiColor.BRIGHT_RED}   |            | (       ) |            |      ${AnsiColor.BRIGHT_YELLOW}乾坤戒法   |            | (       ) |            |
${AnsiColor.BRIGHT_RED}  /^\  |       /^\ \     / /^\       |  /^\  元阳入体   ${AnsiColor.BRIGHT_YELLOW}  /^\  |       /^\ \     / /^\       |  /^\
${AnsiColor.BRIGHT_RED}  |O| /^\     (   )|-----|(   )     /^\ |O|     ${AnsiColor.BRIGHT_YELLOW}五毒不侵  |O| /^\     (   )|-----|(   )     /^\ |O|
${AnsiColor.BRIGHT_RED}  |_| |-| |^-^|---||-----||---|^-^| |-| |_|  九阳之体   ${AnsiColor.BRIGHT_YELLOW}  |_| |-| |^-^|---||-----||---|^-^| |-| |_|
${AnsiColor.BRIGHT_RED}  |O| |O| |/^\|/^\||  |  ||/^\|/^\| |O| |O|     ${AnsiColor.BRIGHT_YELLOW}化缘神功  |O| |O| |/^\|/^\||  |  ||/^\|/^\| |O| |O|
${AnsiColor.BRIGHT_RED}  |-| |-| ||_|||_||| /^\ |||_|||_|| |-| |-|  邪魔退散   ${AnsiColor.BRIGHT_YELLOW}  |-| |-| ||_|||_||| /^\ |||_|||_|| |-| |-|
${AnsiColor.BRIGHT_RED}  |O| |O| |/^\|/^\||(   )||/^\|/^\| |O| |O|     ${AnsiColor.BRIGHT_YELLOW}永不宕机  |O| |O| |/^\|/^\||(   )||/^\|/^\| |O| |O|
${AnsiColor.BRIGHT_RED}  |-| |-| ||_|||_||||   ||||_|||_|| |-| |-|  永无八哥   ${AnsiColor.BRIGHT_YELLOW}  |-| |-| ||_|||_||||   ||||_|||_|| |-| |-|
${AnsiColor.BRIGHT_CYAN}
```
在上面有一些属性配置，如``${AnsiColor.BRIGHT_RED}``，这些配置都位于``org.springframework.boot.ansi.AnsiColor`枚举内，用于配置的是输出的颜色。可配置内容如下所示：
```
    DEFAULT("39"),
    BLACK("30"),
    RED("31"),
    GREEN("32"),
    YELLOW("33"),
    BLUE("34"),
    MAGENTA("35"),
    CYAN("36"),
    WHITE("37"),
    BRIGHT_BLACK("90"),
    BRIGHT_RED("91"),
    BRIGHT_GREEN("92"),
    BRIGHT_YELLOW("93"),
    BRIGHT_BLUE("94"),
    BRIGHT_MAGENTA("95"),
    BRIGHT_CYAN("96"),
    BRIGHT_WHITE("97");
```
这个配置是针对文字的颜色，当然还有背景颜色的配置，位于``org.springframework.boot.ansi.AnsiBackground``枚举内，可配置的内容如下所示：
```
    DEFAULT("49"),
    BLACK("40"),
    RED("41"),
    GREEN("42"),
    YELLOW("43"),
    BLUE("44"),
    MAGENTA("45"),
    CYAN("46"),
    WHITE("47"),
    BRIGHT_BLACK("100"),
    BRIGHT_RED("101"),
    BRIGHT_GREEN("102"),
    BRIGHT_YELLOW("103"),
    BRIGHT_BLUE("104"),
    BRIGHT_MAGENTA("105"),
    BRIGHT_CYAN("106"),
    BRIGHT_WHITE("107");
```
具体的``banner.txt``的内容可根据自己的爱好进行配置，上述``banner.txt``的效果如下图1所示：

![图1](/images/post/user-customer-banner.png)
# 总结
本章主要讲解了如何隐藏与修改``SpringBoot``内的``Banner``内容，``SpringBoot``为我们提供了最大的遍历，让我们根据其中的一些属性自由组合配置内容。

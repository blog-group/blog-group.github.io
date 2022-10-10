---
id: use-lombok
title: 使用Lombok优雅编码
article_type: 原创
article_author: 于起宇
enable_comment: true
news: true
tags: [技术杂谈]
categories: [技术杂谈]
date: 2019-09-29 14:56:27
keywords: lombok,SpringBoot,恒宇少年
description: '使用Lombok优雅编码'
---
``Lombok``对于``Java偷懒开发者``来说应该是比较中意的，恰恰笔者就是一个喜欢在小细节上偷懒来提高开发效率的人。所以在技术框架的海洋里寻找了很久才在``GitHub``开源平台上找到，而在这之前国外很多程序猿一直使用该框架了，``Lombok``框架提供了很多编码遍历，但是也降低了代码的阅读力。下面我们看看在Idea开发工具中该怎么使用``Lombok``？
<!--more-->
# 本章目标
使用Lombok提高开发效率。

# 构建项目
本章的项目不涉及数据访问，所以添加的依赖也比较少，pom.xml配置文件如下所示：
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
	<modelVersion>4.0.0</modelVersion>
	<groupId>com.yuqiyu</groupId>
	<artifactId>chapter29</artifactId>
	<version>0.0.1-SNAPSHOT</version>
	<packaging>jar</packaging>
	<name>chapter29</name>
	<description>Demo project for Spring Boot</description>

	<parent>
		<groupId>org.springframework.boot</groupId>
		<artifactId>spring-boot-starter-parent</artifactId>
		<version>1.5.6.RELEASE</version>
		<relativePath/> <!-- lookup parent from repository -->
	</parent>

	<properties>
		<project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
		<project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
		<java.version>1.8</java.version>
	</properties>

	<dependencies>
		<!--web依赖-->
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-web</artifactId>
		</dependency>
		<!--lombok依赖-->
		<dependency>
			<groupId>org.projectlombok</groupId>
			<artifactId>lombok</artifactId>
			<version>1.16.18</version>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-test</artifactId>
			<scope>test</scope>
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
``lombok``的依赖仅仅只有一个，``lombok``基于配置在编译class文件时会自动将指定模板的内容写入。
## 创建实体
为了方便演示``lombok``的神奇之处，我们简单创建一个用户实体，基于该实体进行配置``lombok``注解，实体代码如下所示：
```java
package com.yuqiyu.chapter29.bean;

/**
 * 用户实体>>>测试lombok
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2017/8/4
 * Time：23:07
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
public class UserBean
{
    //名称
    private String name;
    //年龄
    private int age;
    //家庭住址
    private String address;
}
```
下面我们先来看看我们最常用的``getter/setter``基于``lombok``如何使用。
## Getter/Setter
Getter/Setter注解作用域可以是实体类也可以是具体的属性字段，下面我们仅仅对``name``属性添加注解，代码如下所示：
```java
    //...省略
    //名称
    @Getter
    @Setter
    private String name;
```
如果想让``lombok``生效我们还需要针对idea工具进行插件的安装，下面我们按照顺序打开Idea配置``File  >  Settings  >  Plugins  >  Browse  repositories...  >  输入lombok``，插件就会被自动检索出来，界面如下图1所示：
![](/images/post/lombok-idea-plugin.png)
我的工具已经安装了该插件，所有在右侧是没有任何按钮的，如果你的工具没有安装该插件，右侧会有一个绿色的按钮，按钮的内容则是``Install``，点击安装后``重启Idea``就可以了。
为了方便我们直接使用``SpringBoot``项目为我们创建的测试类（位置：com.yuqiyu.chapter29.Chapter29ApplicationTests）来验证我们的``lombok``注解是否已经生效，测试类代码如下所示：
```java
package com.yuqiyu.chapter29;

import com.yuqiyu.chapter29.bean.UserBean;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;

@RunWith(JUnit4.class)
//@RunWith(SpringRunner.class)
//@SpringBootTest
public class Chapter29ApplicationTests {

	@Test
	public void testLombok()
	{
		//测试Getter/Setter
		UserBean user = new UserBean();
		user.setName("测试lombok");
		System.out.println(user.getName());
	}
}
```
可以看到我们可以正常使用``name``属性的getter/setter方法，但是其他属性的却是无法调用，下面我们修改注解``Getter/Setter``位置，配置到实体类上。修改后的代码如下所示：
```java
//省略...
@Getter
@Setter
public class UserBean
{
    //名称
    private String name;
    //年龄
    private int age;
    //家庭住址
    private String address;
}
```
我们再来测试下其他属性是否可以访问到了，测试类修改代码如下所示：
```java
//省略...
@Test
	public void testLombok()
	{
		//测试Getter/Setter
		UserBean user = new UserBean();
		user.setName("测试lombok");
		user.setAge(10);
		user.setAddress("测试地址");

		System.out.println(user.getName()+"  " + user.getAge() +"  "+user.getAddress());
	}
```
可以看到我们修改配置位置后``UserBean``实体内的所有属性都具备了``Getter/Setter``方法，这样我们在开发中就不需要再去做多余的生成操作了。

> 注意：如果你的属性Getter/Setter需要做特殊处理，那么直接使用原始方法实现即可，Lombok检查到存在自定义的方法后不会再做生成处理。

## ToString
除了上述的``Getter/Setter``Lombok还为我们提供了自动生成toString方法的注解``@ToString``，该注解的作用域仅仅是在实体类上，我们修改实体类添加该注解，在测试类中调用toString方法查看输出内容如下：
```java
System.out.println(user.toString());
//输出：
UserBean(name=测试lombok, age=10, address=sss测试地址)
```
``Lombok``自动创建的toString方法会将所有的属性都包含并且调用后可以输出。
## AllArgsConstructor
``Lombok``还提供了全部参数的构造函数的自动生成，该注解的作用域也是只有在实体类上，因为只有实体类才会存在构造函数。修改添加该注解并且测试调用，如下所示：
```java
UserBean u = new UserBean("构造lombok",1,"测试地址");
//输出：
UserBean(name=构造lombok, age=1, address=sss测试地址)
```
> 注意：该注解配置后会自动生成一个具体全部参数的构造函数，参数的顺序与属性定义的顺序一致。

## NoArgsConstructor
当然除了全部参数的构造函数，``Lombok``还提供了没有参数的构造函数，使用方式与@AllArgsConstructor一致。

到这里也许你就有疑问了，我为了一个类添加这么多注解麻烦吗？还不如工具生成``getter/setter``来的快呢，那好``Lombok``针对这个问题也做出了解决方案。
## Data
我们使用``@Data``注解就可以涵盖``@ToString``、``@Getter``、``@Setter``方法，当然我们使用构造函数时还是需要单独添加注解，下面我们修改实体类添加``@Data``注解代码如下所示：
```java
/*@Getter
@Setter
@ToString*/
@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserBean
{
    //名称
    private String name;
    //年龄
    private int age;
    //家庭住址
    private String address;

    public String getAddress() {
        return "sss"+address;
    }
}
```
我们将``@ToString``、``@Getter``、``@Setter``三个注解注释掉后添加``@Data``，按照官方所说这时我们的测试类应该不会出现任何的异常，我们打开测试类查看是否正常。
查看后果然，没有出现任何的异常，这也说明了``@Data``注解确实涵盖了上面三个注解。

## Slf4j
还有一个利器，``Lombok``为我们内置了各种日志组件的支持，我们在SpringBoot项目开发中几乎都是使用``logback``作为日志组件，而``logback``是基于``slf4j``完成的。所以我们在实体类上直接添加``@Slf4j``就可以自动创建一个日志对象作为类内全局字段，自动创建的代码如下所示：
```java
private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(Chapter29ApplicationTests.class);
```
为了测试我在``Chapter29ApplicationTests``测试类上添加了``@Slf4j``，调用效果如下所示：
```java
//调用：
log.info(u.toString());
//输出：
23:55:46.100 [main] INFO com.yuqiyu.chapter29.Chapter29ApplicationTests - UserBean(name=构造lombok, age=1, address=sss测试地址)
```
# 总结
以上内容就是本章的全部讲述，本章主要讲解``Lombok``用于便于开发的注解组件。``Lombok``虽然提供的组件不多，但是每一个都是我们需要的，正是因为如此从而大大减少了我们的工作量，尤其是这种不起眼却又不得不写的代码。[Lombok官方文档地址](https://projectlombok.org/features/all)
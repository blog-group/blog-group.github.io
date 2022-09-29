---
id: springboot-create-starter
title: 自定义你的业务Starter
article_type: 原创
article_author: 于起宇
enable_comment: true
news: true
tags:
  - starter
  - SpringBoot
categories:
  - SpringBoot
date: 2019-09-29 14:51:00
keywords: starter,springboot,恒宇少年
description: '自定义你的业务SpringBoot Starter'
---
在我们学习``SpringBoot``时都已经了解到``starter``是``SpringBoot``的核心组成部分，``SpringBoot``为我们提供了尽可能完善的封装，提供了一系列的自动化配置的``starter``插件，我们在使用``spring-boot-starter-web``时只需要在``pom.xml``配置文件内添加依赖就可以了，我们之前传统方式则是需要添加很多相关``SpringMVC``配置文件。而``spring-boot-starter-web``为我们提供了几乎所有的默认配置，很好的降低了使用框架时的复杂度。
<!--more-->
因此在使用``xx.starter``时你就不用考虑该怎么配置，即便是有一些必要的配置在``application.properties``配置文件内对应配置就可以了，那好，为什么我在``application.properties``配置对应属性后``xx.starter``就可以获取到并作出处理呢？下面我们带着这个疑问来编写我们自定义的``starter``让我们深入了解``SpringBoot``

# 本章目标
自定义``starter``并且通过``spring-boot-autoconfigure``完成自动化配置。

# 构建项目
创建``starter``项目我们并不需要创建``SpringBoot``项目，我们创建一个``Maven``项目就可以满足我们的需求，创建项目完成后``pom.xml``配置信息如下所示：
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.yuqiyu</groupId>
    <artifactId>chapter28</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    <properties>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-autoconfigure</artifactId>
            <version>1.5.4.RELEASE</version>
        </dependency>
    </dependencies>
</project>
```
我们这个``starter``并不做其他复杂逻辑的编写，所以这里的依赖只是添加了``spring-boot-autoconfigure``，实战开发时可以添加任意依赖到项目中。

### 配置映射参数实体
我们在文章开头埋下了一个疑问，``starter``是如何读取``application.properties``或者``application.yml``配置文件内需要的配置参数的呢？那么接下来我们就看看如何可以获取自定义的配置信息。
``SpringBoot``在处理这种事情上早就已经考虑到了，所以提供了一个注解``@ConfigurationProperties``，该注解可以完成将``application.properties``配置文件内的有规则的配置参数映射到实体内的``field``内，不过需要提供setter方法，自定义配置参数实体代码如下所示：
```java
package com.yuqiyu.chapter28;
import org.springframework.boot.context.properties.ConfigurationProperties;
/**
 * 配置文件实体映射
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2017/7/22
 * Time：22:51
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
@ConfigurationProperties(prefix = "hello")
public class HelloProperties
{
    //消息内容
    private String msg = "HengYu";
    //是否显示消息内容
    private boolean show = true;

    public String getMsg() {
        return msg;
    }
    public void setMsg(String msg) {
        this.msg = msg;
    }
    public boolean isShow() {
        return show;
    }
    public void setShow(boolean show) {
        this.show = show;
    }
}
```
在上面代码中，``@ConfigurationProperties``注解内我们使用到了属性``preffix``，该属性配置了读取参数的前缀，根据上面的实体属性对应配置文件内的配置则是``hello.msg``、``hello.show``，当然我们提供了默认值，配置文件内不进行配置时则是使用默认值。
### 编写自定义业务
我们为自定义``starter``提供一个``Service``，并且提供一个名为``sayHello``的方法用于返回我们配置的``msg``内容。代码如下所示：
```java
package com.yuqiyu.chapter28;

/**
 * 自定义业务实现
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2017/7/22
 * Time：22:54
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
public class HelloService
{
    //消息内容
    private String msg;
    //是否显示消息内容
    private boolean show = true;

    public String sayHello()
    {
        return show ? "Hello，" + msg : "Hidden";
    }

    public void setMsg(String msg) {
        this.msg = msg;
    }

    public void setShow(boolean show) {
        this.show = show;
    }
}
```
我们``Service``内的代码比较简单，根据属性参数进行返回格式化后的字符串。

接下来我们开始编写自动配置，这一块是``starter``的核心部分，配置该部分后在启动项目时才会自动加载配置，当然其中有很多细节性质的配置

### 实现自动化配置
自动化配置其实只是提供实体bean的验证以及初始化，我们先来看看代码：
```java
package com.yuqiyu.chapter28;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 自定义starter自动化配置
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2017/7/22
 * Time：22:56
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
@Configuration//开启配置
@EnableConfigurationProperties(HelloProperties.class)//开启使用映射实体对象
@ConditionalOnClass(HelloService.class)//存在HelloService时初始化该配置类
@ConditionalOnProperty//存在对应配置信息时初始化该配置类
        (
                prefix = "hello",//存在配置前缀hello
                value = "enabled",//开启
                matchIfMissing = true//缺失检查
        )
public class HelloAutoConfiguration
{

    //application.properties配置文件映射前缀实体对象
    @Autowired
    private HelloProperties helloProperties;

    /**
     * 根据条件判断不存在HelloService时初始化新bean到SpringIoc
     * @return
     */
    @Bean//创建HelloService实体bean
    @ConditionalOnMissingBean(HelloService.class)//缺失HelloService实体bean时，初始化HelloService并添加到SpringIoc
    public HelloService helloService()
    {
        System.out.println(">>>The HelloService Not Found，Execute Create New Bean.");
        HelloService helloService = new HelloService();
        helloService.setMsg(helloProperties.getMsg());//设置消息内容
        helloService.setShow(helloProperties.isShow());//设置是否显示
        return helloService;
    }
}
```
自动化配置代码中有很多我们之前没有用到的注解配置，我们从上开始讲解

``@Configuration``：这个配置就不用多做解释了，我们一直在使用
``@EnableConfigurationProperties``：这是一个开启使用配置参数的注解，``value``值就是我们配置实体参数映射的``ClassType``，将配置实体作为配置来源。
##### SpringBoot内置条件注解
有关``@ConditionalOnXxx``相关的注解这里要系统的说下，因为这个是我们配置的关键，根据名称我们可以理解为``具有Xxx条件``，当然它实际的意义也是如此，条件注解是一个系列，下面我们详细做出解释

``@ConditionalOnBean``：当``SpringIoc``容器内存在指定``Bean``的条件
``@ConditionalOnClass``：当``SpringIoc``容器内存在指定``Class``的条件
``@ConditionalOnExpression``：基于SpEL表达式作为判断条件
``@ConditionalOnJava``：基于``JVM``版本作为判断条件
``@ConditionalOnJndi``：在JNDI存在时查找指定的位置
``@ConditionalOnMissingBean``：当``SpringIoc``容器内不存在指定``Bean``的条件
``@ConditionalOnMissingClass``：当``SpringIoc``容器内不存在指定``Class``的条件
``@ConditionalOnNotWebApplication``：当前项目不是Web项目的条件
``@ConditionalOnProperty``：指定的属性是否有指定的值
``@ConditionalOnResource``：类路径是否有指定的值
``@ConditionalOnSingleCandidate``：当指定``Bean``在``SpringIoc``容器内只有一个，或者虽然有多个但是指定首选的``Bean``
``@ConditionalOnWebApplication``：当前项目是Web项目的条件

以上注解都是元注解``@Conditional``演变而来的，根据不用的条件对应创建以上的具体条件注解。

到目前为止我们还没有完成自动化配置``starter``，我们需要了解``SpringBoot``运作原理后才可以完成后续编码。

### Starter自动化运作原理
在注解``@SpringBootApplication``上存在一个开启自动化配置的注解``@EnableAutoConfiguration``来完成自动化配置，注解源码如下所示：
```java
//
// Source code recreated from a .class file by IntelliJ IDEA
// (powered by Fernflower decompiler)
//

package org.springframework.boot.autoconfigure;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Inherited;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import org.springframework.context.annotation.Import;

@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
@AutoConfigurationPackage
@Import({EnableAutoConfigurationImportSelector.class})
public @interface EnableAutoConfiguration {
    String ENABLED_OVERRIDE_PROPERTY = "spring.boot.enableautoconfiguration";

    Class<?>[] exclude() default {};

    String[] excludeName() default {};
}
```
在``@EnableAutoConfiguration``注解内使用到了``@import``注解来完成导入配置的功能，而``EnableAutoConfigurationImportSelector``内部则是使用了``SpringFactoriesLoader.loadFactoryNames``方法进行扫描具有``META-INF/spring.factories``文件的jar包。我们可以先来看下``spring-boot-autoconfigure``包内的``spring.factories``文件内容，如下所示：
```conf
# Initializers
org.springframework.context.ApplicationContextInitializer=\
org.springframework.boot.autoconfigure.SharedMetadataReaderFactoryContextInitializer,\
org.springframework.boot.autoconfigure.logging.AutoConfigurationReportLoggingInitializer

# Application Listeners
org.springframework.context.ApplicationListener=\
org.springframework.boot.autoconfigure.BackgroundPreinitializer

# Auto Configuration Import Listeners
org.springframework.boot.autoconfigure.AutoConfigurationImportListener=\
org.springframework.boot.autoconfigure.condition.ConditionEvaluationReportAutoConfigurationImportListener

# Auto Configuration Import Filters
org.springframework.boot.autoconfigure.AutoConfigurationImportFilter=\
org.springframework.boot.autoconfigure.condition.OnClassCondition

# Auto Configure
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
org.springframework.boot.autoconfigure.admin.SpringApplicationAdminJmxAutoConfiguration,\
org.springframework.boot.autoconfigure.aop.AopAutoConfiguration,\
.....省略
```
可以看到配置的结构形式是``Key``=>``Value``形式，多个``Value``时使用``,``隔开，那我们在自定义``starter``内也可以使用这种形式来完成，我们的目的是为了完成自动化配置，所以我们这里``Key``则是需要使用``org.springframework.boot.autoconfigure.EnableAutoConfiguration``
### 自定义spring.factories
我们在``src/main/resource``目录下创建``META-INF``目录，并在目录内添加文件``spring.factories``，具体内容如下所示：
```conf
#配置自定义Starter的自动化配置
org.springframework.boot.autoconfigure.EnableAutoConfiguration=com.yuqiyu.chapter28.HelloAutoConfiguration
```
都目前为止我们的自定义``starter``已经配置完成，下面我们需要新建一个``SpringBoot``项目来测试我们的自动化配置是否已经生效。
### 创建测试SpringBoot项目
在使用自定义``starter``之前需要将``starter``作``Maven Jar Install``到本地，我们使用idea工具自带的maven命令完成该操作

步骤：工具右侧 -> Maven Projects -> Lifecycle -> install

创建测试项目的``pom.xml``配置文件内容如下所示：
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
	<modelVersion>4.0.0</modelVersion>

	<groupId>com.yuqiyu.sample</groupId>
	<artifactId>test-spring-boot-starter-hello</artifactId>
	<version>0.0.1-SNAPSHOT</version>
	<packaging>jar</packaging>

	<name>test-spring-boot-starter-hello</name>
	<description>Demo project for Spring Boot</description>

	<parent>
		<groupId>org.springframework.boot</groupId>
		<artifactId>spring-boot-starter-parent</artifactId>
		<version>1.5.4.RELEASE</version>
		<relativePath/> <!-- lookup parent from repository -->
	</parent>

	<properties>
		<project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
		<project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
		<java.version>1.8</java.version>
	</properties>

	<dependencies>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter</artifactId>
		</dependency>                
        <!--自定义starter依赖-->
		<dependency>
			<groupId>com.yuqiyu</groupId>
			<artifactId>chapter28</artifactId>
			<version>1.0.0</version>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-web</artifactId>
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
我们只需要将依赖添加到``pom.xml``配置文件内

### 运行测试
在运行项目之前，我们打开``application.properties``配置文件开启``debug``模式，查看自动化配置的输出日志，配置内容如下所示：
``` properties
#显示debug日志信息
debug=true
```
接下来我们启动项目，在控制台查找是否存在我们的``HelloAutoConfiguration``日志输出，控制台输出内容如下所示：
```bash
.....省略
>>>The HelloService Not Found，Execute Create New Bean.
.....省略
   HelloAutoConfiguration matched:
      - @ConditionalOnClass found required class 'com.yuqiyu.chapter28.HelloService'; @ConditionalOnMissingClass did not find unwanted class (OnClassCondition)
      - @ConditionalOnProperty (hello.enabled) matched (OnPropertyCondition)

   HelloAutoConfiguration#helloService matched:
      - @ConditionalOnMissingBean (types: com.yuqiyu.chapter28.HelloService; SearchStrategy: all) did not find any beans (OnBeanCondition)
.....省略
```
在控制台可以看到我们的自定义``starter``的自动化配置已经生效了，并且根据``@ConditionalOnMissingBean(HelloService.class)``做出了条件注入``HelloService``实体bean到``SpringIoc``容器内

### 编写测试控制器
我们来编写一个简单的测试控制器，查看``HelloService``在不配置参数情况下输出格式化字符串内容，控制器代码如下所示：
```java
package com.yuqiyu.sample.testspringbootstarterhello;

import com.yuqiyu.chapter28.HelloService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 测试自定义starter自动化配置HelloService
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2017/7/23
 * Time：11:42
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
@RestController
public class HelloController
{
    //注入自定义starter内逻辑
    @Autowired
    HelloService helloService;

    /**
     * 测试访问地址/hello
     * @return 格式化字符串
     */
    @RequestMapping(value = "/hello")
    public String sayHello()
    {
        return helloService.sayHello();
    }
}
```
接下来我们重启下项目，访问地址[http://127.0.0.1:8080/hello](http://127.0.0.1:8080/hello)，界面输出内容如下所示：
```
Hello，HengYu
```
界面输出的内容是我们默认值，接下来我们在``application.properties``配置文件内对应添加``hello.msg``、``hello.show``配置参数，如下所示：
```properties
#配置自定义starter参数
hello.msg=HengYu Boy
hello.show=true
```
重启项目，再次访问地址，界面输出内容如下所示：
```
Hello，HengYu Boy
```
我们的配置生效了，到目前为止我相信大家已经明白了我们``application.properties``配置文件为什么可以作为统一配置入口，为什么配置后可以被对应``starter``所使用。

#总结
以上内容是本章的全部讲解，本章主要讲解了我们如何自定义``starter``并且自动化配置到``SpringBoot``项目中，当然里面还有很多神奇的地方需要大家去深入挖掘。
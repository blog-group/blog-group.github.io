---
id: redis-springboot2-starter
title: SpringBoot2.x使用Redis缓存数据
article_type: 原创
article_author: 于起宇
enable_comment: true
news: true
tags:
  - Redis
  - SpringBoot
categories:
  - SpringBoot
date: 2019-09-29 17:36:16
keywords: redis,springboot,恒宇少年
description: 'SpringBoot2.x使用Redis缓存数据'
---

自从`SpringBoot`升级到了`2.0`版本后集成`Redis`作为缓存就更为简单了，我们只需要配置`Redis`相关的链接信息以及使用注解`@EnableCaching`开启缓存，这样我们就直接可以在项目内使用缓存相关的内容。
<!--more-->
# 本章目标
基于`SpringBoot2`完成快速集成`Reids`作为项目缓存，并讲解一些缓存常用的配置。

# 构建项目
如果之前本地没有`Redis`环境，请访问[第十六章：使用Redis作为SpringBoot项目数据缓存](https://www.jianshu.com/p/5a70b13a4fa7)文章阅读配置，接下来
我们先来创建一个新的`SpringBoot`项目，添加本站所使用的依赖，`pom.xml`配置文件如下所示：
```xml
...省略部分配置
<dependencies>
    <!--spring data jpa依赖添加-->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <!--redis依赖添加-->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-redis</artifactId>
    </dependency>
    <!--web相关依赖-->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <!--数据库依赖添加-->
    <dependency>
        <groupId>mysql</groupId>
        <artifactId>mysql-connector-java</artifactId>
        <scope>runtime</scope>
    </dependency>
    <!--druid依赖添加-->
    <dependency>
        <groupId>com.alibaba</groupId>
        <artifactId>druid-spring-boot-starter</artifactId>
        <version>1.1.8</version>
    </dependency>
    <!--lombok依赖添加-->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>
    <dependency>
        <groupId>com.alibaba</groupId>
        <artifactId>fastjson</artifactId>
        <version>1.2.44</version>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>

    <!--性能测试依赖-->
    <dependency>
        <groupId>org.databene</groupId>
        <artifactId>contiperf</artifactId>
        <version>2.3.4</version>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>javax.xml.bind</groupId>
        <artifactId>jaxb-api</artifactId>
        <version>2.3.0</version>
    </dependency>
</dependencies>
...省略部分配置
```
在本章的依赖内我们添加了`contiperf`性能测试工具，用于测试分别从数据库、缓存内读取的性能差异。
##### 配置Redis信息
我比较喜欢使用`yml`文件方式进行配置，先来删除之前项目自动创建的`application.properties`文件，新创建一个名为`application.yml`的配置文件，添加`Redis`相关的配置信息到`application.yml`文件内，如下所示：
```yaml
spring:
  application:
    name: spring-boot-redis
  jpa:
    database: mysql
    show-sql: true
  datasource:
    druid:
      username: root
      password: 123456
      url: jdbc:mysql://localhost:3306/test
  # 配置Redis的连接密码
  redis:
    password: hengyuboy
```
由于`Redis`有很多默认的配置，默认连接`localhost`上的`Redis`，我们这里仅仅配置连接的密码就可以了，其他的都使用默认的配置。

##### 开启缓存
我们找到创建的`XxxApplication`入口程序类，在该类上添加`@EnableCaching`注解完成开启缓存，如下所示：
```java
/**
 * spring-boot-redis集成项目启动类入口
 *
 * @author yuqiyu
 * @EnableCaching 注解配置启用缓存，自动配置配置文件的配置信息进行条件注入缓存所需实例
 */
@SpringBootApplication
@EnableCaching
public class SpringBootRedisApplication {
}
```
# 测试
到现在我们的缓存已经配置完成了，是不是比之前`SpringBoot1.x.x`版本的时候要简单很多，当然如果你有一些额外的自定义配置也是可以很简单的集成。
我们本章使用的数据读取是`SpringDataJPA`，如果你之前并没有使用过`SpringDataJPA`请访问[第十三章：SpringBoot实战SpringDataJPA](https://www.jianshu.com/p/9d5bf0e4943f)来阅读学习。

##### 测试添加缓存
我们先来创建一个查询方法完成简单的数据缓存，方法如下所示：
```java
    /**
     * 查询全部用户
     *
     * @return
     */
    @Cacheable(cacheNames = "user.service.all")
    public List<TestUserEntity> findAll() {
        return userRepository.findAll();
    }
```
接下来编写一个简单的单元测试，我们直接使用创建项目时创建的测试类，在测试类内添加一个测试方法，如下所示：
```java
    /**
     * 测试全部缓存
     */
    @Test
    public void findAll() {
        userService.findAll();
    }
```
当我们第一次启动`findAll`测试方法时可以看到控制台输出的`SQL`，如下所示：
```
Hibernate: select testuseren0_.ui_id as ui_id1_0_, testuseren0_.ui_age as ui_age2_0_, testuseren0_.ui_name as ui_name3_0_, testuseren0_.ui_password as ui_passw4_0_ from test_user_info testuseren0_
```
本次的数据是从数据库内查询到的，接下来我们再次执行 `findAll`方法来看下控制台，这时我们并没有看到输出的`SQL`，证明本次的数据是从`Redis`缓存内读取得到的。

#### 性能测试
我们在`pom.xml`配置文件内已经添加了性能测试的依赖`contiperf`，那么下面我们来测试下从 `Redis`内读取数据与 `数据库`内读取输出的性能差异。
```java
    @Rule
    public ContiPerfRule i = new ContiPerfRule();

    /**
     * 性能测试
     * 10万次查询，100个线程同时操作findAll方法
     */
    @Test
    @PerfTest(invocations = 100000, threads = 100)
    public void contextLoads() {
        userService.findAll();
    }
```
我们的测试是查询`10万`次，并且开启`100`个线程来完成这个测试方法，我们先来测试使用缓存的性能，如下图所示：
![Redis10万性能测试](/images/post/redis-springboot2-starter-1.png)
这是`contiperf`执行生成的数据统计，当我们运行性能测试方法完成后，`contiperf`就会自动在`target->contiperf-report`下自动生成一个`index.html`来统计本次执行的状况。
我们使用`Redis`缓存时一共耗时`23秒`，下面我们把`@Cacheable(cacheNames = "user.service.all")`注解注释掉，再来执行一遍性能测试方法。

我们在运行测试的时候可以看到控制台的查询`SQL`在不停的输出，这也证明了我们的数据是直接从数据库内获取的，测试结果如下图所示：
![数据库10万性能测试](/images/post/redis-springboot2-starter-2.png)
从上图内可以看到一共耗时：`43秒`，效果已经很明显了，当然我这是本机模拟测试，如果是读取正在大并发高IO读取的服务器上时差距会更大。

# 总结
本章主要讲解了`SpringBoot2.0`版本如何快速的集成`Redis`。
```
第一步：添加spring-boot-starter-data-redis依赖
第二步：配置@EnableCaching开启缓存
第三步：在application.yml内配置Redis相关的信息
第四步：配置@Cacheable注解完成数据缓存
```
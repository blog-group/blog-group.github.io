---
id: quartz-springboot2-starter
title: Quartz在SpringBoot2.x内的自动化配置
article_type: 原创
article_author: 于起宇
enable_comment: true
news: true
tags: [ApiBoot,Quartz]
categories: [SpringBoot]
date: 2019-09-29 17:28:40
keywords: quartz,springboot,恒宇少年
description: 'Quartz在SpringBoot2.x内的自动化配置'
---
在新版本的`SpringBoot2.0`发布后，急迫尝鲜的我将相关的项目已经更换为最新版本，在`SpringBoot`源码`GitHub`看到更新日志，表明了针对`Quartz`新版本进行了  `AutoConfiguration`自动化配置，省去了很多繁琐的配置。
<!--more-->
#### 官网更新日志
> Auto-configuration support is now include for the [Quartz Scheduler](http://www.quartz-scheduler.org/). We’ve also added a new `spring-boot-starter-quartz` starter POM.
You can use in-memory `JobStores`, or a full JDBC-based store. All `JobDetail`, `Calendar` and `Trigger` beans from your Spring application context will be automatically registered with the `Scheduler`.
For more details read the new ["Quartz Scheduler" section](http://docs.spring.io/spring-boot/docs/2.0.x-SNAPSHOT/reference/htmlsingle/#boot-features-quartz) of the reference documentation.

`SpringBoot2.0`版本集成了`Quartz2.3.0`官网最新版本。

# 本章目标
使用`SpringBoot2.0`新特性完成`Quartz`自动化配置。

# 构建项目
在前面章节[第四十章：基于SpringBoot & Quartz完成定时任务分布式多节点负载持久化](https://www.jianshu.com/p/49133c107143)内我们已经通过添加配置的方式完成集成，为了本章的方便直接复制之前的项目，在基础上进行修改。
打开`pom.xml`配置文件，`SpringBoot`为我们提供了对应的依赖，我们将之前的`quartz`相关依赖删除，替换为`spring-boot-starter-quartz`，如下所示：
```xml
<!--quartz相关依赖-->
<dependency>
	<groupId>org.quartz-scheduler</groupId>
	<artifactId>quartz</artifactId>
	<version>${quartz.version}</version>
</dependency>
<dependency>
	<groupId>org.quartz-scheduler</groupId>
	<artifactId>quartz-jobs</artifactId>
	<version>${quartz.version}</version>
</dependency>
>>>>替换为：>>>>
<!--quartz依赖-->
<dependency>
	<groupId>org.springframework.boot</groupId>
	<artifactId>spring-boot-starter-quartz</artifactId>
</dependency>
......
```
#### 删除QuartzConfiguration配置类
在之前章节我们使用`QuartzConfiguration`配置类来完成了`Quartz`需要的一系列配置，如：`JobFactory`、`SchedulerFactoryBean`等，在我们添加`spring-boot-starter-quartz`依赖后就不需要主动声明工厂类，因为`spring-boot-starter-quartz`已经为我们自动化配置好了。

#### 自动化配置源码
我们找到`Idea`的`External Libraries`并且展开`spring-boot-autoconfigure-2.0.0.RELEASE.jar`，找到`org.springframework.boot.autoconfigure.quartz`，该目录就是`SpringBoot`为我们提供的`Quartz`自动化配置源码实现，在该目录下有如下所示几个类：
- `AutowireCapableBeanJobFactory`
该类替代了我们之前在`QuartzConfiguration`配置类的`AutowiringSpringBeanJobFactory`内部类实现，主要作用是我们自定义的`QuartzJobBean`子类被`Spring IOC`进行托管，可以在定时任务类内使用注入任意被`Spring IOC`托管的类。
- `JobStoreType`
该类是一个枚举类型，定义了对应`application.yml`、`application.properties`文件内`spring.quartz.job-store-type`配置，其目的是配置`quartz`任务的数据存储方式，分别为：MEMORY（内存方式：`默认`）、JDBC（数据库方式）。
- `QuartzAutoConfiguration`
该类是自动配置的主类，内部配置了`SchedulerFactoryBean`以及`JdbcStoreTypeConfiguration`，使用`QuartzProperties`作为属性自动化配置条件。
- `QuartzDataSourceInitializer`
该类主要用于数据源初始化后的一些操作，根据不同平台类型的数据库进行选择不同的数据库脚本。
- `QuartzProperties`
该类对应了`spring.quartz`在`application.yml`、`application.properties`文件内开头的相关配置。
- `SchedulerFactoryBeanCustomizer` 
这是一个接口，我们实现该接口后并且将实现类使用`Spring IOC`托管，可以完成`SchedulerFactoryBean`的个性化设置，这里的设置完全可以对`SchedulerFactoryBean`做出全部的设置变更。

#### spring.quartz配置
看到`QuartzAutoConfiguration`类源码，我们知道了，想要使用自动化配置，需要满足`QuartzProperties`属性配置类的初始化，所以我们需要再`application.yml`、`application.properties`配置文件内添加对应的配置信息，如下所示：
```yaml
spring:
  quartz:
    #相关属性配置
    properties:
      org:
        quartz:
          scheduler:
            instanceName: clusteredScheduler
            instanceId: AUTO
          jobStore:
            class: org.quartz.impl.jdbcjobstore.JobStoreTX
            driverDelegateClass: org.quartz.impl.jdbcjobstore.StdJDBCDelegate
            tablePrefix: QRTZ_
            isClustered: true
            clusterCheckinInterval: 10000
            useProperties: false
          threadPool:
            class: org.quartz.simpl.SimpleThreadPool
            threadCount: 10
            threadPriority: 5
            threadsInheritContextClassLoaderOfInitializingThread: true
    #数据库方式
    job-store-type: jdbc
    #初始化表结构
    #jdbc:
      #initialize-schema: never
```
- `spring.quartz.properties`
该配置其实代替了之前的`quartz.properties`，我们把之前`quartz.properties`配置文件内的所有配置转换成`YAML`风格，对应的添加在该配置下即可，在`QuartzAutoConfiguration`类内，会自动调用`SchedulerFactoryBean`的`setQuartzProperties`方法，把`spring.quartz.properties`内的所有配置进行设置。
```java
@Bean
@ConditionalOnMissingBean
public SchedulerFactoryBean quartzScheduler() {
        SchedulerFactoryBean schedulerFactoryBean = new SchedulerFactoryBean();
        schedulerFactoryBean.setJobFactory(new AutowireCapableBeanJobFactory(this.applicationContext.getAutowireCapableBeanFactory()));
        // 如果配置了spring.quartz.properties
        if (!this.properties.getProperties().isEmpty()) {
        //  将所有properties设置到QuartzProperties
            schedulerFactoryBean.setQuartzProperties(this.asProperties(this.properties.getProperties()));
        }
......省略部分代码
```
- `spring.quartz.job-store-type`
设置`quartz`任务的数据持久化方式，默认是内存方式，我们这里沿用之前的方式，配置`JDBC`以使用数据库方式持久化任务。
- `spring.quartz.jdbc.initialize-schema`
> 该配置目前版本没有生效，根据官网文档查看，其目的是自动将`quartz`需要的数据表通过配置方式进行初始化。

# 测试
1. 启动项目
2. 打开浏览器访问`http://localhost:8083/good/save?name=abcd&unit=斤&price=12.5`进行添加定时任务
3. 查看控制台输出
```bash
 22:55:18.812  INFO 17161 --- [           main] c.hengyu.chapter39.Chapter47Application  : 【【【【【【定时任务分布式节点 - quartz-cluster-node-second 已启动】】】】】】
2018-03-06 22:55:20.772  INFO 17161 --- [uartzScheduler]] o.s.s.quartz.SchedulerFactoryBean        : Starting Quartz Scheduler now, after delay of 2 seconds
2018-03-06 22:55:20.793  INFO 17161 --- [uartzScheduler]] org.quartz.core.QuartzScheduler          : Scheduler quartzScheduler_$_yuqiyudeMacBook-Pro.local1520348117910 started.
2018-03-06 22:56:20.103  INFO 17161 --- [nio-8083-exec-1] o.a.c.c.C.[Tomcat].[localhost].[/]       : Initializing Spring FrameworkServlet 'dispatcherServlet'
2018-03-06 22:56:20.103  INFO 17161 --- [nio-8083-exec-1] o.s.web.servlet.DispatcherServlet        : FrameworkServlet 'dispatcherServlet': initialization started
2018-03-06 22:56:20.121  INFO 17161 --- [nio-8083-exec-1] o.s.web.servlet.DispatcherServlet        : FrameworkServlet 'dispatcherServlet': initialization completed in 18 ms
Hibernate: select next_val as id_val from hibernate_sequence for update
Hibernate: update hibernate_sequence set next_val= ? where next_val=?
Hibernate: insert into basic_good_info (bgi_name, bgi_price, bgi_unit, bgi_id) values (?, ?, ?, ?)
2018-03-06 22:56:20.268 TRACE 17161 --- [nio-8083-exec-1] o.h.type.descriptor.sql.BasicBinder      : binding parameter [1] as [VARCHAR] - [abcd]
2018-03-06 22:56:20.269 TRACE 17161 --- [nio-8083-exec-1] o.h.type.descriptor.sql.BasicBinder      : binding parameter [2] as [NUMERIC] - [12.5]
2018-03-06 22:56:20.269 TRACE 17161 --- [nio-8083-exec-1] o.h.type.descriptor.sql.BasicBinder      : binding parameter [3] as [VARCHAR] - [斤]
2018-03-06 22:56:20.269 TRACE 17161 --- [nio-8083-exec-1] o.h.type.descriptor.sql.BasicBinder      : binding parameter [4] as [BIGINT] - [1]
2018-03-06 22:56:47.253  INFO 17161 --- [eduler_Worker-1] c.h.c.timers.GoodStockCheckTimer         : 分布式节点quartz-cluster-node-second，执行库存检查定时任务，执行时间：Tue Mar 06 22:56:47 CST 2018
2018-03-06 22:57:00.012  INFO 17161 --- [eduler_Worker-2] c.h.c.timers.GoodStockCheckTimer         : 分布式节点quartz-cluster-node-second，执行库存检查定时任务，执行时间：Tue Mar 06 22:57:00 CST 2018
2018-03-06 22:57:20.207  INFO 17161 --- [eduler_Worker-3] c.hengyu.chapter39.timers.GoodAddTimer   : 分布式节点quartz-cluster-node-second，商品添加完成后执行任务，任务时间：Tue Mar 06 22:57:20 CST 2018
2018-03-06 22:57:30.013  INFO 17161 --- [eduler_Worker-4] c.h.c.timers.GoodStockCheckTimer         : 分布式节点quartz-cluster-node-second，执行库存检查定时任务，执行时间：Tue Mar 06 22:57:30 CST 2018
2018-03-06 22:58:00.014  INFO 17161 --- [eduler_Worker-5] c.h.c.timers.GoodStockCheckTimer         : 分布式节点quartz-cluster-node-second，执行库存检查定时任务，执行时间：Tue Mar 06 22:58:00 CST 2018
```
根据控制台内容，可以看到我们的定时任务已经正常的开始执行，当然我们如果打开`多个节点`同样可以实现`任务自动漂移`的效果。
# 总结
综上所述我们已经完成了`SpringBoot2.0`集成`Quartz`，我们只需要添加依赖、添加配置即可，别的不需要做任何代码编写。

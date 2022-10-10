---
id: apiboot-quartz-job-types
title: 分布式调度框架Quartz衍生出的三种任务类型，你用过几个？
sort_title: Quartz衍生出的三种任务类型，你用过几个？
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: false
news: true
disable_toc: false
customize: false
tags: [ApiBoot,Quartz]
categories: [ApiBoot]
keywords: quartz,cron,apiboot
description: '分布式调度框架Quartz衍生出的三种任务类型，你用过几个？'
date: 2019-12-24 09:33:00
article_url:
---

## 前言

`Quartz`内部没有明确的任务类型的概念，在`ApiBoot`中对其进行封装后才确切的定义了这个概念，可以根据业务场景按需选择适合的任务类型来构建执行的任务。

<!--more-->

## 系列文章

`ApiBoot Quartz`是以系列文章的形式更新，了解更多使用方法请访问如下链接：

- [这种方式整合Quartz你见过吗？](https://blog.yuqiyu.com/apiboot-quartz-integrated-away.html)

`ApiBoot`内其他组件系列使用文章请访问：[ApiBoot开源框架各个组件的系列使用文章汇总](https://blog.yuqiyu.com/apiboot-all-articles.html)

## 衍生的任务类型

`ApiBoot`对`Quartz`集成封装后，提供了如下三种的任务类型：

- **OnceJob**：一次性任务，仅执行一次
- **CronJob**：使用Cron表达式定义任务周期
- **LoopJob**：指定循环次数的任务

> 注意事项：任务类型是任务的执行方式类型，并不是创建任务的类型，创建任务都是通过继承`QuartzJobBean`来完成，同一个任务可以使用不同的类型执行。

## 演示项目

我们使用`Idea`创建一个`SpringBoot`项目，用于我们本章的演示项目，创建项目后添加`ApiBoot Quartz`相关的依赖到`pom.xml`文件内，如下所示：

```xml
<dependencies>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
  </dependency>
  <!--ApiBoot Quartz-->
  <dependency>
    <groupId>org.minbox.framework</groupId>
    <artifactId>api-boot-starter-quartz</artifactId>
  </dependency>
</dependencies>
<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>org.minbox.framework</groupId>
      <artifactId>api-boot-dependencies</artifactId>
      <version>2.2.1.RELEASE</version>
      <type>pom</type>
      <scope>import</scope>
    </dependency>
  </dependencies>
</dependencyManagement>
```



### 示例任务

我们来创建一个本章演示所需要的任务类，如下所示：

```java
/**
 * 示例任务
 *
 * @author 恒宇少年
 */
public class DemoJob extends QuartzJobBean {
    /**
     * logger instance
     */
    static Logger logger = LoggerFactory.getLogger(DemoJob.class);

    @Override
    protected void executeInternal(JobExecutionContext context) throws JobExecutionException {
        logger.info("这是一个示例任务，执行时间：{}", System.currentTimeMillis());
    }
}
```

当任务执行时就会在控制台输出任务执行的时间，继承自`Spring`提供的封装任务类`QuartzJobBean`，会自动扫描到`DemoJob`并通过反射创建实例后放入`Ioc`容器，具体的流程可以访问 [这种方式整合Quartz你见过吗？](https://blog.yuqiyu.com/apiboot-quartz-integrated-away.html) 了解详情。

### 一次性任务

我们使用`Once`任务类型来执行上面创建的`DemoJob`示例任务，先上代码，如下所示：

```java
/**
  * ApiBoot Quartz内置接口
  *
  * @see org.minbox.framework.api.boot.plugin.quartz.support.ApiBootQuartzServiceDefaultSupport
  */
@Autowired
private ApiBootQuartzService quartzService;

// 创建Once任务
quartzService.newJob(ApiBootOnceJobWrapper.Context().jobClass(DemoJob.class).wrapper());
```

我们只需要一行代码就可以来定义一个新的任务，在代码中出现了一个新面孔 [ApiBootOnceJobWrapper](https://gitee.com/minbox-projects/api-boot/blob/master/api-boot-project/api-boot-plugins/api-boot-plugin-quartz/src/main/java/org/minbox/framework/api/boot/plugin/quartz/wrapper/support/ApiBootOnceJobWrapper.java)。

`ApiBootOnceJobWrapper`主要工作是来封装Once类型任务所需要的配置字段，内部通过`Lombok`提供的`@Builder`注解来实现，`Once`任务可配置的内容如下所示：

| 方法                                               | 默认值         | 描述                                |
| -------------------------------------------------- | -------------- | ----------------------------------- |
| .jobClass(Class<? extends QuartzJobBean> jobClass) | -              | 配置所执行的QuartzJobBean实现类类型 |
| .jobKey(String jobKey)                             | 随机UUID字符串 | 任务唯一key                         |
| .startAtTime(Date startAtTime)                     | 当前时间       | 任务开始执行时间                    |
| .param(ApiBootJobParamWrapper param)               | -              | 任务执行时的参数列表封装对象        |



### Cron表达式任务

`Cron`表达式来创建任务是比较灵活的，也是比较常用的方式，使用`ApiBoot Quartz`同样仅仅需要一行代码就可以实现，下面我们来定义每间隔一秒执行一次`DemoJob`内的任务逻辑，如下所示：

```java
/**
  * ApiBoot Quartz内置接口
  *
  * @see org.minbox.framework.api.boot.plugin.quartz.support.ApiBootQuartzServiceDefaultSupport
  */
@Autowired
private ApiBootQuartzService quartzService;
// 创建Cron任务
quartzService.newJob(ApiBootCronJobWrapper.Context().jobClass(DemoJob.class).cron("0/1 * * * * ?").wrapper());
```

[ApiBootCronJobWrapper](https://gitee.com/minbox-projects/api-boot/blob/master/api-boot-project/api-boot-plugins/api-boot-plugin-quartz/src/main/java/org/minbox/framework/api/boot/plugin/quartz/wrapper/support/ApiBootCronJobWrapper.java) 所做的工作与`ApiBootOnceJobWrapper`其实是一样的，都是用来采集`Cron`类型的任务所需要的配置字段，内部同样是通过`Lombok`提供的`@Builder`注解实现，`Cron`类型任务可配置的内容如下所示：

| 方法                                               | 默认值         | 描述                                |
| -------------------------------------------------- | -------------- | ----------------------------------- |
| .jobClass(Class<? extends QuartzJobBean> jobClass) | -              | 配置所执行的QuartzJobBean实现类类型 |
| .jobKey(String jobKey)                             | 随机UUID字符串 | 任务唯一key                         |
| .cron(String cron)                                 | -              | 任务执行时间的Cron表达式            |
| .param(ApiBootJobParamWrapper param)               | -              | 任务执行时的参数列表封装对象        |



### Loop循环任务

`Loop`类型的任务在开发中也是比较常用的，根据指定的`循环次数`以及每一次执行的`间隔时间`运行定时任务逻辑，当获取到期望的结果后还可以将任务自身进行删除，先来看看一个简单例子：

```java
/**
  * ApiBoot Quartz内置接口
  *
  * @see org.minbox.framework.api.boot.plugin.quartz.support.ApiBootQuartzServiceDefaultSupport
  */
@Autowired
private ApiBootQuartzService quartzService;
// 创建Loop任务
quartzService.newJob(ApiBootLoopJobWrapper.Context().jobClass(DemoJob.class).loopIntervalTime(2000).repeatTimes(5).wrapper());
```

> 上面的定时任务会先执行1次后每`间隔2000毫秒`再执行**5次**，一共是执行**6次**，大家注意配置。

可以看到`Loop`类型的任务也提供了一个 [ApiBootLoopJobWrapper](https://gitee.com/minbox-projects/api-boot/blob/master/api-boot-project/api-boot-plugins/api-boot-plugin-quartz/src/main/java/org/minbox/framework/api/boot/plugin/quartz/wrapper/support/ApiBootLoopJobWrapper.java) 来封装任务执行所需要的配置字段，可配置的字段方法如下所示：

| 方法                                               | 默认值         | 描述                                |
| -------------------------------------------------- | -------------- | ----------------------------------- |
| .jobClass(Class<? extends QuartzJobBean> jobClass) | -              | 配置所执行的QuartzJobBean实现类类型 |
| .jobKey(String jobKey)                             | 随机UUID字符串 | 任务唯一key                         |
| .loopIntervalTime(int intervalTime)                | 1000           | 循环执行的间隔时间，单位：毫秒      |
| .repeatTimes(int times)                            | 0              | 循环执行次数                        |
| .startAtTime(Date startAtTime)                     | 当前时间       | 任务开始执行时间                    |
| .param(ApiBootJobParamWrapper param)               | -              | 任务执行时的参数列表封装对象        |

> 如果不设置`repeatTimes`仅执行一次，效果与`Once`一样。

## 运行测试

在运行项目之前先来修改项目的`XxxApplication`入口类，我们期望在项目启动完成后就执行任务，那么我们直接实现`CommandLineRunner`接口来完成这一需求，如下所示：

```java
/**
 * ApiBoot Quartz 三种任务类型示例
 */
@SpringBootApplication
public class ApibootQuartzJobTypesApplication implements CommandLineRunner {

    public static void main(String[] args) {
        SpringApplication.run(ApibootQuartzJobTypesApplication.class, args);
    }

    /**
     * ApiBoot Quartz内置接口
     *
     * @see org.minbox.framework.api.boot.plugin.quartz.support.ApiBootQuartzServiceDefaultSupport
     */
    @Autowired
    private ApiBootQuartzService quartzService;

    @Override
    public void run(String... args) throws Exception {
        // 一次性任务
        quartzService.newJob(ApiBootOnceJobWrapper.Context().jobClass(DemoJob.class).wrapper());

        // 循环执行任务，每隔2000毫秒执行一次，循环5次，一共执行6次
        quartzService.newJob(ApiBootLoopJobWrapper.Context().jobClass(DemoJob.class).loopIntervalTime(2000).repeatTimes(5).wrapper());

        // Cron表达式任务，间隔1秒执行一次
        quartzService.newJob(ApiBootCronJobWrapper.Context().jobClass(DemoJob.class).cron("0/1 * * * * ?").wrapper());
    }
}
```

启动项目后我们可以在控制台看到有任务执行时间输出，如下所示：

```bash
2019-12-24 14:56:05.046  INFO 3113 --- [eduler_Worker-1] o.minbox.chapter.apiboot.quartz.DemoJob  : 这是一个示例任务，执行时间：1577170565046
2019-12-24 14:56:05.046  INFO 3113 --- [eduler_Worker-2] o.minbox.chapter.apiboot.quartz.DemoJob  : 这是一个示例任务，执行时间：1577170565046
2019-12-24 14:56:05.047  INFO 3113 --- [eduler_Worker-3] o.minbox.chapter.apiboot.quartz.DemoJob  : 这是一个示例任务，执行时间：1577170565047
2019-12-24 14:56:06.005  INFO 3113 --- [eduler_Worker-4] o.minbox.chapter.apiboot.quartz.DemoJob  : 这是一个示例任务，执行时间：1577170566005
2019-12-24 14:56:07.002  INFO 3113 --- [eduler_Worker-5] o.minbox.chapter.apiboot.quartz.DemoJob  : 这是一个示例任务，执行时间：1577170567002
2019-12-24 14:56:07.042  INFO 3113 --- [eduler_Worker-6] o.minbox.chapter.apiboot.quartz.DemoJob  : 这是一个示例任务，执行时间：1577170567042
2019-12-24 14:56:08.003  INFO 3113 --- [eduler_Worker-7] o.minbox.chapter.apiboot.quartz.DemoJob  : 这是一个示例任务，执行时间：1577170568003
...
```

> 虽然任务已经执行了，但是由于是多种执行方式同时执行同一个任务，我们不好做出区分，针对这个问题可以使用`ApiBoot Quartz`提供的参数来解决。

## 敲黑板，划重点

`ApiBoot Quartz`所提供的功能已经可以满足日常开发所需要，而且比较灵活，可以通过`ApiBoot Quartz`提供的`Wrapper`封装类的方法进行自定义配置，**任务的执行是子线程异步操作，不需要考虑会影响访问响应的效率问题**。

## 代码示例
如果您喜欢本篇文章请为源码仓库点个`Star`，谢谢！！！
本篇文章示例源码可以通过以下途径获取，目录为`apiboot-quartz-job-types`：

- Gitee：[https://gitee.com/minbox-projects/api-boot-chapter](https://gitee.com/minbox-projects/api-boot-chapter)

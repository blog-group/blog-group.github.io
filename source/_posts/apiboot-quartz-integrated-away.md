---
id: apiboot-quartz-integrated-away
title: 这种方式整合Quartz你见过吗？
sort_title: 这种方式整合Quartz你见过吗？
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: true
news: true
disable_toc: false
customize: false
tags:
  - ApiBoot
categories:
  - ApiBoot
keywords: quartz,定时任务,apiboot
description: '这种方式整合Quartz你见过吗？'
date: 2019-12-23 14:34:10
article_url:
---

`Quartz`是一款优秀的任务调度框架，支持内存、JDBC的形式来存储未执行的任务列表，支持多个任务节点同时执行任务，支持任务漂移到不同的节点执行。

<!--more-->

## 前言

这么优秀的任务调度框架我想应该是很多开发者的首选解决方案，因此`ApiBoot`对它下手了，基于`SpringBoot`封装了名为`ApiBoot Quartz`的组件，同样是通过`application.yml`配置文件的形式就可以简单的实现初始化集成。

如果使用默认的配置，我们可以不编写一行集成相关的代码，`ApiBoot Quartz`还针对日常高频率使用的方法提供了一个接口，定义的方法如：创建任务、暂停任务、恢复任务、删除任务等等。

## 任务存储方式

`Quartz`自身提供了两种存储任务的方式：

- `Memory`：内存方式，将任务存储到内存中，当项目重启时就会丢失，不建议生产环境使用。
- `Jdbc`：数据库方式，将任务存储到`Quartz`提供的固定结构的表内，项目重启任务不会丢失，多种数据库的建表语句请访问：[Quartz Schemas](https://github.com/minbox-projects/api-boot/tree/master/api-boot-samples/api-boot-sample-quartz/src/main/resources/schemas) 按需选择。

`ApiBoot`将`Quartz`内提供的两种存储方式进行了封装，通过`api.boot.quartz.job-store-type`参数进行配置，该参数默认值为`memory`，所以你如果使用内存方式该参数不需要修改，更多配置请访问 [ApiBootQuartzProperties](https://gitee.com/minbox-projects/api-boot/blob/master/api-boot-project/api-boot-autoconfigure/src/main/java/org/minbox/framework/api/boot/autoconfigure/quartz/ApiBootQuartzProperties.java) 查看。

## 任务类型

任务类型是`ApiBoot Quartz`的新概念，其实在`Quartz`中任务并没有类型区分，实现`org.quartz.Job`接口就可以创建一个任务。

不过`Spring`也是爱折腾，对其进行了封装提供了`QuartzJobBean`，它是一个抽象类，我们继承该类后也可以创建一个定时任务。

在`ApiBoot Quartz`中有三种任务类型，分别是：

- **OnceJob**：仅执行一次的任务类型
- **CronJob**：使用Cron表达式来定义任务的执行周期
- **LoopJob**：可指定循环次数的任务，根据指定循环的次数进行重复执行

## 内置方法

`ApiBoot`封装`Quartz`后所提供的方法都位于 [ApiBootQuartzService](https://gitee.com/minbox-projects/api-boot/blob/master/api-boot-project/api-boot-plugins/api-boot-plugin-quartz/src/main/java/org/minbox/framework/api/boot/plugin/quartz/ApiBootQuartzService.java) 接口中，而该接口有一个默认的实现类 [ApiBootQuartzServiceDefaultSupport](https://gitee.com/minbox-projects/api-boot/blob/master/api-boot-project/api-boot-plugins/api-boot-plugin-quartz/src/main/java/org/minbox/framework/api/boot/plugin/quartz/support/ApiBootQuartzServiceDefaultSupport.java) ，该实现类全部实现了接口定义方法，内部通过`org.quartz.Scheduler`来实现任务的基本操作。

**内置方法列表：**

| 方法                                                       | 描述                                                       |
| ---------------------------------------------------------- | ---------------------------------------------------------- |
| Scheduler getScheduler();                                  | 获取SpringIoc容器内的Scheduler实例                         |
| String newJob(ApiBootJobWrapper jobWrapper);               | 通过封装的对象创建一个新的任务，这是创建所有类型任务的入口 |
| void deleteJob(String jobKey);                             | 删除一个任务                                               |
| void deleteJobs(String... jobKeys);                        | 删除一系列任务                                             |
| void deleteJobs(Collection<String> jobKeys);               | 删除集合内的所有任务                                       |
| void pauseJob(String jobKey);                              | 暂停一个任务                                               |
| void pauseJobs(String... jobKeys);                         | 暂停传递的所有任务                                         |
| void pauseJobs(Collection<String> jobKeys);                | 暂停集合内的所有任务                                       |
| void resumeJob(String jobKey);                             | 恢复一个任务执行                                           |
| void resumeJobs(String... jobKeys);                        | 恢复数组内的所有任务执行                                   |
| void resumeJobs(Collection<String> jobKeys);               | 恢复集合内的所有任务执行                                   |
| void updateJobCron(String jobKey, String cron);            | 更新任务Cron表达式                                         |
| void updateJobStartTime(String jobKey, Date jobStartTime); | 更新任务开始时间                                           |
| void startAllJobs();                                       | 启动所有定时任务                                           |
| void shutdownAllJobs();                                    | 关闭所有定时任务                                           |



既然`ApiBoot`为我们提供了这么多内置的方法，我们接下来创建一个项目来感受一下。

## 示例项目

使用`Idea`创建一个`SpringBoot`项目，我们把本章所需要的依赖添加在`pom.xml`文件内，如下所示：

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
    <!--ApiBoot统一版本-->
    <dependency>
      <groupId>org.minbox.framework</groupId>
      <artifactId>api-boot-dependencies</artifactId>
      <version>2.2.1.RELEASE</version>
      <scope>import</scope>
      <type>pom</type>
    </dependency>
  </dependencies>
</dependencyManagement>
```

> 注意：`ApiBoot`的版本是根据`SpringBoot`的版本而定义的，详见 [ApiBoot 版本分支]([https://gitee.com/minbox-projects/api-boot#%E5%88%86%E6%94%AF](https://gitee.com/minbox-projects/api-boot#分支))

## 示例任务类

我们来创建一个名为`DemoJob`的任务调度示例类，如下所示：

```java
/**
 * 示例任务
 *
 * @author 恒宇少年
 */
public class DemoJob extends QuartzJobBean {
    @Override
    protected void executeInternal(JobExecutionContext jobExecutionContext) throws JobExecutionException {
        System.out.println("任务执行了..");
    }
}
```

## QuartzJobBean是什么？

`QuartzJobBean`是由`Spring`提供，实现`org.quartz.Job`接口，是对`Quartz`内置任务接口的实现并且封装。

## QuartzJobBean的优势

`Spring`所提供的`QuartzJobBean`具体有什么优势呢？

- **自动将实现类实例加入IOC**

  使用`QuartzJobBean`来创建自定义任务时，`Spring`会自动扫描项目内的实现类，将每一个实现类通过反射机制创建出实例并将实例写入到`IOC`容器内。

- **可在实现类内注入实例**

  直接使用`Quartz`时，如果自定义任务类实例不加入`IOC`容器，我们无法在自定义任务类注入**Service**，这一点了解`Spring`基础的同学应该都明白，我们无法在非被`IOC`托管的类内进行注入操作，而使用`QuartzJobBean`则不用考虑这一点。

## QuartzJobBean注册流程

使用`ApiBoot Quartz`后为什么不需要再手动添加注入把任务实现类加入到`IOC`容器？

任务类注册流程如下所示：

- **第一步：ApiBootQuartzAutoConfiguration#quartzScheduler()**

  `ApiBoot`在集成`Quartz`时提供了一个自动化配置类 [ApiBootQuartzAutoConfiguration](https://gitee.com/minbox-projects/api-boot/blob/master/api-boot-project/api-boot-autoconfigure/src/main/java/org/minbox/framework/api/boot/autoconfigure/quartz/ApiBootQuartzAutoConfiguration.java) ，在该类中通过`quartzScheduler()`方法来自动创建一个`SchedulerFactoryBean`实例

- **第二步：SchedulerFactoryBean#setJobFactory()**

  通过`SchedulerFactoryBean`内提供的`setJobFactory()`方法可以自定义设置具体使用`JobFactory`的实现类，而在`spring-context-support`依赖内已经提供了相关实现，名为 `SpringBeanJobFactory`。

- **第三步：SpringBeanJobFactory#createJobInstance()**

  在项目启动时会将扫描到的所有`QuartzJobBean`实现类通过`JobFactory#newJob`方法进行创建任务实例后将实例交付给`Quartz`框架进行准备后期的任务调度。

`SpringBeanJobFactory`类继承于`AdaptableJobFactory`类，而`AdaptableJobFactory`则是实现了`JobFactory`接口，这样的话如果我们将`SpringBeanJobFactory`设置给`SchedulerFactoryBean`项目启动时`Quartz`就会调用`SpringBeanJobFactory#createJobInstance()`方法来创建任务实例。

而在`createJobInstance()`方法内`Spring`则是将创建的任务实例存入了`IOC`容器内，这样一来我们的自定义任务内就可以进行注入其他Bean的操作了，该方法源码如下所示：

```java
/**
	* Create the job instance, populating it with property values taken
	* from the scheduler context, job data map and trigger data map.
	*/
@Override
protected Object createJobInstance(TriggerFiredBundle bundle) throws Exception {
  Object job = (this.applicationContext != null ?
                // 通过ApplicationContext创建任务实例，并添加到IOC
                this.applicationContext.getAutowireCapableBeanFactory().createBean(
                  bundle.getJobDetail().getJobClass(), AutowireCapableBeanFactory.AUTOWIRE_CONSTRUCTOR, false) :
                super.createJobInstance(bundle));

  if (isEligibleForPropertyPopulation(job)) {
    BeanWrapper bw = PropertyAccessorFactory.forBeanPropertyAccess(job);
    MutablePropertyValues pvs = new MutablePropertyValues();
    if (this.schedulerContext != null) {
      pvs.addPropertyValues(this.schedulerContext);
    }
    pvs.addPropertyValues(bundle.getJobDetail().getJobDataMap());
    pvs.addPropertyValues(bundle.getTrigger().getJobDataMap());
    if (this.ignoredUnknownProperties != null) {
      for (String propName : this.ignoredUnknownProperties) {
        if (pvs.contains(propName) && !bw.isWritableProperty(propName)) {
          pvs.removePropertyValue(propName);
        }
      }
      bw.setPropertyValues(pvs);
    }
    else {
      bw.setPropertyValues(pvs, true);
    }
  }

  return job;
}
```

大致的`QuartzJobBean`实现类注册流程就是这个样子的，下面让我们来见识下是不是真的有那么简单就可以创建并执行一个任务。

## 运行测试

为了演示方便，我们修改`XxxApplication`入口类，让项目启动后自动执行`DemoJob`任务，如下所示：

```java
@SpringBootApplication
public class ApibootQuartzIntegratedAwayApplication implements CommandLineRunner {

  public static void main(String[] args) {
    SpringApplication.run(ApibootQuartzIntegratedAwayApplication.class, args);
  }

  /**
    * ApiBoot Quartz内置方法接口
    * {@link org.minbox.framework.api.boot.plugin.quartz.support.ApiBootQuartzServiceDefaultSupport}
    */
  @Autowired
  private ApiBootQuartzService quartzService;

  @Override
  public void run(String... args) throws Exception {
    quartzService.newJob(ApiBootOnceJobWrapper.Context()
                         .jobClass(DemoJob.class)
                         .wrapper());
  }
}
```

> `CommandLineRunner`是由`SpringBoot`提供用于执行项目启动后的逻辑。

启动项目后控制台输出内容如下所示：

```
......
任务执行了..
```

心细的同学应该看到了我们使用了`ApiBootOnceJobWeapper`这个封装类来创建的任务对象，我们下一章就来讲下这个封装类到底可以干什么？

## 敲黑板，划重点

`Quartz`是一个优秀的分布式任务调度框架，`ApiBoot`封装了它，使它插上了翅膀，让我们明白了简单的另一层定义。

## 代码示例
如果您喜欢本篇文章请为源码仓库点个`Star`，谢谢！！！
本篇文章示例源码可以通过以下途径获取，目录为`apiboot-quartz-integrated-away`：

- Gitee：[https://gitee.com/minbox-projects/api-boot-chapter](https://gitee.com/minbox-projects/api-boot-chapter)
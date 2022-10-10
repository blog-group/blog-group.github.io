---
id: quartz-cluster-node
title: Quartz分布式集群多节点实现任务漂移
article_type: 原创
article_author: 于起宇
enable_comment: true
news: true
tags: [ApiBoot,Quartz]
categories: [Quartz]
date: 2019-09-29 15:55:24
keywords: quartz,springboot,恒宇少年
description: 'Quartz分布式集群多节点实现任务漂移'
---
在上一章{% post_path quartz-signle-node Quartz分布式单节点持久化任务 %}中我们已经完成了任务的持久化，当我们创建一个任务时任务会被``quartz``定时任务框架自动持久化到数据库，我们采用的是``SpringBoot``项目托管的``dataSource``来完成的数据源提供，当然也可以使用``quartz``内部配置数据源方式，我们的标题既然是提到了定时任务的分布式多节点，那么怎么才算是多节点呢？当有节点故障或者手动停止运行后是否可以自动漂移任务到可用的分布式节点呢？
<!--more-->
# 本章目标
>1. 完成定时任务分布式多节点配置，当单个节点关闭时其他节点自动接管定时任务。
>2. 创建任务时传递自定义参数，方便任务处理后续业务逻辑。

# 构建项目
> 注意：我们本章项目需要结合上一章共同完成，有一点要注意的是任务在持久化到数据库内时会保存任务的全路径，如：``com.hengyu.chapter39.timers.GoodStockCheckTimer`` ，``quartz``在运行任务时会根据任务全路径去执行，如果不一致则会提示找不到指定类，我们本章在创建项目时``package``需要跟上一章完全一致。

我们这里就不去直接创建新项目了，直接复制上一章项目的源码为新的项目命名为``Chapter40``

### 配置分布式

在上一章配置文件``quartz.properties``中我们其实已经为分布式做好了相关配置，下面我们就来看一下分布式相关的配置。
分布式相关配置：

``1. org.quartz.scheduler.instanceId`` ： 定时任务的实例编号，如果手动指定需要保证每个节点的唯一性，因为``quartz``不允许出现两个相同``instanceId``的节点，我们这里指定为``Auto``就可以了，我们把生成编号的任务交给``quartz``。

``2. org.quartz.jobStore.isClustered``： 这个属性才是真正的开启了定时任务的分布式配置，当我们配置为``true``时``quartz``框架就会调用``ClusterManager``来初始化分布式节点。

``3. org.quartz.jobStore.clusterCheckinInterval``：配置了分布式节点的检查时间间隔，单位：毫秒。
下面是``quartz.properties``配置文件配置信息：
```properties
#调度器实例名称
org.quartz.scheduler.instanceName = quartzScheduler

#调度器实例编号自动生成
org.quartz.scheduler.instanceId = AUTO

#持久化方式配置
org.quartz.jobStore.class = org.quartz.impl.jdbcjobstore.JobStoreTX

#持久化方式配置数据驱动，MySQL数据库
org.quartz.jobStore.driverDelegateClass = org.quartz.impl.jdbcjobstore.StdJDBCDelegate

#quartz相关数据表前缀名
org.quartz.jobStore.tablePrefix = QRTZ_

#开启分布式部署
org.quartz.jobStore.isClustered = true
#配置是否使用
org.quartz.jobStore.useProperties = false

#分布式节点有效性检查时间间隔，单位：毫秒
org.quartz.jobStore.clusterCheckinInterval = 10000

#线程池实现类
org.quartz.threadPool.class = org.quartz.simpl.SimpleThreadPool

#执行最大并发线程数量
org.quartz.threadPool.threadCount = 10

#线程优先级
org.quartz.threadPool.threadPriority = 5

#配置为守护线程，设置后任务将不会执行
#org.quartz.threadPool.makeThreadsDaemons=true

#配置是否启动自动加载数据库内的定时任务，默认true
org.quartz.threadPool.threadsInheritContextClassLoaderOfInitializingThread = true

```
当我们启动任务节点时，会根据``org.quartz.threadPool.threadsInheritContextClassLoaderOfInitializingThread``属性配置进行是否自动加载任务，默认``true``自动加载数据库内的任务到节点。

### 测试分布式

上一章项目节点名称：``quartz-cluster-node-first``
本章项目节点名称：``quartz-cluster-node-second``

由于我们``quartz-cluster-node-first``的商品库存检查定时任务是每隔30秒执行一次，所以任务除非手动清除否则是不会被清空的，在运行项目测试之前需要将``application.yml``配置文件的端口号、项目名称修改下，保证``quartz-cluster-node-second``与``quartz-cluster-node-first``端口号不一致，可以同时运行，修改后为：
```yaml
spring:
    application:
        name: quzrtz-cluster-node-second
server:
  port: 8082
```
然后修改相应控制台输出，为了能够区分任务执行者是具体的节点。

```
Chapter40Application启动类修改日志输出：
logger.info("【【【【【【定时任务分布式节点 - quartz-cluster-node-second 已启动】】】】】】");

GoodAddTimer商品添加任务类修改日志输出：
logger.info("分布式节点quartz-cluster-node-second，商品添加完成后执行任务，任务时间：{}",new Date());

GoodStockCheckTimer商品库存检查任务类修改日志输出：
logger.info("分布式节点quartz-cluster-node-second，执行库存检查定时任务，执行时间：{}",new Date());
```
下面我们启动本章项目，查看控制台输出内容，如下所示：
```
2017-11-12 10:28:39.969  INFO 11048 --- [           main] c.hengyu.chapter39.Chapter40Application  : 【【【【【【定时任务分布式节点 - quartz-cluster-node-second 已启动】】】】】】
2017-11-12 10:28:41.930  INFO 11048 --- [lerFactoryBean]] o.s.s.quartz.SchedulerFactoryBean        : Starting Quartz Scheduler now, after delay of 2 seconds
2017-11-12 10:28:41.959  INFO 11048 --- [lerFactoryBean]] org.quartz.core.QuartzScheduler          : Scheduler schedulerFactoryBean_$_yuqiyu1510453719308 started.
2017-11-12 10:28:51.963  INFO 11048 --- [_ClusterManager] o.s.s.quartz.LocalDataSourceJobStore     : ClusterManager: detected 1 failed or restarted instances.
2017-11-12 10:28:51.963  INFO 11048 --- [_ClusterManager] o.s.s.quartz.LocalDataSourceJobStore     : ClusterManager: Scanning for instance "yuqiyu1510450938654"'s failed in-progress jobs.
2017-11-12 10:28:51.967  INFO 11048 --- [_ClusterManager] o.s.s.quartz.LocalDataSourceJobStore     : ClusterManager: ......Freed 1 acquired trigger(s).
2017-11-12 10:29:00.024  INFO 11048 --- [ryBean_Worker-1] c.h.c.timers.GoodStockCheckTimer         : 分布式节点quartz-cluster-node-second，执行库存检查定时任务，执行时间：Sun Nov 12 10:29:00 CST 2017
```
可以看到项目启动完成后自动分配的``instanceId``为``yuqiyu1510450938654``，生成的规则是当前用户的名称+时间戳。然后``ClusterManager``分布式管理者自动介入进行扫描是否存在匹配的触发器任务，如果存在则会自动执行任务逻辑，而商品库存检查定时任务确实由``quartz-cluster-node-second``进行输出的。

### 测试任务自动漂移
下面我们也需要把``quartz-cluster-node-first``的输出进行修改，如下所示：
```
Chapter39Application启动类修改日志输出：
logger.info("【【【【【【定时任务分布式节点 - quartz-cluster-node-first 已启动】】】】】】");

GoodAddTimer商品添加任务类修改日志输出：
logger.info("分布式节点quartz-cluster-node-first，商品添加完成后执行任务，任务时间：{}",new Date());

GoodStockCheckTimer商品库存检查任务类修改日志输出：
logger.info("分布式节点quartz-cluster-node-first，执行库存检查定时任务，执行时间：{}",new Date());
```
接下来我们启动``quartz-cluster-node-first``，并查看控制台的输出内容：
```
2017-11-12 10:34:09.750  INFO 192 --- [           main] c.hengyu.chapter39.Chapter39Application  : 【【【【【【定时任务分布式节点 - quartz-cluster-node-first 已启动】】】】】】
2017-11-12 10:34:11.690  INFO 192 --- [lerFactoryBean]] o.s.s.quartz.SchedulerFactoryBean        : Starting Quartz Scheduler now, after delay of 2 seconds
2017-11-12 10:34:11.714  INFO 192 --- [lerFactoryBean]] org.quartz.core.QuartzScheduler          : Scheduler schedulerFactoryBean_$_yuqiyu1510454049066 started.
```
项目启动完成后，定时节点并没有实例化``ClusterManager``来完成分布式节点的初始化，因为``quartz``检测到有其他的节点正在处理任务，这样也是保证了任务执行的唯一性。

#### 关闭quartz-cluster-node-second
我们关闭``quartz-cluster-node-second``运行的项目，预计的目的可以达到``quartz-cluster-node-first``会自动接管数据库内的任务，完成任务执行的自动漂移，我们来查看``quartz-cluster-node-first``的控制台输出内容：
```
2017-11-12 10:34:09.750  INFO 192 --- [           main] c.hengyu.chapter39.Chapter39Application  : 【【【【【【定时任务分布式节点 - quartz-cluster-node-first 已启动】】】】】】
2017-11-12 10:34:11.690  INFO 192 --- [lerFactoryBean]] o.s.s.quartz.SchedulerFactoryBean        : Starting Quartz Scheduler now, after delay of 2 seconds
2017-11-12 10:34:11.714  INFO 192 --- [lerFactoryBean]] org.quartz.core.QuartzScheduler          : Scheduler schedulerFactoryBean_$_yuqiyu1510454049066 started.
2017-11-12 10:41:11.793  INFO 192 --- [_ClusterManager] o.s.s.quartz.LocalDataSourceJobStore     : ClusterManager: detected 1 failed or restarted instances.
2017-11-12 10:41:11.793  INFO 192 --- [_ClusterManager] o.s.s.quartz.LocalDataSourceJobStore     : ClusterManager: Scanning for instance "yuqiyu1510453719308"'s failed in-progress jobs.
2017-11-12 10:41:11.797  INFO 192 --- [_ClusterManager] o.s.s.quartz.LocalDataSourceJobStore     : ClusterManager: ......Freed 1 acquired trigger(s).
2017-11-12 10:41:11.834  INFO 192 --- [ryBean_Worker-1] c.h.c.timers.GoodStockCheckTimer         : 分布式节点quartz-cluster-node-first，执行库存检查定时任务，执行时间：Sun Nov 12 10:41:11 CST 2017
```
控制台已经输出了持久的定时任务，输出节点是``quartz-cluster-node-first``，跟我们预计的一样，节点``quartz-cluster-node-first``完成了自动接管``quartz-cluster-node-second``的工作，而这个过程肯定有一段时间间隔，而这个间隔可以修改``quartz.properties``配置文件内的属性``org.quartz.jobStore.clusterCheckinInterval``进行调节。

#### 关闭quartz-cluster-node-first
我们同样可以测试启动任务节点``quartz-cluster-node-second``后，再关闭``quartz-cluster-node-first``任务节点，查看``quartz-cluster-node-second``控制台的输出内容：
```
2017-11-12 10:53:31.010  INFO 3268 --- [           main] c.hengyu.chapter39.Chapter40Application  : 【【【【【【定时任务分布式节点 - quartz-cluster-node-second 已启动】】】】】】
2017-11-12 10:53:32.967  INFO 3268 --- [lerFactoryBean]] o.s.s.quartz.SchedulerFactoryBean        : Starting Quartz Scheduler now, after delay of 2 seconds
2017-11-12 10:53:32.992  INFO 3268 --- [lerFactoryBean]] org.quartz.core.QuartzScheduler          : Scheduler schedulerFactoryBean_$_yuqiyu1510455210493 started.
2017-11-12 10:53:52.999  INFO 3268 --- [_ClusterManager] o.s.s.quartz.LocalDataSourceJobStore     : ClusterManager: detected 1 failed or restarted instances.
2017-11-12 10:53:52.999  INFO 3268 --- [_ClusterManager] o.s.s.quartz.LocalDataSourceJobStore     : ClusterManager: Scanning for instance "yuqiyu1510454049066"'s failed in-progress jobs.
2017-11-12 10:53:53.003  INFO 3268 --- [_ClusterManager] o.s.s.quartz.LocalDataSourceJobStore     : ClusterManager: ......Freed 1 acquired trigger(s).
2017-11-12 10:54:00.020  INFO 3268 --- [ryBean_Worker-1] c.h.c.timers.GoodStockCheckTimer         : 分布式节点quartz-cluster-node-second，执行库存检查定时任务，执行时间：Sun Nov 12 10:54:00 CST 2017
```
得到的结果是同样可以完成任务的自动漂移。
>如果两个节点同时启动，哪个节点先把节点信息注册到数据库就获得了优先执行权。

### 传递参数到任务

我们平时在使用任务时，如果是针对性比较强的业务逻辑，肯定需要特定的参数来完成业务逻辑的实现。

下面我们来模拟商品秒杀的场景，当我们添加商品后自动添加一个商品提前五分钟的秒杀提醒，为关注该商品的用户发送提醒消息。
我们在节点``quartz-cluster-node-first``中添加秒杀提醒任务，如下所示：
```java
package com.hengyu.chapter39.timers;

import org.quartz.JobDataMap;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.quartz.QuartzJobBean;

/**
 * 商品秒杀提醒定时器
 * 为关注该秒杀商品的用户进行推送提醒
 * ========================
 *
 * @author 恒宇少年
 * Created with IntelliJ IDEA.
 * Date：2017/11/12
 * Time：9:23
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
public class GoodSecKillRemindTimer
extends QuartzJobBean
{
    /**
     * logback
     */
    private Logger logger = LoggerFactory.getLogger(GoodSecKillRemindTimer.class);

    /**
     * 任务指定逻辑
     * @param jobExecutionContext
     * @throws JobExecutionException
     */
    @Override
    protected void executeInternal(JobExecutionContext jobExecutionContext) throws JobExecutionException {
        //获取任务详情内的数据集合
        JobDataMap dataMap = jobExecutionContext.getJobDetail().getJobDataMap();
        //获取商品编号
        Long goodId = dataMap.getLong("goodId");
        
        logger.info("分布式节点quartz-cluster-node-first，开始处理秒杀商品：{}，关注用户推送消息.",goodId);

        //.../
    }
}
```
在秒杀提醒任务逻辑中，我们通过获取``JobDetail``的``JobDataMap``集合来获取在创建任务的时候传递的参数集合，我们这里约定了``goodId``为商品的编号，在创建任务的时候传递到``JobDataMap``内，这样``quartz``在执行该任务的时候就会自动将参数传递到任务逻辑中，我们也就可以通过``JobDataMap``获取到对应的参数值。

#### 设置秒杀提醒任务

我们找到节点项目``quartz-cluster-node-first``中的``GoodInfoService``，编写方法``buildGoodSecKillRemindTimer``设置秒杀提醒任务，如下所示：
```java
/**
     * 构建商品秒杀提醒定时任务
     * 设置五分钟后执行
     * @throws Exception
     */
    public void buildGoodSecKillRemindTimer(Long goodId) throws Exception
    {
        //任务名称
        String name = UUID.randomUUID().toString();
        //任务所属分组
        String group = GoodSecKillRemindTimer.class.getName();
        //秒杀开始时间
        long startTime = System.currentTimeMillis() + 1000 * 5 * 60;
        JobDetail jobDetail = JobBuilder
                .newJob(GoodSecKillRemindTimer.class)
                .withIdentity(name,group)
                .build();

        //设置任务传递商品编号参数
        jobDetail.getJobDataMap().put("goodId",goodId);

        //创建任务触发器
        Trigger trigger = TriggerBuilder.newTrigger().withIdentity(name,group).startAt(new Date(startTime)).build();
        //将触发器与任务绑定到调度器内
        scheduler.scheduleJob(jobDetail,trigger);
    }
```
我们模拟秒杀提醒时间是添加商品后的5分钟，我们通过调用``jobDetail ``实例的``getJobDataMap``方法就可以获取该任务数据集合，直接调用``put``方法就可以进行设置指定key的值，该集合继承了``StringKeyDirtyFlagMap``并且实现了``Serializable``序列化，因为需要将数据序列化到数据库的``qrtz_job_details``表内。
修改保存商品方法，添加调用秒杀提醒任务：
```java
    /**
     * 保存商品基本信息
     * @param good 商品实例
     * @return
     */
    public Long saveGood(GoodInfoEntity good) throws Exception
    {
        goodInfoRepository.save(good);
        //构建创建商品定时任务
        buildCreateGoodTimer();
        //构建商品库存定时任务
        buildGoodStockTimer();
        //构建商品描述提醒定时任务
        buildGoodSecKillRemindTimer(good.getId());
        return good.getId();
    }
```
#### 添加测试商品
下面我们调用节点``quartz-cluster-node-first``的测试``Chapter39ApplicationTests.addGood``方法完成商品的添加，由于我们的``quartz-cluster-node-second``项目并没有停止，所以我们在``quartz-cluster-node-second``项目的控制台查看输出内容：
```
2017-11-12 11:45:00.008  INFO 11652 --- [ryBean_Worker-5] c.h.c.timers.GoodStockCheckTimer         : 分布式节点quartz-cluster-node-second，执行库存检查定时任务，执行时间：Sun Nov 12 11:45:00 CST 2017
2017-11-12 11:45:30.013  INFO 11652 --- [ryBean_Worker-6] c.h.c.timers.GoodStockCheckTimer         : 分布式节点quartz-cluster-node-second，执行库存检查定时任务，执行时间：Sun Nov 12 11:45:30 CST 2017
2017-11-12 11:45:48.230  INFO 11652 --- [ryBean_Worker-7] c.hengyu.chapter39.timers.GoodAddTimer   : 分布式节点quartz-cluster-node-second，商品添加完成后执行任务，任务时间：Sun Nov 12 11:45:48 CST 2017
2017-11-12 11:46:00.008  INFO 11652 --- [ryBean_Worker-8] c.h.c.timers.GoodStockCheckTimer         : 分布式节点quartz-cluster-node-second，执行库存检查定时任务，执行时间：Sun Nov 12 11:46:00 CST 2017
2017-11-12 11:46:30.016  INFO 11652 --- [ryBean_Worker-9] c.h.c.timers.GoodStockCheckTimer         : 分布式节点quartz-cluster-node-second，执行库存检查定时任务，执行时间：Sun Nov 12 11:46:30 CST 2017
2017-11-12 11:47:00.011  INFO 11652 --- [yBean_Worker-10] c.h.c.timers.GoodStockCheckTimer         : 分布式节点quartz-cluster-node-second，执行库存检查定时任务，执行时间：Sun Nov 12 11:47:00 CST 2017
2017-11-12 11:47:30.028  INFO 11652 --- [ryBean_Worker-1] c.h.c.timers.GoodStockCheckTimer         : 分布式节点quartz-cluster-node-second，执行库存检查定时任务，执行时间：Sun Nov 12 11:47:30 CST 2017
2017-11-12 11:48:00.014  INFO 11652 --- [ryBean_Worker-2] c.h.c.timers.GoodStockCheckTimer         : 分布式节点quartz-cluster-node-second，执行库存检查定时任务，执行时间：Sun Nov 12 11:48:00 CST 2017
2017-11-12 11:48:30.013  INFO 11652 --- [ryBean_Worker-3] c.h.c.timers.GoodStockCheckTimer         : 分布式节点quartz-cluster-node-second，执行库存检查定时任务，执行时间：Sun Nov 12 11:48:30 CST 2017
2017-11-12 11:49:00.010  INFO 11652 --- [ryBean_Worker-4] c.h.c.timers.GoodStockCheckTimer         : 分布式节点quartz-cluster-node-second，执行库存检查定时任务，执行时间：Sun Nov 12 11:49:00 CST 2017
2017-11-12 11:49:30.028  INFO 11652 --- [ryBean_Worker-5] c.h.c.timers.GoodStockCheckTimer         : 分布式节点quartz-cluster-node-second，执行库存检查定时任务，执行时间：Sun Nov 12 11:49:30 CST 2017
2017-11-12 11:49:48.290  INFO 11652 --- [ryBean_Worker-6] c.h.c.timers.GoodSecKillRemindTimer      : 分布式节点quartz-cluster-node-second，开始处理秒杀商品：15，关注用户推送消息.
2017-11-12 11:50:00.008  INFO 11652 --- [ryBean_Worker-7] c.h.c.timers.GoodStockCheckTimer         : 分布式节点quartz-cluster-node-second，执行库存检查定时任务，执行时间：Sun Nov 12 11:50:00 CST 2017
```
秒杀任务在添加完成商品后的五分钟开始执行的，而我们也正常的输出了传递过去的``goodId``商品编号的参数，而秒杀提醒任务执行一次后也被自动释放了。

# 总结
本章主要是结合上一章完成了分布式任务的讲解，完成了测试持久化的定时任务自动漂移，以及如何向定时任务传递参数。当然在实际的开发过程中，任务创建是需要进行封装的，目的也是为了减少一些冗余代码以及方面后期统一维护定时任务。
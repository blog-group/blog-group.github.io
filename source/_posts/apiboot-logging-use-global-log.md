---
id: apiboot-logging-use-global-log
title: ApiBoot接口服务框架的又一新特性GlobalLog全局日志的使用详解
sort_title: ApiBoot新特性GlobalLogging详解
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: true
news: true
disable_toc: false
customize: false
tags: [ApiBoot,日志组件]
categories: [ApiBoot]
keywords: apiboot,logging,global log
description: 'ApiBoot接口服务框架的又一新特性GlobalLog全局日志的使用详解'
date: 2019-12-17 10:12:47
article_url:
---

## 全局日志是一个什么概念呢？

其实理解起来比较简单，类似于我们平时一直在使用的`logback`、`log4j`这种的日志框架的其中一个功能部分，`minbox-logging`分布式日志框架目前独立于`api-boot-plugins`，已经加入了`minbox-projects`开源组织，之前博客有一系列的文章来讲解了`ApiBoot Logging`（内部是集成的`minbox-logging`）日志组件的使用以及极简的配置方式，可以访问[ApiBoot 组件系列文章使用汇总](https://blog.yuqiyu.com/apiboot-all-articles.html)了解日志组件的使用详情。

<!--more-->

<hr/>


## 什么是全局日志？

在之前`ApiBoot Logging`分布式日志组件可以实现`日志采集`、`日志上报`、`日志统一存储`、`集成Spring Security`、`集成Openfeign`等功能，随着`ApiBoot Logging 2.2.1.RELEASE`版本的发布引入了一个新的概念，那就是`GlobalLog`。

用过`ApiBoot Logging`日志组件的同学应该都有了解，它只会记录每一次发送`请求`相关的一些信息，如：请求参数、请求地址、请求头信息、响应内容等，并没有提供业务代码中的`debug`、`info`、`error`等级日志的采集方式，就不要提上报这种日志到`Logging Admin`了。

新版本的发布给我们带来了春天，`ApiBoot Logging`为了方便代码的调试，执行时业务数据的监控，支持了采集业务代码内的不同等级的日志，而且还支持采集`Exception`的堆栈信息，方便定位错误，及时纠正。

## 了解GlobalLogging接口

为了支持`业务全局日志`，新版本中引入了`GlobalLogging`接口，我们先来看看这个接口的源码，如下所示：

```java

/**
 * Global log collection interface
 * Provide debug, info, and error log collection
 *
 * @author 恒宇少年
 */
public interface GlobalLogging {
    /**
     * Collect Debug Level Logs
     *
     * @param msg log content
     */
    void debug(String msg);

    /**
     * Collect Debug Level Logs
     *
     * @param format    Unformatted log content
     * @param arguments List of parameters corresponding to log content
     */
    void debug(String format, Object... arguments);

    /**
     * Collect Info Level Logs
     *
     * @param msg log content
     */
    void info(String msg);

    /**
     * Collect Info Level Logs
     *
     * @param format    Unformatted log content
     * @param arguments List of parameters corresponding to log content
     */
    void info(String format, Object... arguments);

    /**
     * Collect Error Level Logs
     *
     * @param msg log content
     */
    void error(String msg);

    /**
     * Collect Error Level Logs
     *
     * @param msg       log content
     * @param throwable Exception object instance
     */
    void error(String msg, Throwable throwable);

    /**
     * Collect Error Level Logs
     *
     * @param format    Unformatted log content
     * @param arguments List of parameters corresponding to log content
     */
    void error(String format, Object... arguments);
}
```

在`GlobalLogging`接口内提供了三种类型的日志采集方法，分别是：`debug`、`info`、`error`，这个版本只是对日志的等级进行了划分，并没有添加限制或者过滤机制。

`GlobalLogging`当前版本有一个实现类`org.minbox.framework.logging.client.global.support.GlobalLoggingMemoryStorage`，该类实现了`GlobalLogging`内的全部方法，并将采集到的日志保存到了`GlobalLoggingThreadLocal`，方便统一上报到`Logging Admin`。

为了方便后期修改`Global Log`的存储方式，`ApiBoot Logging`提供了一个配置参数`api.boot.logging.global-logging-storage-away`，该配置的默认值为`memory`，对应`GlobalLoggingMemoryStorage`实现类。

## GlobalLogging自动化配置

`ApiBoot Logging`根据`api.boot.logging.global-logging-storage-away`配置参数，条件判断自动化配置了`GlobalLogging`接口的实现类，如下所示：

```java
package org.minbox.framework.api.boot.autoconfigure.logging;
import ...
/**
 * the "minbox-logging" global log storage configuration
 *
 * @author 恒宇少年
 */
@Configuration
@ConditionalOnClass(GlobalLogging.class)
public class ApiBootLoggingGlobalLogStorageAutoConfiguration {
    /**
     * Instance global log memory mode storage
     *
     * @return {@link GlobalLoggingMemoryStorage}
     */
    @Bean
    @ConditionalOnProperty(prefix = API_BOOT_LOGGING_PREFIX,
        name = "global-logging-storage-away", havingValue = "memory", matchIfMissing = true)
    public GlobalLogging globalLogging() {
        return new GlobalLoggingMemoryStorage();
    }
}
```

根据`globalLogging()`方法上的条件注入注解`@ConditionalOnProperty`配置内容可以了解到，当我们在`application.yml`配置文件内添加`api.boot.logging.global-logging-storage-away=memory`时或者`缺少该配置`时，该方法会被调用并且创建一个`GlobalLoggingMemoryStorage`对象实例，并将该实例对象写入到`IOC`容器内，这样我们在使用`GlobalLogging`实例时，只需要注入就可以了，如下所示：

```java
/**
  * {@link GlobalLogging}
  *
  * @see org.minbox.framework.logging.client.global.AbstractGlobalLogging
  * @see org.minbox.framework.logging.client.global.support.GlobalLoggingMemoryStorage
  */
@Autowired
private GlobalLogging logging;
```

## 使用GlobalLogging

采集的方式很简单，我们只需要注入`GlobalLogging`对象，使用该接口提供的方法即可，如下所示：

```java
/**
 * 测试用户控制器
 *
 * @author 恒宇少年
 */
@RestController
@RequestMapping(value = "/user")
public class UserController {
    /**
     * {@link GlobalLogging}
     *
     * @see org.minbox.framework.logging.client.global.AbstractGlobalLogging
     * @see org.minbox.framework.logging.client.global.support.GlobalLoggingMemoryStorage
     */
    @Autowired
    private GlobalLogging logging;

    /**
     * 测试获取用户名
     *
     * @return
     */
    @GetMapping(value = "/name")
    public String getUserName() {
        logging.debug("这是一条debug级别的日志");
        logging.info("这是一条info级别的日志");
        return "用户名：恒宇少年";
    }
}
```

当我们调用`GlobalLogging`提供的不同日志等级的方法时，会自动将日志相关信息写入到`GlobalLoggingThreadLocal`的集合内，等到上报请求日志时一并提交给`Logging Admin`，由`Logging Admin`进行保存。

## GlobalLogging表结构

`GlobalLogging`相关的全局日志采集到`Logging Admin`需要进行保存，所有对应添加了一个名为`logging_global_logs`信息表，结构如下所示：

```sql
CREATE TABLE `logging_global_logs` (
  `lgl_id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL COMMENT '日志主键',
  `lgl_request_log_id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL COMMENT '请求日志编号，关联logging_request_logs主键',
  `lgl_level` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '日志等级',
  `lgl_content` mediumtext COLLATE utf8mb4_general_ci COMMENT '日志内容',
  `lgl_caller_class` varchar(200) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '日志输出的类名',
  `lgl_caller_method` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '日志输出的方法名称',
  `lgl_caller_code_line_number` int(11) DEFAULT NULL COMMENT '日志输出的代码行号',
  `lgl_exception_stack` mediumtext COLLATE utf8mb4_general_ci COMMENT 'error等级的日志异常堆栈信息',
  `lgl_create_time` mediumtext COLLATE utf8mb4_general_ci COMMENT '日志发生时间',
  PRIMARY KEY (`lgl_id`),
  KEY `logging_global_logs_logging_request_logs_lrl_id_fk` (`lgl_request_log_id`),
  CONSTRAINT `logging_global_logs_logging_request_logs_lrl_id_fk` FOREIGN KEY (`lgl_request_log_id`) REFERENCES `logging_request_logs` (`lrl_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='全局日志信息表';
```



## 采集Exception堆栈信息

使用`GlobalLogging`可以采集遇到异常的详细堆栈信息，可以让我们直接定位到问题出现的位置，在第一时间解决出现的问题，具体使用如下所示：

```java
try {
  int a = 5 / 0;
} catch (Exception e) {
  logging.error(e.getMessage(), e);
}
```

## 运行测试

我们来运行本章的源码，看下日志采集的效果。

### 输出的采集日志

```json
{
	"endTime":1576561372604,
	"globalLogs":[{
		"callerClass":"org.minbox.chapter.user.service.UserController",
		"callerCodeLineNumber":33,
		"callerMethod":"getUserName",
		"content":"这是一条debug级别的日志，发生时间：{}",
		"createTime":1576561372585,
		"level":"debug"
	},{
		"callerClass":"org.minbox.chapter.user.service.UserController",
		"callerCodeLineNumber":34,
		"callerMethod":"getUserName",
		"content":"这是一条info级别的日志，发生时间：1576561372586",
		"createTime":1576561372586,
		"level":"info"
	},{
		"callerClass":"org.minbox.chapter.user.service.UserController",
		"callerCodeLineNumber":43,
		"callerMethod":"aa",
		"content":"出现了异常.",
		"createTime":1576561372586,
		"exceptionStack":"java.lang.ArithmeticException: / by zero\n\tat org.minbox.chapter.user.service.UserController.aa(UserController.java:41)\n\tat org.minbox.chapter.user.service.UserController.getUserName(UserController.java:35)\n\tat sun.reflect.NativeMethodAccessorImpl.invoke0(Native Method)\n\tat sun.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:62)\n\t....",
		"level":"error"
	}],
	"httpStatus":200,
	"requestBody":"",
	"requestHeaders":{
		"accept":"*/*",
		"host":"localhost:10000",
		"user-agent":"curl/7.64.1"
	},
	"requestIp":"0:0:0:0:0:0:0:1",
	"requestMethod":"GET",
	"requestParam":"{}",
	"requestUri":"/user/name",
	"responseBody":"用户名：恒宇少年",
	"responseHeaders":{},
	"serviceId":"user-service",
	"serviceIp":"127.0.0.1",
	"servicePort":"10000",
	"spanId":"41a0c852-812b-4a2e-aa4a-228b87ce52f6",
	"startTime":1576561372577,
	"timeConsuming":27,
	"traceId":"42ca9f5a-5977-49cf-909d-a23614a47a6b"
}
```

> 上面是控制台输出的一个请求日志的详细内容，其中`globalLogs`字段就是我们采集的全局日志列表。

### 存储的采集日志

我们来确认下采集日志上报到`Logging Admin`后是否保存到了`logging_global_logs`日志表内，如下所示：

```sql
mysql> select * from logging_global_logs order by lgl_create_time asc\G;
*************************** 1. row ***************************
                     lgl_id: 112e36ff-e781-4f11-8f21-2196823cde38
         lgl_request_log_id: f91382e2-2d79-499e-b1df-4757c1ffdbc5
                  lgl_level: info
                lgl_content: 这是一条info级别的日志，发生时间：1576561856333
           lgl_caller_class: org.minbox.chapter.user.service.UserController
          lgl_caller_method: getUserName
lgl_caller_code_line_number: 34
        lgl_exception_stack: NULL
            lgl_create_time: 1576561856333
*************************** 2. row ***************************
                     lgl_id: f1d172a6-5cce-4df0-bc29-fe27ac441089
         lgl_request_log_id: f91382e2-2d79-499e-b1df-4757c1ffdbc5
                  lgl_level: debug
                lgl_content: 这是一条debug级别的日志，发生时间：{}
           lgl_caller_class: org.minbox.chapter.user.service.UserController
          lgl_caller_method: getUserName
lgl_caller_code_line_number: 33
        lgl_exception_stack: NULL
            lgl_create_time: 1576561856333
*************************** 3. row ***************************
                     lgl_id: d95d850d-3bc9-4689-928a-32c6089ff7a2
         lgl_request_log_id: f91382e2-2d79-499e-b1df-4757c1ffdbc5
                  lgl_level: error
                lgl_content: 出现了异常.
           lgl_caller_class: org.minbox.chapter.user.service.UserController
          lgl_caller_method: getUserName
lgl_caller_code_line_number: 38
        lgl_exception_stack: java.lang.ArithmeticException: / by zero
        at org.minbox.chapter.user.service.UserController.getUserName(UserController.java:36)
        at sun.reflect.NativeMethodAccessorImpl.invoke0(Native Method)
        at sun.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:62)
						...
            lgl_create_time: 1576561856334
3 rows in set (0.01 sec)

```

> 这里异常的堆栈信息比较多，做出了省略。

## 敲黑板，划重点

本章把`GlobalLog`全局日志的概念进行了详细的描述，建议将一些重要逻辑判断性质的`GlobalLog`进行采集上报，防止`logging_global_logs`表内的数据量过大。

> 详细的使用方式请参考本章的源码。

## 代码示例
如果您喜欢本篇文章请为源码仓库点个`Star`，谢谢！！！
本篇文章示例源码可以通过以下途径获取，目录为`apiboot-logging-use-global-log`：

- Gitee：[https://gitee.com/minbox-projects/api-boot-chapter](https://gitee.com/minbox-projects/api-boot-chapter)
---
id: spring-boot-basic-use-commandlinerunner-or-applicationrunner
title: SpringBoot2.x基础篇：使用CommandLineRunner或ApplicationRunner
sort_title: SpringBoot使用CommandLineRunner或ApplicationRunner
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: true
news: true
disable_toc: false
customize: false
tags: [SpringBoot2.x]
categories: [SpringBoot]
keywords: 'SpringBoot,CommandLineRunner,ApplicationRunner'
description: spring-boot-basic-use-commandlinerunner-or-applicationrunner
date: 2020-07-03 22:32:08
article_url:
---
如果你想要使用`SpringBoot`构建的项目在启动后运行一些特定的代码，那么`CommandLineRunner`、`ApplicationRunner`都是很好的选择。

## 推荐阅读
- [SpringBoot2.x 教程汇总](http://blog.minbox.org/spring-boot-2-x-articles.html)


## 使用方式

我们以`CommandLineRunner`创建了一个简单的例子，如下所示：

```java
/**
 * {@link CommandLineRunner}接口使用示例
 *
 * @author 恒宇少年
 */
@Component
public class CommandLineRunnerExample implements CommandLineRunner {
    /**
     * 实例化本类的日志采集器
     */
    static LoggingCollector logging = LoggingCollectorFactory.getCollector(CommandLineRunnerExample.class);

    @Override
    public void run(String... args) throws Exception {
        // 执行特定的代码
        logging.debug("main方法参数列表：{}", args);
    }
}
```

`CommandLineRunner`接口的定义很简单，只提供了一个名为`#run()`的方法，我们只需要实现该方法做一些自定义的业务逻辑即可，`ApplicationRunner`接口的使用方式也是一样的。

## 两者的区别？

从源码上分析，`CommandLineRunner`与`ApplicationRunner`两者之间只有`#run()`方法的参数不一样而已。

**CommandLineRunner：**

```java
@FunctionalInterface
public interface CommandLineRunner {

	/**
	 * Callback used to run the bean.
	 * @param args incoming main method arguments
	 * @throws Exception on error
	 */
	void run(String... args) throws Exception;

}
```

**ApplicationRunner：**

```java
@FunctionalInterface
public interface ApplicationRunner {

	/**
	 * Callback used to run the bean.
	 * @param args incoming application arguments
	 * @throws Exception on error
	 */
	void run(ApplicationArguments args) throws Exception;

}
```

`CommandLineRunner#run()`方法的参数是启动`SpringBoot`应用程序`main`方法的参数列表，而`ApplicationRunner#run()`方法的参数则是`ApplicationArguments`对象。

在之前的文章中也提到过`ApplicatgionArguments`对象，并使用它获取外部的配置参数，查看：[应用程序在启动时访问启动项参数](https://blog.minbox.org/spring-boot-basic-accessing-application-arguments.html)。

> **建议：**如果你在项目启动时需要获取类似 "--xxx" 的启动参数值建议使用`ApplicationRunner`

## 什么时候会被调用？

我们已经了解`CommandLineRunner`与`ApplicationRunner`两个接口的使用以及区别，是不是很想知道`SpringBoot`在启动时在什么时候调用它们的呢？

我们大家都知道`SpringBoot`应用程序的启动主要归功于`SpringApplication`这个类，我们在创建项目时在启动类内会调用`SpringApplication#run()`方法，如下所示：

```java
public static void main(String[] args) {
  SpringApplication.run(LoggingServiceApplication.class, args);
}
```

那我们来查看下`SpringApplication`类`#run()`方法的源码，根据查看方法之间的相互调用，最终我们会定位到`org.springframework.boot.SpringApplication#run(java.lang.String...)`这个方法，阅读该方法时发现有关调用`Runner`的定义，如下所示：

```java
// 省略部分源码
listeners.started(context);
callRunners(context, applicationArguments);
// 省略部分源码
```

`#callRunnners()`方法的调用确实是在应用程序启动完成后，而且把`ApplicationContext`与`ApplicationArguments`对象都作为参数进行了传递，那么我们来看看这个方法究竟干了些什么事情？

**SpringApplication#callRunners：**

```java
private void callRunners(ApplicationContext context, ApplicationArguments args) {
  List<Object> runners = new ArrayList<>();
  runners.addAll(context.getBeansOfType(ApplicationRunner.class).values());
  runners.addAll(context.getBeansOfType(CommandLineRunner.class).values());
  AnnotationAwareOrderComparator.sort(runners);
  for (Object runner : new LinkedHashSet<>(runners)) {
    if (runner instanceof ApplicationRunner) {
      callRunner((ApplicationRunner) runner, args);
    }
    if (runner instanceof CommandLineRunner) {
      callRunner((CommandLineRunner) runner, args);
    }
  }
}
```

我想大家看到这里就应该明白了，这个方法就是在执行`CommandLineRunner`以及`ApplicationRunner`实现类实例的`#run()`方法，首先会从`ApplicationContext`中获取`CommandLineRunner`、`ApplicationRunner`接口实现类的实例，然后根据不同类型的`Runner`实例去调用了`callRunner`方法。

**SpringApplication#callRunner：**

```java

// 调用ApplicationRunner实现类实例#run()
private void callRunner(ApplicationRunner runner, ApplicationArguments args) {
  try {
    (runner).run(args);
  }
  catch (Exception ex) {
    throw new IllegalStateException("Failed to execute ApplicationRunner", ex);
  }
}
// 调用CommandLineRunner实现类实例#run()
private void callRunner(CommandLineRunner runner, ApplicationArguments args) {
  try {
    (runner).run(args.getSourceArgs());
  }
  catch (Exception ex) {
    throw new IllegalStateException("Failed to execute CommandLineRunner", ex);
  }
}
```



## 设置执行顺序

那如果我们创建了多个`CommandLineRunner`、`ApplicationRunner`实现类，还想要实现类在执行的时候有一定的先后顺序，那你不妨试下`org.springframework.core.annotation.Order`这个注解或者实现`org.springframework.core.Ordered`接口。

**CommandLineRunnerExample：**

```java
/**
 * {@link CommandLineRunner}接口使用示例
 *
 * @author 恒宇少年
 */
@Component
@Order(100)
public class CommandLineRunnerExample implements CommandLineRunner, Ordered {
    // 省略部分代码
    @Override
    public int getOrder() {
        return 100;
    }
}
```

> **接口**与**注解**的方式选择其中一种就可以了。


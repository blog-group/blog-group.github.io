---
id: spring-boot-basic-accessing-application-arguments
title: SpringBoot2.x基础篇：应用程序在启动时访问启动项参数
sort_title: SpringBoot2.x应用程序在启动时访问启动项参数
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: true
news: true
disable_toc: false
customize: false
tags: [SpringBoot2.x]
categories: [SpringBoot]
keywords: 'springboot,启动参数,基础教程'
date: 2020-03-03 17:29:13
article_url:
description: 'SpringBoot2.x基础篇：应用程序在启动时访问启动项参数'
---

`SpringBoot`应用程序在启动时，我们可以传递自定义的参数来进行动态控制逻辑，比如我们使用`--debug`启动参数时就会使用`debug`启动应用程序，在控制台打印一些调试日志信息。

## 推荐阅读
- [SpringBoot2.x 教程汇总](http://blog.minbox.org/spring-boot-2-x-articles.html)

## 什么是启动项参数？

启动项参数的格式一般是`--`开头的，如：`java -jar service.jar --debug --skip`，启动时我们就可以获取`[debug,skip]`两个启动项参数。



**SpringBoot** 内部提供了一个接口`org.springframework.boot.ApplicationArguments`来接收应用程序在启动时所传递的`选项参数（Option Args）`，源码如下所示：

```java
public interface ApplicationArguments {

	/**
	 * 返回未处理的原始参数列表
	 * @return the arguments
	 */
	String[] getSourceArgs();

	/**
	 * 返回所有选项参数的名称 
	 * For example, if the arguments were
	 * "--foo=bar --debug" would return the values {@code ["foo", "debug"]}.
	 * @return the option names or an empty set
	 */
	Set<String> getOptionNames();

	/**
	 * 根据选项参数名称判断是否在启动时传递
	 * option with the given name.
	 * @param name the name to check
	 * @return {@code true} if the arguments contain an option with the given name
	 */
	boolean containsOption(String name);

	/**
	 * 返回与具有给定名称的arguments选项关联的值的集合。
	 * <ul>
	 * <li>if the option is present and has no argument (e.g.: "--foo"), return an empty
	 * collection ({@code []})</li>
	 * <li>if the option is present and has a single value (e.g. "--foo=bar"), return a
	 * collection having one element ({@code ["bar"]})</li>
	 * <li>if the option is present and has multiple values (e.g. "--foo=bar --foo=baz"),
	 * return a collection having elements for each value ({@code ["bar", "baz"]})</li>
	 * <li>if the option is not present, return {@code null}</li>
	 * </ul>
	 * @param name the name of the option
	 * @return a list of option values for the given name
	 */
	List<String> getOptionValues(String name);

	/**
	 * 返回分析的非选项参数的集合。
	 * @return the non-option arguments or an empty list
	 */
	List<String> getNonOptionArgs();
}
```



该接口有一个默认的实现`DefaultApplicationArguments`，它实现了`ApplicationArguments`接口的全部定义方法。

`DefaultApplicationArguments`类在`org.springframework.boot.SpringApplication#run(java.lang.String...)`方法内通过`new`进行实例化，该对象实例主要用于启动时的相关配置。

而在启动过程中的`org.springframework.boot.SpringApplication#prepareContext`方法内通过`ConfigurableListableBeanFactory`进行注册到`IOC`容器，并且把`springApplicationArguments`作为唯一名称。

## 获取启动项参数

上面我们说道，在应用启动时会将`ApplicationArguments`接口的实现类实例注册到`IOC`容器，所以我们可以使用注入`ApplicationArguments`接口的形式来获取启动项参数，如下所示：

```java
/**
 * 加载启动项参数
 *
 * @author 恒宇少年
 */
@Component
public class LoadArguments {
    /**
     * 构造函数注入{@link ApplicationArguments}
     *
     * @param applicationArguments
     */
    @Autowired
    public LoadArguments(ApplicationArguments applicationArguments) {
        // 判断是否存在名为skip的启动项参数 
        boolean isHaveSkip = applicationArguments.containsOption("skip");
        System.out.println("skip：" + isHaveSkip);
        // 遍历输出全部的非启动项参数
        List<String> arguments = applicationArguments.getNonOptionArgs();
        for (int i = 0; i < arguments.size(); i++) {
            System.out.println("非启动项参数：" + arguments.get(i));
        }
    }
}
```

我们把项目通过`mvn package`命令进行打包后，使用如下命令启动：

```bash
java -jar spring-boot-basic-accessing-application-arguments-0.0.1-SNAPSHOT.jar --skip noway
```

当我们启动后控制台会输出如下内容：

```
...
skip：true
非启动项参数：noway
...
```

其中`--skip`为启动项参数，而后面携带的`noway`其实是不属于`skip`启动参数，如果我们使用`--skip=noway`作为启动参数时，调用`ApplicationArguments#getOptionValues("skip")`方法获取到的值则是`noway`。



## ApplicationRunner



除了通过注入`ApplicationArguments`的方式获取启动参数外，通过实现`ApplicationRunner`接口也可以获取`ApplicationArguments`对象实例，使用方法如下所示：

```java
/**
 * {@link ApplicationRunner} 实现类
 *
 * @author 恒宇少年
 */
@Component
public class ApplicationRunnerSupport implements ApplicationRunner {
    @Override
    public void run(ApplicationArguments args) throws Exception {
        boolean isHaveSkip = args.containsOption("skip");
        System.out.println("skip：" + isHaveSkip);
        System.out.println(args.getOptionValues("skip"));
    }
}
```

> 注意事项：实现`ApplicationRunner`接口的类需要通过`@Component`标注，通过注解方式注册到`IOC`容器。



## 敲黑板，划重点

我们可以通过`注入`、`ApplicationRunner`这两种方法来获取`ApplicationArguments`对象，那你知道这两种方法的执行先后顺序吗？带着这个疑问可以动手实验下。



## 代码示例

如果您喜欢本篇文章请为源码仓库点个`Star`，谢谢！！！
本篇文章示例源码可以通过以下途径获取，目录为`spring-boot-basic-accessing-application-arguments`：

- Gitee：[https://gitee.com/hengboy/spring-boot-chapter](https://gitee.com/hengboy/spring-boot-chapter/tree/2.x/)
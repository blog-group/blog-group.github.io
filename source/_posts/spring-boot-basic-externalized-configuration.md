---
id: spring-boot-basic-externalized-configuration
title: SpringBoot2.x基础篇：灵活的使用外部化配置信息
sort_title: SpringBoot的外部配置可以这么使用
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: true
news: true
disable_toc: false
customize: false
tags:
  - SpringBoot
categories:
  - SpringBoot
keywords: 'springboot,外部配置,学习教程'
date: 2020-03-06 10:23:54
article_url:
description: 'SpringBoot2.x基础篇：灵活的使用外部化配置信息'
---
`SpringBoot`提供了内部配置`application.yml`文件的方式来进行全局配置，还支持使用`profiles`来激活不同环境下使用不同的配置文件，而这种方式毕竟是已经打包完成了，因此存在一定的局限性，像数据库特殊敏感配置也可能存在泄露的风险，如何解决这种问题呢？我们来看看本章要讲到的外部配置的方式吧！！！
<!--more-->

## 推荐阅读
- [SpringBoot2.x 教程汇总](http://blog.yuqiyu.com/spring-boot-2-x-articles.html)

## 前言

`SpringBoot`提供了多种的外部化配置方式，主要是为了方便在不同的环境中运行相同的代码。

我们可以通过`Properties文件`、`YAML文件`、`环境变量`、`命令行参数`等来配置，获取配置的值时可以通过`@Value`注解进行注入，也可以使用`@ConfigurationProperties`注解进行**层级结构化**绑定到实体类的字段中。

## 加载顺序

`SpringBoot`配置参数存在一定的顺序，当然对相同名称的属性配置，会因为加载的优先级存在**覆盖**，顺序如下所示：

1. `DevTools`全局设置属性
2. `@TestPropertySource`注解
3. `properties`测试中的属性
4. 命令行参数
5. `SPRING_APPLICATION_JSON`属性配置（嵌入在环境变量或者系统属性中的嵌入式JSON字符串）
6. `ServletConfig`初始化参数
7. `ServletContext`初始化参数
8. `JNDI`属性`java:comp/env`
9. Java系统属性
10. 操作系统环境变量
11. 打包在jar内的配置文件（`application.properties`和`YAML`文件）
12. `@PropertySource`注解
13. 默认属性（通过`SpringApplication.setDefaultProperties`设置）



## 配置示例

我们从上面挑选几种来进行测试下配置输出，首先创建一个名为`LoadConfig`的配置类，内容如下所示：

```java
/**
 * 加载配置类
 *
 * @author 恒宇少年
 */
@Configuration
public class LoadConfig {
    /**
     * 配置读取name属性，不存在时使用空字符为默认值
     */
    @Value("${name:''}")
    private String name;

    public String getName() {
        return name;
    }
}
```

在`LoadConfig`配置类中，我们添加了一个`name`字段，由于该字段使用了`@Value`注解，所以它的值会从配置环境中加载名为`name`的属性值（配置的方式并没有限制）。

为了方便演示，我们在应用程序启动时通过实现`CommandLineRunner`接口在启动成功后输出`name`的值，`SpringBootApplication`入口类代码如下所示：

```java
/**
 * 启动类入口
 */
@SpringBootApplication
public class SpringBootBasicExternalizedConfigurationApplication implements CommandLineRunner {
    /**
     * 注入配置类{@link LoadConfig}
     */
    @Autowired
    private LoadConfig loadConfig;

    public static void main(String[] args) {
        SpringApplication.run(SpringBootBasicExternalizedConfigurationApplication.class, args);
    }


    @Override
    public void run(String... args) throws Exception {
        System.out.println("name config value：" + loadConfig.getName());
    }
}
```



## YAML文件配置

这种我们在开发应用程序中最常用的方式，只需要在`src/main/resources`目录下创建一个名为`application.yml`的配置文件，然后在该文件内添加对应属性名称的配置，如下所示：

```yaml
# 配置name属性
name:
  default
```

我们如果直接启动应用程序，会在控制台输出`name`的值为`default`。

> 注意事项：`application.yml`与`application.properties`作用、优先级相同，只是配置的展现形式不一样而已，我个人更喜欢`YAML`文件的形式，层级分明，阅读性高一些。

## 命令行环境变量配置

在执行`java -jar`启动应用程序时，可以通过添加`SPRING_APPLICATION_JSON`配置来进行自定义属性配置，该配置是一个`JSON`字符串的形式，使用方式如下所示：

```bash
SPRING_APPLICATION_JSON='{"name":"system_env"}' java -jar spring-boot-basic-externalized-configuration-0.0.1-SNAPSHOT.jar
```

> **运行结果：**这种方式启用应用程序时，会在控制台输出`name`的值为`system_env`。

## 命令行参数配置

命令行参数这种方式也比较常用，通过`--`进行配置，比较常见的命令`--spring.profiles.active`，启动时用于修改激活的`profile`，而我们如果想要修改`name`属性配置的值，如下所示：

```bash
java -jar spring-boot-basic-externalized-configuration-0.0.1-SNAPSHOT.jar --name=hengboy
```

或者使用`--spring.application.json`方式也可以配置，如下所示：

```bash
java -jar spring-boot-basic-externalized-configuration-0.0.1-SNAPSHOT.jar --spring.application.json='{"name":"hengboy"}'
```

> **运行结果：**以上两种方式都可以，控制台都会输出`name`的值为`hengboy`。

## Java系统属性配置

`Java`系统属性的方式进行配置时，不仅使用`@Value`可以获取到属性值，使用`java.lang.System#getProperty(java.lang.String)`方法也是可以获取到的，通过`-D`进行配置，如下所示：

```bash
java -Dname=JavaSystemConfig -jar spring-boot-basic-externalized-configuration-0.0.1-SNAPSHOT.jar
```

或者使用`-Dspring.application.json`方式配置（这种方式使用`System.getProperty`方法无法获取到属性值），如下所示：

```bash
java -Dspring.application.json='{"name":"JavaSystemConfig"}' -jar spring-boot-basic-externalized-configuration-0.0.1-SNAPSHOT.jar
```

> **运行结果：**以上两种方式启动应用程序，控制台会输出`name`的值为`JavaSystemConfig`。
>
> **注意事项：**Java属性配置必须在`-jar xxx.jar`之前，配置在后面无法读取到属性值。



## 总结

多样化的配置属性的方式，使`SpringBoot`变的是那么的灵活，如果有兴趣可以把上面全部的配置方式都尝试一遍，你会有意想不到的收获的。



## 代码示例

如果您喜欢本篇文章请为源码仓库点个`Star`，谢谢！！！
本篇文章示例源码可以通过以下途径获取，源码分支为`2.x`，目录为`spring-boot-basic-externalized-configuration`：

- Gitee：[https://gitee.com/hengboy/spring-boot-chapter](https://gitee.com/hengboy/spring-boot-chapter/tree/2.x/)
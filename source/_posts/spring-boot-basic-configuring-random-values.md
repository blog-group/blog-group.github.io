---
id: spring-boot-basic-configuring-random-values
title: SpringBoot2.x基础篇：探索配置文件中随机数的实现方式
sort_title: SpringBoot是怎么实现在配置文件的随机数的？
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: true
news: true
disable_toc: false
customize: false
tags: [SpringBoot2.x]
categories: [SpringBoot]
keywords: '随机数,springboot,源码分析'
date: 2020-03-06 17:29:29
article_url:
description: 'SpringBoot2.x基础篇：探索配置文件中随机数的实现方式'
---
随机数的使用你是不是经常用到？我们在进行运行`SpringBoot`单元测试时一般不会指定应用程序启动时的`端口号`，可以在`application.properties`文件内配置`server.port`的值为`${random.int(10000)}`，代表了随机使用`0~10000`的端口号。

既然这种方式使用这么方便，那你知道`${random.int}`是通过什么方式实现的吗？
<!--more-->
## 推荐阅读
- [SpringBoot2.x 教程汇总](http://blog.minbox.org/spring-boot-2-x-articles.html)

## 概述

![](http://blog.minbox.org/images/post/spring-boot-basic-configuring-random-values-1.png)

## 配置文件方式

在我们分析源码之前，我们先来看看`${random.xxx}`具体提供了哪几种的随机配置。

### int随机数

使用`${random.int}`方式配置，结果从`int`的最大值、最小值中间产生，`int`的最小值为`-2147483648`，最大值为`2147483647`，配置如下所示：

```yaml
server:
  port: ${random.int}
```



### int范围随机数

使用`${random.int(10000)}`方式配置，这种方式我们可以指定随机数的**最大值**，当然不能超过`2147483647`，配置如下所示：

```
server:
  port: ${random.int(10000)}
```

> 注意事项：`${random.int(10000)}`随机数的值将会在`0~10000`之间产生，配置的**最大值必须为正整数**，
>
> 如果需要指定随机数的最小值，可以使用`${random.int[100,200]}`方式配置，这样只会从`100~200`之间产生随机数（包括最小值，不包括最大值）。

### long随机数

使用`${random.long}`方式配置，结果会从`long`的最大值、最小值中间产生，`long`的最小值为`-9223372036854775808`，最大值为`9223372036854775807`，配置方式如下所示：

```yaml
config:
  longValue: ${random.long}
```



### long范围随机数

使用`${random.long(10000)}`方式配置，我们可以指定`0~9223372036854775807`之间的任意数值作为随机的最大上限，配置方式如下所示：

```yaml
config:
  maxLongValue: ${random.long(102400)}
```

> 如果需要指定最小值，可以使用`${random.long[1024,2048]}`方式配置，这样只会从`1024~2048`中产生随机数（包括最小值，不包括最大值）。

### uuid随机数

`uuid`因为它的唯一性，应该是我们平时开发中比较常用到的。

`SpringBoot`也为我们考虑到了这一点，我们只需要使用`${random.uuid}`就可以获得一个随机的`uuid`字符串，配置方式如下所示：

```yaml
config:
  uuid: ${random.uuid}
```



## @Value方式

如果在我们在编码中需要用到随机数的生成，`${random}`是支持注入使用的，主要还是因为它的实现继承自`PropertySource`。

我们可以在`Spring IOC`所管理的类内直接使用`@Value`注解进行注入使用，如下所示：

```java
/**
 * 随机生成uuid字符串
 */
@Value("${random.uuid}")
private String uuid;
/**
 * 随机生成0~1000的正整数
 */
@Value("${random.int(1000)}")
private int maxInt;
/**
 * 随机生成0~102400的long类型数值
 */
@Value("${random.long(102400)}")
private long maxLong;
```



## 源码解析

我们之所以可以这么方便的使用随机数，都归功于`SpringBoot`为我们提供了一个名为`RandomValuePropertySource`的`PropertySource`实现类，该实现类位于`org.springframework.boot.env`包内，该类部分源码如下所示：

```java
/**
 * {@link PropertySource} that returns a random value for any property that starts with
 * {@literal "random."}. Where the "unqualified property name" is the portion of the
 * requested property name beyond the "random." prefix, this {@link PropertySource}
 * ...
 */
public class RandomValuePropertySource extends PropertySource<Random> {

  private static final String PREFIX = "random.";

  private static final Log logger = LogFactory.getLog(RandomValuePropertySource.class);

  @Override
  public Object getProperty(String name) {
    // 仅处理random.开头的配置
    if (!name.startsWith(PREFIX)) {
      return null;
    }
    if (logger.isTraceEnabled()) {
      logger.trace("Generating random property for '" + name + "'");
    }
    // 获取数据数，将random.后的内容作为类型参数传递到getRandomValue方法
    return getRandomValue(name.substring(PREFIX.length()));
  }
  
  private Object getRandomValue(String type) {
    // 处理random.int类型的随机数
    if (type.equals("int")) {
      return getSource().nextInt();
    }
    // 处理random.long类型的随机数
    if (type.equals("long")) {
      return getSource().nextLong();
    }
    // 处理random.int(100)类型的随机数
    String range = getRange(type, "int");
    if (range != null) {
      // 生成有范围的int类型随机数
      return getNextIntInRange(range);
    }
    // 处理random.long(1024)类型的随机数
    range = getRange(type, "long");
    if (range != null) {
      // 生成有范围的long类型随机数
      return getNextLongInRange(range);
    }
    // 处理random.uuid类型的随机数
    if (type.equals("uuid")) {
      // 生成随机的uuid返回
      return UUID.randomUUID().toString();
    }
    // 默认返回随机字节
    return getRandomBytes();
  }

  private String getRange(String type, String prefix) {
    if (type.startsWith(prefix)) {
      int startIndex = prefix.length() + 1;
      if (type.length() > startIndex) {
        return type.substring(startIndex, type.length() - 1);
      }
    }
    return null;
  }

  private int getNextIntInRange(String range) {
    String[] tokens = StringUtils.commaDelimitedListToStringArray(range);
    int start = Integer.parseInt(tokens[0]);
    if (tokens.length == 1) {
      return getSource().nextInt(start);
    }
    return start + getSource().nextInt(Integer.parseInt(tokens[1]) - start);
  }

  private long getNextLongInRange(String range) {
    String[] tokens = StringUtils.commaDelimitedListToStringArray(range);
    if (tokens.length == 1) {
      return Math.abs(getSource().nextLong() % Long.parseLong(tokens[0]));
    }
    long lowerBound = Long.parseLong(tokens[0]);
    long upperBound = Long.parseLong(tokens[1]) - lowerBound;
    return lowerBound + Math.abs(getSource().nextLong() % upperBound);
  }
}
```



当我们使用`${random.xxx}`这种方式获取随机数时，无论是`配置文件`方式还是`@Value`方式都会通过`org.springframework.boot.env.RandomValuePropertySource#getProperty`方法来获取对应类型的随机数。



> 注意事项：`RandomValuePropertySource`在继承`PropertySource`时泛型类型为`Random`，`java.util.Random`类内包含了全部的随机生成逻辑，该类由`java`提供，有兴趣可以研究下源码。

## 总结

`SpringBoot`内的配置都是通过`ConfigurablePropertyResolver`属性配置解析器来获取的，而该类的实例化在`AbstractEnvironment`内，我们通过`AbstractEnvironment#getProperty(java.lang.String)`方法可以获取由多个`PropertySource`实现类提供的属性配置。
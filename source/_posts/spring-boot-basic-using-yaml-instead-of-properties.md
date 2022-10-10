---
id: spring-boot-basic-using-yaml-instead-of-properties
title: SpringBoot2.x基础篇：使用YAML代替Properties的对应配置
sort_title: 使用YAML代替Properties的对应配置
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: true
news: true
disable_toc: false
customize: false
tags: [SpringBoot2.x]
categories: [SpringBoot]
keywords: 'springboot,yaml,properties'
date: 2020-03-26 08:41:02
article_url:
description: 'SpringBoot2.x基础篇：使用YAML代替Properties的对应配置'
---

`YAML`是一种用于指定层次结构配置数据的便捷格式，`SpringBoot`内部通过集成[SnakeYAML](https://bitbucket.org/asomov/snakeyaml)来支持解析，那我们如果来使用`YAML`格式来代替`Properties`，我们需要了解每一种`Properties`对应`YAML`的配置代替方式。

## 推荐阅读
- [SpringBoot2.x 教程汇总](http://blog.yuqiyu.com/spring-boot-2-x-articles.html)

## 普通配置

普通的方式比较简单直接，不存在`数组`、`集合`、`子类`等相关配置，我们通过`Properties`方式编写了如下的配置内容：

```properties
system.config.max-value=100
system.config.min-value=10
system.config.location=classpath:/configs
```

那这种方式对应的`YAML`配置是什么样子的呢？

如下所示：

```yaml
system:
  config:
    min-value: 10
    max-value: 100
    location: classpath:/configs
```

> 这两种方式对比之下，`YAML`层次感鲜明，更直观的查看配置信息，而`Properties`这种方式配置前缀相对来说是**冗余**的，如果配置前缀过长，每一行的配置内容则会更长。

## List配置

如果你需要添加`List/Set/Array`类型的配置信息，使用`Properties`方式编写如下所示：

```properties
system.config.ports[0]=8080
system.config.ports[1]=8081
system.config.ports[2]=8082
```

> **注意事项：**配置的索引从**0**开始。

对应上面配置的`YAML`实现如下所示：

```yaml
system:
  config:
    ports:
      - 8080
      - 8081
      - 8082
```

无论是`Properties`还是`YAML`格式，这种`List`的配置内容都可以通过如下的方式获取：

```java
@Configuration
@ConfigurationProperties(prefix = "system.config")
@Data
public class LoadListConfig {
    private List<String> ports;
}
```



## List内实体配置

如果你的`List`内不是基本数据类型，而是一个实体类，使用`Properties`的配置方式如下所示：

```properties
system.users[0].username=admin
system.users[0].email=yuqiyu@vip.qq.com
system.users[1].username=hengboy
system.users[1].email=jnyuqy@gmail.com
```

其实跟上面的`List配置`差不多，不过如果你需要配置每一个索引内字段的值，就要一一指定配置值。

对应上面的`YAML`实现如下所示：

```yaml
system:
  users:
    - username: admin
      email: yuqiyu@vip.qq.com
    - username: hengboy
      email: jnyuqy@gmail.com
```

> 每一个 `-` 其实代表集合内的一个元素。

获取`List实体`配置时我们可以通过如下的方式：

```java
@Data
@Configuration
@ConfigurationProperties(prefix = "system")
public class LoadSystemUserConfig {
    private List<User> users;

    @Getter
    @Setter
    public static class User {
        private String username;
        private String email;
    }
}
```



## YAML缺点

一种方案的诞生是为了解决相应的问题，虽然说存在既有道理，但是每一种方案也不是完美的都有自身的缺点。

下面简单说说`YAML`的缺点：

- 配置时**缩进**要特别注意，如果存在空格缩进对应不齐就会出现问题
- 在`SpringBoot`内无法通过`@PropertySource`注解加载`YAML`文件。
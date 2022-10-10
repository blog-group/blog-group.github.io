---
id: spring-boot-basic-load-order-of-config-files
title: SpringBoot2.x基础篇：配置文件的加载顺序以及优先级覆盖
sort_title: SpringBoot配置文件的加载顺序以及优先级覆盖
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: true
news: true
disable_toc: false
customize: false
tags: [SpringBoot2.x]
categories: [SpringBoot]
keywords: 'springboot,配置文件,覆盖,优先级'
date: 2020-03-22 16:04:45
article_url:
description: 'SpringBoot2.x基础篇：配置文件的加载顺序以及优先级覆盖'
---

`SpringBoot`约定了配置文件，默认为`application.properties`，通过该文件可以修改很多默认的配置，当然我们还可以在该配置文件内添加自定义的配置，该文件通过`key=value`的形式进行配置。

## 推荐阅读
- [SpringBoot2.x 教程汇总](http://blog.yuqiyu.com/spring-boot-2-x-articles.html)

## 疑惑配置提示？
当我们使用开发工具来配置时，就会出现相应的提示，这要完全要归功于`spring-configuration-metadata.json`配置元数据文件，该文件内记录了配置的**名称**、**类型**、**归属类**等信息，如果配置类型为`枚举`还可以实现`选择性配置`。

> `SpringBoot`提供了一个依赖，它的主要任务就是自动生成配置元数据，该依赖的名称为`spring-boot-configuration-processor`，在打包时会在`META-INF`目录生成一个名为`spring-configuration-metadata.json`的文件。

## 配置方式

虽然默认使用`properties`格式的配置文件，不过这种方式会导致配置的部分前缀冗余，可阅读性稍差，`SpringBoot`内部还支持使用`yaml`方式的配置文件，只需要在`src/main/resources`目录下创建一个名为`application.yml`文件即可，使用配置时同样也有提供功能。

项目内可以同时存在`application.properties`、`application.yml`两个文件，经过测试发现，`properties`优先级会高一些，相同名称的配置，会将`yml`内的配置覆盖掉。

## 指定配置文件

如果你的应用程序配置文件的名称不是`application`，你想要进行自定义，可以通过`--spring.config.name`命令行参数进行指定，如下所示：

```bash
java -jar project-sample.jar --spring.config.name=custome
```

> **注意事项：**我们只需要指定配置文件的名称即可，可以使用`properties`或`yaml`文件格式，上面的配置会加载`src/main/resources/custome.yml`或`src/main/resources/custome.properties`。

通过`--spring.config.name`仅仅是修改了配置文件的名称，那如果是修改配置文件所处的目录位置，我们需要怎么做呢？

`SpringBoot`已经给我们准备好了，通过`--spring.config.location`参数就可以指定配置文件的位置，如下所示：

```bash
java -jar project-sample.jar --spring.config.location=classpath:/configs/custome.yml
```

如果一个配置文件无法满足你的需求，那你看看下面这个方式：

```bash
java -jar project-sample.jar --spring.config.location=classpath:/configs/custome.yml,classpath:/configs/default.properties
```

> **注意事项：**支持通过命令行参数的方式指定多个配置文件，使用英文半角 `,` 隔开即可。

如果你通过`spring.config.location`指定的不是一个文件而是一个目录，在路径最后务必添加一个"/"结束，然后结合`spring.config.name`进行组合配置文件，组合示例如下：

```bash
# 加载/configs/application.properties 或 /configs/application.yml（默认文件名）
java -jar project-sample.jar --spring.config.location=classpath:/configs/

# 加载/configs/custome.properties 或 /configs/custome.yml
java -jar project-sample.jar --spring.config.location=classpath:/configs/ --spring.config.name=custome

```

> **注意事项：**`spring.config.name`该配置参数默认值为`application`，所以如果只是指定了`spring.config.location`并为目录形式，上面示例中会自动将`spring.config.name`追加到目录路径后，如果指定的`spring.config.location`并非是一个目录，这里会忽略`spring.config.name`的值。

## 加载顺序

`SpringBoot`应用程序在启动时会遵循下面的顺序进行加载配置文件：

1. 类路径下的配置文件
2. 类路径内config子目录的配置文件
3. 当前项目根目录下的配置文件
4. 当前项目根目录下config子目录的配置文件

示例项目配置文件存放结构如下所示：

```
. project-sample
├── config
│   ├── application.yml （4）
│   └── src/main/resources
|   │   ├── application.yml （1）
|   │   └── config
|   |   │   ├── application.yml （2）
├── application.yml （3）
```

**启动时加载配置文件顺序：1 > 2 > 3 > 4**

> `src/main/resources`下的配置文件在项目编译时，会放在`target/classes`下。

## 优先级覆盖

`SpringBoot`配置文件存在一个特性，**优先级较高的配置加载顺序比较靠后**，`相同名称`的配置`优先级较高`的会`覆盖`掉`优先级较低`的内容。

为了更好地解释这一点，我们根据对应的加载顺序分别创建一个`application.yml`配置文件，来验证根据优先级的不同是否存在覆盖问题，如下图所示：

![](http://blog.yuqiyu.com/images/post/spring-boot-basic-load-order-of-config-files-1.jpg)

在上面四个配置文件中都有一个名为`name`的配置，而红色字体标注的内容就是每个配置文件`name`的配置内容，下面我们来启动项目测试下输出内容。

## 运行测试

在测试之前我们让启动类实现`CommandLineRunner`接口，如下所示：

```java
@SpringBootApplication
public class LoadOrderOfConfigFilesApplication implements CommandLineRunner {

    public static void main(String[] args) {
        SpringApplication.run(LoadOrderOfConfigFilesApplication.class, args);
    }

    @Value("${name}")
    private String name;

    @Override
    public void run(String... args) throws Exception {
        System.out.println("配置名称：" + name);
    }
}
```

项目启动后通过`run`方法进行打印`${name}`配置的内容。

### 测试一：顺序覆盖

保留上面四个对应加载顺序的配置文件，启动项目，控制台输出内容：

```
配置名称：project/config
```

期望与实际输出是符合的，项目根下的`config`目录是`最后加载`的，所以它的`优先级`相对其他三个来说是`最高`的，**覆盖顺序为：4 > 3 > 2 > 1**。

### 测试二：跨顺序覆盖

上一个测试点我们对每一个加载顺序都对应添加了一个配置文件，那如果我们只有两个`project/config`、`classes/config`两个目录的配置文件，是否按照优先级进行覆盖呢？

删除另外两个，只保留`project/config`、`classes/config`两个位置的配置文件，启动项目控制台输出如下所示：

```
配置名称：project/config
```

同样是输出了优先级最高的`project/config`配置文件的内容，**覆盖顺序为：4 > 1**

### 测试点：单顺序加载

平时在项目开发中一般都是将`application.yml`配置文件放在`src/main/resources`目录下，然而根据上面的加载顺序来看，我们可以将配置文件放置在任意一处，启动时都会进行加载。

仅保留`classes/config`位置的配置文件，启动项目控制台输出内容如下所示：

```
配置名称：classes/config
```

`IDEA`对`SpringBoot`的支持真的很强大， `classes/config`下的配置文件同样提供了`关键字提醒`功能。

## 总结

了解配置文件的加载顺序，才能得心应手的进行配置覆盖，完全控制在不同环境下使用不同的配置内容，要记住`classes/application.yml`优先级最低，`project/config/application.yml`优先级最高。
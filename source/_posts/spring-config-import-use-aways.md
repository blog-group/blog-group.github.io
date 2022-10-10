---
id: spring-config-import-use-aways
title: SpringBoot使用spring.config.import多种方式导入配置文件
sort_title: 使用spring.config.import导入配置文件
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: false
news: true
disable_toc: false
customize: false
tags:
  - SpringBoot
categories:
  - SpringBoot
keywords: 'SpringCloud,SpringBoot,恒宇少年,微服务'
description: spring-config-import-use-aways
date: 2022-04-10 08:41:29
article_url:
---

`SpringBoot`从2.4.x版本开始支持了导入文件的方式来加载配置参数，与`spring.config.additional-location`不同的是不用提前设置而且支持导入的文件类型相对来说要丰富很多。

我们只需要在`application.properties/application.yml`配置文件中通过`spring.config.import`属性配置需要导入的文件列表即可。

通过`spring.config.import`属性支持导入多种途径的配置文件，下面简单介绍几种。

<!--more-->
## 导入classpath下的配置文件

可以导入`classpath`下任意目录的文件，使用方式如下所示：

```yaml
spring:
  config:
    import:
    # 导入classpath下default目录下的default.properties配置文件
    - classpath:/default/default.properties
    # 导入classpath下service目录下的service.yml配置文件
    - classpath:/service/service.yml
```

在`src/main/resource`下分别创建`default`、`service`目录，在`default`目录下创建`default.properties`、在`service`目录下创建`sevice.yml`。

通过上面配置的属性导入后我们直接就可以在项目中通过`@ConfigurationProperties`或`@Value`来注入使用。

> `src/main/resource`、`src/main/java`目录编译后都会到`classpath`根目录下。

```yaml
// default.properties
default.password=111111
// service.yml
service:
  id: example
  port: 9999
  index-path: /index
```

```java
// default.properties
@Value("${default.password}")
private String defaultPassword;
---
// service.yml
@Configuration
@ConfigurationProperties(prefix = "service")
@Data
public class ServiceProperties {
    private String id;
    private int port;
    private String indexPath;
}
```

## 导入系统目录下的配置文件

可以导入操作系统目录下的配置文件，我在`/Users/yuqiyu/Downloads`目录下创建了名为`system.properties`的文件，导入方式如下所示：

```yaml
spring:
  config:
    import:
    # 导入系统目录/Users/yuqiyu/Downloads下的system.properties配置文件
    - optional:/Users/yuqiyu/Downloads/system.properties
```

使用`@ConfigurationProperties`方式注入映射如下所示：

```java
// system.properties
system.os=osx
system.jdk-version=11

// SystemProperties.java
@Data
@Configuration
@ConfigurationProperties(prefix = "system")
public class SystemProperties {
    private String os;
    private String jdkVersion;
}
```

## 导入Nacos配置中心的配置文件

`Nacos`在`SpringCloud Alibaba`发布了`2021.0.1.0`版本后对`spring.config.import`做了支持，可以直接通过加载`Nacos Server`内指定的配置文件。

首先我们使用`Docker`来创建一个`Nacos Server`容器，步骤如下所示：

```bash
# 拉取nacos-server镜像
docker pull nacos/nacos-server
# 创建并启动nacos-server容器
docker run --name nacos-quick -e MODE=standalone -p 8848:8848 -p 9848:9848 -d nacos/nacos-server:latest
```

访问[http://localhost:8848/nacos](http://localhost:8848/nacos)，使用默认账号`nacos`登录后在`public`命名空间下创建一个名为`spring-config-import-example.yaml`的`YAML`格式的配置文件，内容如下所示：

```yaml
config:
    source: nacos
```

在`SpringBoot`项目中如果需要集成`nacos`，可以直接添加`spring-cloud-starter-alibaba-nacos-config`依赖，如下所示：

```xml
<dependency>
  <groupId>com.alibaba.cloud</groupId>
  <artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
  <version>2021.0.1.0</version>
</dependency>
```

导入方式如下所示：

```yaml
spring:
  cloud:
    nacos:
      server-addr: localhost:8848
  config:
    import:
    # 导入nacos配置中心的配置文件
    - optional:nacos:spring-config-import-example.yaml
```

在项目中同样可以使用`@ConfigurationProperties`、`@Value`来注入配置参数，如下所示：

```java
@Value("${config.source}")
private String configSource;
```

## 总结

`spring.config.import`使用方式是多样化的，如果你需要自定义导入的方式，可以借鉴`nacos`对其实现的部分代码。
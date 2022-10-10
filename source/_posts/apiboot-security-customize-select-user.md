---
id: apiboot-security-customize-select-user
title: ApiBoot零代码整合Spring Security的JDBC方式获取AccessToken
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: true
news: true
customize: false
tags: [ApiBoot,OAuth2,Spring Security]
categories: [ApiBoot]
keywords: apiboot,security,spring
description: 'ApiBoot零代码整合Spring Security的JDBC方式获取AccessToken'
date: 2019-11-29 12:34:41
article_url:
---
`ApiBoot Security`内部提供了**两种方式**进行读取需要认证的用户信息，在之前的文章中讲到过`ApiBoot Security`使用`内存方式（memory）`**不写一行代码**就可以实现用户的认证并获取`AccessToken`，那我们使用`JDBC`方式是不是也是这么的简单呢？
<!--more-->
如果你还对`ApiBoot`不了解，可以通过以下的途径来获取帮助。
- 官方文档：[https://apiboot.minbox.org](https://apiboot.minbox.org/zh-cn/index.html)
- 源码：[https://gitee.com/minbox-projects/api-boot](https://gitee.com/minbox-projects/api-boot)

## ApiBoot Security的认证方式
有一些同学可能对`ApiBoot Security`的两种认证方式还不太了解，下面介绍下这两种认证方式的区别。
### 内存方式
`内存方式（memory）`是将用户信息（用户名、密码、角色列表）在`application.yml`文件内配置，可配置多个用户，项目启动后将用户信息加载到内存中，用于获取`AccessToken`时的认证。
### 数据库方式
`数据库方式（jdbc）`是将用户信息保存到数据库内，`ApiBoot Security`定义了一个默认表结构的`用户信息数据表`，我们可以从官网找到[建表语句](https://apiboot.minbox.org/zh-cn/docs/api-boot-security.html)直接在自己的数据库内创建即可，当然如果不使用默认的表结构可以进行自定义读取用户信息。

> 注意：在数据库内存放用户的`密码`必须是通过`BCryptPasswordEncoder`加密后的密文字符串。

## 创建项目
对`ApiBoot Security`的两种认证方式概念明白后，我们开始说下怎么才能使用`JDBC`方式进行用户认证，我们先来使用`IDEA`开发工具创建一个`SpringBoot`项目。
### 添加ApiBoot统一版本
在使用`ApiBoot`内提供的组件依赖时，首先我们需要在`pom.xml`文件内添加`ApiBoot统一版本`，如下所示：
```xml
<properties>
    <java.version>1.8</java.version>
    <!--ApiBoot版本号-->
    <apiboot.version>2.1.5.RELEASE</apiboot.version>
</properties>
<dependencyManagement>
    <dependencies>
        <!--ApiBoot版本依赖-->
        <dependency>
            <groupId>org.minbox.framework</groupId>
            <artifactId>api-boot-dependencies</artifactId>
            <version>${apiboot.version}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```
### 添加ApiBoot Security依赖
在项目`pom.xml`文件添加`ApiBoot Security`依赖，如下所示：
```xml
<!--ApiBoot Security OAuth-->
<dependency>
  <groupId>org.minbox.framework</groupId>
  <artifactId>api-boot-starter-security-oauth-jwt</artifactId>
</dependency>
```
### 添加JDBC相关依赖

我们本章使用`MySQL`数据库做演示，我们需要添加相关的`数据库依赖`以及数据库`连接池依赖`，由于`ApiBoot Security`读取内置的默认用户表结构使用的是`DataSource`，所以我们还需要添加一个可以实例化`DataSource`的依赖，可以选择`api-boot-starter-mybatis-enhance`或者`spring-boot-starter-jdbc`，在`pom.xml`添加依赖如下所示：

```xml
<!--SpringBoot Web-->
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<!--MySQL-->
<dependency>
  <groupId>mysql</groupId>
  <artifactId>mysql-connector-java</artifactId>
</dependency>

<!--Hikari-->
<dependency>
  <groupId>com.zaxxer</groupId>
  <artifactId>HikariCP</artifactId>
</dependency>
<!--SpringBoot JDBC-->
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-jdbc</artifactId>
</dependency>
```

> 注意：`spring-boot-starter-web`这个依赖不可少，在`ApiBoot AutoConfiguration`内需要一些`Web`的依赖类。

### 创建默认用户表结构

本章使用`ApiBoot Security`提供的默认用户表结构，访问官方文档查看[3.3 使用内置表结构的用户](https://apiboot.minbox.org/zh-cn/docs/api-boot-security.html)，将建表语句在自己数据库内执行创建表信息，创建后添加一条用户信息，如下所示：

```sql
INSERT INTO `api_boot_user_info` VALUES (1,'admin','昵称','$2a$10$RbJGpi.v3PwkjrYENzOzTuMxazuanX3Qa2hwI/f55cYsZhFT/nX3.',NULL,NULL,NULL,'N','Y','O','2019-11-29 06:14:44');
```



### 配置数据源

依赖添加完成后我们在`application.yml`配置文件内进行配置数据源，如下所示：

```yaml
spring:
  application:
    name: apiboot-security-customize-select-user
  # 数据源配置
  datasource:
    type: com.zaxxer.hikari.HikariDataSource
    url: jdbc:mysql://127.0.0.1:3306/test?characterEncoding=utf8&serverTimezone=Asia/Shanghai
    username: root
    password: 123456
    driver-class-name: com.mysql.cj.jdbc.Driver
server:
  port: 9090
```



### 配置ApiBootSecurity JDBC方式

由于`ApiBoot Security`默认使用`memory`用户认证读取方式，我们需要在`application.yml`文件内进行修改，如下所示：

```yaml
# ApiBoot相关配置
api:
  boot:
    # 启用ApiBoot Security 的JDBC方式
    security:
      away: jdbc
```

## 运行测试

项目配置完成，下面我们通过`XxxApplication`方式启动项目。

在获取`AccessToken`之前我们要知道的一点，`ApiBoot Security`内部默认集成了`OAuth2`，而且还默认配置了`clientId`、`clientSecret`客户端基本信息，默认值分别是`ApiBoot`、`ApiBootSecret`。

```
clientId = ApiBoot
clientSecret = ApiBootSecret
```

如果你对`ApiBoot OAuth`其他功能有兴趣可以查看[ApiBoot OAuth文档](https://apiboot.minbox.org/zh-cn/docs/api-boot-oauth.html)了解详情。

### 获取AccessToken

由于学习者的本机环境不同，下面采用两种方式进行获取`AccessToken`。

#### CURL方式

执行如下命令获取`AccessToken`：

```json
➜ ~ curl -X POST ApiBoot:ApiBootSecret@localhost:9090/oauth/token\?grant_type\=password\&username\=admin\&password\=123456
{"access_token":"d9cb97ee-d1bf-42e1-a7a0-c1002df48c52","token_type":"bearer","refresh_token":"db9e9d52-cbe3-4379-a5f2-ffaa34681c01","expires_in":2884,"scope":"api"}
```

#### PostMan方式

![](/images/post/apiboot-security-customize-select-user-1.png)

> 注意：获取AccessToken的请求方式为`POST`.

## 敲黑板，划重点

`ApiBoot Security`不仅`内存方式`可以实现**零代码**的方式进行集成`Spring Security`、`OAuth2`，`JDBC`方式同样也可以，不过要根据`ApiBoot`的约定创建用户表。

## 代码示例
如果您喜欢本篇文章请为源码仓库点个`Star`，谢谢！！！
本篇文章示例源码可以通过以下途径获取，目录为`apiboot-security-customize-select-user`：
- Gitee：[https://gitee.com/minbox-projects/api-boot-chapter](https://gitee.com/minbox-projects/api-boot-chapter)

---
id: apiboot-logging-admin-visual-interface-management-log
title: ApiBoot Logging Admin可视化界面管理日志
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: true
news: true
tags:
  - ApiBoot
categories:
  - ApiBoot
keywords: apiboot,logging,admin
description: 'ApiBoot分布式链路日志组件的可视化管理平台'
date: 2019-11-07 09:16:04
article_url:
---
`ApiBoot Logging Admin`支持界面可视化查看请求日志信息，初期版本支持查看上报日志的`服务列表`、`最新的链路日志`等功能，还可以整合`Spring Security`配置用户名、密码
<!--more-->
## 创建Logging Admin项目
我们需要创建一个`SpringBoot`项目，并添加`ApiBoot Logging Admin`相关的依赖以及配置信息。

### 添加依赖

在项目的`pom.xml`配置文件内添加如下依赖：

```xml
<dependencies>
  <!--Spring Web-->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
  </dependency>
  <!--MySQL-->
  <dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
    <scope>runtime</scope>
  </dependency>

  <dependency>
    <groupId>com.zaxxer</groupId>
    <artifactId>HikariCP</artifactId>
  </dependency>

  <!--ApiBoot Logging Admin-->
  <dependency>
    <groupId>org.minbox.framework</groupId>
    <artifactId>api-boot-starter-logging-admin</artifactId>
  </dependency>

  <!--ApiBoot Mybatis Enhance-->
  <dependency>
    <groupId>org.minbox.framework</groupId>
    <artifactId>api-boot-starter-mybatis-enhance</artifactId>
  </dependency>
<!--版本依赖-->
<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>org.minbox.framework</groupId>
      <artifactId>api-boot-dependencies</artifactId>
      <version>2.1.5.RELEASE</version>
      <scope>import</scope>
      <type>pom</type>
    </dependency>
  </dependencies>
</dependencyManagement>
```

### 配置数据源

我们需要连接到`Logging Admin`所需要的数据库上，具体的数据库表结构请访问【[将ApiBoot Logging采集的日志上报到Admin](https://blog.yuqiyu.com/apiboot-report-logs-by-logging-to-admin.html#初始化日志表结构)】查看.

修改`application.yml`配置文件添加相关数据源信息如下所示：

```yaml
# 服务名称
spring:
  application:
    name: logging-admin
  # 数据源相关配置
  datasource:
    driver-class-name: com.mysql.cj.jdbc.Driver
    url: jdbc:mysql://localhost:3306/test
    username: root
    password: 123456
    type: com.zaxxer.hikari.HikariDataSource
# 服务端口号
server:
  port: 8080
```

### 配置日志输出 & 美化

修改`application.yml`配置文件添加`ApiBoot Logging Admin`相关配置信息，如下所示：

```yaml
api:
  boot:
    logging:
      # Logging Admin相关配置
      admin:
        # 控制台显示采集的日志信息
        show-console-report-log: true
        # 美化日志
        format-console-log-json: true
```



## 集成Spring Security

当我们集成`Spring Security`时，直接访问 [http://localhost:8080](http://localhost:8080) 就可以查看`ApiBoot Logging Admin`提供的可视化界面，不过为了安全起见，我们添加`Spring Security`依赖并对应配置内存用户信息，在`pom.xml`文件内添加依赖如下所示：

```xml
<!--Spring Security-->
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-security</artifactId>
</dependency>
```



### 配置安全用户

`spring-boot-starter-security`依赖提供了内存方式配置用户信息，在`application.yml`文件配置用户如下所示：

```yaml
# 服务名称
spring:
  # 整合Spring Security，配置内存用户
  security:
    user:
      name: admin
      password: admin123
```

## 运行测试

通过`XxxApplication`方式启动本章项目。

在浏览器内访问 [http://localhost:8080](http://localhost:8080) 地址，效果如下所示：

![](/images/post/apiboot-logging-admin-visual-interface-management-log-1.png)

因为`Spring Security`的安全拦截，会直接跳转到`ApiBoot Logging Admin`内置的登录页面，输入我们在`application.yml`配置的`用户名`、`密码`即可登录。

### 链路日志列表

登录成功后会跳转到`链路日志`列表页面，点击`每一行链路日志`都可以`展开查看详情`，效果如下所示：

![](/images/post/apiboot-logging-admin-visual-interface-management-log-2.png)

### 日志服务列表

`日志服务`菜单内可以查看每一个服务的基本信息，最后上报的时间以及第一次上报日志的时间，如下图所示：

![](/images/post/apiboot-logging-admin-visual-interface-management-log-3.png)

## 敲黑板，划重点

`ApiBoot Logging Admin`目前支持可视化界面查看日志、服务基本信息，功能还在不断丰富，完整度有待提高。

## 代码示例
如果您喜欢本篇文章请为源码仓库点个`Star`，谢谢！！！
本篇文章示例源码可以通过以下途径获取，目录为`apiboot-logging-admin-visual-interface-management-log`：

- Gitee：[https://gitee.com/minbox-projects/api-boot-chapter](https://gitee.com/minbox-projects/api-boot-chapter)
---
id: apiboot-swagger-integrated-oauth
title: Swagger2怎么整合OAuth2来在线调试接口？
sort_title: Swagger2怎么整合OAuth2来在线调试接口？
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: false
news: true
disable_toc: false
customize: false
tags: [ApiBoot,Swagger2]
categories: [ApiBoot]
keywords: swagger,apiboot,oauth
date: 2019-12-18 17:05:58
description: 'Swagger2怎么整合OAuth2来在线调试接口？'
article_url:
---
## 前言

`Swagger2`作为侵入式文档中比较出色的一员，支持接口认证的在线调试肯定是不在话下的，当我们在调用`OAuth2`所保护的接口时，需要将有效的`AccessToken`作为请求`Header`内`Authorization`的值时，我们才拥有了访问权限，那么我们在使用`Swagger`在线调试时该设置`AccessToken`的值呢？
<!--more-->
本文所需ApiBoot相关链接：

- [ApiBoot官网](https://apiboot.minbox.org/)
- [ApiBoot全组件系列文章](https://blog.yuqiyu.com/apiboot-all-articles.html)
- [ApiBoot Gitee源码仓库（欢迎Contributor）](https://gitee.com/minbox-projects/api-boot)
- [ApiBoot GitHub源码仓库（欢迎Contributor）](https://github.com/minbox-projects/api-boot)

## 创建示例项目
在之前文章「[使用Swagger2作为文档来描述你的接口信息](https://blog.yuqiyu.com/apiboot-swagger-describe-the-interface.html)」我们已经讲到了使用`Swagger2`来简单的描述接口，提供可视化在线的接口文档，我们本章的主要目的是来集成使用`OAuth2`实现在线调试接口，我们把之前章节测试的接口`UserController`复制到本篇文章中以便于测试，本章项目`pom.xml`依赖如下所示：
```xml
<dependencies>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
  </dependency>
  <dependency>
    <groupId>org.minbox.framework</groupId>
    <artifactId>api-boot-starter-swagger</artifactId>
  </dependency>
  <dependency>
    <groupId>org.minbox.framework</groupId>
    <artifactId>api-boot-starter-security-oauth-jwt</artifactId>
  </dependency>
</dependencies>
<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>org.minbox.framework</groupId>
      <artifactId>api-boot-dependencies</artifactId>
      <version>2.2.1.RELEASE</version>
      <type>pom</type>
      <scope>import</scope>
    </dependency>
  </dependencies>
</dependencyManagement>
```

如果你看过`ApiBoot Security`、`ApiBoot OAuth`你应该知道，通过`application.yml`文件简单的几行配置就可以集成`Spring Security`整合`OAuth2`，本章来使用**内存方式**配置`用户列表`以及`客户端列表`。

> ApiBoot Security & ApiBoot OAuth组件使用系列文章：[https://blog.yuqiyu.com/apiboot-all-articles.html](https://blog.yuqiyu.com/apiboot-all-articles.html)
>
> 如果你想深入的了解这个神奇的`ApiBoot`安全组件，可以通过依赖文章汇总链接学习。

## 启用ApiBoot Swagger

通过`@EnableApiBootSwagger`注解来启用`ApiBoot Swagger`相关功能，在`XxxApplication`入口类配置如下所示：

```java
@SpringBootApplication
@EnableApiBootSwagger
public class ApibootSwaggerIntegratedOauthApplication {

    public static void main(String[] args) {
        SpringApplication.run(ApibootSwaggerIntegratedOauthApplication.class, args);
    }

}
```



## 配置ApiBoot Security

使用`grant_type=password`获取`AccessToken`时，需要我们传递用户的`username`、`password`，使用默认的内存方式配置我们只需要在`application.yml`文件内添加如下配置：

```yaml
api:
  boot:
    security:
      # 配置安全用户列表
      users:
        - username: yuqiyu
          password: 123123
      # 资源保护路径前缀，默认为/api/**
      auth-prefix: /**
```

## 配置ApiBoot OAuth

我们来添加`OAuth2`所需要的客户端列表配置信息，使用默认的内存方式配置客户端的`client-id`、`client-secret`，只需要修改`application.yml`文件内容如下所示：

```yaml
api:
  boot:
    oauth:
      # 配置OAuth客户端列表
      clients:
        - clientId: minbox
          clientSecret: chapter
```

## 了解资源文件排除拦截

`Swagger2`可视化界面有很多静态资源组成，比如：`js/css/images`等，而集成`Spring Security`后这些资源需要排除权限拦截才可以访问到，如果是使用传统的方式整合`Spring Security`，需要使用`WebSecurity`来进行忽略路径才可以，而通过`ApiBoot Security`则是不用考虑这一点，在内部已经对`Swagger`的静态资源文件做出了排除。

## 运行测试

通过`Application`方式启动本章项目，`Swagger`可视化界面访问：[http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

### 获取AccessToken

通过`CURL`方式获取用户：`yuqiyu`的请求令牌，如下所示：

```bash
➜ ~ curl -X POST minbox:chapter@localhost:8080/oauth/token -d 'grant_type=password&username=yuqiyu&password=123123'
{"access_token":"304676a4-b9a6-4c4d-af40-e439b934aba8","token_type":"bearer","refresh_token":"ee2b5744-6947-4677-862e-fcf9517afca5","expires_in":7199,"scope":"api"}
```

### Swagger在线调试

我们把获取的`AccessToken`与类型进行组合成：`Bearer 304676a4-b9a6-4c4d-af40-e439b934aba8`，将该令牌字符串配置到`Swagger`界面上，如下图所示：

![](https://blog.yuqiyu.com/images/post/apiboot-swagger-integrated-oauth-1.png)

输入后点击`Authorize`按钮即可。

## 敲黑板，划重点

`Swagger`的在线调试其实内部是模拟发送请求，将界面上输入的参数进行组合装配，发送到需要测试的接口路径，而上图设置`AccessToken`，也是一个临时保存，**刷新页面就会丢失**，发送请求时会自动追加到`Request Header`列表内。

## 代码示例

如果您喜欢本篇文章请为源码仓库点个`Star`，谢谢！！！
本篇文章示例源码可以通过以下途径获取，目录为`apiboot-swagger-integrated-oauth`：

- Gitee：[https://gitee.com/minbox-projects/api-boot-chapter](https://gitee.com/minbox-projects/api-boot-chapter)
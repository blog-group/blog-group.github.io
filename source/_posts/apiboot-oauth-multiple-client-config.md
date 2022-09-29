---
id: apiboot-oauth-multiple-client-config
title: OAuth2在内存、Redis、JDBC方式下的多客户端配置
sort_title: OAuth2在内存、Redis方式下的多客户端配置
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: true
news: true
disable_toc: false
customize: false
tags:
  - ApiBoot
categories:
  - ApiBoot
keywords: oauth,客户端,apiboot
description: 'OAuth2在内存、Redis、JDBC方式下的多客户端配置'
date: 2019-12-31 09:37:53
article_url:
---

`Spring`所提供的`OAuth2`集成策略，支持多种方式存储`认证信息`以及`客户端信息`，由于在之前的文章中讲解使用时把知识点进行了拆分，有很多同学不太会组合使用，很多单独问我`ApiBoot`所提供的`OAuth2`的整合后，多个客户端该怎么配置？
<!--more-->
本章就来讲讲如果我们使用`内存方式`、`Redis方式`做`OAuth2`相关信息存储时，该如何配置多个客户端！！！

## 系列文章

`ApiBoot`针对每一个组件都提供一系列的拆分详解文章，详情请访问 [ApiBoot开源框架各个组件的系列使用文章汇总](https://blog.yuqiyu.com/apiboot-all-articles.html) 。

## 前言

`ApiBoot`集成`OAuth2`后`内存方式`与`Redis方式`的客户端配置都位于`application.yml/application.properties`配置文件内，通过源码发现`Spring`提供了一个接口 **TokenStore** 来定义操作认证信息的方法列表，实现该接口后就可以定义不同的存储方式具体的逻辑，当前我们也可以进行自定义，只需要将自定义实现类的实例交付给`Spring IOC`进行托管就即可，`OAuth2`内部就会调用自定义的实现类来处理业务（**在内部都是通过接口来操作，不关心实例是哪个实现类**）。

当然`Spring`在整合`OAuth2`后也提供了一些内置的`TokenStore`实现类，如下所示：

- **InMemoryTokenStore**

  将`客户端信息`以及生成的`AccessToken`存放在**内存**中，项目重启后之前生成的`AccessToken`就会丢失，而`ApiBoot OAuth`在项目启动时会自动加载`application.yml`配置文件的客户端列表，所以客户端信息不会丢失。

- **JdbcTokenStore**

  将`客户端信息`以及生成的`AccessToken`存放在**数据库**中，项目重启后不影响认证，表结构由`OAuth2`提供。

- **RedisTokenStore**

  将`客户端信息`以及生成的`AccessToken`存放在 **Redis**中，支持分布式部署，`AccessToken`默认过期时间为`7200`秒，过期后也会自动被删除，使用起来比较方便，`ApiBoot OAuth`只需要修改`api.boot.oauth.away=redis`就可以启用这种方式。

- **JwtTokenStore**

  主要功能是使用`Jwt`进行转换`AccessToken`，并不做数据`AccessToken`的存储。

  

## 客户端配置源码分析

当我们使用`ApiBoot OAuth2`提供的`内存方式`、`Redis方式`来集成使用时，客户端列表的配置都位于`application.yml`，使用`api.boot.oauth.clients`配置参数进行指定，那这个参数所对应的源码位于 [ApiBootOauthProperties](https://gitee.com/minbox-projects/api-boot/blob/master/api-boot-project/api-boot-autoconfigure/src/main/java/org/minbox/framework/api/boot/autoconfigure/oauth/ApiBootOauthProperties.java) 属性配置类内。

在`ApiBoot`最初发行版中客户端只允许配置一个，根据使用者的反馈进行了迭代更新后支持了多个客户端的配置，对应`ApiBootOauthProperties`属性配置类内的`clientis`字段，源码如下所示：

```java
/**
  * configure multiple clients
  */
private List<Client> clients = new ArrayList() {{
  add(new Client());
}};
```

`clients`字段默认值为一个`Client`的对象实例，而`Client`则是为`ApiBootOauthProperties`的一个内部类，如下所示：

```java
/**
 * Oauth2 Client
 * Used to configure multiple clients
 */
@Data
public static class Client {
    /**
     * oauth2 client id
     */
    private String clientId = "ApiBoot";
    /**
     * oauth2 client secret
     */
    private String clientSecret = "ApiBootSecret";
    /**
     * oauth2 client grant types
     * default value is "password,refresh_token"
     */
    private String[] grantTypes = new String[]{"password", "refresh_token"};
    /**
     * oauth2 client scope
     * default value is "api"
     */
    private String[] scopes = new String[]{"api"};
    /**
     * oauth2 application resource id
     * default value is "api"
     */
    private String[] resourceId = new String[]{"api"};
    /**
     * oauth2 access token validity seconds
     * default value is 7200 second
     */
    private int accessTokenValiditySeconds = 7200;
}
```

根据`Client`类我们也就可以明白了，为什么`ApiBoot OAuth`在集成时不配置`客户端`也可以使用`ApiBoot:ApiBootSecret`来进行获取`AccessToken`，因为在`ApiBootOauthProperties`属性配置类中有一个默认的`Client`对象实例。

> 注意事项：当我们配置`api.boot.oauth.clients`参数时默认的客户端会被覆盖掉

## 示例项目

既然我们知道了使用`api.boot.oauth.clients`可以配置多个客户端，那么接下来我们创建一个测试的项目，使用`IDEA`创建一个`SpringBoot`项目，项目`pom.xml`文件内容如下所示：

```xml
<dependencies>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
  </dependency>
  <!--ApiBoot Security OAuth-->
  <dependency>
    <groupId>org.minbox.framework</groupId>
    <artifactId>api-boot-starter-security-oauth-jwt</artifactId>
  </dependency>
</dependencies>

<dependencyManagement>
  <dependencies>
    <!--ApiBoot统一版本依赖-->
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

### 配置多客户端

看过`ApiBoot OAuth2`系列文章的同学都应该知道，默认使用`内存方式`进行存储生成的`AccessToken`，这一点我们就不做修改了，如果你项目不是使用默认，可以去参考 [ApiBoot开源框架各个组件的系列使用文章汇总](https://blog.yuqiyu.com/apiboot-all-articles.html) 内安全组件分类下的文章。

在`application.yml`文件内添加客户端列表配置，如下所示：

```yaml
api:
  boot:
    # ApiBoot OAuth 相关配置
    oauth:
      clients:
        - clientId: minbox
          clientSecret: chapter
        - clientId: hengboy
          clientSecret: 123123
    # ApiBoot Security 相关配置
    security:
      users:
        - username: yuqiyu
          password: 123456
```

> 由于`api-boot-starter-security-oauth-jwt`依赖是`Spring Security`与`OAuth2`的整合，所以我们想要获取`AccessToken`需要配置`Spring Security`的用户列表，即`api.boot.security.users`参数，默认同样是内存方式存储，详见：[ApiBoot实现零代码整合Spring Security & OAuth2](https://blog.yuqiyu.com/apiboot-security-oauth-zero-code-integration.html)

## 运行测试

通过`XxxApplication`方式启动本章项目，通过Curl命令测试获取`AccessToken`，如下所示：

```json
➜  ~ curl -X POST minbox:chapter@localhost:8080/oauth/token -d 'grant_type=password&username=yuqiyu&password=123456'
{"access_token":"bf2d67b8-c7a4-4f5c-846e-a6f1c7e44a9d","token_type":"bearer","refresh_token":"522507a2-30e5-4d86-a997-c991c3cb0807","expires_in":7191,"scope":"api"}
```

在上面命令行中，我们通过`minbox:chapter`客户端进行测试获取`AccessToken`，接下来我们验证是否两个客户端都已经生效，下面使用`hengboy:123123`客户端尝试：

```json
➜  ~ curl -X POST hengboy:123123@localhost:8080/oauth/token -d 'grant_type=password&username=yuqiyu&password=123456'                    
{"access_token":"62b8da93-27cd-4963-8612-8e94036c4d78","token_type":"bearer","refresh_token":"4e516a7f-db52-4f40-ab92-c6b43cd62294","expires_in":7200,"scope":"api"}
```

根据输出来看，是可以获取到`AccessToken`的，多客户端配置都已经生效。

## 敲黑板，划重点

其实`ApiBoot Security OAuth`有很多配置都可以组合使用，不过跨越存储方式的配置有的是无法相互组合使用的，比如：当你使用`Jdbc`方式来存储认证信息时，即使我们配置了`api.boot.oauth.clients`参数，这时也是没有任何作用的，因为使用数据库方式来读取客户端信息时，`OAuth2`通过`JdbcClientDetailsService`类从数据库的`oauth_client_details`表内查询客户端列表，我们如果想要添加客户端，这时就需要向`oauth_client_details`表内添加一条数据。

## 代码示例
如果您喜欢本篇文章请为源码仓库点个`Star`，谢谢！！！
本篇文章示例源码可以通过以下途径获取，目录为`apiboot-oauth-multiple-client-config`：

- Gitee：[https://gitee.com/minbox-projects/api-boot-chapter](https://gitee.com/minbox-projects/api-boot-chapter)

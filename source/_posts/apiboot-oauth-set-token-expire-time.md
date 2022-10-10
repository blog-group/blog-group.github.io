---
id: apiboot-oauth-set-token-expire-time
title: 来看看OAuth2怎么设置AccessToken有效期时间时长
sort_title: OAuth2设置AccessToken的过期时间
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: false
news: true
disable_toc: false
customize: false
tags: [ApiBoot,OAuth2,Spring Security]
categories: [ApiBoot]
keywords: oauth2过期时间,accesstoken,apiboot
description: '来看看OAuth2怎么设置AccessToken有效期时间时长'
date: 2019-12-11 09:45:07
article_url:
---
`OAuth2`所生成的`AccessToken`以及`RefreshToken`都存在过期时间，当在有效期内才可以拿来作为会话身份发起请求，否者`认证中心`会直接拦截无效请求提示`已过期`，那么我们怎么修改这个过期时间来满足我们的业务场景呢？
<!--more-->

目前一线大厂所使用的的`AccessToken`的有效期一般都是`7200秒`，也就是`2小时`，而且有获取的次数限制，所以发起请求的一方必须通过一定的形式保存到本地，以方便下一次发起请求时，写入请求的`header`或者作为参数携带。

本章来讲解下使用`ApiBoot OAuth`组件该怎么去设置`AccessToken`的过期时间，针对`memory`(内存方式)、`jdbc`(数据库)这两种方式来讲解，更多使用请参考官方文档：

- ApiBoot OAuth官方文档：[https://apiboot.minbox.org/zh-cn/docs/api-boot-oauth.html](https://apiboot.minbox.org/zh-cn/docs/api-boot-oauth.html)

## 默认有效时长
`ApiBoot OAuth`在`memory`存储方式下为每一个`客户端`都提供了一个默认的`AccessToken`有效时长，该配置在`org.minbox.framework.api.boot.autoconfigure.oauth.ApiBootOauthProperties`，相关源码如下所示：

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
`Client`是`ApiBootOauthProperties`的一个内部类，主要是提供了`OAuth2 客户端`的相关配置字段，通过`spring-boot-configuration-processor`依赖将该类自动解析成`配置元数据`，这样我们在`application.yml`输入`api.xxx`时可以得到相应的提示。

在`Client`内部类中有一个字段`accessTokenValiditySeconds`，通过该字段我们来修改该客户端下所有用户生成的`AccessToken`默认过期时长，值得注意的是，这里的配置值时间单位是`秒`，`7200秒 = 2小时`。

## 内存方式

在上面说到了，内存方式时`ApiBoot OAuth`会使用`ApiBootOauthProperties#Client`内部类的`accessTokenValiditySeconds`字段来配置过期时间，所以我们只需要在`application.yml`添加如下配置即可：

```yaml
api:
  boot:
    oauth:
      clients:
        - clientId: minbox
          clientSecret: chapter
          # 配置客户端Token过期时长，单位：秒
          accessTokenValiditySeconds: 43200
    security:
      users:
        - username: yuqiyu
          password: 123123
```

在上面配置中，我们添加了一个在内存存储的`minbox`客户端，设置`accessTokenValiditySeconds`过期时间字段为`43200秒 = 12小时`。

## JDBC方式

`JDBC`方式是`ApiBoot OAuth`无法控制的，因为`OAuth2`当使用`JDBC`方式进行存储客户端、令牌等信息时，都是通过`OAuth2`提供的固定的表进行操作，正因为如此我们只需要修改`oauth_client_details`表内每一条`client`信息的`access_token_validity`字段的值即可，时间单位同样也是`秒`，如下图所示：

![](https://blog.yuqiyu.com/images/post/apiboot-oauth-set-token-expire-time-1.png)

`OAuth2`提供的`MySQL`版本的建表语句请访问[ApiBoot OAuth Starter](https://gitee.com/minbox-projects/api-boot/blob/master/api-boot-project/api-boot-starters/api-boot-starter-security-oauth-jwt/oauth-mysql.sql)查看。

## 运行测试

下面来测试下修改后的过期时间是否已经生效，我们先来启动本章的项目示例。

通过`CURL`的方式获取`AccessToken`，如下所示：

```json
➜ ~ curl -X POST minbox:chapter@localhost:9090/oauth/token -d 'grant_type=password&username=yuqiyu&password=123123'
{"access_token":"41127985-1b31-4413-ac9f-30d5e26f4aaf","token_type":"bearer","refresh_token":"0a39ca6a-8697-4f80-9bb1-ac59894a45dd","expires_in":43199,"scope":"api"}
```

通过`PostMan`方式获取`AccessToken`如下图所示：

![](https://blog.yuqiyu.com/images/post/apiboot-oauth-set-token-expire-time-2.png)

我们根据结果可以看到，由原本默认的`7200`修改成了我们在`application.yml`配置的`43200`（结果中的`43199`是因为生成token耗时差导致的）。

## 敲黑板，划重点

`ApiBoot`的宗旨就是化繁为简，能使用配置简单搞定的事情，绝不拖泥带水，赶快分享下本篇文章吧，让更多人得到帮助，非常感谢~~~

> `ApiBoot OAuth`可以一次配置多个客户端，并且为每一个客户端配置不同的过期时间。

## 代码示例
如果您喜欢本篇文章请为源码仓库点个`Star`，谢谢！！！
本篇文章示例源码可以通过以下途径获取，目录为`apiboot-oauth-set-token-expire-time`：

- Gitee：[https://gitee.com/minbox-projects/api-boot-chapter](https://gitee.com/minbox-projects/api-boot-chapter)

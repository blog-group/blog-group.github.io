---
id: apiboot-security-oauth-use-jwt
title: 还不会使用JWT格式化OAuth2令牌吗？
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
keywords: OAuth2,jwt,apiboot
description: '还不会使用JWT格式化OAuth2令牌吗？'
date: 2019-12-09 15:53:47
article_url:
---
`OAuth2`默认的`AccessToken`是由`DefaultAccessTokenConverter`生成，是具有唯一性的`UUID`随机字符串，我们如果想要使用`JWT`来格式化`AccessToken`就需要使用`JwtAccessTokenConverter`来进行格式化，当然如果你有自己独特的业务可以自己实现`AccessTokenConverter`接口，并将实现类交付给`IOC`托管即可。
<!--more-->
`ApiBoot`内部集成了`DefaultAccessTokenConverter`（默认）、`JwtAccessTokenConverter`，只需要一个配置就可以实现相互转换。

## 相关文档

- ApiBoot OAuth2官方文档：[https://apiboot.minbox.org/zh-cn/docs/api-boot-oauth.html](https://apiboot.minbox.org/zh-cn/docs/api-boot-oauth.html)
- ApiBoot 开源源码：[minbox-projects/api-boot](https://gitee.com/minbox-projects/api-boot)

## JWT加密秘钥
对`JWT`了解的同学应该知道，它内部不可逆的部分采用的是`RSA`加密，在加密过程中需要一个`秘钥`，在`JwtAccessTokenConverter`实现类中采用了**6位随机字符串**作为秘钥，相关源码如下：
```java
/**
 * Helper that translates between JWT encoded token values and OAuth authentication
 * information (in both directions). Also acts as a {@link TokenEnhancer} when tokens are
 * granted.
 *
 * @see TokenEnhancer
 * @see AccessTokenConverter
 *
 * @author Dave Syer
 * @author Luke Taylor
 */
public class JwtAccessTokenConverter implements TokenEnhancer, AccessTokenConverter, InitializingBean {
  .....

	private String verifierKey = new RandomValueStringGenerator().generate();

	private Signer signer = new MacSigner(verifierKey);

	private String signingKey = verifierKey;
}  
```

这种形式虽然在某一些层面上是唯一的，实在感觉不太严谨，所以`ApiBoot`添加一个配置，可以自定义这个加密秘钥`signingKey`字段。

## 创建示例项目

为了本章的演示效果，我们使用`IDEA`来创建一个`SpringBoot`项目，`pom.xml`文件内相关的依赖如下所示：

```xml
<dependencies>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
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
      <version>2.2.0.RELEASE</version>
      <type>pom</type>
      <scope>import</scope>
    </dependency>
  </dependencies>
</dependencyManagement>
```

依赖添加完成后下面我们配置下测试的`用户`以及`客户端信息`。

### 配置内存用户

我们在获取`AccessToken`时使用的`password`授权类型，所以我们需要在`application.yml`文件内配置`登录用户`所使用的用户名、密码，如下所示：

```yaml
api:
  boot:
    security:
      users:
        - username: yuqiyu
          password: 123456
```

> 本章为了演示`JWT`格式化`AccessToken`，验证的用户采用内存方式配置，[了解详情](https://apiboot.minbox.org/zh-cn/docs/api-boot-security.html)。

### 开启JWT转换

`ApiBoot OAuth2`默认使用`DefaultAccessTokenConverter`实现类来格式化`AccessToken`，如果我们想要切换到`JwtAccessTokenConverter`，需要在`application.yml`添加一个配置，如下所示：

```yaml
api:
  boot:
    oauth:
      # 启用JWT，用于格式化AccessToken
      jwt:
        enable: true
```

### 配置加密秘钥

在本文开头说到了`JwtAccessTokenConverter`实现类内采用的是6位随机字符串的方式来作为`RSA`加密的秘钥，`ApiBoot OAuth2`提供了参数配置可以进行自定义，如下所示：

```yaml
api:
  boot:
    oauth:
      jwt:
        # 加密秘钥
        sign-key: 恒宇少年
```

> 秘钥格式不限，如：`特殊字符串`、`汉字`、`数字`、`字母`....

## 运行测试

见证奇迹的时刻到了，我们通过`IDEA`的`XxxApplication`方式来启动本章项目，尝试使用`CURL`方式获取`AccessToken`如下所示：

```json
➜ ~ curl ApiBoot:ApiBootSecret@localhost:9090/oauth/token -d 'grant_type=password&username=yuqiyu&password=123456'
{
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOlsiYXBpIl0sInVzZXJfbmFtZSI6Inl1cWl5dSIsInNjb3BlIjpbImFwaSJdLCJleHAiOjE1NzU5NTMwNDgsImF1dGhvcml0aWVzIjpbIlJPTEVfYXBpIl0sImp0aSI6ImQxMDNmNDYwLTk3YzMtNGNiZS05OWM4LWYzZjU2MmRhMDZhOCIsImNsaWVudF9pZCI6IkFwaUJvb3QifQ.HMHRBCIGPZNlkJPCnXaktMWxXEW-5roo7tdQR1JpCyY", 
    "token_type": "bearer", 
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOlsiYXBpIl0sInVzZXJfbmFtZSI6Inl1cWl5dSIsInNjb3BlIjpbImFwaSJdLCJhdGkiOiJkMTAzZjQ2MC05N2MzLTRjYmUtOTljOC1mM2Y1NjJkYTA2YTgiLCJleHAiOjE1Nzg1Mzc4NDgsImF1dGhvcml0aWVzIjpbIlJPTEVfYXBpIl0sImp0aSI6ImY1NDMxZTMzLWE1YzMtNGVmNC1hZDM0LTk1MGQ3ODliYTRiZCIsImNsaWVudF9pZCI6IkFwaUJvb3QifQ.TfJ5vThvaibV2kVo2obHqnYzmYm-GsdtRLoB3RJbkrg", 
    "expires_in": 6925, 
    "scope": "api", 
    "jti": "d103f460-97c3-4cbe-99c8-f3f562da06a8"
}
```

> `ApiBoot OAuth`有默认的客户端配置信息为`ApiBoot`、`ApiBootSecret`，为了方便演示，这里没做修改，如需修改请查看[ApiBoot OAuth文档](https://apiboot.minbox.org/zh-cn/docs/api-boot-oauth.html)，如果你感觉控制台打印的`json`不美观，阅读性太差，可以使用[在线格式化JSON工具](http://tools.yuqiyu.com/pages/formatter/json.html).

## 敲黑板，划重点

使用`ApiBoot`来格式化`OAuth2`的`AccessToken`是不是特别简单？省去了我们自己去创建`JwtAccessTokenConverter`实例，然后还需要将实例放入`IOC`繁琐的步骤，更多使用详解敬请期待~~

## 代码示例
如果您喜欢本篇文章请为源码仓库点个`Star`，谢谢！！！
本篇文章示例源码可以通过以下途径获取，目录为`apiboot-security-oauth-use-jwt`：

- Gitee：[https://gitee.com/minbox-projects/api-boot-chapter](https://gitee.com/minbox-projects/api-boot-chapter)
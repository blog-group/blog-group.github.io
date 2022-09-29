---
id: oauth2-always-create-token
title: Spring OAuth2 实现始终获取新的令牌
sort_title: OAuth2 始终获取新的令牌
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: true
news: true
disable_toc: false
customize: false
tags:
  - SpringBoot
categories:
  - SpringBoot
keywords: 'OAuth2,Spring,AccessToken,RefreshToken'
description: oauth2-always-create-token
date: 2021-04-21 11:14:41
article_url:
---

`Spring`基于`OAuth2`协议编写的`spring-oauth2`实现，是行业级的接口资源安全解决方案，我们可以基于该依赖配置不同客户端的不同权限来访问接口数据。

## 默认令牌生成方式

每当我们获取请求令牌（`access_token`）时，默认情况返回第一次生成的令牌，使用同一个用户多次获取令牌时，只有过期时间在缩短，其它的内容不变。

这种方式有利有弊，如果同一个账户只能有一个人登录，这样是没有任何问题的，但是如果同一个账号可以让多个人同时登录，那么就会存在一定的问题。

比如我们现在有一个名为`hengboy`的账户：第一个人登录时令牌有效期为我们配置的最长有效期（假设为`7200`秒），这时又有第二个人登录的同一个用户，第二个人获取的令牌并不会重置有效期（可能还剩下`3000`秒），对于**这种结果并不是我们期望的**。

### 原因分析

目前`spring-oauth2`依赖内集成了三种存储令牌的方式，分别是：`InMemoryTokenStore（内存方式）`、`RedisTokenStore（Redis方式）`、`JdbcTokenStore（数据库方式）`。

从阅读源码中可以发现无论我们配置使用什么方式来进行存储令牌，同一个账户的有效令牌只会存在一个，结合上面的场景来思考所以第二个人获取的令牌与第一个人是同一个。

### DefaultTokenServices

`DefaultTokenServices`令牌服务是`AuthorizationServerTokenServices`接口的默认实现，位于`org.springframework.security.oauth2.provider.token`包内，提供了默认的操作令牌的方法，常用的有：

- `createAccessToken`：根据客户端信息、登录用户信息来创建请求令牌（`access_token`）以及刷新令牌（`refresh_token`）
- `refreshAccessToken`：根据刷新令牌（`refresh_token`）来获取一个全新的请求令牌（`access_token`）
- `revokeToken`：撤销令牌，删除用户生成的请求令牌（`access_token`）、刷新令牌（`refresh_token`）

### 源码解析：生成令牌

**DefaultTokenServices#createAccessToken：**

```java
@Transactional
    public OAuth2AccessToken createAccessToken(OAuth2Authentication authentication) throws AuthenticationException {
        OAuth2AccessToken existingAccessToken = this.tokenStore.getAccessToken(authentication);
        OAuth2RefreshToken refreshToken = null;
        if (existingAccessToken != null) {
            if (!existingAccessToken.isExpired()) {
                this.tokenStore.storeAccessToken(existingAccessToken, authentication);
                return existingAccessToken;
            }

            if (existingAccessToken.getRefreshToken() != null) {
                refreshToken = existingAccessToken.getRefreshToken();
                this.tokenStore.removeRefreshToken(refreshToken);
            }

            this.tokenStore.removeAccessToken(existingAccessToken);
        }

        if (refreshToken == null) {
            refreshToken = this.createRefreshToken(authentication);
        } else if (refreshToken instanceof ExpiringOAuth2RefreshToken) {
            ExpiringOAuth2RefreshToken expiring = (ExpiringOAuth2RefreshToken)refreshToken;
            if (System.currentTimeMillis() > expiring.getExpiration().getTime()) {
                refreshToken = this.createRefreshToken(authentication);
            }
        }

        OAuth2AccessToken accessToken = this.createAccessToken(authentication, refreshToken);
        this.tokenStore.storeAccessToken(accessToken, authentication);
        refreshToken = accessToken.getRefreshToken();
        if (refreshToken != null) {
            this.tokenStore.storeRefreshToken(refreshToken, authentication);
        }

        return accessToken;
    }
```

在创建令牌的源码方法中，首先根据认证信息去读取存储介质（`TokenStore`实现类）内该账户的令牌，如果令牌已经存储并且并未过期，则直接返回（`这也就是同一个账户不同人登录时返回同一个令牌的逻辑`），如果令牌已经过期，则删除刷新令牌（`refresh_token`）、请求令牌（`access_token`）后重新生成。

### 源码解析：刷新令牌

**DefaultTokenServices#refreshAccessToken：**

```java
@Transactional(
        noRollbackFor = {InvalidTokenException.class, InvalidGrantException.class}
    )
    public OAuth2AccessToken refreshAccessToken(String refreshTokenValue, TokenRequest tokenRequest) throws AuthenticationException {
        if (!this.supportRefreshToken) {
            throw new InvalidGrantException("Invalid refresh token: " + refreshTokenValue);
        } else {
            OAuth2RefreshToken refreshToken = this.tokenStore.readRefreshToken(refreshTokenValue);
            if (refreshToken == null) {
                throw new InvalidGrantException("Invalid refresh token: " + refreshTokenValue);
            } else {
                OAuth2Authentication authentication = this.tokenStore.readAuthenticationForRefreshToken(refreshToken);
                if (this.authenticationManager != null && !authentication.isClientOnly()) {
                    Authentication userAuthentication = authentication.getUserAuthentication();
                    PreAuthenticatedAuthenticationToken preAuthenticatedToken = new PreAuthenticatedAuthenticationToken(userAuthentication, "", authentication.getAuthorities());
                    if (userAuthentication.getDetails() != null) {
                        preAuthenticatedToken.setDetails(userAuthentication.getDetails());
                    }

                    Authentication user = this.authenticationManager.authenticate(preAuthenticatedToken);
                    Object details = authentication.getDetails();
                    authentication = new OAuth2Authentication(authentication.getOAuth2Request(), user);
                    authentication.setDetails(details);
                }

                String clientId = authentication.getOAuth2Request().getClientId();
                if (clientId != null && clientId.equals(tokenRequest.getClientId())) {
                    this.tokenStore.removeAccessTokenUsingRefreshToken(refreshToken);
                    if (this.isExpired(refreshToken)) {
                        this.tokenStore.removeRefreshToken(refreshToken);
                        throw new InvalidTokenException("Invalid refresh token (expired): " + refreshToken);
                    } else {
                        authentication = this.createRefreshedAuthentication(authentication, tokenRequest);
                        if (!this.reuseRefreshToken) {
                            this.tokenStore.removeRefreshToken(refreshToken);
                            refreshToken = this.createRefreshToken(authentication);
                        }

                        OAuth2AccessToken accessToken = this.createAccessToken(authentication, refreshToken);
                        this.tokenStore.storeAccessToken(accessToken, authentication);
                        if (!this.reuseRefreshToken) {
                            this.tokenStore.storeRefreshToken(accessToken.getRefreshToken(), authentication);
                        }

                        return accessToken;
                    }
                } else {
                    throw new InvalidGrantException("Wrong client for this refresh token: " + refreshTokenValue);
                }
            }
        }
    }
```

在刷新令牌的源码方法中，首先需要读取刷新令牌（`refresh_token`）的具体内容，如果不存在则直接抛出刷新令牌无效的异常`InvalidGrantException`。

执行令牌刷新之前，需要根据刷新令牌删除请求令牌`removeAccessTokenUsingRefreshToken`，删除后再次判定刷新令牌是否失效，如果失效抛出`InvalidTokenException`异常。

刷新令牌的重复使用是根据全局变量`reuseRefreshToken`来判定的，默认情况下该变量的值为`true`，也就是刷新令牌可以重复使用，但是经过`createAccessToken > TokenEnhancer#enhance`处理后刷新令牌会被重新创建并替换（这个地方貌似是一个Bug）。

## 重写TokenServices

### 期望效果

假设请求令牌（`access_token`）的有效期为`7200`秒，也就是`2`个小时，刷新令牌（`refresh_token`）的有效期为`43200`秒，也就是`12`个小时。

在第一次通过`createAccessToken`获取令牌后，每次请求令牌（`access_token`）过期后通过刷新的方式（`/oauth/token?grant_type=refresh_token`）重新获取一次新的（`有效期为2个小时`）请求令牌，当刷新令牌（`refresh_token`）失效后，再次通过`createAccessToken`方法来获取令牌。

### 分析期望效果

针对上面的期望效果我们需要修改`createAccessToken`、`refreshAccessToken`两个方法的源码，调用`createAccessToken`方法时不再判定是否使用已经存在的有效令牌，而调用`refreshAccessToken`方法时需要删除响应的`refresh_token`的返回字段并把新的请求令牌与刷新令牌进行绑定。

### OverrideTokenServices

复制`DefaultTokenServices`类内的全部代码，创建一个名为`OverrideTokenServices`的类，为了兼容原来的逻辑，需要添加一个全局变量`alwaysCreateToken`，用于判定是否始终创建令牌。

### 重写创建令牌逻辑

```java
@Transactional
    public OAuth2AccessToken createAccessToken(OAuth2Authentication authentication) throws AuthenticationException {
        OAuth2RefreshToken refreshToken = null;
        OAuth2AccessToken existingAccessToken = this.tokenStore.getAccessToken(authentication);
        // 根据alwaysCreateToken字段判定是否始终创建令牌
        if (!this.alwaysCreateToken && existingAccessToken != null) {
            if (!existingAccessToken.isExpired()) {
                this.tokenStore.storeAccessToken(existingAccessToken, authentication);
                return existingAccessToken;
            }

            if (existingAccessToken.getRefreshToken() != null) {
                refreshToken = existingAccessToken.getRefreshToken();
                this.tokenStore.removeRefreshToken(refreshToken);
            }

            this.tokenStore.removeAccessToken(existingAccessToken);
        }
        if (refreshToken == null) {
            refreshToken = this.createRefreshToken(authentication);
        } else if (refreshToken instanceof ExpiringOAuth2RefreshToken) {
            ExpiringOAuth2RefreshToken expiring = (ExpiringOAuth2RefreshToken)refreshToken;
            if (System.currentTimeMillis() > expiring.getExpiration().getTime()) {
                refreshToken = this.createRefreshToken(authentication);
            }
        }
        OAuth2AccessToken accessToken = this.createAccessToken(authentication, refreshToken);
        this.tokenStore.storeAccessToken(accessToken, authentication);
        refreshToken = accessToken.getRefreshToken();
        if (refreshToken != null) {
            this.tokenStore.storeRefreshToken(refreshToken, authentication);
        }

        return accessToken;
    }
```

> 如果我们想使用原来的逻辑，在初始化`OverrideTokenServices`类时需要设置`alwaysCreateToken`变量的值为`false`。

### 重写刷新令牌逻辑

```java
public OAuth2AccessToken refreshAccessToken(String refreshTokenValue, TokenRequest tokenRequest) throws AuthenticationException {
        if (!this.supportRefreshToken) {
            throw new InvalidGrantException("Invalid refresh token: " + refreshTokenValue);
        } else {
            OAuth2RefreshToken refreshToken = this.tokenStore.readRefreshToken(refreshTokenValue);
            if (refreshToken == null) {
                throw new InvalidGrantException("Invalid refresh token: " + refreshTokenValue);
            } else {
                OAuth2Authentication authentication = this.tokenStore.readAuthenticationForRefreshToken(refreshToken);
                if (this.authenticationManager != null && !authentication.isClientOnly()) {
                    Authentication userAuthentication = authentication.getUserAuthentication();
                    PreAuthenticatedAuthenticationToken preAuthenticatedToken = new PreAuthenticatedAuthenticationToken(userAuthentication, "", authentication.getAuthorities());
                    if (userAuthentication.getDetails() != null) {
                        preAuthenticatedToken.setDetails(userAuthentication.getDetails());
                    }

                    Authentication user = this.authenticationManager.authenticate(preAuthenticatedToken);
                    Object details = authentication.getDetails();
                    authentication = new OAuth2Authentication(authentication.getOAuth2Request(), user);
                    authentication.setDetails(details);
                }

                String clientId = authentication.getOAuth2Request().getClientId();
                if (clientId != null && clientId.equals(tokenRequest.getClientId())) {
                    this.tokenStore.removeAccessTokenUsingRefreshToken(refreshToken);
                    if (this.isExpired(refreshToken)) {
                        this.tokenStore.removeRefreshToken(refreshToken);
                        throw new InvalidTokenException("Invalid refresh token (expired): " + refreshToken);
                    } else {
                        authentication = this.createRefreshedAuthentication(authentication, tokenRequest);
                        if (!this.reuseRefreshToken) {
                            this.tokenStore.removeRefreshToken(refreshToken);
                            refreshToken = this.createRefreshToken(authentication);
                        }

                        DefaultOAuth2AccessToken accessToken = (DefaultOAuth2AccessToken) this.createAccessToken(authentication, refreshToken);
                        // If you reuse the refresh token, set the refresh token to the new AccessToken
                        // 如果重复使用刷新令牌，将刷新令牌与新生成的请求令牌进行绑定
                        if (this.reuseRefreshToken) {
                            accessToken.setRefreshToken(refreshToken);
                        }
                        this.tokenStore.storeAccessToken(accessToken, authentication);
                        if (!this.reuseRefreshToken) {
                            this.tokenStore.storeRefreshToken(accessToken.getRefreshToken(), authentication);
                        }
                        // No new token will be returned after refresh
                        // 刷新令牌后不再返回refresh_token
                        accessToken.setRefreshToken(null);
                        return accessToken;
                    }
                } else {
                    throw new InvalidGrantException("Wrong client for this refresh token: " + refreshTokenValue);
                }
            }
        }
    }
```

在`DefaultTokenServices`类中默认定义了全局变量`reuseRefreshToken`，该变量的值为`true`，表示默认情况下刷新令牌（`refresh_token`）是可以重复使用的，一般刷新令牌的过期时间都比较久，当请求令牌（`access_token`）失效后根据刷新令牌进行获取新的有效请求令牌。

## 配置TokenServices

我们需要在`AuthorizationServerConfigurerAdapter`实现类内进行配置`TokenServices`的替换使用，如下所示：

```java
/**
  * 实例化{@link OverrideTokenServices}
  *
  * @return {@link OverrideTokenServices}
  */
private AuthorizationServerTokenServices tokenServices() {
  OverrideTokenServices tokenServices = new OverrideTokenServices();
  tokenServices.setTokenStore(tokenStore());
  tokenServices.setAlwaysCreateToken(true);
  tokenServices.setSupportRefreshToken(true);
  tokenServices.setClientDetailsService(clientDetailsService);
  return tokenServices;
}

@Override
public void configure(AuthorizationServerEndpointsConfigurer endpoints) throws Exception {
  endpoints
    .authenticationManager(authenticationManager)
    .tokenStore(tokenStore())
    // 配置替换使用TokenServices
    .tokenServices(tokenServices());
}
```

## 测试

**获取令牌示例：**

```sh
第一次获取令牌：
yuqiyu@hengyu ~> curl -X POST -u "local:123456" http://localhost:9091/oauth/token -d "grant_type=password&username=hengboy&password=123456" | jsonpp
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   199    0   147  100    52    362    128 --:--:-- --:--:-- --:--:--   491
{
  "access_token": "qoL7Kg33-deYw-aw8PnIKK-qxEk",
  "token_type": "bearer",
  "refresh_token": "-OfFqllKZJC6-r_v_uR9KGUBXl0",
  "expires_in": 7199,
  "scope": "read"
}
第二次获取令牌：
yuqiyu@hengyu ~> curl -X POST -u "local:123456" http://localhost:9091/oauth/token -d "grant_type=password&username=hengboy&password=123456" | jsonpp
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   199    0   147  100    52    896    317 --:--:-- --:--:-- --:--:--  1213
{
  "access_token": "hfo01xMTVE1xxxbzQLY7vPfLXPE",
  "token_type": "bearer",
  "refresh_token": "QuLgm-H3xHzo71M_XSLrglsRs_o",
  "expires_in": 7199,
  "scope": "read"
}
```

可以看到上面使用同一个账号获取了两次令牌，而这两次的令牌内容是完全不同的，这也就是实现了针对同一个账号不同人登录时返回新的令牌的需求。

**刷新令牌示例：**

```sh
根据第一次获取的刷新令牌刷新：
yuqiyu@hengyu ~> curl -X POST -u "local:123456" http://localhost:9091/oauth/token -d "grant_type=refresh_token&refresh_token=-OfFqllKZJC6-r_v_uR9KGUBXl0" | jsonpp
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   167    0   101  100    66   1109    725 --:--:-- --:--:-- --:--:--  1835
{
  "access_token": "KuOprmzBCzC78NXlTkHvZGs9rhs",
  "token_type": "bearer",
  "expires_in": 7199,
  "scope": "read"
}
根据第二次获取的刷新令牌刷新：
yuqiyu@hengyu ~> curl -X POST -u "local:123456" http://localhost:9091/oauth/token -d "grant_type=refresh_token&refresh_token=QuLgm-H3xHzo71M_XSLrglsRs_o" | jsonpp
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   167    0   101  100    66   1122    733 --:--:-- --:--:-- --:--:--  1855
{
  "access_token": "aLPOEkfUCxn87XkTkcwyixaUO1s",
  "token_type": "bearer",
  "expires_in": 7200,
  "scope": "read"
}
```

> **同一个账户，上面虽然刷新了两次，但是令牌的有效期不会相互影响**，第一次刷新使用的是第一次获取的刷新令牌，这样其实也就是刷新的第一次的请求令牌，与第二次的无关！！！

## 代码示例
如果您喜欢本篇文章请为源码仓库点个`Star`，谢谢！！！
本篇文章示例源码可以通过以下途径获取，目录为`oauth2-always-create-token`：

- Gitee：[https://gitee.com/hengboy/spring-boot-chapter](https://gitee.com/hengboy/spring-boot-chapter/tree/2.x/)

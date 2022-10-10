---
id: apiboot-oauth-use-redis-storage
title: OAuth2使用Redis来存储客户端信息以及AccessToken
sort_title: OAuth2使用Redis来存储客户端信息以及AccessToken
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: true
news: true
disable_toc: false
customize: false
tags: [ApiBoot,OAuth2,Spring Security]
categories: [ApiBoot]
keywords: oauth,redis,apiboot
description: 'OAuth2使用Redis来存储客户端信息以及AccessToken'
date: 2019-12-11 14:48:54
article_url:
---

使用`Redis`来存储`OAuth2`相关的客户端信息以及生成的`AccessToken`是一个不错的选择，`Redis`与生俱来的的高效率、集群部署是比较出色的功能，如果用来作为`服务认证中心`的数据存储，可以大大的提高响应效率。

`Redis`还支持超时自动删除功能，`OAuth2`所生成的`AccessToken`相关的数据在超过配置的`有效时间`后就会自动被清除，这样也隐形的提高了接口的安全性。

既然`Redis`可以做到这么好，我们该怎么实现代码逻辑呢？
<!--more-->

`ApiBoot OAuth2`是支持使用`Redis`来存储`AccessToken`的，只需要修改`application.yml`一个配置就可以实现，相关的使用也可以通过查看文档了解。

- [ApiBoot OAuth 官方文档](https://apiboot.minbox.org/zh-cn/docs/api-boot-oauth.html)

## 创建项目

我们使用`IDEA`开发工具创建一个`SpringBoot`项目，在项目的`pom.xml`添加我们需要的`ApiBoot`的`统一版本`依赖以及`安全组件`依赖，如下所示：

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

## 添加Redis支持

既然我们本章需要用到`Redis`，我们需要在项目内添加相关的依赖，`SpringBoot`已经为我们提供了封装好的依赖，在`pom.xml`文件内`dependencies`节点下添加，如下所示：

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
```

### 配置Redis连接信息

`SpringBoot`对`Redis`的连接、数据操作都做了封装，我们只需要在`application.yml`配置文件内添加响应的`Redis`连接信息即可。

`spring-boot-starter-data-redis`依赖所需要的配置都是由`RedisProperties`类提供，该类内有部分配置字段存在默认值，部分源码如下所示：

```java
@ConfigurationProperties(prefix = "spring.redis")
public class RedisProperties {

	/**
	 * Database index used by the connection factory.
	 */
	private int database = 0;

	/**
	 * Connection URL. Overrides host, port, and password. User is ignored. Example:
	 * redis://user:password@example.com:6379
	 */
	private String url;

	/**
	 * Redis server host.
	 */
	private String host = "localhost";

	/**
	 * Login password of the redis server.
	 */
	private String password;

	/**
	 * Redis server port.
	 */
	private int port = 6379;
  //...
}	
```

默认配置下连接`Redis`只需要在`application.yml`配置`spring.redis.password`，如下所示：

```yaml
spring:
  # 配置Redis连接信息
  redis:
    password: 123123
```

> `password`是连接`Redis`所需要的密码，在`redis.conf`文件内配置。

相关配置解释：

- `spring.redis.database`：如果你使用的`Redis DataBase`并不是默认的`0`索引，需要修改该配置
- `spring.redis.host`：默认为`localhost`，如果不是本地使用，需要修改该配置
- `spring.redis.url`：这是一个连接字符串，如天配置了会自动覆盖`database`、`host`、`port`等三个配置信息
- `spring.redis.port`：默认为`Redis`的端口号`6379`，如已修改`Redis`的监听端口号，需要修改该配置

## 启用ApiBoot OAuth Redis

`ApiBoot OAuth`提供了`redis`配置选项，在`application.yml`文件内通过`api.boot.oauth.away`配置参数指定，如下所示：

```yaml
api:
  boot:
    security:
      # 配置内存安全用户列表
      users:
        - username: yuqiyu
          password: 123123
    oauth:
      # 配置使用Redis存储OAuth2相关数据
      away: redis
      # 配置客户端列表
      clients:
        - clientId: minbox
          clientSecret: chapter
```

为了方便演示，我们使用`ApiBoot Security`的内存方式配置了一个用户`yuqiyu`，而且还修改了默认`client`信息，新加了`minbox`客户端。

如果对`ApiBoot Security`用户配置或者`ApiBoot OAuth`的客户端配置不了解，可以查看官方文档：

- [ApiBoot Security](https://apiboot.minbox.org/zh-cn/docs/api-boot-security.html)
- [ApiBoot OAuth](https://apiboot.minbox.org/zh-cn/docs/api-boot-oauth.html)

或者你可以查看我编写的`ApiBoot`系列的文章：[ApiBoot开源框架各个组件的系列使用文章汇总](https://blog.yuqiyu.com/apiboot-all-articles.html)

## 运行测试

在运行测试之前我们添加一个名为`ApiController`的控制器用来测试，代码如下所示：

```java
/**
 * 测试Api控制器
 *
 * @author 恒宇少年
 */
@RestController
@RequestMapping(value = "/api")
public class ApiController {
    /**
     * 测试请求，需携带令牌访问
     *
     * @return
     */
    @GetMapping(value = "/index")
    public String index() {
        return "this is index";
    }
}
```

### 测试点：查看Redis存储的AccessToken

预计效果是当我们发送获取`AccessToken`的请求时，会自动将生成的`AccessToken`存储到`Redis`。

下面我们使用`CURL`命令来尝试获取下`AccessToken`，如下所示：

```json
➜ ~ curl minbox:chapter@localhost:9090/oauth/token -d 'grant_type=password&username=yuqiyu&password=123123'
{"access_token":"38a7ee20-2fad-43c5-a349-31e6f0ee0f29","token_type":"bearer","refresh_token":"f469b1e8-f63c-4be9-8564-2603f8458024","expires_in":7199,"scope":"api"}
```

下面我们使用`redis-cli`来看下是否已经将`AccessToken`存储到`Redis`，如下所示：

```bash
➜ ~ redis-cli 
127.0.0.1:6379> auth 123123
OK
127.0.0.1:6379> keys *
 1) "uname_to_access:minbox:yuqiyu"
 2) "refresh_to_access:f469b1e8-f63c-4be9-8564-2603f8458024"
 3) "access_to_refresh:1ea8e5cd-ea63-4a73-969f-9e7767f25f30"
 4) "auth:38a7ee20-2fad-43c5-a349-31e6f0ee0f29"
 5) "refresh_auth:6898bef4-f4a7-4fa9-858b-a4c62a1567d8"
 6) "refresh:6898bef4-f4a7-4fa9-858b-a4c62a1567d8"
 7) "refresh_auth:f469b1e8-f63c-4be9-8564-2603f8458024"
 8) "access:38a7ee20-2fad-43c5-a349-31e6f0ee0f29"
 9) "refresh_to_access:6898bef4-f4a7-4fa9-858b-a4c62a1567d8"
1)  "auth_to_access:f02ceb5faa4577222082842b82a57067"
2)  "refresh:f469b1e8-f63c-4be9-8564-2603f8458024"
3)  "access_to_refresh:38a7ee20-2fad-43c5-a349-31e6f0ee0f29"
4)  "client_id_to_access:minbox"
```

结果往往让人感觉惊喜，看到这里我们已经成功的把`OAuth2`生成的`AccessToken`存储到了`Redis`，如果`AccessToken`对应的数据超过了`expires_in`时间，就会自动被清除。

### 测试点：携带AccessToken访问接口

我们可以拿着生成的`AccessToken`来访问在上面添加的测试`ApiController`内的接口，如下所示：

```bash
➜ ~ curl -H 'Authorization: Bearer 38a7ee20-2fad-43c5-a349-31e6f0ee0f29' http://localhost:9090/api/index
this is index
```

我们可以拿到接口的返回的接口，这也证明了一点，`AccessToken`的验证是没有问题的，`OAuth2`拿着请求携带的`AccessToken`去`Redis`验证通过。

## 敲黑板，划重点

`ApiBoot OAuth`所支持的`3种`存储方式都已经通过文章的方式告知大家，每一种方式都做到了精简，简单的配置，添加相关的依赖，就能够实现在之前让很多人头疼的集成。

> 如果在生产环境中数据量较大，建议使用`Redis`集群来解决存储`AccessToken`的问题。


## 代码示例
如果您喜欢本篇文章请为源码仓库点个`Star`，谢谢！！！
本篇文章示例源码可以通过以下途径获取，目录为`apiboot-oauth-use-redis-storage`：

- Gitee：[https://gitee.com/minbox-projects/api-boot-chapter](https://gitee.com/minbox-projects/api-boot-chapter)

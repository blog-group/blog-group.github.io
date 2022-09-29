---
id: apiboot-security-open-paths-without-intercept
title: 原来SpringSecurity整合OAuth2后开放权限拦截路径还能这么玩？
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: false
news: true
disable_toc: false
customize: false
tags:
  - ApiBoot
categories:
  - ApiBoot
keywords: SpringSecurity,apiboot,springboot
description: '原来SpringSecurity整合OAuth2后开放权限拦截路径还能这么玩？'
date: 2019-12-07 09:18:47
article_url:
---
当我们整合了`Spring Security`以及`OAuth2`后发现，有一些业务请求是需要开放的，因为种种原因这时访问者还没有身份标识（`比如：用户刚来，还没有注册，需要进行新用户注册，这时注册业务相关的接口都应该是开放的`），下面我们来看看`ApiBoot`是怎么排除路径不进行权限拦截的。
<!--more-->
## 官方相关文档

相关`ApiBoot Security`官方使用文档，请访问 [ApiBoot Security](https://apiboot.minbox.org/zh-cn/docs/api-boot-security.html)。

在文档的第`4. 默认排除路径`部分，我们了解到了`ApiBoot Security`为了与其他的第三方框架进行集成，在内部已经添加了一些`默认的拦截路径`，当我们在添加`开放路径`时会在默认的基础上**增量添加，不会覆盖**。

## 创建项目

我们使用`IDEA`开发工具创建一个`SpringBoot`项目，在`pom.xml`内添加相关的依赖，如下所示：

```xml
<dependencies>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
  </dependency>
  <!--ApiBoot Security OAuth安全组件-->
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
      <version>2.2.0.RELEASE</version>
      <type>pom</type>
      <scope>import</scope>
    </dependency>
  </dependencies>
</dependencyManagement>
```

### 排除路径配置

`ApiBoot Security OAuth`安全组件默认拦截配置为`/api/**`，也就是`/api`下的全部路径以及子路径都需要认证后才可以访问。

我们可以通过`api.boot.security.auth-prefix`参数配置修改`保护的路径列表`，`ApiBoot`还提供了另外的一个参数配置`api.boot.security.ignoring-urls`，用于配置`开放的路径列表`（开放路径可直接访问，不走权限拦截），支持使用`Ant`风格，`application.yml`配置内容如下所示：

```yaml
spring:
  application:
    name: apiboot-security-open-paths-without-intercept
server:
  port: 9090

api:
  boot:
    # ApiBoot Security安全配置
    security:
      # 权限拦截的路径前缀
      auth-prefix: /**
      # 排除不拦截的路径
      ignoring-urls:
        - /index/**
```

我们在`application.yml`文件内配置`api.boot.security.ignoring-urls`的值为`/index/**`，这时我们在访问`/index`、`/index/xxx`路径时都不会经过权限的拦截，直接可以访问到。

### 示例请求

我们来创建一个名为`IndexController`的示例控制器，来验证我们开放的路径是否已经生效了，如下所示：

```java

/**
 * 示例：控制器
 *
 * @author 恒宇少年
 */
@RestController
@RequestMapping(value = "/index")
public class IndexController {
    /**
     * 示例：首页地址
     * /index
     *
     * @return
     */
    @GetMapping
    public String index() {
        return "this is index page.";
    }

    /**
     * 示例：首页地址子页面
     * /index/sub
     *
     * @return
     */
    @GetMapping(value = "/sub")
    public String indexSub() {
        return "this is sub index page.";
    }
}
```

在`application.yml`我们配置的开放地址为`/index/**`，所以`IndexController`控制器内的两个地址`/index`、`/index/sub`都会被开放，不走权限拦截，直接放行。

## 运行测试

我们使用`IDEA`通过`XxxApplication`入口类的方式来启动本章项目源码，下面是我们要验证的测试点。

### 测试点：开放路径

我们先来访问下`http://localhost:9090/index`，效果如下所示：

```
➜ ~ curl http://localhost:9090/index    
this is index page.
```

直接访问`/index`是可以直接获取接口返回的内容，这也证明了一点，这个地址被开放了，不再被权限拦截。

在之前说到`ApiBoot Security OAuth`开放地址支持`Ant`风格，我们配置的开放地址为`/index/**`，所以`/index/sub`这个请求地址也应该已经被开放了，效果如下所示：

```
➜ ~ curl http://localhost:9090/index/sub
this is sub index page.
```

> 如果我们修改`api.boot.security.ignoring-urls`配置为`/index`，我们在访问`/index/sub`这个地址时是没有权限的，需要携带有效的`AccessToken`才可以访问到。

### 测试点：未开放路径的拦截

下面我们来完成一个比较特殊的测试点，访问一个并没有在后台定义的路径，如下所示：

```json
➜ ~ curl http://localhost:9090/index/11
{"error":"unauthorized","error_description":"Full authentication is required to access this resource"}
```

我们并没有添加`/index/xx`这个请求地址的实现，当访问时同样也会被拦截，这证明了我们发起的请求并没有到达解析请求就已经被权限拦截了。

## 敲黑板，划重点

除了被开放的路径都需要提供有效的AccessToken才可以访问，无论这个地址是否存在，本章为了示例讲解方便我这里配置的权限拦截根地址为`/**`，`api.boot.security.auth-paths`参数源码是一个数组（详见：`org.minbox.framework.api.boot.autoconfigure.security.ApiBootSecurityProperties`），可以配置多个地址，比如：`/user/**`、`/order/**`，`api.boot.security.ignoring-urls`同样支持数组形式配置多个。

## 代码示例
如果您喜欢本篇文章请为源码仓库点个`Star`，谢谢！！！
本篇文章示例源码可以通过以下途径获取，目录为`apiboot-security-open-paths-without-intercept`：

- Gitee：[https://gitee.com/minbox-projects/api-boot-chapter](https://gitee.com/minbox-projects/api-boot-chapter)
---
id: apiboot-security-oauth-zero-code-integration
title: ApiBoot实现零代码整合Spring Security & OAuth2
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: true
news: true
tags:
  - ApiBoot
categories:
  - ApiBoot
keywords: apiboot,security,oauth2
description: 'ApiBoot实现零代码整合Spring Security & OAuth2'
date: 2019-11-12 14:30:27
article_url:
---
接口服务的安全性一直是程序员比较注重的一个问题，成熟的安全框架也比较多，其中一个组合就是`Spring Security`与`OAuth2`的整合，在`ApiBoot`内通过代码的封装、自动化配置实现了自动化整合这两大安全框架。
<!--more-->

## ApiBoot Security OAuth简介

`ApiBoot Security OAuth`是`ApiBoot`开源项目内的一个组件，内部通过`SpringBoot AutoConfiguration`整合了`Spring Security`、`OAuth2`，而且支持多种存储方式，如：`内存（memory）`、`数据库（jdbc）`、`Redis`等，使用配置文件的方式来**代替**代码侵入式集成方式，提高开发效率、减少非业务的繁琐代码，而且还有这比较高的可扩展性。

- ApiBoot 源码（源码详见：api-boot-plugins、api-boot-autoconfigure目录）：https://gitee.com/minbox-projects/api-boot

- ApiBoot Security使用文档：https://apiboot.minbox.org/zh-cn/docs/api-boot-security.html

- ApiBoot OAuth使用文档：https://apiboot.minbox.org/zh-cn/docs/api-boot-oauth.html

## 创建项目

通过`Idea`开发工具创建一个名为`apiboot-security-oauth-zero-code-integration`的`SpringBoot`项目。
### 添加ApiBoot统一版本依赖
在添加依赖之前我们需要将`ApiBoot`的统一版本依赖加入到我们项目的`pom.xml`文件内，如下所示：
```xml
<!--ApiBoot统一版本依赖-->
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
### 添加ApiBoot Security OAuth依赖

添加完成版本依赖后，我们继续在`pom.xml`文件内添加`ApiBoot Security OAuth`依赖，如下所示：

```xml
<dependencies>
  <!--SpringBoot Web-->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
  </dependency>

  <!--ApiBoot Security Oauth-->
  <dependency>
    <groupId>org.minbox.framework</groupId>
    <artifactId>api-boot-starter-security-oauth-jwt</artifactId>
  </dependency>
</dependencies>
```

### 配置ApiBoot Security用户列表

`ApiBoot Security`默认支持`内存方式（memory）`配置`用户列表`，用于整合`OAuth2`的`密码授权方式（grant_type=password）`，我们需要在`application.yml`配置文件内添加相关配置，如下所示：

```yaml
spring:
  application:
    name: apiboot-security-oauth-first-application
server:
  port: 9090
# ApiBoot 相关配置
api:
  boot:
    # ApiBoot Security配置
    security:
      # 配置内存用户列表
      users:
        - username: hengboy
          password: 123456
        - username: yuqiyu
          password: 123123
```

通过`api.boot.security.users`参数可以配置`多个用户`信息，每个用户可配置`username`、`password`、`roles`，可以通过查看`org.minbox.framework.api.boot.autoconfigure.security.ApiBootSecurityProperties`源码类了解详情。

- **username**：配置`Spring Security`用户的用户名。
- **password**：配置`Spring Security`用户的密码。
- **roles**：配置`Spring Security`用户对应授权的角色列表，多个可以使用英文半角`,`隔开，或者使用`-`方式配置。

## 运行测试

我们通过`XxxApplication`方式启动本章项目。

### 测试点：获取AccessToken

项目运行成功后我们先来测试下是否可以获取到`AccessToken`。

**Curl方式获取：**

```bash
➜ ~ curl -X POST ApiBoot:ApiBootSecret@localhost:9090/oauth/token -d "grant_type=password&username=hengboy&password=123456"
{"access_token":"f16202f7-ab8c-41ae-86be-e314aebe82ff","token_type":"bearer","refresh_token":"93c74812-ec5b-4676-8378-b68e4c1751ae","expires_in":3297,"scope":"api"}
```

**PostMan方式获取：**

![](/images/post/apiboot-security-oauth-zero-code-integration-1.png)

如果对`Spring Security`与`OAuth2`整合有一定经验的同学应该明白`grant_type`是`OAuth2`内提供的其中一种**授权方式**，而参数`username`、`password`则是整合后对应的`Spring Security`的`用户名`以及`密码`，也就是我们在`application.yml`配置文件`api.boot.security.users`配置用户列表的**其中一个用户信息**。

在上面分别通过`Curl`、`PostMan`两种方式进行测试获取`AccessToken`，都是可以直接获取到的。

### 测试点：获取当前用户信息

`ApiBoot Security OAuth`获取**当前用户**信息的方式与`Spring Security`一样，通过注入`java.security.Principal`接口来完成，下面我们创建一个名为`UserController`的控制器来测试下效果：

```java
package org.minbox.chapter.apiboot.security.oauth.first.application;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

/**
 * 登录用户信息
 *
 * @author 恒宇少年
 */
@RestController
@RequestMapping(value = "/api/user")
public class UserController {

    /**
     * 获取当前登录的用户信息
     * 通过Spring Security提供的注解{@link PreAuthorize}进行验证角色
     *
     * @param principal {@link Principal}
     * @return {@link Principal#getName()}
     */
    @GetMapping
    @PreAuthorize("hasRole('api')")
    public String info(Principal principal) {
        return principal.getName();
    }
}
```

> 注意：`ApiBoot Security OAuth`默认权限拦截的路径时`/api/**`，所以我们在测试控制器上配置了`/api/user`作为路径前缀，如果想对`ApiBoot Security OAuth`详细了解，请访问ApiBoot官网文档[ApiBoot Security使用文档](https://apiboot.minbox.org/zh-cn/docs/api-boot-security.html)

我们通过`Curl`方式访问`http://localhost:9090/api/user`接口效果如下：

```bash
➜ ~ curl http://localhost:9090/api/user -H 'Authorization: Bearer d73e86a8-892f-42c1-bc95-04aedfe97828'
hengboy
```

访问`/api/user`路径的`AccessToken`是通过用户`hengboy`用户生成的，所以该接口返回了`hengboy`用户名。

## 敲黑板，划重点

`ApiBoot Security OAuth`极其简单的完成了`Spring Security`与`OAuth2`的整合，使用内存方式时不需要配置一行代码就可以完成自动化的整合。

## 代码示例
如果您喜欢本篇文章请为源码仓库点个`Star`，谢谢！！！
本篇文章示例源码可以通过以下途径获取，目录为`apiboot-security-oauth-first-application`：

- Gitee：[https://gitee.com/minbox-projects/api-boot-chapter](https://gitee.com/minbox-projects/api-boot-chapter)
---
id: apiboot-security-oauth-custom-certification-user
title: 见过这么简单的方式整合SpringSecurity & OAuth2的自定义查询用户吗？
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: false
news: true
customize: false
tags: [ApiBoot,OAuth2,Spring Security]
categories: [ApiBoot]
keywords: apiboot,springboot,security,oauth2
description: '见过这么简单的方式整合SpringSecurity & OAuth2的自定义查询用户吗？'
date: 2019-12-02 14:51:51
article_url:
---

`SpringSecurity`整合`OAuth2`是开发者公认的`资源保护`、`服务认证`的最佳搭配伙伴，这对好基友一直在默默的守护着应用服务的安全，根据访问者的不同角色可以颗粒度控制到具体的接口，从而实现权限的细微划分。

<!--more-->

而`SpringSecurity`框架在安全框架的队伍中算是入门比较高的，虽然`Spring`通过`SpringBoot`进行了封装，但是使用起来还是有很多容易遗漏的配置，因为配置比较多，让初学者理解起来也比较困难，针对这个问题`ApiBoot`对`SpringSecurity`以及`OAuth2`进行了封装，在基础上极大的简化了配置（只做简化、增强，`SpringSecurity`的基础语法、配置还可以正常使用）

## ApiBoot Security 系列文章

- [ApiBoot实现零代码整合Spring Security & OAuth2](https://blog.minbox.org/apiboot-security-oauth-zero-code-integration.html)
- [ApiBoot零代码整合Spring Security的JDBC方式获取AccessToken](https://blog.minbox.org/apiboot-security-customize-select-user.html)

## 创建项目
使用`IDEA`开发工具创建一个`SpringBoot`项目。

> `ApiBoot`的底层是`SpringBoot`，而且`ApiBoot`为了支持`SpringBoot`的`2.2.x`分支，也对应的创建了`2.2.x`分支版本。

### 添加ApiBoot统一依赖

创建完项目后我们需要在`pom.xml`添加`ApiBoot`的统一版本依赖，如下所示：

```xml
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

### 添加相关依赖

本章我们需要查询数据库内的用户信息进行认证，所以需要在`pom.xml`添加数据库相关的依赖，如下所示：

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
  <dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
  </dependency>
  <dependency>
    <groupId>com.zaxxer</groupId>
    <artifactId>HikariCP</artifactId>
  </dependency>
  <dependency>
    <groupId>org.minbox.framework</groupId>
    <artifactId>api-boot-starter-mybatis-enhance</artifactId>
  </dependency>
</dependencies>
```

在本章使用到了`ApiBoot Mybatis Enhance`，具体的使用请访问官方文档[ApiBoot MyBatis Enhance使用文档](https://apiboot.minbox.org/zh-cn/docs/api-boot-mybatis-enhance.html)

### 配置数据源

添加数据库相关的依赖后，在`application.yml`文件内添加如下配置信息：

```yaml
spring:
  application:
    name: apiboot-security-oauth-custom-certification-user
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



### 配置ApiBoot Security

`ApiBoot Security`默认采用的是`内存方式`（memory）读取用户信息，我们本章需要修改为`JDBC`方式，并且`禁用默认读取用户信息`（`ApiBoot Security`内部提供了默认的表结构，建表后添加数据即可直接使用用户信息进行认证，详见：[ApiBoot Security使用文档](https://apiboot.minbox.org/zh-cn/docs/api-boot-security.html)）。

在`application.yml`配置文件中添加如下配置：

```yaml
# ApiBoot配置
api:
  boot:
    security:
      # ApiBoot Security 使用JDBC方式读取用户
      away: jdbc
      # 禁用默认的读取用户方式
      enable-default-store-delegate: false
```

`api.boot.security.enable-default-store-delegate`配置参数默认值为`true`，也就是会自动读取数据源对应数据库内的`api_boot_user_info`用户信息表，当我们设置为`false`后需要通过实现`ApiBootStoreDelegate`接口来进行自定义查询的用户信息。

### 配置ApiBoot OAuth

`api-boot-starter-security-oauth-jwt`这个依赖内部也默认集成了`OAuth2`，而且默认的数据存储方式与`Spring Security`一致也是内存方式（`memory`），我们本章的主要目的是查询`认证用户信息`，而不是`客户端信息`，所以我们还是采用默认的内存方式，不过修改下客户端的默认配置信息，在`application.yml`文件内添加配置如下所示：

```yaml
# ApiBoot配置
api:
  boot:
    oauth:
      # ApiBoot OAuth2的客户端列表
      clients:
        - clientId: hengboy
          clientSecret: chapter
          grantTypes: password,refresh_token
```

> 在`ApiBoot`中`OAuth2`默认的客户端配置信息，可以通过查看`org.minbox.framework.api.boot.autoconfigure.oauth.ApiBootOauthProperties.Client`源码了解详情。

## 用户认证

配置已经完成，下面我们来编写查询用户信息，将用户信息交给`ApiBoot Security`框架进行`认证`、`生成AccessToken`等操作。

本章使用的持久化框架是`ApiBoot MyBatis Enhance`，具体的使用方法请查看[官方文档](https://apiboot.minbox.org/zh-cn/docs/api-boot-mybatis-enhance.html)。

### 创建用户表

我们在数据库内创建一张名为`system_user`的系统用户信息表，表结构如下所示：

```sql
CREATE TABLE `system_user` (
  `su_id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL COMMENT '用户编号',
  `su_login_name` varchar(30) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '登录名',
  `su_nick_name` varchar(30) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '昵称',
  `su_password` varchar(200) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '用户密码',
  `su_create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `su_status` int(11) DEFAULT '1' COMMENT '用户状态，1：正常，0：冻结，-1：已删除',
  PRIMARY KEY (`su_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='系统用户信息表';
```

`system_user`用户表创建完成后，我们往这张表内添加一条用户数据，如下所示：

```sql
INSERT INTO `system_user` VALUES ('9b69fd26-14db-11ea-b743-dcd28627348e','yuqiyu','恒宇少年 - 于起宇','$2a$10$RbJGpi.v3PwkjrYENzOzTuMxazuanX3Qa2hwI/f55cYsZhFT/nX3.','2019-12-02 08:13:22',1);
```

我们在登录时用户名对应`su_login_name`字段，而密码则是对应`su_password`字段，`yuqiyu`这个用户的密码初始化为`123456`，密码的格式必须为`BCryptPasswordEncoder`加密后的密文。

### 创建用户实体

针对`system_user`表我们需要来创建一个`ApiBoot MyBatis Enhance`使用的实体，创建一个名为`SystemUser`的实体如下所示：

```java

/**
 * 系统用户基本信息
 *
 * @author 恒宇少年
 */
@Data
@Table(name = "system_user")
public class SystemUser implements UserDetails {
    /**
     * 用户编号
     */
    @Id(generatorType = KeyGeneratorTypeEnum.UUID)
    @Column(name = "su_id")
    private String userId;
    /**
     * 登录名
     */
    @Column(name = "su_login_name")
    private String loginName;
    /**
     * 昵称
     */
    @Column(name = "su_nick_name")
    private String nickName;
    /**
     * 密码
     */
    @Column(name = "su_password")
    private String password;
    /**
     * 创建时间
     */
    @Column(name = "su_create_time")
    private String createTime;
    /**
     * 用户状态
     * 1：正常，0：已冻结，-1：已删除
     */
    @Column(name = "su_status")
    private Integer status;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.EMPTY_LIST;
    }

    @Override
    public String getUsername() {
        return this.loginName;
    }

    @Override
    public String getPassword() {
        return this.password;
    }

    /**
     * UserDetails提供的方法，用户是否未过期
     * 可根据自己用户数据表内的字段进行扩展，这里为了演示配置为true
     *
     * @return
     */
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    /**
     * UserDetails提供的方法，用户是否未锁定
     * 可根据自己用户数据表内的字段进行扩展，这里为了演示配置为true
     *
     * @return
     */
    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    /**
     * UserDetails提供的方法，凭证是否未过期
     * 可根据自己用户数据表内的字段进行扩展，这里为了演示配置为true
     *
     * @return
     */
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    /**
     * UserDetails提供的方法，是否启用
     *
     * @return
     */
    @Override
    public boolean isEnabled() {
        return this.status == 1;
    }
}
```

具体的注解使用详见`ApiBoot MyBatis Enhance`文档，这里还一点需要注意的是，`SystemUser`实现了`UserDetails`接口，如果使用过`Spring Security`的同学应该都知道这是`Spring Security`提供的用户详情接口定义，我们如果`自定义查询用户`就应该让我们`自定义的用户实体`（注：这是的自定义用户实体也就是SystemUser实体）实现这个接口并全部实现`UserDetails`接口内提供的方法。

### 创建用户数据接口

用户的实体已经创建完成，我们本章需要一个根据用户的`登录名`来查询用户基本的数据接口，创建一个名为`SystemUserEnhanceMapper`的接口如下所示：

```java
/**
 * ApiBoot Enhance提供的增强Mapper
 * 自动被扫描并且注册到IOC
 *
 * @author 恒宇少年
 * @see org.minbox.framework.api.boot.autoconfigure.enhance.ApiBootMyBatisEnhanceAutoConfiguration
 */
public interface SystemUserEnhanceMapper extends EnhanceMapper<SystemUser, Integer> {
    /**
     * 根据用户登录名查询用户信息
     *
     * @param loginName {@link SystemUser#getLoginName()}
     * @return {@link SystemUser}
     */
    SystemUser findByLoginName(@Param("loginName") String loginName);
}
```

该接口继承了`EnhanceMapper<Entity,ID>`接口，可以自动被扫描到`创建代理的实例`后并且加入`IOC`，这样我们在项目其他的地方可以直接注入使用。

> 注意：`findByXxx`方法是`ApiBoot MyBatis Enhance`提供的方法命名规则查询，多个查询条件可以使用`And`或者`Or`追加，会自动根据方法的规则生成对应的`SQL`。

### 实现ApiBootStoreDelegate接口

`ApiBoot Security`提供了一个接口`ApiBootStoreDelegate`，这个接口主要是用来查询登录用户的具体信息的作用，当我们通过`grant_type=password&username=xxx`的方式进行获取`AccessToken`时，`ApiBoot Security`会直接把`username`的参数值传递给`ApiBootStoreDelegate#loadUserByUsername`的方法内，这样我们就可以根据`username`进行查询用户并返回给`ApiBoot Security`做后续的认证操作。

我们来创建一个名为`UserService`的类并实现`ApiBootStoreDelegate`接口，如下所示：

```java

/**
 * 自定义读取用户信息
 *
 * @author 恒宇少年
 */
@Service
public class UserService implements ApiBootStoreDelegate {
    /**
     * logger instance
     */
    static Logger logger = LoggerFactory.getLogger(UserService.class);
    /**
     * 用户数据接口
     */
    @Autowired
    private SystemUserEnhanceMapper mapper;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        UserDetails userDetails = mapper.findByLoginName(username);
        if (ObjectUtils.isEmpty(userDetails)) {
            throw new UsernameNotFoundException("用户：" + username + "，不存在.");
        }
        logger.info("登录用户的信息：{}", JSON.toJSONString(userDetails));
        return userDetails;
    }
}
```

`loadUserByUsername`方法的返回值是`UserDetails`接口类型，在之前我们已经将`SystemUser`实现了该接口，所以我们可以直接将`SystemUser`实例作为返回值。

## 运行测试

代码一切就绪，通过`XxxxApplication`的方式来启动项目。

### 测试点：获取AccessToken

在获取`AccessToken`之前，我们需要确认`application.yml`文件内配置的`api.boot.oauth.clients`的客户端的`clientId`、`clientSecret`配置内容，下面是通过`CURL`的方式：

```json
➜ ~ curl hengboy:chapter@localhost:9090/oauth/token -d 'grant_type=password&username=yuqiyu&password=123456'
{"access_token":"3beb1bee-9ca6-45e1-9fb8-5fc181670f63","token_type":"bearer","refresh_token":"d2243e18-8ab3-4842-a98f-ebd79da94e2e","expires_in":7199,"scope":"api"}
```

### 测试点：刷新AccessToken

复制上面获取到的`refresh_token`的值进行刷新，下面是刷新`AccessToken`的`CURL`方式：

```json
➜ ~ curl hengboy:chapter@localhost:9090/oauth/token -d 'grant_type=refresh_token&refresh_token=d2243e18-8ab3-4842-a98f-ebd79da94e2e'
{"access_token":"e842c2ee-5672-49db-a530-329186f36492","token_type":"bearer","refresh_token":"d2243e18-8ab3-4842-a98f-ebd79da94e2e","expires_in":7199,"scope":"api"}
```



> `hengboy`这个`OAuth2`客户端在`application.yml`中通过配置`grantTypes`授权了两种`grant_type`，分别是`password`、`refresh_token`，如果需要别的方式可以在配置文件内对应添加。

## 敲黑板，划重点

`ApiBoot`整合`Spring Security`以及`OAuth2`后读取自定义用户信息，我们只需要关注具体怎么读取用户信息，之前那些懵懵懂懂的代码配置都可以通过`配置文件`的方式**代替**，本章的主要内容是`ApiBootStoreDelegate`这个接口，`ApiBoot`所提供的功能还不止这些，会陆续分享给大家。

## 代码示例
如果您喜欢本篇文章请为源码仓库点个`Star`，谢谢！！！
本篇文章示例源码可以通过以下途径获取，目录为`apiboot-security-oauth-custom-certification-user`：

- Gitee：[https://gitee.com/minbox-projects/api-boot-chapter](https://gitee.com/minbox-projects/api-boot-chapter)
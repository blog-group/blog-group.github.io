---
id: apiboot-define-oauth-grant-type
title: 使用ApiBoot来自定义OAuth2的GrantType授权方式
sort_title: 自定义OAuth2短信登录GrantType
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: true
news: true
customize: false
tags: [ApiBoot,OAuth2,Spring Security]
categories: [ApiBoot]
keywords: granttype,apiboot,oauth2
description: '使用ApiBoot来自定义OAuth2的GrantType授权方式'
date: 2019-12-04 09:18:26
article_url:
---
`Spring`提供的原生的`OAuth2`依赖内置了几种比较常用的授权方式：`password`、`authorization-code`、`client_credentials`、`refresh_token`、`implicit`等，虽然可以满足我们日常的需求，不过针对一些特殊的需求还是捉襟见肘，有点无奈，比如：`微信登录`、`短信登录`...，针对这一点`ApiBoot`通过修改`Spring OAuth2`依赖的源码，可以根据业务进行自定义添加`grantType`。
<!--more-->

- ApiBoot官方文档：[https://apiboot.minbox.org](https://apiboot.minbox.org)

## 创建项目

我们先来使用`IDEA`创建本章的项目，`pom.xml`添加的依赖如下所示：

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

`ApiBoot MyBatis Enhance`使用文档详见[ApiBoot Mybatis Enhance官网文档](https://apiboot.minbox.org/zh-cn/docs/api-boot-mybatis-enhance.html)。

本章的源码在[ApiBoot零代码整合Spring Security的JDBC方式获取AccessToken](https://blog.yuqiyu.com/apiboot-security-customize-select-user.html)基础上进行修改，将之前章节源码的`application.yml`、`SystemUser`、`SystemUserEnhanceMppaer`、`UserService`文件复制到本章项目对应的目录内。

## 验证码登录逻辑

本章来讲下使用`ApiBoot`怎么完成自定义`短信验证码`登录的授权方式。

在短信验证码登录的逻辑中，大致的流程如下所示：

1. `用户在获取验证码时，系统会将验证码保存到数据库内`
2. `当用户输入验证码后提交登录时，读取验证码并判断有效性后`
3. `最后获取手机号对应的用户信息完成登录逻辑。`
4. `返回请求令牌`

根据`验证码登录`的流程来看我们首先需要创建一个`验证码数据表`，用来保存用户发送的验证码数据，在`第3步`中需要通过手机号获取对应的用户信息，所以我们还要修改之前章节创建的表结构，添加一列，下面我们开始进行改造。

### 验证码表结构

在数据库内创建一个名为`phone_code`的数据表，并初始化一条验证码数据（模拟已经用户已经发送了验证码），`SQL`如下所示：

```sql
CREATE TABLE `phone_code` (
  `pc_id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键自增',
  `pc_phone` varchar(11) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '手机号',
  `pc_code` varchar(6) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '验证码内容',
  `pc_create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '验证码生成时间',
  PRIMARY KEY (`pc_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='手机号验证码信息表';
-- 初始化验证码数据
INSERT INTO `phone_code` VALUES (1,'17111111111','123123','2019-12-04 03:01:05');
```

### 验证码实体

对应`phone_code`表结构编写一个数据实体，如下所示：

```java

/**
 * 手机号验证码信息表
 *
 * @author 恒宇少年
 */
@Data
@Table(name = "phone_code")
public class PhoneCode {
    /**
     * 验证码主键
     */
    @Column(name = "pc_id")
    @Id(generatorType = KeyGeneratorTypeEnum.AUTO)
    private Integer id;
    /**
     * 手机号
     */
    @Column(name = "pc_phone")
    private String phone;
    /**
     * 验证码内容
     */
    @Column(name = "pc_code")
    private String code;
    /**
     * 创建时间
     */
    @Column(name = "pc_create_time")
    private Timestamp createTime;
}
```

### 验证码数据接口

为`PhoneCode`验证码数据实体添加一个查询的数据接口，实现`ApiBoot MyBatis Enhance`提供的`EnhanceMapper<Entity,ID>`接口，如下所示：

```java
/**
 * 手机号验证码数据接口
 *
 * @author 恒宇少年
 */
public interface PhoneCodeEnhanceMapper extends EnhanceMapper<PhoneCode, Integer> {
    /**
     * 查询手机号验证码信息
     *
     * @param phone {@link PhoneCode#getPhone()}
     * @param code  {@link PhoneCode#getCode()}
     * @return {@link PhoneCode}
     */
    PhoneCode findByPhoneAndCode(@Param("phone") String phone, @Param("code") String code);
}
```

通过`ApiBoot MyBatis Enhance`提供的方法命名规则查询语法，我们可以根据指定的`phone`、`code`查询出对应的记录。

### 验证码业务逻辑

为验证码查询提供一个业务逻辑实现类，如下所示：

```java
/**
 * 验证码业务逻辑实现
 *
 * @author 恒宇少年
 */
@Service
public class PhoneCodeService {
    /**
     * 手机号验证码数据接口
     */
    @Autowired
    private PhoneCodeEnhanceMapper mapper;

    /**
     * 查询手机号验证码
     *
     * @param phone {@link PhoneCode#getPhone()}
     * @param code  {@link PhoneCode#getCode()}
     * @return
     */
    public PhoneCode findPhoneCode(String phone, String code) {
        return mapper.findByPhoneAndCode(phone, code);
    }
}
```

### 修改用户表结构

我们在[ApiBoot零代码整合Spring Security的JDBC方式获取AccessToken](https://blog.yuqiyu.com/apiboot-security-customize-select-user.html)文章内创建的`system_user`用户表的基础上添加一个字段，如下所示：

```sql
alter table system_user
	add su_phone varchar(11) null comment '手机号';
```

字段添加后初始化表内`yuqiyu`这条数据的列值，我在`phone_code`表内添加的手机号为`17111111111`，所以我需要更新`su_phone`字段的值为`17111111111`。

## 了解ApiBootOauthTokenGranter

基础的代码实现我们都已经准备好了，下面我们来介绍下本章的主角`ApiBootOauthTokenGranter`接口，该接口为自定义`GrantType`而生，由`ApiBoot OAuth2`提供，源码如下所示：

```java
/**
 * ApiBoot Integrates Oauth2 to Realize Custom Authorization to Acquire Token
 *
 * @author：恒宇少年 - 于起宇
 * <p>
 * DateTime：2019-05-28 09:57
 * Blog：http://blog.yuqiyu.com
 * WebSite：http://www.jianshu.com/u/092df3f77bca
 * Gitee：https://gitee.com/hengboy
 * GitHub：https://github.com/hengboy
 */
public interface ApiBootOauthTokenGranter extends Serializable {
    /**
     * oauth2 grant type for ApiBoot
     *
     * @return grant type
     */
    String grantType();

    /**
     * load userDetails by parameter
     *
     * @param parameters parameter map
     * @return UserDetails
     * @throws ApiBootTokenException
     * @see UserDetails
     */
    UserDetails loadByParameter(Map<String, String> parameters) throws ApiBootTokenException;
}
```

- `grantType()`：该方法的返回值用于告知`OAuth2`自定义的`GrantType`是什么，根据自己的业务逻辑而定。
- `loadByParameter`：该方法是自定义`GrantType`的业务实现，`parameters`参数内包含了自定义授权请求`/oauth/token`时所携带的全部参数，如：`/oauth/token?grant_type=phone_code&phone=xx&code=xx`，会把`phone`、`code`参数一并传递给该方法。

## 实现短信验证码授权方式

下面我们来创建一个名为`PhoneCodeGrantType`的自定义授权类，实现`ApiBootOauthTokenGranter`接口，如下所示：

```java

/**
 * 手机验证码OAuth2的认证方式实现
 *
 * @author 恒宇少年
 * @see ApiBootOauthTokenGranter
 */
@Component
public class PhoneCodeGrantType implements ApiBootOauthTokenGranter {
    /**
     * 手机号验证码方式的授权方式
     */
    private static final String GRANT_TYPE_PHONE_CODE = "phone_code";
    /**
     * 授权参数：手机号
     */
    private static final String PARAM_PHONE = "phone";
    /**
     * 授权参数：验证码
     */
    private static final String PARAM_CODE = "code";
    /**
     * 手机号验证码业务逻辑
     */
    @Autowired
    private PhoneCodeService phoneCodeService;
    /**
     * 系统用户业务逻辑
     */
    @Autowired
    private UserService userService;

    @Override
    public String grantType() {
        return GRANT_TYPE_PHONE_CODE;
    }

    /**
     * 根据自定义的授权参数进行查询用户信息
     *
     * @param parameters
     * @return
     * @throws ApiBootTokenException
     */
    @Override
    public UserDetails loadByParameter(Map<String, String> parameters) throws ApiBootTokenException {
        String phone = parameters.get(PARAM_PHONE);
        String code = parameters.get(PARAM_CODE);
        PhoneCode phoneCode = phoneCodeService.findPhoneCode(phone, code);
        if (ObjectUtils.isEmpty(phoneCode)) {
            throw new ApiBootTokenException("登录失败，验证码：" + code + "，已过期.");
        }
        UserDetails userDetails = userService.findByPhone(phone);
        if (ObjectUtils.isEmpty(userDetails)) {
            throw new ApiBootTokenException("用户：" + phone + "，不存在.");
        }
        return userDetails;
    }
}
```

在`loadByParameter`方法内，我们首先获取到了本次登录的手机号（`phone`）、验证码（`code`）这两个参数，查询是否存在这条验证码的记录（`PS：这里没做验证码过期时间限制，自己的业务请把这块加上`），验证码验证通过后查询出手机号对应的用户信息并将用户返回交付给`ApiBoot OAuth2`框架来完成验证。

在验证业务逻辑方法内如果出现异常可以直接使用`ApiBootTokenException`异常进行抛出。

## 运行测试

将我们的项目运行起来，下面通过`CURL`的方式尝试获取`AccessToken`，如下所示：

```json
➜ ~ curl -X POST hengboy:chapter@localhost:9090/oauth/token -d 'grant_type=phone_code&phone=17111111111&code=123123'
{"access_token":"30e3f7d0-8c53-4dfe-b1ff-523a1db7b9eb","token_type":"bearer","refresh_token":"4b1f0ad5-f869-46ca-8b45-0231e69316b3","expires_in":7194,"scope":"api"}
```

使用`postman`方式获取`AccessToken`，如下图所示：

![](/images/post/apiboot-define-oauth-grant-type-1.png)

## 敲黑板，划重点

本章根据`短信验证码登录`的例子来给大家讲解了使用`ApiBoot OAuth2`怎么进行自定义授权方式来获取`AccessToken`，例子讲解注重点是在自定义`GrantType`，在生产使用时还请根据各种情况进行验证，保证数据的安全性。

## 代码示例
如果您喜欢本篇文章请为源码仓库点个`Star`，谢谢！！！
本篇文章示例源码可以通过以下途径获取，目录为`apiboot-define-oauth-grant-type`：

- Gitee：[https://gitee.com/minbox-projects/api-boot-chapter](https://gitee.com/minbox-projects/api-boot-chapter)


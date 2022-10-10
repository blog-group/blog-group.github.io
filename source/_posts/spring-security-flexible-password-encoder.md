---
id: spring-security-flexible-password-encoder
title: Spring Security灵活的PasswordEncoder加密方式
sort_title: Spring Security密码加密方式
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: true
news: true
disable_toc: false
customize: false
tags: [SpringBoot]
categories: [SpringBoot]
keywords: 'SpringSecurity,PasswordEncoder,安全加密'
description: Spring Security灵活的PasswordEncoder加密方式
date: 2020-10-21 16:44:36
article_url:
---
本章基于`Spring Security 5.4.1`版本编写，从`5.x`版本开始引入了很多新的特性。
为了适配老系统的安全框架升级，`Spring Security`也是费劲了心思，支持不同的密码加密方式，而且根据不同的用户可以使用不同的加密方式。
<!--more-->
## 构建Spring Security项目
`Spring Security`的集成使用还是很简单的，根据项目使用的框架不同大致分为两种集成方式：
- `SpringBoot方式集成`
- `SecurityBom方式集成`

### SpringBoot方式构建
在`pom.xml`文件内添加如下内容：
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>
```
### SecurityBom方式构建
`spring-security-bom`是一个提供了`Spring Security`指定版本的全部默认依赖的`pom`类型项目，我们可以通过`dependencyManagement`进行配置到项目中，这样我们就可以直接添加对应的`dependency`了（`注意：版本号因为bom已经注定，所以dependency不需要指定.`）。
在`pom.xml`文件内添加如下内容：
```xml
<dependencies>
  // ...省略其他依赖
  <dependency>
      <groupId>org.springframework.security</groupId>
      <artifactId>spring-security-config</artifactId>
  </dependency>
  <dependency>
      <groupId>org.springframework.security</groupId>
      <artifactId>spring-security-core</artifactId>
  </dependency>
  <dependency>
      <groupId>org.springframework.security</groupId>
      <artifactId>spring-security-web</artifactId>
  </dependency>
</dependencies>
<dependencyManagement>
  <dependencies>
    <!--配置SecurityBom-->
    <dependency>
        <groupId>org.springframework.security</groupId>
        <artifactId>spring-security-bom</artifactId>
        <version>5.4.1</version>
        <type>pom</type>
        <scope>import</scope>
    </dependency>
  </dependencies>
</dependencyManagement>
```
> 注意事项：我们构建Web类型的安全项目时，`spring-security-config`、`spring-security-core`、`spring-security-web`三个依赖都是必须添加的。
## PasswordEncoder

`PasswordEncoder`是`Spring Security`提供的密码加密方式的接口定义，源码类如下所示：

```java
public interface PasswordEncoder {

	/**
	 * Encode the raw password. Generally, a good encoding algorithm applies a SHA-1 or
	 * greater hash combined with an 8-byte or greater randomly generated salt.
	 */
	String encode(CharSequence rawPassword);

	/**
	 * Verify the encoded password obtained from storage matches the submitted raw
	 * password after it too is encoded. Returns true if the passwords match, false if
	 * they do not. The stored password itself is never decoded.
	 *
	 * @param rawPassword the raw password to encode and match
	 * @param encodedPassword the encoded password from storage to compare with
	 * @return true if the raw password, after encoding, matches the encoded password from
	 * storage
	 */
	boolean matches(CharSequence rawPassword, String encodedPassword);

	/**
	 * Returns true if the encoded password should be encoded again for better security,
	 * else false. The default implementation always returns false.
	 * @param encodedPassword the encoded password to check
	 * @return true if the encoded password should be encoded again for better security,
	 * else false.
	 */
	default boolean upgradeEncoding(String encodedPassword) {
		return false;
	}
}
```

- **#encode**

  该方法提供了明文密码的加密处理，加密后密文的格式主要取决于`PasswordEncoder`接口实现类实例。

- **#matches**

  匹配**存储的密码**以及**登录时传递的密码**（`登录密码是经过加密处理后的字符串`）是否匹配，如果匹配该方法则会返回`true`.

## 内置的PasswordEncoder实现列表

- **NoOpPasswordEncoder（已废除）**

  **明文**密码加密方式，该方式已被废除（不建议在生产环境使用），不过还是支持开发阶段测试`Spring Security`的时候使用。

- [**BCryptPasswordEncoder**](https://docs.spring.io/spring-security/site/docs/current/reference/html5/#authentication-password-storage-bcrypt)

- [**Argon2PasswordEncoder**](https://docs.spring.io/spring-security/site/docs/current/reference/html5/#authentication-password-storage-argon2)

- [**Pbkdf2PasswordEncoder**](https://docs.spring.io/spring-security/site/docs/current/reference/html5/#authentication-password-storage-pbkdf2)

- [**SCryptPasswordEncoder**](https://docs.spring.io/spring-security/site/docs/current/reference/html5/#authentication-password-storage-scrypt)

## DelegatingPasswordEncoder

在之前版本集成`Spring Secuirty`时，我们需要通过`@Bean`的方式来配置全局统一使用的密码加密方式（`PasswordEncoder`），当然这种方式现在还是适用的，不过在`5.x`版本开始为了支持动态的多种密码加密方式，`DelegatingPasswordEncoder`委托加密方式类应用而生，它内部其实是一个Map集合，根据传递的Key（Key为加密方式）获取Map集合的Value，而Value则是具体的`PasswordEncoder`实现类。

`DelegatingPasswordEncoder`建立密码格式的规则，格式如：`{bcrypt}encodePassword`，示例如下所示：

```java
// {bcrypt}格式会委托给BCryptPasswordEncoder加密类
{bcrypt}$2a$10$iMz8sMVMiOgRgXRuREF/f.ChT/rpu2ZtitfkT5CkDbZpZlFhLxO3y
// {pbkdf2}格式会委托给Pbkdf2PasswordEncoder加密类
{pbkdf2}cc409867e39f011f6332bbb6634f58e98d07be7fceefb4cc27e62501594d6ed0b271a25fd9f7fc2e
// {MD5}格式会委托给MessageDigestPasswordEncoder加密类
{MD5}e10adc3949ba59abbe56e057f20f883e
// {noop}明文方式，委托给NoOpPasswordEncoder
{noop}123456
// ...
```

## 指定用户使用PasswordEncoder

`DelegatingPasswordEncoder`是默认的`PasswordEncoder`加密方式，所以我们可以为不同的用户配置所使用不同的密码加密方式，只需要密码格式按照：`{away}encodePassword`来进行持久化即可。

```java
@Configuration
@EnableWebSecurity
public class WebSecurityConfiguration extends WebSecurityConfigurerAdapter {

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
                .formLogin()
                .and()
                .csrf()
                .disable()
                .authorizeRequests()
                .antMatchers("/**")
                .authenticated();
    }

    @Bean
    public UserDetailsService users() {
        // {MD5}value必须大写，value值必须是32位小写
        // admin
        UserDetails admin = User.builder()
                //.passwordEncoder(encoder::encode)
                .username("admin").password(
                        "{MD5}e10adc3949ba59abbe56e057f20f883e"
                ).roles("admin").build();

        // hengboy
        UserDetails hengboy = User.builder()
                .username("hengboy")
                .password("{bcrypt}$2a$10$iMz8sMVMiOgRgXRuREF/f.ChT/rpu2ZtitfkT5CkDbZpZlFhLxO3y")
                .roles("admin")
                .build();

        // yuqiyu
        UserDetails yuqiyu = User.builder().username("yuqiyu")
                //.password("{noop}123456")
                .password("{pbkdf2}cc409867e39f011f6332bbb6634f58e98d07be7fceefb4cc27e62501594d6ed0b271a25fd9f7fc2e")
                .roles("user").build();

        return new InMemoryUserDetailsManager(admin, yuqiyu, hengboy);
    }
}
```

上面是使用内存方式存储安全用户的实现代码，在创建`UserDetailsService`类的实例时将用户列表通过构造参数进行传递。

所创建的用户：`admin`，采用`MD5`的加密方式进行密码编码，这里需要注意的是**MD5加密后的字符串必须为小写32位**。

所创建的用户：`hengboy`，采用`bcrypt`方式进行密码编码。

所创建的用户：`yuqiyu`，采用`pbkdf2`方式进行密码编码。

## 覆盖默认的PasswordEncoder

`Spring Security 5.x`版本默认的`PasswordEncoder`方式改成了`DelegatingPasswordEncoder`委托类，不过如果是通过`PasswordEncoderFactories#createDelegatingPasswordEncoder`方法创建的`DelegatingPasswordEncoder`实例时，默认其实使用的还是`BCryptPasswordEncoder`，源码如下所示：

```java
public static PasswordEncoder createDelegatingPasswordEncoder() {
  String encodingId = "bcrypt";
  Map<String, PasswordEncoder> encoders = new HashMap<>();
  encoders.put(encodingId, new BCryptPasswordEncoder());
  // 省略...

  return new DelegatingPasswordEncoder(encodingId, encoders);
}
```

如果我们项目中不需要使用`DelegatingPasswordEncoder`委托密码编码方式，可以通过`@Bean`的方式来统一配置全局共用的`PasswordEncoder`，如下所示：

```java
@Bean
public PasswordEncoder passwordEncoder() {
  return new BCryptPasswordEncoder();
}
```

> 可以根据项目自行选择所使用的`PasswordEncoder`实现类。


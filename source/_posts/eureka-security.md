---
title: 你的Eureka服务注册中心安全吗？
id: eureka-security
article_type: 原创
article_author: 于起宇
enable_comment: true
news: true
hot: true
tags:
  - SpringCloud
  - Eureka
categories:
  - SpringCloud
keywords: eureka,security,恒宇少年
date: 2019-09-29 13:36:59
description: '你的Eureka服务注册中心安全吗？'
---
在之前的章节我们讲到了{% post_path eureka-server 搭建Eureka服务注册中心 %}，已经可以让我们自定义的`微服务节点`进行注册到该`Eureka Server`上，不过在注册过程中存在一个风险的问题，如果我们的`Eureka Server`的地址无意暴露在外，那岂不是通过`Eureka`协议创建的`任意服务`都可以进行注册到该`Eureka Server`吗？（当然如果你配置了服务器的`安全组`并且使用`内网的IP地址`或者`主机名`方式对外提供`服务注册地址`几乎不存在这个问题。）
<!--more-->
### 本章目标
为`Eureka Server`穿上安全的外套，我的注册中心更安全。
### 构建项目
依然使用`idea`开发工具创建一个`SpringBoot`项目，在依赖的选择界面我们添加`Eureka Server`、`Security`相关依赖，`pom.xml`配置文件如下所示：
```xml
//...省略部分内容
<dependencies>
    <!--Eureka服务端-->
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-netflix-eureka-server</artifactId>
    </dependency>
    <!--添加安全认证-->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>

    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
//...省略部分内容
```
因为我们是用的是`Spring Security`作为安全组件，所以在这里需要添加`spring-boot-starter-security`依赖来完成`安全相关组件`的`自动化配置以及实例化`。

既然依赖已经添加好了，那么我们怎么配置安全用户呢？

### 开启注册中心安全配置
在添加安全配置之前，我们需要把`Eureka Server`的配置也一并添加上，如果你对`Eureka Server`配置不太了解，你可以查看{% post_path eureka-server 搭建Eureka服务注册中心 %}阅读学习

#### 配置文件的安全配置
修改`application.yml`配置文件内容，添加安全配置信息，如下所示：
```yaml
# 服务名称
spring:
  application:
    name: hengboy-spring-cloud-eureka-security
  # 安全参数配置
  security:
    user:
      name: api
      password: node
      roles: SERVICE_NODE
# eureka配置
eureka:
  client:
    service-url:
      defaultZone: http://localhost:${server.port}/eureka/
    fetch-registry: false
    register-with-eureka: false

# 端口号
server:
  port: 10000

```
安全相关的内容我们通过`spring.security.user`开头的参数进行配置，对应自动绑定`spring-boot-starter-security`依赖内的`org.springframework.boot.autoconfigure.security.SecurityProperties`属性实体类。
在`SecurityProperties`的内部类`SecurityProperties.User`内我们可以看到已经给我们生成了一个默认的`name`以及`password`
- `spring.security.user.name`
用户名，默认值为`user`，配置`Spring Security`内置使用`内存方式存储`的用户名。
- `spring.security.user.password`
用户对应的密码，默认值为`UUID随机字符串`，配置`Spring Security`默认对应`user`用户的密码，该密码在系统启动时会在`控制台打印`，如果使用默认值可以运行查看控制台的输出内容。

#### 开启Http Basic 安全认证
旧版本的`Spring Security`的依赖是可以在配置文件内容直接通`security.basic.enabled`参数进行开启`basic`认证，不过目前版本已经被`废除`，既然这种方式不可行，那我们就使用另外一种方式进行配置，通过继承`WebSecurityConfigurerAdapter`安全配置类来完成开启认证权限，配置类如下所示：
```java
/**
 * 开启Eureka Server安全认证配置
 *
 * @author：于起宇 <p>
 * ================================
 * Created with IDEA.
 * Date：2018/9/28
 * Time：5:42 PM
 * 简书：http://www.jianshu.com/u/092df3f77bca
 * 码云：https://gitee.com/hengboy
 * GitHub：https://github.com/hengyuboy
 * ================================
 * </p>
 */
@Configuration
public class SecurityConfiguration extends WebSecurityConfigurerAdapter {
    /**
     * 配置安全信息
     * - 禁用csrf攻击功能
     * - 开启所有请求需要验证并且使用http basic进行认证
     *
     * @param http
     * @throws Exception
     */
    @Override
    protected void configure(HttpSecurity http) throws Exception {

        http.csrf()
                .disable()
                .authorizeRequests()
                .anyRequest().authenticated()
                .and()
                .httpBasic();
    }
}
```
如果你了解`Spring Security`那肯定对我们自定义的安全配置类`SecurityConfiguration`的内容不陌生，在`SecurityConfiguration#configure`方法内，我们禁用了`csrf`功能并且开启所有请求都需要通过`basic`方式进行验证。

> 到目前为止我们的`Eureka 注册中心`的安全相关配置已经添加完成，那么我们的服务在进行注册时是不是也需要同步修改呢？
> 
> `答案：肯定以及必须的`
> 
> 不过服务注册时仅仅是微调，影响不太大，那么我们下面来看下该怎么调整。

### 注册服务时的安全配置
如果你对怎么把服务注册到`Eureka Server`不太了解，你可以阅读{% post_path eureka-register-service 将服务注册到Eureka %}来进行学习，
我们只需要修改`eureka.client.service-url.defaultZone`配置的连接字符串内容即可，下面是修改前后的对比：
```yaml
// 修改前
# 配置Eureka Server 信息
eureka:
  client:
    service-url:
      defaultZone: http://localhost:10000/eureka/

// 修改后
# 配置Eureka Server 信息
eureka:
  client:
    service-url:
      defaultZone: http://api:node@localhost:10000/eureka/
```
修改后的`api:node@`这块的内容，前面是`spring.security.user.name`配置的值，而后面则是`spring.security.user.password`配置的值，`@`符号后面才是原本之前的`Eureka Server`的连接字符串信息。
对于上面的修改是不是很简单？

这也归功于`Eureka`的设计，安全方面也是`netflix`他们在研发过程中考虑到的一点，所以才会可以这么简单的集成`Spring Security`安全认证。

### 运行测试
> 本章的测试流程如下：
> 1. 启动`Eureka Server`（本章项目）
> 2. 启动`Eureka Client`（可以自行创建一个`服务节点`，也可以直接使用{% post_path eureka-register-service 将服务注册到Eureka %}源码进行测试。）
> 3. 访问`Eureka Server`管理平台 `http://localhost:10000`
> 4. 输入用户名`api`以及密码`node`进行登录
> 5. 查看`服务注册列表`

### 总结
我们本章为`Eureka Server`穿上了安全的外套，让它可以更安全，在文章开始的时候我说到了如果使用`内网IP`或者`主机名`方式进行服务注册时是几乎不存在`安全问题`的，如果你想你的`服务注册中心`更新安全，大可不必考虑你的`服务注册方式`都可以添加安全认证。
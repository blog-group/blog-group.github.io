---
id: customize-eureka-manage-page
title: 自定义你自己的Eureka管理界面
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: false
news: true
customize: false
tags: [微服务,Spring Cloud,Eureka]
categories: [微服务]
keywords: eureka,springcloud,恒宇少年
date: 2019-11-28 15:07:11
article_url:
description: '自定义你自己的Eureka管理界面'
---

`Eureka`服务端的界面是可以自定义的，而且方式比较简单，下面我们来看下修改方式。

<!--more-->

在某一些公司内部，服务注册中心界面可能需要完全自定义，需要携带一些公司的特性以及元素，如果是这样那么本章节的内容可以帮到你，效果可以查看我公开的[Open Eureka Server](http://open.eureka.yuqiyu.com)服务。

## 创建Eureka Server项目

使用`IDEA`开发工具创建一个`SpringBoot`项目，在`pom.xml`内添加依赖如下所示：

```xml
<properties>
  <java.version>1.8</java.version>
  <spring-cloud.version>Hoxton.RC2</spring-cloud.version>
</properties>

<dependencies>
  <dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-eureka-server</artifactId>
  </dependency>
</dependencies>

<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>org.springframework.cloud</groupId>
      <artifactId>spring-cloud-dependencies</artifactId>
      <version>${spring-cloud.version}</version>
      <type>pom</type>
      <scope>import</scope>
    </dependency>
  </dependencies>
</dependencyManagement>
```

### 启用Eureka Server

我们在启动类`XxxApplication`使用`@EnableEurekaServer`注解来启用`Eureka`管理端的功能，如下所示：

```java
/**
 * 自定义Eureka Server管理界面
 *
 * @author 恒宇少年
 */
@SpringBootApplication
@EnableEurekaServer
public class CustomizeEurekaManagePageApplication {

    public static void main(String[] args) {
        SpringApplication.run(CustomizeEurekaManagePageApplication.class, args);
    }

}
```

### 配置服务

接下来我们在`application.yml`配置文件内添加`Eureka`相关配置信息，如下所示：

```yaml
spring:
  application:
    name: customize-eureka-manage-page
# Eureka配置
eureka:
  client:
    service-url:
      defaultZone: http://127.0.0.1:${server.port}/eureka/
    fetch-registry: false
    register-with-eureka: false

server:
  port: 10000
```



### 自定义页面

在`spring-cloud-netflix-eureka-server-xx.xx.xx.jar`依赖文件内我们可以找到`tempaltes.eureka`目录，结构如下图所示：

![](/images/post/customize-eureka-manage-page-1.png)

`templates.eureka`目录下存放了`Erueka Server`管理页面的模板文件，我们可以将模板文件复制出来到当前项目的`resources/templates/eureka`目录下，然后进行自定义界面内容。

- `header.ftlh`：顶部菜单导航模板页面
- `lastn.ftlh`：服务注册记录模板页面
- `navbar.ftlh`：首页导航栏信息模板页面
- `status.ftlh`：服务所在服务器的基本状态模板页面

我们找到`navbar.ftlh`文件，这个文件内是`Eureka Server`在首页显示系统信息、服务注册列表、服务服务器基本信息的展示页面，我们简单在`System Status`分类下的第一个`table`内添加一行信息，如下所示：

```html
<tr>
  <td>程序员恒宇少年</td>
  <td><img src="https://blog.yuqiyu.com/images/profile2.png" width="400px"/></td>
</tr>
```

## 查看效果

我们来启动或重启下本项目，访问http://127.0.0.1:10000，查看效果如下图所示：

![](/images/post/customize-eureka-manage-page-2.png)

## 总结

通过修改`templates.eureka`目录下的文件我们就可以完成`Eureka Server`界面的自定义的操作，完全可以将页面的内容都进行定制化，心随所动，赶紧行动起来吧~

## 代码示例

本篇文章示例源码可以通过以下途径获取，目录为`customize-eureka-manage-page`：

- Gitee：https://gitee.com/hengboy/spring-cloud-chapter
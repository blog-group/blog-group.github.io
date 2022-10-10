---
id: apiboot-swagger-describe-the-interface
title: 使用Swagger2作为文档来描述你的接口信息
sort_title: 使用Swagger2作为你的接口文档
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: true
news: true
disable_toc: false
customize: false
tags: [ApiBoot,Swagger2]
categories: [ApiBoot]
keywords: swagger,apiboot,接口文档
description: '使用Swagger2作为文档来描述你的接口信息'
date: 2019-12-18 10:34:07
article_url:
---

接口文档在前后分离的项目中是必不可少的一部分，文档的编写一直以来都是一件头疼的事情，写程序`不写注释`、`不写文档`这几乎是程序员的通病，`Swagger2`的产生给广大的程序员们带来了曙光，只需要在接口类或者接口的方法上添加注解配置，就可以实现文档效果，除了可以应用到`单体应用`，在`微服务架构中`也是可以使用的，只需要整合`zuul`就可以实现各个服务的文档整合。

<!--more-->
本文所需ApiBoot相关链接：

- [ApiBoot官网](https://apiboot.minbox.org/)
- [ApiBoot全组件系列文章](https://blog.yuqiyu.com/apiboot-all-articles.html)
- [ApiBoot Gitee源码仓库（欢迎Contributor）](https://gitee.com/minbox-projects/api-boot)
- [ApiBoot GitHub源码仓库（欢迎Contributor）](https://github.com/minbox-projects/api-boot)



## 前言

`ApiBoot Swagger`内部封装了`Swagger2`，只需要一个注解`@EnableApiBootSwagger`就可以实现集成，使用起来非常简单。

`ApiBoot Swagger`提供了一系列的默认配置，比如：`文档标题`、`文档描述`、`文档版本号`等，如果需要修改文档的默认配置，只需要在`application.yml`文件内对应配置参数即可实现自定义，告别了繁琐的代码配置，`ApiBoot`通过自动化配置的方式来实现这一点，可以查看 [ApiBootSwaggerAutoConfiguration](https://gitee.com/minbox-projects/api-boot/blob/master/api-boot-project/api-boot-autoconfigure/src/main/java/org/minbox/framework/api/boot/autoconfigure/swagger/ApiBootSwaggerAutoConfiguration.java) 配置类源码了解详情。

`ApiBoot Swagger`支持在线调试集成`OAuth2`的接口，只需要在文档界面通过 `"Authorize"`按钮设置有效的`AccessToken`即可。

## 可配置参数一览

`ApiBoot Swagger`之所以可以只需要一个注解就可以实现`Swagger2`的集成，其中难免有很多的配置参数在做支持，了解每一个配置参数的作用，我们才能进行心应手的自定义调整。

| 参数名                                  | 默认值                                                 | 描述                                    |
| --------------------------------------- | ------------------------------------------------------ | --------------------------------------- |
| api.boot.swagger.enable                 | true                                                   | 是否启用文档                            |
| api.boot.swagger.title                  | ApiBoot快速集成Swagger文档                             | 文档标题                                |
| api.boot.swagger.description            | -                                                      | 文档描述                                |
| api.boot.swagger.base-package           | SpringBoot默认package，详见`AutoConfigurationPackages` | 生成文档的基础package                   |
| api.boot.swagger.version                | ApiBoot的版本号                                        | 文档版本号                              |
| api.boot.swagger.authorization.name     |                                                        | 授权名称                                |
| api.boot.swagger.authorization.key-name | Authorization                                          | 整合Oauth2后AccessToken在Header内的Name |

<hr/>

上面是常用的参数，更多配置参数详见官方文档：[https://apiboot.minbox.org/zh-cn/docs/api-boot-swagger.html](https://apiboot.minbox.org/zh-cn/docs/api-boot-swagger.html)

## 创建示例项目

我们先来创建一个`SpringBoot`应用程序，在项目的`pom.xml`文件内添加`ApiBoot`的相关依赖，如下所示：

```xml
<dependencies>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
  </dependency>
  <dependency>
    <groupId>org.minbox.framework</groupId>
    <artifactId>api-boot-starter-swagger</artifactId>
  </dependency>

</dependencies>
<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>org.minbox.framework</groupId>
      <artifactId>api-boot-dependencies</artifactId>
      <version>2.2.1.RELEASE</version>
      <type>pom</type>
      <scope>import</scope>
    </dependency>
  </dependencies>
</dependencyManagement>
```

### 启用ApiBoot Swagger

通过`@EnableApiBootSwagger`注解来启用`ApiBoot Swagger`，该注解可以配置在`XxxApplication`入口类上，也可以配置在被`@Configuration`注解修饰的配置类上。

```java
@SpringBootApplication
@EnableApiBootSwagger
public class ApibootSwaggerDescribeTheInterfaceApplication {

    public static void main(String[] args) {
        SpringApplication.run(ApibootSwaggerDescribeTheInterfaceApplication.class, args);
    }

}
```

### 修改默认配置

`ApiBoot Swagger`所提供的**配置参数**都可以在`application.yml`文件内进行设置或修改默认值，下面是修改了`版本号`、`标题`的配置：

```yaml
# ApiBoot相关配置
api:
  boot:
    swagger:
      # 配置文档标题
      title: 接口文档
      # 配置文档版本
      version: v1.0
```

### 测试控制器

为了方便演示`Swagger`文档的强大之处，我们来创建一个测试的控制器，使用`Swagger`提供的注解来描述测试接口，如下所示：

```java
/**
 * 示例控制器
 *
 * @author 恒宇少年
 */
@RestController
@RequestMapping(value = "/user")
@Api(tags = "用户控制器")
public class UserController {
    /**
     * 示例：
     * 根据用户名查询用户基本信息
     *
     * @param name {@link UserResponse#getName()}
     * @return {@link UserResponse}
     */
    @GetMapping(value = "/{name}")
    @ApiOperation(value = "查询用户信息", response = UserResponse.class)
    @ApiResponse(code = 200, message = "success", response = UserResponse.class)
    public UserResponse getUser(@PathVariable("name") String name) {
        return new UserResponse(name, 25);
    }
    /**
     * 响应实体示例
     */
    @ApiModel
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class UserResponse {
        @ApiModelProperty(value = "用户名")
        private String name;
        @ApiModelProperty(value = "年龄")
        private Integer age;
    }
}
```

> 注意：`ApiBoot Swagger`只是针对`Swagger`进行了封装，实现了快速集成，对内部的注解以及配置不做修改。

## 运行测试

启动本章项目源码，访问：[http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html) 查看运行效果，如下图所示：

![](/images/post/apiboot-swagger-describe-the-interface-1.png)

当我们点击 "用户控制器" 时可以展开该`Controller`内定义的接口列表，每一个接口都提供了 "Try it out"（在线调试）功能。

> 本章并没有集成`OAuth2`，在执行在线调试时并不需要配置`AccessToken`。

## 敲黑板，划重点

`ApiBoot Swagger`的实现主要归功于`SpringBoot`自定义`Starter`，根据配置参数进行条件配置控制对象的实例化，通过`@Import`来导入`Swagger`所需要的配置类。

## 代码示例

如果您喜欢本篇文章请为源码仓库点个`Star`，谢谢！！！
本篇文章示例源码可以通过以下途径获取，目录为`apiboot-swagger-describe-the-interface`：

- Gitee：[https://gitee.com/minbox-projects/api-boot-chapter](https://gitee.com/minbox-projects/api-boot-chapter)
---
id: mongodb-springboot2-rest
title: SpringBoot2.x使用MongoDB的Rest端点访问数据
article_type: 原创
article_author: 于起宇
enable_comment: true
news: true
tags:
  - MongoDB
  - SpringBoot
categories:
  - SpringBoot
date: 2019-09-29 17:45:49
keywords: SpringCloud,SpringBoot,恒宇少年,微服务,mongodb
description: 'SpringBoot2.x使用MongoDB的Rest端点访问数据'
---
在之前项目中我们想要读取`MongoDB`内的内容需要使用`MongoDBTemplate`来完成数据的`CRUD`，那如果我们想要通过`RestController`的形式获取`MongoDB`内的数据就更麻烦了，还需要自行去创建对应的控制器，然后使用`MongoDBTemplate`从`MongoDB`内读取出数据后返回给前端。
<!--more-->

在上一章节[第五十一章：基于SpringBoot2 & MongoDB完成自动化集成](https://www.jianshu.com/p/2ec104e4ab39)我们讲到了`SpringBoot2`与`MongoDB`集成后怎么简单的操作数据，当然`Spring Data Xxx`家族方式的设计与`Spring Data JPA`一样，`Sring Data MongoDB`提供了一个`MongoRepository<T,PK>`接口来为继承该接口的子接口自动提供代理类完成数据操作实现。
***
# 本章目标
使用`Spring Data Rest`自动映射读取`MongoDB`内的数据，省去一系列繁琐的操作步骤。

# 构建项目
使用`Idea`开发工具创建一个`SpringBoot`的项目，添加相应的依赖，pom.xml配置文件依赖内容如下所示：
```xml
<dependencies>
    <!--mongodb依赖-->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-mongodb</artifactId>
    </dependency>
    <!--data rest依赖-->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-rest</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
    <!--Lombok依赖-->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
    </dependency>
</dependencies>
```
我们本章节的依赖比上一章多了一个`spring-boot-starter-data-rest`，通过这个依赖我们可以自动完成`RestController`的依赖配置，不需要再手动去创建控制器，因为我们通过一些简单的注解配置以及固定格式名称规则的方法就可以完成控制器的实现。

> 因为本章的内容需要在上一章的基础上编写，所以我们直接把之前章节的相关的配置以及类都复制到本项目内，复制的内容有：`application.yml`、`Customer`、`CustomerRepository`。(源码位置：[第五十一章源码](https://gitee.com/hengboy/spring-boot-chapter/tree/master/Chapter51))
***
### 改造CustomerRepository

`spring-boot-starter-data-rest`会自动扫描添加`@RepositoryRestResource`注解的接口，自动将该接口映射为`一系列`可通过`rest`访问的请求路径，这里说到一系列，我们在测试的时候会讲到为什么说是`一系列！！！`。
既然需要添加注解，那么我们就打开`CustomerRepository`接口，对应为它添加上如下注解内容：
```java
@RepositoryRestResource(collectionResourceRel = "customer", path = "customer")
public interface CustomerRepository extends MongoRepository<Customer, String> {
//....省略
}
```
注解内需要提供两个参数，
`collectionResourceRel `：该参数配置映射`MongoDB`内的`Collection`名称。
`path `：该参数配置映射完成`rest`后访问的路径前缀。
***
# 运行测试
我们先来简单的运行测试下是否可以通过我们配置的`path`路径实现访问内容，启动项目时我们可以看到控制台的输出内容：
```bash
Mapped "{[/{repository}/search],methods=[GET]
Mapped "{[/{repository}/search/{search}],methods=[GET]
Mapped "{[/{repository}/{id}/{property}],methods=[GET]
Mapped "{[/{repository}],methods=[GET]
....
```
我们配置一个`@RepositoryRestResource`注解的接口就会根据`rest`内置的一系列的条件生成对应的请求，这也是我们在之前说到的`一系列`请求路径的地方，我们先来访问下映射`/{repository}`的路径。
***
#### 测试 /{repository} 映射路径

> 你如果使用`Windows`系统直接打开浏览器输出地址就可以看到返回的内容，如果你使用`Linux`或者`OS X`系统可以在`Terminal`使用`curl`命令查看返回内容。

我们访问：[http://localhost:8080/customer](http://localhost:8080/customer)，路径查看返回的内容：
```json
➜  ~ curl http://localhost:8080/customer
{
  "_embedded" : {
    "customer" : [ {
      "firstName" : "恒宇",
      "lastName" : "少年",
      "_links" : {
        "self" : {
          "href" : "http://localhost:8080/customer/5adbec9ceb89f105acd90cec"
        },
        "customer" : {
          "href" : "http://localhost:8080/customer/5adbec9ceb89f105acd90cec"
        }
      }
    } ]
  },
  "_links" : {
    "self" : {
      "href" : "http://localhost:8080/customer{?page,size,sort}",
      "templated" : true
    },
    "profile" : {
      "href" : "http://localhost:8080/profile/customer"
    }
  },
  "page" : {
    "size" : 20,
    "totalElements" : 1,
    "totalPages" : 1,
    "number" : 0
  }
}
```
通过这个地址我们可以读取出`@RepositoryRestResource注解`配置的`collectionResourceRel`对应的 `MongoDB.collection`集合内的数据，我们发现不仅读取出来了数据而且还为我们提供了`分页的信息`，这可是很贴心的地方啊，默认读取`第1页`，`每页20条`数据。
***
#### 测试 /{repository}/{id} 映射路径
我们访问[http://localhost:8080/customer/5adbec9ceb89f105acd90cec](http://localhost:8080/customer/5adbec9ceb89f105acd90cec)（注意：这里的id是你本地生成的，这个id是我本地生成，直接访问会出现404）如下所示：
```json
➜  ~ curl http://localhost:8080/customer/5adbec9ceb89f105acd90cec
{
  "firstName" : "恒宇",
  "lastName" : "少年",
  "_links" : {
    "self" : {
      "href" : "http://localhost:8080/customer/5adbec9ceb89f105acd90cec"
    },
    "customer" : {
      "href" : "http://localhost:8080/customer/5adbec9ceb89f105acd90cec"
    }
  }
}
```
根据返回的内容看到是能够访问根据`id`查询的数据内容的。
***
#### 测试 /{repository}/search/{search} 映射路径
这个映射的配置是专门为我们自定义方法准备的，自定义方法的规则与`SpringDataJPA`的方法名称规则一样，当我们在接口创建`findByXxx`方法时`Idea`会自动为我们提示相应的内容，下面我们就创建两个不同的查询方法，如下所示：
```java
    /**
     * 更加名字查询数据
     *
     * @param firstName 名字
     * @return
     */
    List<Customer> findByFirstName(@Param("firstName") String firstName);

    /**
     * 根据姓氏查询出最靠前的一条数据
     *
     * @param lastName 姓氏
     * @return
     */
    Customer findTopByLastName(@Param("lastName") String lastName);
```
下面我们重启下项目访问路径[http://localhost:8080/customer/search/findByFirstName?firstName=恒宇](http://localhost:8080/customer/search/findByFirstName?firstName=%E6%81%92%E5%AE%87)可以看到返回内容：
```json
➜  ~ curl http://localhost:8080/customer/search/findByFirstName\?firstName\=%E6%81%92%E5%AE%87
{
  "_embedded" : {
    "customer" : [ {
      "firstName" : "恒宇",
      "lastName" : "少年",
      "_links" : {
        "self" : {
          "href" : "http://localhost:8080/customer/5adbec9ceb89f105acd90cec"
        },
        "customer" : {
          "href" : "http://localhost:8080/customer/5adbec9ceb89f105acd90cec"
        }
      }
    } ]
  },
  "_links" : {
    "self" : {
      "href" : "http://localhost:8080/customer/search/findByFirstName?firstName=%E6%81%92%E5%AE%87"
    }
  }
}
```
自动的根据我们的配置的方法查询出了对应的数据，自动过滤了对应的数据，不过这个是没有分页的。
同样另外一个自定义方法的请求[http://localhost:8080/customer/search/findTopByLastName?lastName=少年](http://localhost:8080/customer/search/findTopByLastName?lastName=%E5%B0%91%E5%B9%B4)，也是一样的可以对应的获取过滤后的数据。

> 注意：@Param注解内的参数名称要与`Customer`内的属性对应。

如果你想查看配置的全部自定义的方法，访问：[http://localhost:8080/customer/search](http://localhost:8080/customer/search)，如下所示：
```json
➜  ~ curl http://localhost:8080/customer/search                                               
{
  "_links" : {
    "findByFirstName" : {
      "href" : "http://localhost:8080/customer/search/findByFirstName{?firstName}",
      "templated" : true
    },
    "findTopByLastName" : {
      "href" : "http://localhost:8080/customer/search/findTopByLastName{?lastName}",
      "templated" : true
    },
    "self" : {
      "href" : "http://localhost:8080/customer/search"
    }
  }
}
```
***
# 总结
本章内容主要是围绕着`spring-boot-starter-data-rest`这个依赖进行的，这个依赖帮助我们完成了日常编码中一些重复的工作，而且很智能的提供了一些映射，更方便我们进行查询数据。

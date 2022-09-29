---
id: use-mapstruct
title: 使用MapStruct自动化转换实体
article_type: 原创
article_author: 于起宇
enable_comment: true
news: true
tags:
  - SpringBoot
categories:
  - SpringBoot
date: 2019-09-29 15:04:31
keywords: mapstruct,实体映射,SpringBoot,恒宇少年
description: '使用MapStruct自动化转换实体'
---
``MapStruct``是一种类型安全的``bean映射``类生成java注释处理器。
我们要做的就是定义一个映射器接口，声明任何必需的映射方法。在编译的过程中，``MapStruct``会生成此接口的实现。该实现使用纯java方法调用的源和目标对象之间的映射，``MapStruct``节省了时间，通过生成代码完成繁琐和容易出错的代码逻辑。下面我们来揭开它的神秘面纱
<!--more-->
# 本章目标
基于``SpringBoot``平台完成``MapStruct``映射框架的集成。

# 构建项目
我们使用idea开发工具创建一个``SpringBoot``项目，添加相应的依赖，pom.xml配置文件如下所示：
```xml
...省略部分代码
<parent>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-parent</artifactId>
  <version>1.5.6.RELEASE</version>
  <relativePath/> <!-- lookup parent from repository -->
</parent>

<properties>
  <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
  <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
  <java.version>1.8</java.version>
  <org.mapstruct.version>1.2.0.CR1</org.mapstruct.version>
</properties>

<dependencies>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
  </dependency>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
  </dependency>

  <dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
    <scope>runtime</scope>
  </dependency>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-tomcat</artifactId>
    <!--<scope>provided</scope>-->
  </dependency>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
  </dependency>

  <!--mapStruct依赖-->
  <dependency>
    <groupId>org.mapstruct</groupId>
    <artifactId>mapstruct-jdk8</artifactId>
    <version>${org.mapstruct.version}</version>
  </dependency>
  <dependency>
    <groupId>org.mapstruct</groupId>
    <artifactId>mapstruct-processor</artifactId>
    <version>${org.mapstruct.version}</version>
    <scope>provided</scope>
  </dependency>
  <dependency>
    <groupId>javax.inject</groupId>
    <artifactId>javax.inject</artifactId>
    <version>1</version>
  </dependency>
  
  <dependency>
    <groupId>com.alibaba</groupId>
    <artifactId>druid</artifactId>
    <version>1.0.31</version>
  </dependency>
  <dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
  </dependency>
</dependencies>
....省略部分代码
```
集成MapStruct官方提供了两种方式，上面配置文件内我们采用的是直接添加Maven依赖，而官方文档还提供了另外一种方式，采用Maven插件形式配置，配置如下所示：
```xml
...引用官方文档
...
<properties>
    <org.mapstruct.version>1.2.0.CR1</org.mapstruct.version>
</properties>
...
<dependencies>
    <dependency>
        <groupId>org.mapstruct</groupId>
        <artifactId>mapstruct-jdk8</artifactId>
        <version>${org.mapstruct.version}</version>
    </dependency>
</dependencies>
...
<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-compiler-plugin</artifactId>
            <version>3.5.1</version>
            <configuration>
                <source>1.8</source>
                <target>1.8</target>
                <annotationProcessorPaths>
                    <path>
                        <groupId>org.mapstruct</groupId>
                        <artifactId>mapstruct-processor</artifactId>
                        <version>${org.mapstruct.version}</version>
                    </path>
                </annotationProcessorPaths>
            </configuration>
        </plugin>
    </plugins>
</build>
...
```
我个人比较喜欢采用第一种方式，不需要配置过多的插件，依赖方式比较方便。
接下来我们开始配置下数据库连接信息以及简单的两张表的SpringDataJPA相关接口。
## 数据库连接信息
在resource下新创建一个application.yml文件，并添加如下数据库连接配置：
```yaml
spring:
  datasource:
    type: com.alibaba.druid.pool.DruidDataSource
    driver-class-name: com.mysql.jdbc.Driver
    url: jdbc:mysql://127.0.0.1:3306/test?characterEncoding=utf8
    username: root
    password: 123456
    #最大活跃数
    maxActive: 20
    #初始化数量
    initialSize: 1
    #最大连接等待超时时间
    maxWait: 60000
    #打开PSCache，并且指定每个连接PSCache的大小
    poolPreparedStatements: true
    maxPoolPreparedStatementPerConnectionSize: 20
    #通过connectionProperties属性来打开mergeSql功能；慢SQL记录
    #connectionProperties: druid.stat.mergeSql=true;druid.stat.slowSqlMillis=5000
    minIdle: 1
    timeBetweenEvictionRunsMillis: 60000
    minEvictableIdleTimeMillis: 300000
    validationQuery: select 1 from dual
    testWhileIdle: true
    testOnBorrow: false
    testOnReturn: false
    #配置监控统计拦截的filters，去掉后监控界面sql将无法统计,'wall'用于防火墙
    filters: stat, wall, log4j
  jpa:
    properties:
      hibernate:
        show_sql: true
        format_sql: true
```
有关SpringDataJPA相关的学习请访问[第三章：SpringBoot使用SpringDataJPA完成CRUD](http://www.jianshu.com/p/b6932740f3c0)，我们在数据库内创建两张表信息分别是商品基本信息表、商品类型表。
两张表有相应的关联，我们在不采用连接查询的方式模拟使用``MapStruct``，表信息如下所示：
```sql
--商品类型信息表
CREATE TABLE `good_types` (
  `tgt_id` int(11) NOT NULL AUTO_INCREMENT,
  `tgt_name` varchar(30) DEFAULT NULL,
  `tgt_is_show` int(1) DEFAULT NULL,
  `tgt_order` int(255) DEFAULT NULL,
  PRIMARY KEY (`tgt_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

--商品基本信息表
CREATE TABLE `good_infos` (
  `tg_id` int(11) NOT NULL AUTO_INCREMENT,
  `tg_type_id` int(11) DEFAULT NULL,
  `tg_title` varchar(30) DEFAULT NULL,
  `tg_price` decimal(8,2) DEFAULT NULL,
  `tg_order` int(2) DEFAULT NULL,
  PRIMARY KEY (`tg_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

INSERT INTO `good_types` VALUES ('1', '青菜', '1', '1');
INSERT INTO `good_infos` VALUES ('1', '1', '芹菜', '12.40', '1');
```
下面我们根据这两张表创建对应的实体类。
#### 商品类型实体
```java
package com.yuqiyu.chapter30.bean;

import lombok.Data;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

/**
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2017/8/20
 * Time：11:17
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
@Entity
@Table(name = "good_types")
@Data
public class GoodTypeBean
{
    @Id
    @Column(name = "tgt_id")
    private Long id;

    @Column(name = "tgt_name")
    private String name;
    @Column(name = "tgt_is_show")
    private int show;
    @Column(name = "tgt_order")
    private int order;

}

```
#### 商品基本信息实体
```java
package com.yuqiyu.chapter30.bean;

import lombok.Data;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

/**
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2017/8/20
 * Time：11:16
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
@Entity
@Table(name = "good_infos")
@Data
public class GoodInfoBean
{
    @Id
    @Column(name = "tg_id")
    private Long id;
    @Column(name = "tg_title")
    private String title;
    @Column(name = "tg_price")
    private double price;
    @Column(name = "tg_order")
    private int order;
    @Column(name = "tg_type_id")
    private Long typeId;
}
```
接下来我们继续创建相关的JPA。
#### 商品类型JPA
```java
package com.yuqiyu.chapter30.jpa;

import com.yuqiyu.chapter30.bean.GoodTypeBean;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2017/8/20
 * Time：11:24
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
public interface GoodTypeJPA
    extends JpaRepository<GoodTypeBean,Long>
{
}

```
#### 商品信息JPA
```java
package com.yuqiyu.chapter30.jpa;

import com.yuqiyu.chapter30.bean.GoodInfoBean;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2017/8/20
 * Time：11:23
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
public interface GoodInfoJPA
    extends JpaRepository<GoodInfoBean,Long>
{
    
}
```
# 配置MapStruct
到目前为止我们的准备工作差不多完成了，下面我们开始配置使用``MapStruct``。我们的最终目的是为了返回一个自定义的DTO实体，那么我们就先来创建这个DTO，DTO的代码如下所示：
```java
package com.yuqiyu.chapter30.dto;

import lombok.Data;

/**
 * 转换Dto
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2017/8/20
 * Time：11:25
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
@Data
public class GoodInfoDTO
{
    //商品编号
    private String goodId;
    //商品名称
    private String goodName;
    //商品价格
    private double goodPrice;
    //类型名称
    private String typeName;
}
```
可以看到GoodInfoDTO实体内集成了商品信息、商品类型两张表内的数据，对应查询出信息后，我们需要使用``MapStruct``自动映射到GoodInfoDTO。

### 创建Mapper

``Mapper``这个定义一般是被广泛应用到``MyBatis``半自动化ORM框架上，而这里的Mapper跟``Mybatis``没有关系。下面我们先来看下代码，如下所示：
```java
package com.yuqiyu.chapter30.mapper;

import com.yuqiyu.chapter30.bean.GoodInfoBean;
import com.yuqiyu.chapter30.bean.GoodTypeBean;
import com.yuqiyu.chapter30.dto.GoodInfoDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;

/**
 * 配置映射
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2017/8/20
 * Time：11:26
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
@Mapper(componentModel = "spring")
//@Mapper
public interface GoodInfoMapper
{
    //public static GoodInfoMapper MAPPER = Mappers.getMapper(GoodInfoMapper.class);

    @Mappings({
            @Mapping(source = "type.name",target = "typeName"),
            @Mapping(source = "good.id",target = "goodId"),
            @Mapping(source = "good.title",target = "goodName"),
            @Mapping(source = "good.price",target = "goodPrice")
    })
    public GoodInfoDTO from(GoodInfoBean good, GoodTypeBean type);
}
```
可以看到GoodInfoMapper是一个接口的形式存在的，当然也可以是一个抽象类，如果你需要在转换的时候才用个性化的定制的时候可以采用抽象类的方式，相应的代码配置官方文档已经声明。
``@Mapper``注解是用于标注接口、抽象类是被``MapStruct``自动映射的标识，只有存在该注解才会将内部的接口方法自动实现。
``MapStruct``为我们提供了多种的获取Mapper的方式，比较常用的两种分别是
##### 默认配置
默认配置，我们不需要做过多的配置内容，获取Mapper的方式就是采用``Mappers``通过动态工厂内部反射机制完成Mapper实现类的获取。
默认方式获取Mapper如下所示：
```java
//Mapper接口内部定义
public static GoodInfoMapper MAPPER = Mappers.getMapper(GoodInfoMapper.class);

//外部调用
GoodInfoMapper.MAPPER.from(goodBean,goodTypeBean);
```
##### Spring方式配置
``Spring``方式我们需要在``@Mapper``注解内添加``componentModel``属性值，配置后在外部可以采用``@Autowired``方式注入Mapper实现类完成映射方法调用。
Spring方式获取Mapper如下所示：
```java
//注解配置
@Mapper(componentModel = "spring")

//注入Mapper实现类
@Autowired
private GoodInfoMapper goodInfoMapper;

//调用
goodInfoMapper.from(goodBean,goodTypeBean);
```
##### @Mappings & @Mapping
在``Mapper``接口定义方法上面声明了一系列的注解映射``@Mapping``以及``@Mappings``，那么这两个注解是用来干什么工作的呢？
``@Mapping``注解我们用到了两个属性，分别是``source``、``target``

``source``代表的是映射接口方法内的参数名称，如果是基本类型的参数，参数名可以直接作为``source``的内容，如果是实体类型，则可以采用实体参数名.字段名的方式作为``source``的内容，配置如上面``GoodInfoMapper``内容所示。

``target``代表的是映射到方法方法值内的字段名称，配置如上面``GoodInfoMapper``所示。

#### 查看Mapper实现
下面我们执行maven compile命令，到target/generated-sources/annotations目录下查看对应``Mapper``实现类，实现类代码如下所示：
```java
package com.yuqiyu.chapter30.mapper;

import com.yuqiyu.chapter30.bean.GoodInfoBean;
import com.yuqiyu.chapter30.bean.GoodTypeBean;
import com.yuqiyu.chapter30.dto.GoodInfoDTO;
import javax.annotation.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2017-08-20T12:52:52+0800",
    comments = "version: 1.2.0.CR1, compiler: javac, environment: Java 1.8.0_111 (Oracle Corporation)"
)
@Component
public class GoodInfoMapperImpl implements GoodInfoMapper {

    @Override
    public GoodInfoDTO from(GoodInfoBean good, GoodTypeBean type) {
        if ( good == null && type == null ) {
            return null;
        }

        GoodInfoDTO goodInfoDTO = new GoodInfoDTO();

        if ( good != null ) {
            if ( good.getId() != null ) {
                goodInfoDTO.setGoodId( String.valueOf( good.getId() ) );
            }
            goodInfoDTO.setGoodName( good.getTitle() );
            goodInfoDTO.setGoodPrice( good.getPrice() );
        }
        if ( type != null ) {
            goodInfoDTO.setTypeName( type.getName() );
        }

        return goodInfoDTO;
    }
}

```
``MapStruct``根据我们配置的``@Mapping``注解自动将``source``实体内的字段进行了调用``target``实体内字段的setXxx方法赋值，并且做出了一切参数验证。
我们采用了``Spring方式``获取``Mapper``，在自动生成的实现类上``MapStruct``为我们自动添加了``@Component``Spring声明式注入注解配置。

# 运行测试
下面我们来创建一个测试的Controller，用于访问具体请求地址时查询出商品的基本信息以及商品的类型后调用``GoodInfoMapper.from(xxx,xxx)``方法完成返回``GoodInfoDTO``实例。Controller代码实现如下所示：
```java
package com.yuqiyu.chapter30.controller;

import com.yuqiyu.chapter30.bean.GoodInfoBean;
import com.yuqiyu.chapter30.bean.GoodTypeBean;
import com.yuqiyu.chapter30.dto.GoodInfoDTO;
import com.yuqiyu.chapter30.jpa.GoodInfoJPA;
import com.yuqiyu.chapter30.jpa.GoodTypeJPA;
import com.yuqiyu.chapter30.mapper.GoodInfoMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 测试控制器
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2017/8/20
 * Time：12:24
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
@RestController
public class GoodInfoController
{
    /**
     * 注入商品基本信息jpa
     */
    @Autowired
    private GoodInfoJPA goodInfoJPA;
    /**
     * 注入商品类型jpa
     */
    @Autowired
    private GoodTypeJPA goodTypeJPA;
    /**
     * 注入mapStruct转换Mapper
     */
    @Autowired
    private GoodInfoMapper goodInfoMapper;

    /**
     * 查询商品详情
     * @param id
     * @return
     */
    @RequestMapping(value = "/detail/{id}")
    public GoodInfoDTO detail(@PathVariable("id") Long id)
    {
        //查询商品基本信息
        GoodInfoBean goodInfoBean = goodInfoJPA.findOne(id);
        //查询商品类型基本信息
        GoodTypeBean typeBean = goodTypeJPA.findOne(goodInfoBean.getTypeId());
        //返回转换dto
        return goodInfoMapper.from(goodInfoBean,typeBean);
    }
}
```
在Controller内我们注入了``GoodInfoJPA``、``GoodTypeJPA``以及``GoodInfoMapper``，在查询商品详情方法时做出了映射处理。接下来我们启动项目访问地址[http://127.0.0.1:8080/detail/1](http://127.0.0.1:8080/detail/1)查看界面输出效果，如下所示：
```json
{
"goodId": "1",
"goodName": "芹菜",
"goodPrice": 12.4,
"typeName": "青菜"
}
```
可以看到界面输出了``GoodInfoDTO``内的所有字段内容，并且通过from方法将对应配置的``target``字段赋值。

# 总结
本章主要讲述了基于``SpringBoot``开发框架上集成``MapStruct``自动映射框架，完成模拟多表获取数据后将某一些字段通过``@Mapping``配置自动映射到DTO实体实例指定的字段内。
``MapStruct``官方文档地址：[http://mapstruct.org/documentation/dev/reference/html/](http://mapstruct.org/documentation/dev/reference/html/)
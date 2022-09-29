---
id: springboot-active-profiles
title: 激活项目配置的多环境(profiles)
article_type: 原创
article_author: 于起宇
enable_comment: true
news: true
tags:
  - SpringCloud
  - profile
  - SpringBoot
categories:
  - SpringBoot
date: 2019-09-29 15:33:29
keywords: springboot,active,profiles
description: '激活项目配置的多环境(profiles)'
---
在中大型企业项目开发中，环境分离是必不可少的一步，然而现在的开发人员也只是有这个概念，还是有很多项目采用普通的方式，每次打包发布部署的时候改动一大堆的配置文件，有一个地方忘记改就相当于白更新了一次系统，这种修改配置文件完成环境更换的方式给我们带来了很多的困扰，浪费了我们很多宝贵的时间！早在``Spring 3.1``版本就已经为我们提供了环境分离的相关注解配置方式，不过在传统的Spring项目中配置``Profile``确实有点麻烦，在``Spring``版本的不断更新直到后来``SpringBoot``成长起来后``Profile``已经能够很好支持项目配置环境分离。
<!--more-->
# 本章目标
基于``SpringBoot``平台完成简单的数据库环境操作分离，根据激活不同的``Profile``完成不同的数据库操作。

# 构建项目
使用Idea工具创建一个``SpringBoot``项目，目前``SpringBoot``的版本已经更新至``1.5.8``，我们采用最新版本来完成本章内容，添加相关``JPA``、``MySQL``、``Druid``、``Lombok``、``Web``、``FastJson``等，pom.xml依赖相关配置如下所示：
```xml
....省略部分配置
<parent>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-parent</artifactId>
  <version>1.5.8.RELEASE</version>
  <relativePath/> <!-- lookup parent from repository -->
</parent>

<properties>
  <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
  <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
  <java.version>1.8</java.version>
</properties>

<dependencies>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
  </dependency>

  <!--引入druid最新maven依赖-->
  <dependency>
    <groupId>com.alibaba</groupId>
    <artifactId>druid</artifactId>
    <version>1.1.4</version>
  </dependency>
  <dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
    <scope>runtime</scope>
  </dependency>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
  </dependency>
  <dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
  </dependency>
  <!-- https://mvnrepository.com/artifact/com.alibaba/fastjson -->
  <dependency>
    <groupId>com.alibaba</groupId>
    <artifactId>fastjson</artifactId>
    <version>1.2.39</version>
  </dependency>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
  </dependency>
</dependencies>
....省略部分配置
```
### 配置数据库
我们创建三个数据库分别是``project_prod`` => 线上环境数据库、``project_dev``=>开发环境数据库、``project_beta``=>线上测试环境数据库，这样我们在切换``Profile``时可以很好的区分环境，下面我们创建一张用户基本信息表，SQL如下：
```sql
-- ----------------------------
-- Table structure for system_user_info
-- ----------------------------
DROP TABLE IF EXISTS `system_user_info`;
CREATE TABLE `system_user_info` (
  `SUI_ID` int(11) NOT NULL AUTO_INCREMENT,
  `SUI_NICK_NAME` varchar(50) DEFAULT NULL,
  `SUI_LOGIN_NAME` varchar(30) DEFAULT NULL,
  `SUI_LOGIN_PASSWORD` varchar(32) DEFAULT NULL,
  PRIMARY KEY (`SUI_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;
```
将上面SQL分别在三个数据库内分别执行一次，保证我们数据结构环境一致，然后对应数据库分别插入数据，如下：
```sql
INSERT INTO `system_user_info` VALUES ('1', '线上测试环境用户', 'beta', 'beta_password');
INSERT INTO `system_user_info` VALUES ('1', '开发环境用户', 'dev', 'dev_password');
INSERT INTO `system_user_info` VALUES ('1', '正式环境用户', 'prod', 'prod_password');
```
这样我们就可以区分项目正在访问的具体环境。

### 创建Entity
对应``system_user_info``数据表创建一个数据实体，如下所示：
```java
package com.yuqiyu.chapter38.entity;

import lombok.Data;

import javax.persistence.*;

/**
 * 用户基本信息实体
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2017/10/29
 * Time：08:25
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
@Entity
@Table(name = "system_user_info")
@Data
public class SystemUserInfoEntity
{
    /**
     * 主键
     */
    @Column(name = "SUI_ID")
    @GeneratedValue
    @Id
    private Integer id;
    /**
     * 昵称
     */
    @Column(name = "SUI_NICK_NAME")
    private String nickName;
    /**
     * 登录名
     */
    @Column(name = "SUI_LOGIN_NAME")
    private String loginName;
    /**
     * 登录密码
     */
    @Column(name = "SUI_LOGIN_PASSWORD")
    private String loginPassword;
}
```
接下来我们为上面的实体创建一个JPA接口，继承``JpaRepository<T,PK>``接口完成``Jpa``扫描自动代理实例的动作。
### 创建JPA
``SystemUserInfoJPA``接口内容如下所示：
```java
package com.yuqiyu.chapter38.jpa;

import com.yuqiyu.chapter38.entity.SystemUserInfoEntity;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * 系统用户信息jpa
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2017/10/29
 * Time：08:30
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
public interface SystemUserInfoJPA
    extends JpaRepository<SystemUserInfoEntity,Integer>
{

}
```
### 配置Profile环境
在``SpringBoot``内已经为了约定好了``Profile``配置文件的命名规则，即：``application-xxx.properties``或者``application-xxx.yml``，我们只需要将对应环境的配置文件放到``resources``目录下即可，也就是``classpath``下，我们对应我们的数据库环境编写三个不同的配置文件。

#### application-dev.yml
根据我们与``SpringBoot``的约定在``application-dev.xml``配置文件内配置的都是开发环境信息，里面包含了开发环境数据源配置信息，当然在实际的项目开发过程中配置信息可以任意约定。配置内容如下所示：
```yaml
spring:
  datasource:
    type: com.alibaba.druid.pool.DruidDataSource
    driver-class-name: com.mysql.jdbc.Driver
    url: jdbc:mysql://127.0.0.1:3306/project_dev?characterEncoding=utf8
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
在上面代码中可以看到，我们连接了本地的``project_dev``数据库来作为开发环境的访问数据源。
#### application-beta.yml
``application-beta.yml``配置文件就是我们与``SpringBoot``约定的线上测试环境，在我们实际的开发过程中线上测试环境肯定与开发环境不是同一个数据库，这时我们将``application-dev.yml``配置文件复制一份，修改下数据库链接信息即可，如果你的``application-beta.yml``还存在其他的配置，不要忘记修改成相关的环境配置。配置信息如下所示：
```yaml
spring:
  datasource:
    type: com.alibaba.druid.pool.DruidDataSource
    driver-class-name: com.mysql.jdbc.Driver
    url: jdbc:mysql://127.0.0.1:3306/project_beta?characterEncoding=utf8
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
#### application-prod.yml
而``application-prod.yml``配置文件则是我们与``SpringBoot``约定的线上生产环境的配置文件，里面保存的全部都是正式环境配置信息，一般在开发过程中线上环境配置信息是不需要变动的，配置完成后就只是在打包部署时修改``spring.profiles.active``为``prod``就可以了（注：根据实际项目的线上环境的配置约定名称而定）。配置信息如下所示：
```yaml
spring:
  datasource:
    type: com.alibaba.druid.pool.DruidDataSource
    driver-class-name: com.mysql.jdbc.Driver
    url: jdbc:mysql://127.0.0.1:3306/project_prod?characterEncoding=utf8
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
为了方便我们测试，我在本地创建的三个数据库，当然实际项目开发中你可能是数据库读写分离环境，也可能是多台服务器完全分离的环境，只需要针对不同的约定修改相对应的配置信息就可以了。

# 测试Profile

下面我们来创建一个控制器，使用我们上面已经创建好的``SystemUserInfoJPA``完成数据库的读取动作。
#### 创建测试控制器
在上面我们为每一个环境的数据库表````都初始化了一条数据，那么我就来编写一个读取数据库的请求方法，根据我们修改的``spring.profiles.active``配置文件内容，是否可以改变请求数据库。控制器代码如下所示：
```java
package com.yuqiyu.chapter38;

import com.yuqiyu.chapter38.entity.SystemUserInfoEntity;
import com.yuqiyu.chapter38.jpa.SystemUserInfoJPA;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 测试profile环境
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2017/10/29
 * Time：09:02
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 * @author hengyu
 */
@RestController
@RequestMapping(value = "/user")
public class IndexController
{
    @Autowired
    private SystemUserInfoJPA systemUserInfoJPA;

    /**
     * 查询用户详情
     * @param id
     * @return
     */
    @RequestMapping(value = "/{id}")
    public SystemUserInfoEntity detail(@PathVariable("id") Integer id)
        throws Exception
    {
        return systemUserInfoJPA.findOne(id);
    }
}
```
在控制器内，我们通过访问``/user/{id}``请求地址，就可以获取到用户的基本信息在页面上通过``Json``字符串的形式展示，下面我们就来配置需要激活的``Profile``，访问该请求地址查看输出效果。

## 激活Profile
由于激活``Profile``的配置不属于任何一个环境分离的配置文件，所以我们不可以在``dev``、``beta``、``prod``任意一个配置文件内添加激活配置，我们知道``application.yml``是``SpringBoot``约定的配置文件，那么我就在该配置文件内配置环境分离激活，配置如下所示：
```yaml
spring:
  profiles:
    active: dev
```
我们在``application.yml``配置文件内激活了``dev``开发环境，下面我们启动项目访问请求路径http://127.0.0.1:8080/user/1来查看界面输出内容，如下所示：
```json
{
  "id": 1,
  "nickName": "开发环境用户",
  "loginName": "dev",
  "loginPassword": "dev_password"
}
```
正如我们所料，正确的输出了开发环境的用户信息，那我们修改下激活环境是不是也会编程相对应的输出呢？下面我们来证实这一点，修改激活环境为线上开发环境：
```yaml
spring:
  profiles:
    active: beta
```
重启项目，再次访问http://127.0.0.1:8080/user/1请求路径，界面输出内容如下所示：
```json
{
  "id": 1,
  "nickName": "线上测试环境用户",
  "loginName": "beta",
  "loginPassword": "beta_password"
}
```
可以看到已经改成我们需要的效果，我们只是激活了不同的环境，就轻松实现了环境的分离，正式环境也是一样的，下面我们来激活正式环境完成``Package``打包。

## 正式环境打包
有很多项目在上线打包部署的时候需要改动很多配置文件，访问地址等等配置信息，那我们采用了``Profile``后打包该怎么处理呢？
答案是：省心。
第一步我们只需要修改激活环境改成线上环境即可，如下所示：
```yaml
spring:
  profiles:
    active: prod
```
第二步运行打包命令，等待打包完成。本章是采用的``Idea``开发工具完成的打包，``Idea``工具为``Maven``自带了命令窗口，只需要选择不同的命令双击就可以执行，如下图1所示：

![图1](/images/post/active-profiles.png)
我们双击``package``命令，等待打包完成就可以了，完成后``jar``或者``war``会在``target``目录生成，下面我们使用``Windows CMD``命令行进入``jar``存在的目录，执行命令之前需要关掉``Idea``启动的项目：
```bash
java -jar chapter38-0.0.1-SNAPSHOT.jar
```
启动完成后，我们再次访问请求地址http://127.0.0.1:8080/user/1，查看界面输出内容：
```json
{
  "id": 1,
  "nickName": "正式环境用户",
  "loginName": "prod",
  "loginPassword": "prod_password"
}
```
正确输出了``prod``正式环境的用户信息。

# 总结
``Profile``的加入可以让很多运维实施人员减少了太多的烦恼，在几年前部署完全都是采用修改配置文件，如果修改出错还会导致返工，既浪费了时间也浪费了精力。

> 建议大家项目初期尽可能的采用环境分离的方式进行构建项目！

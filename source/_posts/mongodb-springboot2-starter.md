---
id: mongodb-springboot2-starter
title: SpringBoot2.x使用MongoDB存储数据
article_type: 原创
article_author: 于起宇
enable_comment: true
news: true
tags: [SpringBoot,MongoDB]
categories: [MongoDB]
date: 2019-09-29 17:43:16
keywords: SpringCloud,SpringBoot,恒宇少年,微服务,mongodb
description: 'SpringBoot2.x使用MongoDB存储数据'
---
`MongoDB`在企业级项目中一般用于存储文档信息、图片资源等，`MongoDB`的内容完全是以 `JSON`字符串的形式进行存储的，所以我们在获取数据时通过简单的 `反序列化`就可以完成与项目内的实体类转换，不过这个过程是自动的，不需要我们手动进行反序列化处理。
<!--more-->

# 本章目标
完成简单的`SpringBoot`与`MongoDB`的自动化整合，让我们像是使用`spring-data-jpa`的形式来完成`MongoDB`的数据操作。

# 准备MongDB
我们使用`MongoDB`官方提供的安装方式进行安装，下面是对应系统的官方安装文档：
1. [Linux下安装MongoDB](https://docs.mongodb.com/manual/administration/install-on-linux/)
2. [Windows下安装MongoDB](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/)
3. [OSX下安装MongoDB](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-os-x/)
### 创建用户
我们需要创建一个用户，用于本章的使用，如果你是`OSX`系统，只需要打开终端输入`mongo`命令就可以进入`MongoDB`的管理界面。
```
1. 创建数据库
使用 use test; 命令可以创建一个名为`test`的数据库
2. 创建数据库所有者角色的用户
db.createUser(
   {
     user: "test",
     pwd: "123456",
     roles: [ { role: "dbOwner", db: "test" } ]
   }
);
```
用户创建完成后就可以进行本章的编码了，环境有了之后我们接下来需要进行环境的连接进行操作数据。
***
# 构建项目
我们使用`IDEA`创建一个新的`SpringBoot`项目，在`pom.xml`配置文件内添加我们本章所需要的依赖，如下所示：
```xml
<dependencies>
    <!--mongodb依赖-->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-mongodb</artifactId>
    </dependency>
    <!--lombok依赖-->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>
    <!--fastjson依赖-->
    <dependency>
        <groupId>com.alibaba</groupId>
        <artifactId>fastjson</artifactId>
        <version>1.2.44</version>
    </dependency>
    <!--测试依赖-->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```
根据`mongodb`的依赖我们可以看到`Spring`家族式的设计，把所有操作数据的依赖都进行归类到`spring-boot-starter-data-xxx`下，我们比较常用到的如：`spring-boot-starter-data-jpa`、`spring-boot-starter-data-redis`等。
***
### MongoRepository
`spring-boot-starter-data-mongodb`确实采用了跟`spring-boot-starter-data-jpa`同样的方式来完成接口代理类的生成，并且提供了一些常用的单个对象操作的公共方法，`MongoRepository`接口作用与`JPARepository`一致，继承了该接口的`业务数据接口`就可以提供一个被`Spring IOC`托管的代理实现类，这样我们在注入`业务数据接口`时就会完成代理实现类的注入。
废话不多说了，下面我们直接来创建一个名为`CustomerRepository`的数据接口，该接口继承`MongoRepository<T,PK>`，如下所示：
```java
/**
 * 客户数据接口
 * 继承自MongoRepository接口
 *
 * @author：于起宇 <br/>
 * ===============================
 * Created with IDEA.
 * Date：2018/3/28
 * Time：下午7:41
 * 简书：http://www.jianshu.com/u/092df3f77bca
 * ================================
 */
public interface CustomerRepository extends MongoRepository<Customer, String> {
}
```
`MongoRepository <T,PK>`同样也是采用了两个泛型参数，
`T`：实体类类型。
`PK`：`T`实体类内的主键类型，如：String。
***
#### 自定义实体类

我们在`CustomerRepository `接口内使用了`Customer`实体类作为泛型参数，下面我们简单创建`Customer`实体类，内容如下所示：
```java
@Data
public class Customer implements Serializable {
    /**
     * 客户编号
     */
    @Id
    public String id;
    /**
     * 客户名称
     */
    public String firstName;
    /**
     * 客户姓氏
     */
    public String lastName;

    public Customer(String firstName, String lastName) {
        this.firstName = firstName;
        this.lastName = lastName;
    }
}
```
同样我们需要通过`@Id`注解进行设置主键，不过这个主键的值是`MongoDB`自动生成的，生成的主键值是具有唯一性的。
***
### 添加配置
代码已经准备好了，我们只需要添加`MongoDB`的一些配置信息就大功告成了，下面我们需要在`application.yml`配置文件内添加如下配置：
```yaml
spring:
  application:
    name: spring-boot-mongodb
  data:
    mongodb:
      uri: mongodb://localhost/test
      username: test
      password: 123456
```
在上面配置的`uri`内的`test`即为数据库的名称，`username`配置我们自定义的用户名称，`password`配置为自定义用户设置的密码。

上面我们的代码已经全部编写完成，接下来我们需要进行测试，来查看我们的`CustomerRepository`是否已经生效.
***
# 测试
我们使用`CommandLineRunner`接口进行简单的项目运行后就执行`Customer`文档内的数据操作，修改`Chapter51Application`入口类，添加`CommandLineRunner`接口的实现，如下所示：
```java
/**
 * 程序入口类
 * @author yuqiyu
 */
@SpringBootApplication
public class Chapter51Application implements CommandLineRunner {
    /**
     * logger instance
     */
    static Logger logger = LoggerFactory.getLogger(Chapter51Application.class);
    /**
     * 客户数据接口注入
     */
    @Autowired
    private CustomerRepository repository;

    public static void main(String[] args) {
        SpringApplication.run(Chapter51Application.class, args);
        logger.info("【【【【【SpringBoot整合Mongodb启动完成.】】】】】");
    }

    @Override
    public void run(String... args) {
        // 删除全部
        repository.deleteAll();
        // 添加一条数据
        repository.save(new Customer("于", "起宇"));
        // 查询全部
        logger.info(JSON.toJSONString(repository.findAll()));
    }
}
```
在`run`方法内
1. 删除了`Customer`文档内的全部内容
2. 执行了保存数据的操作
3. 查询出本次保存的数据内容

下面我们来运行下程序查看控制台的效果，如下所示：
```
[{"firstName":"于","id":"5ad4be1cab73ac0bdc23bd9a","lastName":"起宇"}]
【【【【【SpringBoot整合Mongodb启动完成.】】】】】
```
已经可以正常的输出了`MongoDB`我们添加到文档内的数据，在上面说到了`id`这个字段的特殊性，这是个分布式唯一性的字段值，是一个短板的`md5`格式的字符串。
***
### 修改默认扫描路径
如果你不打算使用`SpringBoot`默认的扫描路径（`SpringBoot`默认扫描`XxxApplication`类的同级以及所有子级的`package`）可以通过`@EnableMongoRepositories`注解配置`basePackages`属性完成自定义的`MongoDB`的`MongoRepository`实现类的扫描，如下所示：
```java
@SpringBootApplication
@EnableMongoRepositories(basePackages = "com.hengyu.chapter51")
public class Chapter51Application implements CommandLineRunner { }
```
***
# 总结
本章简单的讲解了`SpringBoot`集成`MongoDB`，它与`JPA`有着同样的数据操作方式，数据接口通过继承`MongoRepository`就可以让我们可以使用与`JPA`相同的方法进行操作`MongoDB`文档内的数据，从而减少了学习的成本。
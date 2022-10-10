---
id: rabbitmq-direct-exchange
title: 消息队列RabbitMQ的Direct类型消息消费
article_type: 原创
article_author: 于起宇
enable_comment: true
news: true
tags: [消息队列,RabbitMQ]
categories: [消息队列]
date: 2019-09-29 16:01:01
keywords: rabbitmq,springboot,消息队列
description: '消息队列RabbitMQ的Direct类型消息消费'
---
消息队列目前流行的有KafKa、RabbitMQ、ActiveMQ等，它们的诞生无非不是为了解决消息的分布式消费，完成项目、服务之间的解耦动作。消息队列提供者与消费者之间完全采用异步通信方式，极力的提高了系统的响应能力，从而提高系统的网络请求吞吐量。
每一种的消息队列都有它在设计上的独一无二的优势，在实际的项目技术选型时根据项目的需求来确定。
<!--more-->
# 本章目标
基于``SpringBoot``项目整合``RabbitMQ``消息队列，完成``DirectExchange（路由键）``分布式消息消费。

# Exchange
在``RabbitMQ``中有三种常用的转发方式，分别是：

``DirectExchange``：路由键方式转发消息。
``FanoutExchange``：广播方式转发消息。
``TopicExchange``：主题匹配方式转发消息。

我们本章先来讲解``DirectExchange``路由键方式，根据设置的路由键的值进行完全匹配时转发，下面我们来看一张图，形象的介绍了转发消息匹配流程，如下图所示：
![DirectExchange](/images/post/rabbitmq-direct-exchange-1.png)

我们可以看到上图，当消息被提供者发送到``RabbitMQ``后，会根据配置队列的交换以及绑定实例进行转发消息，上图只会将消息转发路由键为``KEY``的队列消费者对应的实现方法逻辑中，从而完成消息的消费过程。

## 安装RabbitMQ
因为``RabbitMQ``是跨平台的分布式消息队列服务，可以部署在任意的操作系统上，下面我们分别介绍在不同的系统下该怎么去安装``RabbitMQ``服务。

我们本章采用的环境版本如下：

* RabbitMQ Server 3.6.14
* Erlang/OTP_X64 20.1

### Windows下安装
我们先去``RabbitMQ``官方网站下载最新版的安装包，下载地址：``https://www.rabbitmq.com/download.html``，可以根据不同的操作系统选择下载。
我们在安装``RabbitMQ``服务端时需要``Erlang``环境的支持，所以我们需要先安装``Erlang``。
1. 我们通过``Erlang``官方网站``http://www.erlang.org/downloads``下载最新的安装包

2. 我们访问``RabiitmQ``官方下载地址``https://www.rabbitmq.com/download.html``下载最新安装包。

> 因为是国外的网站所以下载比较慢，大家下载时会浪费时间，我已经将安装包分享到了百度网盘，下载地址：[安装包下载地址](https://pan.baidu.com/s/1pLkNXWn)，密码：``pexf``

3. 运行安装``Erlang``

4. 运行安装``RabbitMQ``

5.检查服务是否安装完成，``RabbitMQ``安装完成后会以服务的形式创建，并且随着开机启动，如下所示：
![Rabbit服务](/images/post/rabbitmq-direct-exchange-2.png)

### Mac OS X 安装
在Mac OS X中我们使用``brew``工具可以很简单的安装``RabbitMQ``服务端，步骤如下：
1. ``brew``更新到最新版本，执行：``brew update``
2. 接下来我们安装``Erlang``，执行：``brew install erlang``
3. 最后安装``RabbitMQ``，执行：``brew install rabbitmq``

我们通过上面的步骤安装后，``RabbitMQ``会被自动安装到``/usr/local/Cellar/rabbitmq/``目录下，下面我们进入``cd sbin``目录执行：
```bash
sudo ./rabbitmq-server
```
可以直接启动``RabbitMQ``服务。

### Ubuntu 安装
在``Ubuntu``操作系统中，我们可以直接使用``APT``仓库进行安装，我使用的系统版本是``16.04``，系统版本并不影响安装。

1.  安装``Erlang``，执行命令：``sudo apt-get install erlang``
2. 下面我们需要将``RabbitMQ``的安装源配置信息写入到系统的``/etc/apt/sources.list.d``配置文件内，执行如下命令：
```
echo 'deb http://www.rabbitmq.com/debian/ testing main' | sudo tee /etc/apt/sources.list.d/rabbitmq.list
```
3. 下面我们更新``APT``本地仓库的安装包列表，执行命令：``sudo apt-get update``
4. 最后安装``RabbitMQ``服务，执行命令：``sudo apt-get install rabbitmq-server``

## 启用界面管理插件

``RabbitMQ``提供了界面管理的``web``插件，我们只需要启用指定的插件就可以了，下面我们来看看``Windows``操作系统下该怎么启动界面管理插件。
我们使用``CMD``进入``RabbitMQ``安装目录``C:\Program Files\RabbitMQ Server\rabbitmq_server-3.6.14``，然后我们进入``sbin``目录，可以看到目录内存在很多个``bat``脚本程序，我们找到``rabbitmq-plugins.bat``，这个脚本程序可以控制``RabbitMQ``插件启用禁用，我们执行如下脚本命令来启用界面管理插件：
```
rabbitmq-plugins.bat enable rabbitmq_management
```
命令行输出内容如下所示：
```
The following plugins have been enabled:
  amqp_client
  cowlib
  cowboy
  rabbitmq_web_dispatch
  rabbitmq_management_agent
  rabbitmq_management

Applying plugin configuration to rabbit@yuqiyu... started 6 plugins.
```
可以看到输出的内容``RabbitMQ``自动启动了6个插件，我们现在访问[http://127.0.0.1:15672](http://127.0.0.1:15672)地址可以直接打开``RabbitMQ``的界面管理平台，而默认的用户名/密码分别为：``guest/guest``，通过该用户可以直接登录管理平台。

### 禁用界面管理插件

我们同样可以禁用``RabbitMQ``指定插件，执行如下命令：
```
rabbitmq-plugins.bat disable rabbitmq_management
```
命令创建输出内容则是相关停止插件的日志，如下：
```
The following plugins have been disabled:
  amqp_client
  cowlib
  cowboy
  rabbitmq_web_dispatch
  rabbitmq_management_agent
  rabbitmq_management

Applying plugin configuration to rabbit@yuqiyu... stopped 6 plugins.
```
这样我们再访问[http://127.0.0.1:15672](http://127.0.0.1:15672)就会发现我们无法访问到界面。

# 构建项目

我们使用``idea``开发工具创建一个``SpringBoot``项目，添加依赖，pom.xml配置文件如下所示：
```xml
<dependencies>
  <!--rabbitmq依赖-->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-amqp</artifactId>
  </dependency>
  <!--web依赖-->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
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
    <version>1.2.40</version>
  </dependency>
  <!--测试依赖-->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
  </dependency>
</dependencies>
```
我们本章来模拟用户注册完成后，将注册用户的编号通过``Provider``模块发送到``RabbitMQ ``，然后``RabbitMQ ``根据配置的``DirectExchange``的路由键进行异步转发。

#### 初始化用户表
下面我们先来创建所需要的``用户基本信息表``，建表SQL如下所示：
```sql
CREATE TABLE `user_info` (
  `UI_ID` int(11) DEFAULT NULL COMMENT '用户编号',
  `UI_USER_NAME` varchar(20) DEFAULT NULL COMMENT '用户名称',
  `UI_NAME` varchar(20) DEFAULT NULL COMMENT '真实姓名',
  `UI_AGE` int(11) DEFAULT NULL COMMENT '用户年龄',
  `UI_BALANCE` decimal(10,0) DEFAULT NULL COMMENT '用户余额'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='用户基本信息表';
```
### 构建 rabbitmq-provider 项目
基于我们上述的项目创建一个``Maven``子模块，命名为：``rabbitmq-provider``，因为是直接创建的``Module``项目，``IDEA``并没有给我创建``SpringApplication``启用类。
##### 创建入口类
下面我们自行创建一个``Provider``项目启动入口程序，如下所示：
```java
/**
 * 消息队列消息提供者启动入口
 * ========================
 *
 * @author 恒宇少年
 * Created with IntelliJ IDEA.
 * Date：2017/11/26
 * Time：14:14
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
@SpringBootApplication
public class RabbitmqProviderApplication
{
    static Logger logger = LoggerFactory.getLogger(RabbitmqProviderApplication.class);

    /**
     * 消息队列提供者启动入口
     * @param args
     */
    public static void main(String[] args)
    {
        SpringApplication.run(RabbitmqProviderApplication.class,args);

        logger.info("【【【【【消息队列-消息提供者启动成功.】】】】】");
    }
}
```
##### application.properties配置文件
下面我们在``src/main/resource``目录下创建``application.properties``并将对应``RabbitMQ``以及``Druid``的配置加入，如下所示：
```properties
#用户名
spring.rabbitmq.username=guest
#密码
spring.rabbitmq.password=guest
#服务器ip
spring.rabbitmq.host=localhost
#虚拟空间地址
spring.rabbitmq.virtual-host=/
#端口号
spring.rabbitmq.port=5672
#配置发布消息确认回调
spring.rabbitmq.publisher-confirms=true

#数据源配置
spring.datasource.druid.driver-class-name=com.mysql.jdbc.Driver
spring.datasource.druid.url=jdbc:mysql://localhost:3306/test?useUnicode=true&characterEncoding=UTF-8&autoReconnect=true
spring.datasource.druid.username=root
spring.datasource.druid.password=123456
```
在``RabbitMQ``内有个``virtual-host``即虚拟主机的概念，一个``RabbitMQ``服务可以配置多个虚拟主机，每一个虚拟机主机之间是相互隔离，相互独立的，授权用户到指定的``virtual-host``就可以发送消息到指定队列。

##### 用户实体

本章数据库操作采用``spring-data-jpa``，相关文章请访问：[第十三章：SpringBoot实战SpringDataJPA](http://www.jianshu.com/p/9d5bf0e4943f)，我们基于``user_info``数据表对应创建实体，如下所示：
```java
@Data
@Table(name = "user_info")
@Entity
public class UserEntity
    implements Serializable
{
    /**
     * 用户编号
     */
    @Id
    @GeneratedValue
    @Column(name = "UI_ID")
    private Long id;
    /**
     * 用户名称
     */
    @Column(name = "UI_USER_NAME")
    private String userName;
    /**
     * 姓名
     */
    @Column(name = "UI_NAME")
    private String name;
    /**
     * 年龄
     */
    @Column(name = "UI_AGE")
    private int age;
    /**
     * 余额
     */
    @Column(name = "UI_BALANCE")
    private BigDecimal balance;
}
```
##### 用户数据接口
创建``UserRepository``用户数据操作接口，并继承``JpaRepository``获得``spring-data-jpa``相关的接口定义方法。如下所示：
```java
/**
 * 用户数据接口定义
 * ========================
 *
 * @author 恒宇少年
 * Created with IntelliJ IDEA.
 * Date：2017/11/26
 * Time：14:35
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
public interface UserRepository
    extends JpaRepository<UserEntity,Long>
{
}
```
##### 用户业务逻辑实现
本章只是简单完成了数据的添加，代码如下所示：
```java
/**
 * 用户业务逻辑实现类
 * ========================
 *
 * @author 恒宇少年
 * Created with IntelliJ IDEA.
 * Date：2017/11/26
 * Time：14:37
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
@Service
@Transactional(rollbackFor = Exception.class)
public class UserService
{
    @Autowired
    private UserRepository userRepository;
    /**
     * 消息队列业务逻辑实现
     */
    @Autowired
    private QueueMessageService queueMessageService;

    /**
     * 保存用户
     * 并写入消息队列
     * @param userEntity
     * @return
     */
    public Long save(UserEntity userEntity) throws Exception
    {
        /**
         * 保存用户
         */
        userRepository.save(userEntity);
        /**
         * 将消息写入消息队列
         */
        queueMessageService.send(userEntity.getId(), ExchangeEnum.USER_REGISTER, QueueEnum.USER_REGISTER);

        return userEntity.getId();
    }
```
在上面业务逻辑实现类内出现了一个名为``QueueMessageService``消息队列实现类，该类是我们定义的用于发送消息到消息队列的统一入口，在下面我们会详细讲解。

##### 用户控制器
创建一个名为``UserController``的控制器类，对应编写一个添加用户的请求方法，如下所示：
```java
/**
 * 用户控制器
 * ========================
 *
 * @author 恒宇少年
 * Created with IntelliJ IDEA.
 * Date：2017/11/26
 * Time：14:41
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
@RestController
@RequestMapping(value = "/user")
public class UserController
{
    /**
     * 用户业务逻辑
     */
    @Autowired
    private UserService userService;

    /**
     * 保存用户基本信息
     * @param userEntity
     * @return
     */
    @RequestMapping(value = "/save")
    public UserEntity save(UserEntity userEntity) throws Exception
    {
        userService.save(userEntity);
        return userEntity;
    }
}
```
到这我们添加用户的流程已经编写完成了，那么我们就来看下消息队列``QueueMessageService``接口的定义以及实现类的定义。

##### 消息队列方法定义接口
创建一个名为``QueueMessageService``的接口并且继承了``RabbitTemplate.ConfirmCallback``接口，而``RabbitTemplate.ConfirmCallback``接口是用来回调消息发送成功后的方法，当一个消息被成功写入到``RabbitMQ``服务端时，就会自动的回调``RabbitTemplate.ConfirmCallback``接口内的``confirm``方法完成通知，``QueueMessageService``接口如下所示：
```java
/**
 * 消息队列业务
 * ========================
 *
 * @author 恒宇少年
 * Created with IntelliJ IDEA.
 * Date：2017/11/26
 * Time：14:50
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
public interface QueueMessageService
    extends RabbitTemplate.ConfirmCallback
{
    /**
     * 发送消息到rabbitmq消息队列
     * @param message 消息内容
     * @param exchangeEnum 交换配置枚举
     * @param queueEnum 队列配置枚举
     * @throws Exception
     */
    public void send(Object message, ExchangeEnum exchangeEnum, QueueEnum queueEnum) throws Exception;
}
```
接下来我们需要实现该接口内的所有方法，并做出一些业务逻辑的处理。

##### 消息队列业务实现
创建名为``QueueMessageServiceSupport``实体类实现``QueueMessageService``接口，并实现接口内的所有方法，如下所示：
```java
/**
 * 消息队列业务逻辑实现
 * ========================
 *
 * @author 恒宇少年
 * Created with IntelliJ IDEA.
 * Date：2017/11/26
 * Time：14:52
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
@Component
public class QueueMessageServiceSupport
    implements QueueMessageService
{
    /**
     * 消息队列模板
     */
    @Autowired
    private RabbitTemplate rabbitTemplate;

    @Override
    public void send(Object message, ExchangeEnum exchangeEnum, QueueEnum queueEnum) throws Exception {
        //设置回调为当前类对象
        rabbitTemplate.setConfirmCallback(this);
        //构建回调id为uuid
        CorrelationData correlationId = new CorrelationData(UUID.randomUUID().toString());
        //发送消息到消息队列
        rabbitTemplate.convertAndSend(exchangeEnum.getValue(),queueEnum.getRoutingKey(),message,correlationId);
    }

    /**
     * 消息回调确认方法
     * @param correlationData 请求数据对象
     * @param ack 是否发送成功
     * @param cause
     */
    @Override
    public void confirm(CorrelationData correlationData, boolean ack, String cause) {
        System.out.println(" 回调id:" + correlationData.getId());
        if (ack) {
            System.out.println("消息发送成功");
        } else {
            System.out.println("消息发送失败:" + cause);
        }
    }
}
```
``convertAndSend``方法用于将``Object``类型的消息转换后发送到``RabbitMQ``服务端，发送是的消息类型要与消息消费者方法参数保持一致。

在``confirm``方法内，我们仅仅打印了消息发送时的``id``，根据``ack``参数输出消息发送状态。

> 在上面代码中我们注入了``RabbitTemplate``消息队列模板实例，而通过该实例我们可以将消息发送到``RabbitMQ``服务端。那么这个实例具体在什么地方定义的呢？我们带着这个疑问来创建下面的模块，我们需要将``RabbitMQ``相关的配置抽取出来作为一个单独的``Module``存在。

### 构建 rabbitmq-common 项目

该模块项目很简单，只是添加``RabbitMQ``相关的配置信息，由于``Module``是一个子模块所以继承了``parent``所有的依赖，当然我们用到的``RabbitMQ``相关依赖也不例外。

##### 配置rabbitmq
在创建配置类之前，我们先来定义两个枚举，分别存放了队列的交换信息、队列路由信息，
* ExchangeEnum (存放了队列交换配置信息)
```java
/**
 * rabbitmq交换配置枚举
 * ========================
 *
 * @author 恒宇少年
 * Created with IntelliJ IDEA.
 * Date：2017/11/26
 * Time：13:56
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
@Getter
public enum ExchangeEnum
{
    /**
     * 用户注册交换配置枚举
     */
    USER_REGISTER("user.register.topic.exchange")
    ;
    private String value;

    ExchangeEnum(String value) {
        this.value = value;
    }
}
```
* QueueEnum (存放了队列信息以及队列的路由配置信息)
```java
/**
 * 队列配置枚举
 * ========================
 *
 * @author 恒宇少年
 * Created with IntelliJ IDEA.
 * Date：2017/11/26
 * Time：14:05
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
@Getter
public enum QueueEnum
{
    /**
     * 用户注册枚举
     */
    USER_REGISTER("user.register.queue","user.register")
    ;
    /**
     * 队列名称
     */
    private String name;
    /**
     * 队列路由键
     */
    private String routingKey;

    QueueEnum(String name, String routingKey) {
        this.name = name;
        this.routingKey = routingKey;
    }
}
```
创建名为``UserRegisterQueueConfiguration``的实体类用于配置本章用到的用户注册队列信息，如果你得项目中使用多个队列，建议每一个业务逻辑创建一个配置类，分开维护，这样不容易出错。配置信息如下：
```java
/**
 * 用户注册消息队列配置
 * ========================
 * @author 恒宇少年
 * Created with IntelliJ IDEA.
 * Date：2017/11/26
 * Time：16:58
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
@Configuration
public class UserRegisterQueueConfiguration {
    /**
     * 配置路由交换对象实例
     * @return
     */
    @Bean
    public DirectExchange userRegisterDirectExchange()
    {
        return new DirectExchange(ExchangeEnum.USER_REGISTER.getValue());
    }

    /**
     * 配置用户注册队列对象实例
     * 并设置持久化队列
     * @return
     */
    @Bean
    public Queue userRegisterQueue()
    {
        return new Queue(QueueEnum.USER_REGISTER.getName(),true);
    }

    /**
     * 将用户注册队列绑定到路由交换配置上并设置指定路由键进行转发
     * @return
     */
    @Bean
    public Binding userRegisterBinding()
    {
        return BindingBuilder.bind(userRegisterQueue()).to(userRegisterDirectExchange()).with(QueueEnum.USER_REGISTER.getRoutingKey());
    }
}
```
该配置类大致分为如下三部分：
* 配置交换实例
配置``DirectExchange``实例对象，为交换设置一个名称，引用``ExchangeEnum``枚举配置的交换名称，消息提供者与消息消费者的交换名称必须一致才具备的第一步的通讯基础。

* 配置队列实例
配置``Queue``实例对象，为消息队列设置一个名称，引用``QueueEnum``枚举配置的队列名称，当然队列的名称同样也是提供者与消费者之间的通讯基础。

* 绑定队列实例到交换实例
配置``Binding``实例对象，消息绑定的目的就是将``Queue``实例绑定到``Exchange``上，并且通过设置的路由``Key``进行消息转发，配置了路由``Key``后，只有符合该路由配置的消息才会被转发到绑定交换上的消息队列。

我们的``rabbitmq-common``模块已经编写完成。

##### 添加 rabbitmq-provider 依赖 rabbitmq-common

下面我们回到``rabbitmq-provider``模块，修改pom.xml配置文件，如下所示：
```xml
<dependencies>
        <!--添加common模块依赖-->
        <dependency>
            <groupId>com.hengyu</groupId>
            <artifactId>rabbitmq-common</artifactId>
            <version>0.0.1-SNAPSHOT</version>
        </dependency>
        <!--mysql依赖-->
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
        </dependency>
        <!--druid数据源依赖-->
        <dependency>
            <groupId>com.alibaba</groupId>
            <artifactId>druid-spring-boot-starter</artifactId>
            <version>1.1.5</version>
        </dependency>
        <!--data jpa依赖-->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
    </dependencies>
```
可以看到我们将``rabbitmq-common``模块添加到了``rabbitmq-provider``模块的``pom``配置文件内，完成了模块之间的相互依赖，这样我们``rabbitmq-provider``就自动添加了对应的消息队列配置。

### 构建rabbitmq-consumer
我们再来创建一个``rabbitmq-consumer``队列消息消费者模块，用于接受消费用户注册消息。

##### 创建入口类

同样我们先来创建一个``SpringApplication``入口启动类，如下所示：
```java
/**
 * 消息队列消息消费者入口
 * ========================
 *
 * @author 恒宇少年
 * Created with IntelliJ IDEA.
 * Date：2017/11/26
 * Time：15:15
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
@SpringBootApplication
public class RabbitmqConsumerApplication
{
    static Logger logger = LoggerFactory.getLogger(RabbitmqConsumerApplication.class);

    /**
     * rabbitmq消费者启动入口
     * @param args
     */
    public static void main(String[] args)
    {
        SpringApplication.run(RabbitmqConsumerApplication.class,args);

        logger.info("【【【【【消息队列-消息消费者启动成功.】】】】】");
    }
}
```
##### application.properties配置文件
配置文件的消息队列配置信息要与``rabbitmq-provider``配置文件一致，如下所示：
```
spring.application.name=rabbitmq-consumer
#启动端口
server.port=1111
#用户名
spring.rabbitmq.username=guest
#密码
spring.rabbitmq.password=guest
#服务器ip
spring.rabbitmq.host=localhost
#虚拟空间地址
spring.rabbitmq.virtual-host=/
#端口号
spring.rabbitmq.port=5672
#配置发布消息确认回调
spring.rabbitmq.publisher-confirms=true
```
我们修改了程序启动的端口号，为了我们下面进行测试的时候不出现端口占用的情况。
> 如果``RabbitMQ``配置信息与``rabbitmq-provider``不一致，就不会收到消费消息。

##### 用户注册消息消费者
创建名为``UserConsumer``类，用于完成消息监听，并且实现消息消费，如下所示：
```java
/**
 * 用户注册消息消费者
 * ========================
 *
 * @author 恒宇少年
 * Created with IntelliJ IDEA.
 * Date：2017/11/26
 * Time：15:20
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
@Component
@RabbitListener(queues = "user.register.queue")
public class UserConsumer {

    @RabbitHandler
    public void execute(Long userId)
    {
        System.out.println("用户：" + userId+"，完成了注册");

        //...//自行业务逻辑处理
    }
}
```
在消息消费者类内，有两个陌生的注解：
* @RabbitListener
``RabbitMQ``队列消息监听注解，该注解配置监听``queues``内的队列名称列表，可以配置多个。队列名称对应本章``rabbitmq-common``模块内``QueueEnum``枚举``name``属性。
* @RabbitHandler
``RabbitMQ``消息处理方法，该方法的参数要与``rabbitmq-provider``发送消息时的类型保持一致，否则无法自动调用消费方法，也就无法完成消息的消费。

#运行测试
我们接下来在``rabbitmq-provider``模块``src/test/java``下创建一个测试用例，访问用户注册控制器请求路径，如下所示：
```java
@RunWith(SpringRunner.class)
@SpringBootTest(classes = RabbitmqProviderApplication.class)
public class UserTester
{
    /**
     * 模拟mvc测试对象
     */
    private MockMvc mockMvc;

    /**
     * web项目上下文
     */
    @Autowired
    private WebApplicationContext webApplicationContext;

    /**
     * 所有测试方法执行之前执行该方法
     */
    @Before
    public void before() {
        //获取mockmvc对象实例
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
    }

    /**
     * 测试添加用户
     * @throws Exception
     */
    @Test
    public void testUserAdd() throws Exception
    {
        mockMvc.perform(MockMvcRequestBuilders.post("/user/save")
                .param("userName","yuqiyu")
                .param("name","恒宇少年")
                .param("age","23")
        )
                .andDo(MockMvcResultHandlers.log())
                .andReturn();
    }
}
```
调用测试用例时会自动将参数保存到数据库，并且将用户编号发送到``RabbitMQ``服务端，而``RabbitMQ``根据交换配置以及队列配置转发消息到消费者实例。

##### 启动 rabbitmq-consumer
我们先来把``rabbitmq-consumer``项目启动，控制台输出启动日志如下所示：
```bash
.....
51.194  INFO 2340 --- [           main] o.s.j.e.a.AnnotationMBeanExporter        : Bean with name 'rabbitConnectionFactory' has been autodetected for JMX exposure
2017-12-03 16:58:51.196  INFO 2340 --- [           main] o.s.j.e.a.AnnotationMBeanExporter        : Located managed bean 'rabbitConnectionFactory': registering with JMX server as MBean [org.springframework.amqp.rabbit.connection:name=rabbitConnectionFactory,type=CachingConnectionFactory]
2017-12-03 16:58:51.216  INFO 2340 --- [           main] o.s.c.support.DefaultLifecycleProcessor  : Starting beans in phase 2147483647
2017-12-03 16:58:51.237  INFO 2340 --- [cTaskExecutor-1] o.s.a.r.c.CachingConnectionFactory       : Created new connection: rabbitConnectionFactory#443ff8ef:0/SimpleConnection@4369ac5c [delegate=amqp://guest@127.0.0.1:5672/, localPort= 62107]
2017-12-03 16:58:51.287  INFO 2340 --- [           main] s.b.c.e.t.TomcatEmbeddedServletContainer : Tomcat started on port(s): 1111 (http)
2017-12-03 16:58:51.290  INFO 2340 --- [           main] c.h.r.c.RabbitmqConsumerApplication      : Started RabbitmqConsumerApplication in 2.354 seconds (JVM running for 3.026)
2017-12-03 16:58:51.290  INFO 2340 --- [           main] c.h.r.c.RabbitmqConsumerApplication      : 【【【【【消息队列-消息消费者启动成功.】】】】】
```
该部分启动日志就是我们配置的``RabbitMQ``初始化信息，我们可以看到项目启动时会自动与配置的``RabbitMQ``进行关联：
```
[delegate=amqp://guest@127.0.0.1:5672/, localPort= 62107]
```
##### 运行测试用例
接下来我们执行``rabbitmq-provider``项目的测试用例，来查看控制台的输出内容如下所示：
```
......
 回调id:e08f6d82-57bc-4c3f-9899-31c4b990c5be
消息发送成功
......
```
已经可以正常的将消息发送到``RabbitMQ``服务端，并且接收到了回调通知，那么我们的``rabbitmq-consumer``项目是不是已经执行了消息的消费呢？我们打开``rabbitmq-consumer``控制台查看输出内容如下所示：
```
用户：2，完成了注册
```
看以看到已经可以成功的执行``UserConsumer``消息监听类内的监听方法逻辑，到这里消息队列路由一对一的方式已经讲解完了。


# 总结
本章主要讲解了``RabbitMQ``在不同操作系统下的安装方式，以及通过三个子模块形象的展示了消息的分布式处理，整体流程：rabbitmq-provider -> ``RabbitMQ``服务端 -> rabbitmq-consumer，消息的转发是非常快的，``RabbitMQ``在收到消息后就会检索当前服务端是否存在该消息的消费者，如果存在将会马上将消息转发。

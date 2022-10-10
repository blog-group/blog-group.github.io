---
id: rabbitmq-topic-exchange
title: 消息队列RabbitMQ的Topic类型消息消费
article_type: 原创
article_author: 于起宇
enable_comment: true
news: true
tags: [消息队列,RabbitMQ]
categories: [消息队列]
date: 2019-09-29 16:11:45
keywords: rabbitmq,springboot,消息队列
description: '消息队列RabbitMQ的Topic类型消息消费'
---
我们在之前的两个章节[第四十一章： 基于SpringBoot & RabbitMQ完成DirectExchange分布式消息消费](https://www.jianshu.com/p/6b62a0ed2491)、[第四十二章： 基于SpringBoot & RabbitMQ完成DirectExchange分布式消息多消费者消费](https://www.jianshu.com/p/4cccb48ccef7)提高了``RabbitMQ``消息队列的``DirectExchange``交换类型的消息消费，我们之前的章节提到了``RabbitMQ``比较常用的交换类型有三种，我们今天来看看``TopicExchange``主题交换类型。
<!--more-->
# 本章目标
基于``SpringBoot``平台完成``RabbitMQ``的``TopicExchange``消息类型交换。

# 解决问题
之前少年也遇到了一个问题，分类了多模块后消息队列无法自动创建，说来也好笑，之前没有时间去看这个问题，今天在编写本章文章时发现原因竟然是``SpringBoot``没有扫描到``common``模块内的配置类。让我一阵的头大~~~，我们在``XxxApplication``启动类上添加``@ComponentScan(value = "com.hengyu.rabbitmq")``就可以自动创建队列了！！！

# 构建项目
本章构建项目时同样采用多模块的方式进行设计，可以很好的看到消息处理的效果，因为是多模块项目，我们先来创建一个``SpringBoot``项目，``pom.xml``配置文件依赖配置如下所示：
```xml
<dependencies>
  <!--rabbbitMQ相关依赖-->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-amqp</artifactId>
  </dependency>
  <!--web相关依赖-->
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
  <!--spring boot tester-->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
  </dependency>
  <!--fast json依赖-->
  <dependency>
    <groupId>com.alibaba</groupId>
    <artifactId>fastjson</artifactId>
    <version>1.2.40</version>
  </dependency>
</dependencies>
```
下面我们先来构建公共``RabbitMQ``模块，因为我们的消费者以及生产者都是需要``RabbitMQ``相关的配置信息，这里我们可以提取出来，使用时进行模块之间的引用。
### rabbitmq-topic-common
创建子模块``rabbitmq-topic-common``，在``resources``下添加``application.yml``配置文件并配置``RabbitMQ``相关的依赖配置，如下所示：
```yaml
spring:
  #rabbitmq消息队列配置信息
  rabbitmq:
    host: 127.0.0.1
    port: 5672
    username: guest
    password: guest
    virtual-host: /
    publisher-confirms: true
```
##### 定义交换配置信息
我们跟之前的章节一张，独立编写一个枚举类型来配置消息队列的交换信息，如下所示：
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
    USER_REGISTER_TOPIC_EXCHANGE("register.topic.exchange")
    ;
    private String name;

    ExchangeEnum(String name) {
        this.name = name;
    }
}
```
##### 定义队列配置信息
同样消息队列的基本信息配置也同样采用枚举的形式配置，如下所示：
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
     * 用户注册
     * 创建账户消息队列
     */
    USER_REGISTER_CREATE_ACCOUNT("register.account","register.#"),
    /**
     * 用户注册
     * 发送注册成功邮件消息队列
     */
    USER_REGISTER_SEND_MAIL("register.mail","register.#")
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
消息队列枚举内添加了两个属性，分别对应了``队列名称``、``队列路由``，我们本章所讲解的``TopicExchange``类型消息队列可以根据路径信息配置多个消息消费者，而转发的匹配规则信息则是我们定义的队列的路由信息。
##### 定义发送消息路由信息
我们在发送消息到队列时，需要我们传递一个路由相关的配置信息，``RabbitMQ``会根据发送时的消息路由规则信息与定义消息队列时的路由信息进行匹配，如果可以匹配则调用该队列的消费者完成消息的消费，发送消息路由信息配置如下所示：
```java
/**
 * 消息队列topic交换路由key配置枚举
 * ========================
 *
 * @author 恒宇少年
 * Created with IntelliJ IDEA.
 * Date：2017/12/11
 * Time：21:58
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
@Getter
public enum TopicEnum {
    /**
     * 用户注册topic路由key配置
     */
    USER_REGISTER("register.user")
    ;

    private String topicRouteKey;

    TopicEnum(String topicRouteKey) {
        this.topicRouteKey = topicRouteKey;
    }
}
```
###### 路由特殊字符 ``#``
我们在``QueueEnum``内配置的``路由键``时有个特殊的符号：``#``，在``RabbitMQ``消息队列内路由配置``#``时表示可以匹配零个或多个字符，我们``TopicEnum ``枚举内定义的``register.user``，则是可以匹配``QueueEnum``枚举定义``register.#``队列的路由规则。
当然发送消息时如果路由传递：``register.user.account``也是可以同样匹配``register.#``的路由规则。

###### 路由特殊字符 ``*``
除此之外比较常用到的特殊字符还有一个``*``，在``RabbitMQ``消息队列内路由配置``*``时表示可以匹配一个字符，我们``QueueEnum``定义路由键如果修改成``register.*``时，发送消息时路由为``register.user``则是可以接受到消息的。但如果发送时的路由为``register.user.account``时，则是无法匹配该消息。

#### 消息队列配置
配置准备工作已经做好，接下来我们开始配置队列相关的内容，跟之前一样我们需要配置``Queue``、``Exchange``、``Binding``将消息队列与交换绑定。下面我们来看看配置跟之前的章节有什么差异的地方，代码如下所示：
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

    private Logger logger = LoggerFactory.getLogger(UserRegisterQueueConfiguration.class);
    /**
     * 配置用户注册主题交换
     * @return
     */
    @Bean
    public TopicExchange userTopicExchange()
    {
        TopicExchange topicExchange = new TopicExchange(ExchangeEnum.USER_REGISTER_TOPIC_EXCHANGE.getName());
        logger.info("用户注册交换实例化成功。");
        return topicExchange;
    }

    /**
     * 配置用户注册
     * 发送激活邮件消息队列
     * 并设置持久化队列
     * @return
     */
    @Bean
    public Queue sendRegisterMailQueue()
    {
        Queue queue = new Queue(QueueEnum.USER_REGISTER_SEND_MAIL.getName());
        logger.info("创建用户注册消息队列成功");
        return queue;
    }

    /**
     * 配置用户注册
     * 创建账户消息队列
     * 并设置持久化队列
     * @return
     */
    @Bean
    public Queue createAccountQueue()
    {
        Queue queue = new Queue(QueueEnum.USER_REGISTER_CREATE_ACCOUNT.getName());
        logger.info("创建用户注册账号队列成功.");
        return queue;
    }

    /**
     * 绑定用户发送注册激活邮件队列到用户注册主题交换配置
     * @return
     */
    @Bean
    public Binding sendMailBinding(TopicExchange userTopicExchange,Queue sendRegisterMailQueue)
    {
        Binding binding = BindingBuilder.bind(sendRegisterMailQueue).to(userTopicExchange).with(QueueEnum.USER_REGISTER_SEND_MAIL.getRoutingKey());
        logger.info("绑定发送邮件到注册交换成功");
        return binding;
    }

    /**
     * 绑定用户创建账户到用户注册主题交换配置
     * @return
     */
    @Bean
    public Binding createAccountBinding(TopicExchange userTopicExchange,Queue createAccountQueue)
    {
        Binding binding = BindingBuilder.bind(createAccountQueue).to(userTopicExchange).with(QueueEnum.USER_REGISTER_CREATE_ACCOUNT.getRoutingKey());
        logger.info("绑定创建账号到注册交换成功。");
        return binding;
    }
}
```
我们从上面开始分析。
第一步： 首先我们创建了``TopicExchange``消息队列对象，使用``ExchangeEnum``枚举内的``USER_REGISTER_TOPIC_EXCHANGE``类型作为交换名称。

第二步：我们创建了发送注册邮件的队列``sendRegisterMailQueue``，使用``QueueEnum``枚举内的类型``USER_REGISTER_SEND_MAIL``作为队列名称。

第三步：与发送邮件队列一致，用户创建完成后需要初始化账户信息，而``createAccountQueue ``消息队列后续逻辑就是来完成该工作，使用``QueueEnum``枚举内的``USER_REGISTER_CREATE_ACCOUNT``枚举作为创建账户队列名称。

第四步：在上面步骤中已经将交换、队列创建完成，下面就开始将队列绑定到用户注册交换，从而实现注册用户消息队列消息消费，``sendMailBinding``绑定了``QueueEnum.USER_REGISTER_SEND_MAIL``的``RoutingKey``配置信息。

``createAccountBinding ``绑定了``QueueEnum.USER_REGISTER_CREATE_ACCOUNT``的``RoutingKey ``配置信息。

到目前为止我们完成了``rabbitmq-topic-common``模块的所有配置信息，下面我们开始编写用户注册消息消费者模块。

### rabbitmq-topic-consumer
我们首先来创建一个子模块命名为``rabbitmq-topic-consumer``，在``pom.xml``配置文件内添加``rabbitmq-topic-common``模块的引用，如下所示：
```xml
....//
<dependencies>
        <!--公共模块依赖-->
        <dependency>
            <groupId>com.hengyu</groupId>
            <artifactId>rabbitmq-topic-common</artifactId>
            <version>${parent.version}</version>
        </dependency>
    </dependencies>
....//
```
##### 消费者程序入口
下面我们来创建程序启动类``RabbitMqTopicConsumerApplication``，在这里需要注意，手动配置下扫描路径``@ComponentScan``，启动类代码如下所示：
```java
/**
 * 消息消费者程序启动入口
 * ========================
 *
 * @author 恒宇少年
 * Created with IntelliJ IDEA.
 * Date：2017/12/11
 * Time：21:48
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
@SpringBootApplication
@ComponentScan(value = "com.hengyu.rabbitmq")
public class RabbitMqTopicConsumerApplication {

    /**
     * logback
     */
    private static Logger logger = LoggerFactory.getLogger(RabbitMqTopicConsumerApplication.class);

    /**
     * 程序入口
     * @param args
     */
    public static void main(String[] args)
    {
        SpringApplication.run(RabbitMqTopicConsumerApplication.class,args);

        logger.info("【【【【【Topic队列消息Consumer启动成功】】】】】");
    }
}
```
手动配置扫描路径在文章的开始解释过了，主要目的是为了扫描到``RabbitMQConfiguration``配置类内的信息，让``RabbitAdmin``自动创建配置信息到``server``端。

##### 发送邮件消费者
发送邮件消息费监听``register.mail``消息队列信息，如下所示：
```java
/**
 * 发送用户注册成功邮件消费者
 * ========================
 *
 * @author 恒宇少年
 * Created with IntelliJ IDEA.
 * Date：2017/12/11
 * Time：22:07
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
@Component
@RabbitListener(queues = "register.mail")
public class SendMailConsumer
{

    /**
     * logback
     */
    Logger logger = LoggerFactory.getLogger(SendMailConsumer.class);

    /**
     * 处理消息
     * 发送用户注册成功邮件
     * @param userId 用户编号
     */
    @RabbitHandler
    public void handler(String userId)
    {

        logger.info("用户：{}，注册成功，自动发送注册成功邮件.",userId);

        //... 发送注册成功邮件逻辑
    }
}
```
在这里我只是完成了消息的监听，具体的业务逻辑可以根据需求进行处理。
##### 创建账户消费者
创建用户账户信息消费者监听队列``register.account``，代码如下所示：
```java
/**
 * ========================
 *
 * @author 恒宇少年
 * Created with IntelliJ IDEA.
 * Date：2017/12/11
 * Time：22:04
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
@Component
@RabbitListener(queues = "register.account")
public class CreateAccountConsumer {

    /**
     * logback
     */
    Logger logger = LoggerFactory.getLogger(CreateAccountConsumer.class);

    /**
     * 处理消息
     * 创建用户账户
     * @param userId 用户编号
     */
    @RabbitHandler
    public void handler(String userId)
    {
        logger.info("用户：{}，注册成功，自动创建账户信息.",userId);

        //... 创建账户逻辑
    }
}
```
创建账户，账户初始化逻辑都可以在``handler``方法进行处理，本章没有做数据库复杂的处理，所以没有过多的逻辑处理在消费者业务内。
### rabbitmq-topic-provider
接下来是我们的消息提供者的模块编写，我们依然先来创建程序入口类，并添加扫描配置``@ComponentScan``路径，代码如下所示：
```java
/**
 * 消息生产者程序启动入口
 * ========================
 *
 * @author 恒宇少年
 * Created with IntelliJ IDEA.
 * Date：2017/12/11
 * Time：21:48
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
@SpringBootApplication
@ComponentScan(value = "com.hengyu.rabbitmq")
public class RabbitMqTopicProviderApplication {

    /**
     * logback
     */
    private static Logger logger = LoggerFactory.getLogger(RabbitMqTopicProviderApplication.class);

    /**
     * 程序入口
     * @param args
     */
    public static void main(String[] args)
    {
        SpringApplication.run(RabbitMqTopicProviderApplication.class,args);

        logger.info("【【【【【Topic队列消息Provider启动成功】】】】】");
    }
}
```

##### 定义消息发送接口
创建``QueueMessageService``队列消息发送接口并添加``send``方法，如下所示：
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
{
    /**
     * 发送消息到rabbitmq消息队列
     * @param message 消息内容
     * @param exchangeEnum 交换配置枚举
     * @param routingKey 路由key
     * @throws Exception
     */
    public void send(Object message, ExchangeEnum exchangeEnum, String routingKey) throws Exception;
}
```
``send``方法内有三个参数，解析如下：
- message：发送消息内容，可以为任意类型，当然本章内仅仅是java.lang.String。
- exchangeEnum：我们自定义的交换枚举类型，方便发送消息到指定交换。
- routingKey：发送消息时的路由键内容，该值采用``TopicEnum``枚举内的``topicRouteKey``作为参数值。

下面我们来看看该接口的实现类``QueueMessageServiceSupport``内``send``方法实现，如下所示：
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
    public void send(Object message, ExchangeEnum exchangeEnum, String routingKey) throws Exception {
        //发送消息到消息队列
        rabbitTemplate.convertAndSend(exchangeEnum.getName(),routingKey,message);
    }
}
```
我们通过``RabbitTemplate``实例的``convertAndSend``方法将对象类型转换成``JSON``字符串后发送到消息队列服务端，``RabbitMQ``接受到消息后根据注册的消费者并且路由规则筛选后进行消息转发，并实现消息的消费。

# 运行测试
为了方便测试我们创建一个名为``UserService``的实现类，如下所示：
```java
/**
 * 用户业务逻辑
 * ========================
 *
 * @author 恒宇少年
 * Created with IntelliJ IDEA.
 * Date：2017/12/11
 * Time：22:10
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
@Service
public class UserService
{
    /**
     * 消息队列发送业务逻辑
     */
    @Autowired
    private QueueMessageService queueMessageService;

    /**
     * 随机创建用户
     * 随机生成用户uuid编号，发送到消息队列服务端
     * @return
     * @throws Exception
     */
    public String randomCreateUser() throws Exception
    {
        //用户编号
        String userId = UUID.randomUUID().toString();
        //发送消息到rabbitmq服务端
        queueMessageService.send(userId, ExchangeEnum.USER_REGISTER_TOPIC_EXCHANGE, TopicEnum.USER_REGISTER.getTopicRouteKey());
        return userId;
    }
}
```
该类内添加了一个名为``randomCreateUser``随机创建用户的方法，通过``UUID``随机生成字符串作为用户的编号进行传递给用户注册消息队列，完成用户的模拟创建。
##### 编写测试用例
接下来我们创建``RabbitMqTester``测试类来完成随机用户创建消息发送，测试用例完成简单的``UserService``注入，并调用``randomCreateUser ``方法，如下所示：
```java
/**
 * ========================
 *
 * @author 恒宇少年
 * Created with IntelliJ IDEA.
 * Date：2017/12/11
 * Time：22:10
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
@RunWith(SpringRunner.class)
@SpringBootTest(classes = RabbitMqTopicProviderApplication.class)
public class RabbitMqTester
{
    /**
     * 用户业务逻辑
     */
    @Autowired
   private UserService userService;

    /**
     * 模拟随机创建用户 & 发送消息到注册用户消息队列
     * @throws Exception
     */
    @Test
    public void testTopicMessage() throws Exception
    {
        userService.randomCreateUser();
    }
}
```
到目前为止，我们的编码已经完成，下面我们按照下面的步骤启动测试：
> 1. 启动``rabbitmq-topic-consumer``消息消费者模块，并查看控制台输出内容是否正常
> 2. 运行``rabbitmq-topic-provider``模块测试用例方法``testTopicMessage ``
> 3. 查看``rabbitmq-topic-consumer``控制台输出内容

最终效果：
```

2017-12-30 18:39:16.819  INFO 2781 --- [           main] c.h.r.c.RabbitMqTopicConsumerApplication : 【【【【【Topic队列消息Consumer启动成功】】】】】
2017-12-30 18:39:29.376  INFO 2781 --- [cTaskExecutor-1] c.h.r.consumer.CreateAccountConsumer     : 用户：c6ef682d-da2e-4cac-a004-c244ff4c4503，注册成功，自动创建账户信息.
2017-12-30 18:39:29.376  INFO 2781 --- [cTaskExecutor-1] c.h.rabbitmq.consumer.SendMailConsumer   : 用户：c6ef682d-da2e-4cac-a004-c244ff4c4503，注册成功，自动发送注册成功邮件.
```
# 总结
本章主要讲解了``TopicExchange``交换类型如何消费队列消息，讲解了常用到了的特殊字符``#``、``*``如何匹配，解决了多模块下的队列配置信息无法自动创建问题。还有一点需要注意``TopicExchange``交换类型在消息消费时不存在固定的先后顺序！！！

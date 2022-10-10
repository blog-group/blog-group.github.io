---
id: rabbitmq-delay-consumer
title: 消息队列RabbitMQ消息延时消费
article_type: 原创
article_author: 于起宇
enable_comment: true
news: true
tags: [消息队列,RabbitMQ]
categories: [消息队列]
date: 2019-09-29 17:20:53
keywords: rabbitmq,springboot,消息队列
description: '消息队列RabbitMQ消息延时消费'
---
在`2018-3-1`日`SpringBoot`官方发版了`2.0.0.RELEASE`最新版本，新版本完全基于`Spring5.0`来构建，`JDK`最低支持也从原来的`1.6`也改成了`1.8`，不再兼容`1.8`以下的版本，更多新特性请查看[官方文档](https://docs.spring.io/spring-boot/docs/2.0.0.RELEASE/reference/htmlsingle/)。
<!--more-->
# 本章目标
基于`SpringBoot`整合`RabbitMQ`完成消息延迟消费。

# 构建项目

#### 注意前言
> 由于`SpringBoot`的内置扫描机制，我们如果不自动配置扫描路径，请保持下面`rabbitmq-common`模块内的配置可以被`SpringBoot`扫描到，否则不会自动创建队列，控制台会输出404的错误信息。

我们本章采用`2.0.0.RELEASE`版本的`SpringBoot`，添加相关的依赖如下所示：
```xml
<parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.0.0.RELEASE</version>
        <relativePath/> <!-- lookup parent from repository -->
</parent>
......
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
......
```
我们仍然采用多模块的方式来测试队列的`Provider`以及`Consumer`。
### 队列公共模块
我们先来创建一个名为`rabbitmq-common`公共依赖模块（Create New Maven Module）
在公共模块内添加一个`QueueEnum`队列枚举配置，该枚举内配置队列的`Exchange`、`QueueName`、`RouteKey`等相关内容，如下所示：
```java
package com.hengyu.rabbitmq.lazy.enums;

import lombok.Getter;

/**
 * 消息队列枚举配置
 *
 * @author：于起宇 <br/>
 * ===============================
 * Created with IDEA.
 * Date：2018/3/3
 * Time：下午4:33
 * 简书：http://www.jianshu.com/u/092df3f77bca
 * ================================
 */
@Getter
public enum QueueEnum {
    /**
     * 消息通知队列
     */
    MESSAGE_QUEUE("message.center.direct", "message.center.create", "message.center.create"),
    /**
     * 消息通知ttl队列
     */
    MESSAGE_TTL_QUEUE("message.center.topic.ttl", "message.center.create.ttl", "message.center.create.ttl");
    /**
     * 交换名称
     */
    private String exchange;
    /**
     * 队列名称
     */
    private String name;
    /**
     * 路由键
     */
    private String routeKey;

    QueueEnum(String exchange, String name, String routeKey) {
        this.exchange = exchange;
        this.name = name;
        this.routeKey = routeKey;
    }
}
```
可以看到`MESSAGE_QUEUE`队列配置跟我们之前章节的配置一样，而我们另外新创建了一个后缀为`ttl`的消息队列配置。我们采用的这种方式是`RabbitMQ`消息队列其中一种的延迟消费模块，通过配置队列消息过期后转发的形式。

> 这种模式比较简单，我们需要将消息先发送到`ttl`延迟队列内，当消息到达过期时间后会自动转发到`ttl`队列内配置的转发`Exchange`以及`RouteKey`绑定的队列内完成消息消费。

下面我们来模拟`消息通知`的延迟消费场景，先来创建一个名为`MessageRabbitMqConfiguration`的队列配置类，该配置类内添加`消息通知队列`配置以及`消息通过延迟队列`配置，如下所示：
```java
/**
 * 消息通知 - 消息队列配置信息
 *
 * @author：恒宇少年 <br/>
 * ===============================
 * Created with IDEA.
 * Date：2018/3/3
 * Time：下午4:32
 * 简书：http://www.jianshu.com/u/092df3f77bca
 * ================================
 */
@Configuration
public class MessageRabbitMqConfiguration {
    /**
     * 消息中心实际消费队列交换配置
     *
     * @return
     */
    @Bean
    DirectExchange messageDirect() {
        return (DirectExchange) ExchangeBuilder
                .directExchange(QueueEnum.MESSAGE_QUEUE.getExchange())
                .durable(true)
                .build();
    }

    /**
     * 消息中心延迟消费交换配置
     *
     * @return
     */
    @Bean
    DirectExchange messageTtlDirect() {
        return (DirectExchange) ExchangeBuilder
                .directExchange(QueueEnum.MESSAGE_TTL_QUEUE.getExchange())
                .durable(true)
                .build();
    }

    /**
     * 消息中心实际消费队列配置
     *
     * @return
     */
    @Bean
    public Queue messageQueue() {
        return new Queue(QueueEnum.MESSAGE_QUEUE.getName());
    }


    /**
     * 消息中心TTL队列
     *
     * @return
     */
    @Bean
    Queue messageTtlQueue() {
        return QueueBuilder
                .durable(QueueEnum.MESSAGE_TTL_QUEUE.getName())
                // 配置到期后转发的交换
                .withArgument("x-dead-letter-exchange", QueueEnum.MESSAGE_QUEUE.getExchange())
                // 配置到期后转发的路由键
                .withArgument("x-dead-letter-routing-key", QueueEnum.MESSAGE_QUEUE.getRouteKey())
                .build();
    }

    /**
     * 消息中心实际消息交换与队列绑定
     *
     * @param messageDirect 消息中心交换配置
     * @param messageQueue  消息中心队列
     * @return
     */
    @Bean
    Binding messageBinding(DirectExchange messageDirect, Queue messageQueue) {
        return BindingBuilder
                .bind(messageQueue)
                .to(messageDirect)
                .with(QueueEnum.MESSAGE_QUEUE.getRouteKey());
    }

    /**
     * 消息中心TTL绑定实际消息中心实际消费交换机
     *
     * @param messageTtlQueue
     * @param messageTtlDirect
     * @return
     */
    @Bean
    public Binding messageTtlBinding(Queue messageTtlQueue, DirectExchange messageTtlDirect) {
        return BindingBuilder
                .bind(messageTtlQueue)
                .to(messageTtlDirect)
                .with(QueueEnum.MESSAGE_TTL_QUEUE.getRouteKey());
    }
}
```
我们声明了`消息通知队列`的相关`Exchange`、`Queue`、`Binding`等配置，将`message.center.create`队列通过路由键`message.center.create`绑定到了`message.center.direct`交换上。

除此之外，我们还添加了`消息通知延迟队列`的`Exchange`、`Queue`、`Binding`等配置，将`message.center.create.ttl`队列通过`message.center.create.ttl`路由键绑定到了`message.center.topic.ttl`交换上。

我们仔细来看看`messageTtlQueue`延迟队列的配置，跟`messageQueue`队列配置不同的地方这里多出了`x-dead-letter-exchange`、`x-dead-letter-routing-key`两个参数，而这两个参数就是配置延迟队列过期后转发的`Exchange`、`RouteKey`，只要在创建队列时对应添加了这两个参数，在`RabbitMQ`管理平台看到的队列配置就不仅是单纯的`Direct`类型的队列类型，如下图所示：
![队列类型差异](http://upload-images.jianshu.io/upload_images/4461954-456e709d038bfd7a.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

在上图内我们可以看到`message.center.create.ttl`队列多出了`DLX`、`DLK`的配置，这就是`RabbitMQ`内`死信交换`的标志。
满足`死信交换`的条件，在官方文档中表示：

Messages from a queue can be 'dead-lettered'; that is, republished to another exchange when any of the following events occur:

The message is rejected (basic.reject or basic.nack) with requeue=false,
The TTL for the message expires; or
The queue length limit is exceeded.

- 该消息被拒绝（basic.reject或  basic.nack），requeue = false
- 消息的TTL过期
- 队列长度限制已超出
[官方文档地址](https://www.rabbitmq.com/dlx.html)

我们需要满足上面的其中一种方式就可以了，我们采用满足第二个条件，采用过期的方式。

### 队列消息提供者
我们再来创建一个名为`rabbitmq-lazy-provider`的模块(Create New Maven Module)，并且在`pom.xml`配置文件内添加`rabbitmq-common`模块的依赖，如下所示：
```xml
<!--添加公共模块依赖-->
<dependency>
      <groupId>com.hengyu</groupId>
      <artifactId>rabbitmq-common</artifactId>
      <version>0.0.1-SNAPSHOT</version>
</dependency>
```
#### 配置队列
在`resource`下创建一个名为`application.yml`的配置文件，在该配置文件内添加如下配置信息：
```yaml
spring:
  #rabbitmq消息队列配置信息
  rabbitmq:
    host: localhost
    port: 5672
    username: guest
    password: guest
    virtual-host: /hengboy
    publisher-confirms: true
```
#### 消息提供者类
接下来我们来创建名为`MessageProvider`消息提供者类，用来发送消息内容到消息通知延迟队列，代码如下所示：
```java
/**
 * 消息通知 - 提供者
 *
 * @author：于起宇 <br/>
 * ===============================
 * Created with IDEA.
 * Date：2018/3/3
 * Time：下午4:40
 * 简书：http://www.jianshu.com/u/092df3f77bca
 * ================================
 */
@Component
public class MessageProvider {
    /**
     * logger instance
     */
    static Logger logger = LoggerFactory.getLogger(MessageProvider.class);
    /**
     * RabbitMQ 模版消息实现类
     */
    @Autowired
    private AmqpTemplate rabbitMqTemplate;

    /**
     * 发送延迟消息
     *
     * @param messageContent 消息内容
     * @param exchange       队列交换
     * @param routerKey      队列交换绑定的路由键
     * @param delayTimes     延迟时长，单位：毫秒
     */
    public void sendMessage(Object messageContent, String exchange, String routerKey, final long delayTimes) {
        if (!StringUtils.isEmpty(exchange)) {
            logger.info("延迟：{}毫秒写入消息队列：{}，消息内容：{}", delayTimes, routerKey, JSON.toJSONString(messageContent));
            // 执行发送消息到指定队列
            rabbitMqTemplate.convertAndSend(exchange, routerKey, messageContent, message -> {
                // 设置延迟毫秒值
                message.getMessageProperties().setExpiration(String.valueOf(delayTimes));
                return message;
            });
        } else {
            logger.error("未找到队列消息：{}，所属的交换机", exchange);
        }
    }
}
```
由于我们在  `pom.xml`配置文件内添加了`RabbitMQ`相关的依赖并且在上面`application.yml`文件内添加了对应的配置，`SpringBoot`为我们自动实例化了`AmqpTemplate`，该实例可以发送任何类型的消息到指定队列。
我们采用`convertAndSend `方法，将消息内容发送到指定`Exchange`、`RouterKey`队列，并且通过`setExpiration`方法设置过期时间，单位：毫秒。

#### 编写发送测试
我们在`test`目录下创建一个测试类，如下所示：
```java
@RunWith(SpringRunner.class)
@SpringBootTest(classes = RabbitMqLazyProviderApplication.class)
public class RabbitMqLazyProviderApplicationTests {
    /**
     * 消息队列提供者
     */
    @Autowired
    private MessageProvider messageProvider;

    /**
     * 测试延迟消息消费
     */
    @Test
    public void testLazy() {
        // 测试延迟10秒
        messageProvider.sendMessage("测试延迟消费,写入时间：" + new Date(),
                QueueEnum.MESSAGE_TTL_QUEUE.getExchange(),
                QueueEnum.MESSAGE_TTL_QUEUE.getRouteKey(),
                10000);
    }
}
```
> 注意：`@SpringBootTest`注解内添加了`classes`入口类的配置，因为我们是模块创建的项目并不是默认创建的`SpringBoot`项目，这里需要配置入口程序类才可以运行测试。

在测试类我们注入了`MessageProvider `消息提供者，调用`sendMessage`方法发送消息到`消息通知延迟队列`，并且设置延迟的时间为`10秒`，这里衡量发送到指定队列的标准是要看`MessageRabbitMqConfiguration`配置类内的相关`Binding`配置，通过`Exchange`、`RouterKey`值进行发送到指定的队列。

到目前为止我们的`rabbitmq-lazy-provider`消息提供模块已经编写完成了，下面我们来看看消息消费者模块。

### 队列消息消费者

我们再来创建一个名为`rabbitmq-lazy-consumer`的模块(Create New Maven Module)，同样需要在`pom.xml`配置文件内添加`rabbitmq-common`模块的依赖，如下所示：
```xml
<!--添加公共模块依赖-->
<dependency>
      <groupId>com.hengyu</groupId>
      <artifactId>rabbitmq-common</artifactId>
      <version>0.0.1-SNAPSHOT</version>
</dependency>
```
当然同样需要在`resource`下创建`application.yml`并添加消息队列的相关配置，代码就不贴出来了，可以直接从`rabbitmq-lazy-provider`模块中复制`application.yml`文件到当前模块内。

#### 消息消费者类
接下来创建一个名为`MessageConsumer`的消费者类，该类需要监听`消息通知队列`，代码如下所示：
```java
/**
 * 消息通知 - 消费者
 *
 * @author：于起宇 <br/>
 * ===============================
 * Created with IDEA.
 * Date：2018/3/3
 * Time：下午5:00
 * 简书：http://www.jianshu.com/u/092df3f77bca
 * ================================
 */
@Component
@RabbitListener(queues = "message.center.create")
public class MessageConsumer {
    /**
     * logger instance
     */
    static Logger logger = LoggerFactory.getLogger(MessageConsumer.class);

    @RabbitHandler
    public void handler(String content) {
        logger.info("消费内容：{}", content);
    }
}
```
在`@RabbitListener`注解内配置了监听的队列，这里配置内容是`QueueEnum`枚举内的`queueName`属性值，当然如果你采用常量的方式在注解属性上是直接可以使用的，枚举不支持这种配置，这里只能把`QueueName`字符串配置到`queues`属性上了。
由于我们在消息发送时采用字符串的形式发送消息内容，这里在`@RabbitHandler`处理方法的参数内要保持数据类型一致！

#### 消费者入口类
我们为消费者模块添加一个入口程序类，用于启动消费者，代码如下所示：
```java
/**
 * 【第四十六章：SpringBoot & RabbitMQ完成消息延迟消费】
 * 队列消费者模块 - 入口程序类
 *
 * @author：于起宇 <br/>
 * ===============================
 * Created with IDEA.
 * Date：2018/3/3
 * Time：下午4:55
 * 简书：http://www.jianshu.com/u/092df3f77bca
 * ================================
 */
@SpringBootApplication
public class RabbitMqLazyConsumerApplication {

    public static void main(String[] args) {
        SpringApplication.run(RabbitMqLazyConsumerApplication.class, args);
    }
}
```

# 测试
我们的代码已经编写完毕，下面来测试下是否完成了我们预想的效果，步骤如下所示：
```
1. 启动消费者模块
2. 执行RabbitMqLazyProviderApplicationTests.testLazy()方法进行发送消息到通知延迟队列
3. 查看消费者模块控制台输出内容
```
我们可以在消费者模块控制台看到输出内容：
```
2018-03-04 10:10:34.765  INFO 70486 --- [cTaskExecutor-1] c.h.r.lazy.consumer.MessageConsumer      : 消费内容：测试延迟消费,写入时间：Sun Mar 04 10:10:24 CST 2018
```
我们在提供者测试方法发送消息的时间为`10:10:24`，而真正消费的时间则为`10:10:34`，与我们预计的一样，消息延迟了`10秒`后去执行消费。

# 总结
终上所述我们完成了消息队列的`延迟消费`，采用`死信`方式，通过消息过期方式触发，在实际项目研发过程中，延迟消费还是很有必要的，可以省去一些定时任务的配置。

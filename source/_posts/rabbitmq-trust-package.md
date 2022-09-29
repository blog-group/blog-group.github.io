---
id: rabbitmq-trust-package
title: 消息队列RabbitMQ设置信任package
article_type: 原创
article_author: 于起宇
enable_comment: true
news: true
tags:
  - RabbitMQ
  - SpringBoot
categories:
  - SpringBoot
date: 2019-09-29 17:30:51
keywords: rabbitmq,springboot,消息队列
description: '消息队列RabbitMQ设置信任package'
---
在这次`SpringBoot`升级后，之前的系统内使用实体传输受到了限制，如果使用`SpringBoot`默认的序列化方式不会出现`信任package`的问题，之所以出现这个问题是因为项目使用`fastjson`方式进行类的`序列化`已经`反序列化`，在之前`SpringBoot 1.5.10`版本的时候 `RabbitMQ`依赖内的`DefaultClassMapper`类在构造函数内配置`*`，表示信任项目内的所有`package`，在`SpringBoot 2.0.0`版本时，`DefaultClassMapper`类源码构造函数进行了修改，不再信任全部`package`而是仅仅信任`java.util`、`java.lang`。
<!--more-->
# 本章目标
基于`SpringBoot2.0`使用`RabbitMQ`自定义`MessageConverter`配置信任指定`package`或者全部`package`。

# 构建项目
创建项目添加对应依赖，`pom.xml`配置文件如下所示：
```xml
<dependencies>
    <!--消息队列依赖-->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-amqp</artifactId>
    </dependency>
    <!--web相关依赖-->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <!--fastjson依赖-->
    <dependency>
        <groupId>com.alibaba</groupId>
        <artifactId>fastjson</artifactId>
        <version>1.2.44</version>
    </dependency>
    <!--lombok依赖-->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>
    <!--测试依赖-->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```
#### 消息队列配置文件
我们需要在`application.properties`配置文件内添加`RabbitMQ`相应的配置信息，如下所示：
```properties
spring.rabbitmq.host=localhost
spring.rabbitmq.username=admin
spring.rabbitmq.password=admin
spring.rabbitmq.virtual-host=/hengyu
```
> 具体消息队列的连接配置信息需要根据实际情况填写。

#### 队列常量配置
我们之前的文章都是采用的`Enum`方式来配置队列相关的`Exchange`、`Name`、 `RouteKey`等相关的信息，使用枚举有个弊端，无法在注解内作为属性的值使用，所以我们之前的`Consumer`类配置监听的队列时都是字符串的形式，这样后期修改时还要修改多个地方（当然队列信息很少变动），我们本章使用`Constants`常量的形式进行配置，如下所示：
```java
/**
 * 队列常量配置
 * @author：于起宇 <br/>
 * ===============================
 * Created with IDEA.
 * Date：2018/3/7
 * Time：下午10:10
 * 简书：http://www.jianshu.com/u/092df3f77bca
 * ================================
 */
public interface QueueConstants {
    /**
     * 消息交换
     */
    String MESSAGE_EXCHANGE = "message.direct.exchange";
    /**
     * 消息队列名称
     */
    String MESSAGE_QUEUE_NAME = "message.queue";
    /**
     * 消息路由键
     */
    String MESSAGE_ROUTE_KEY = "message.send";
}
```
#### 示例消息队列JavaConfig配置
本章是为了设置信任`package`，所以这里使用消息中心队列来模拟，配置代码如下所示：
```java
/**
 * 消息队列配置类
 *
 * @author：于起宇 <br/>
 * ===============================
 * Created with IDEA.
 * Date：2018/3/7
 * Time：下午10:07
 * 简书：http://www.jianshu.com/u/092df3f77bca
 * ================================
 */
@Configuration
public class MessageRabbitMqConfiguration {
    /**
     * 交换配置
     *
     * @return
     */
    @Bean
    public DirectExchange messageDirectExchange() {
        return (DirectExchange) ExchangeBuilder.directExchange(QueueConstants.MESSAGE_EXCHANGE)
                .durable(true)
                .build();
    }

    /**
     * 消息队列声明
     *
     * @return
     */
    @Bean
    public Queue messageQueue() {
        return QueueBuilder.durable(QueueConstants.MESSAGE_QUEUE_NAME)
                .build();
    }

    /**
     * 消息绑定
     *
     * @return
     */
    @Bean
    public Binding messageBinding() {
        return BindingBuilder.bind(messageQueue())
                .to(messageDirectExchange())
                .with(QueueConstants.MESSAGE_ROUTE_KEY);
    }
}
```
上面配置类内添加`Exchange`、`Queue`、`Binding`等配置，将`messageQueue`使用`message.send`路由键与`messageDirectExchange`交换配置进行绑定。

我们在之前说了只有传递实体类时才会出现信任`package`问题，下面我们需要创建一个简单的消息传输实体，如下所示：
```java
/**
 * 消息实体
 *
 * @author：于起宇 <br/>
 * ===============================
 * Created with IDEA.
 * Date：2018/3/11
 * Time：下午5:18
 * 简书：http://www.jianshu.com/u/092df3f77bca
 * ================================
 */
@Data
public class MessageEntity implements Serializable {
    /**
     * 消息内容
     */
    private String content;
}
```
该实体类仅添加了一个`content`字段，这样足够模拟我们的场景了，到这里我们的配置已经处理完，下面就是我们的队列的`Provider`以及`Consumer`的相关实体类编写。
#### 消息提供者
为队列`message.queue`添加`Provider`的代码实现，如下所示：
```java
/**
 * 消息队列 - 消息提供者
 * @author：于起宇 <br/>
 * ===============================
 * Created with IDEA.
 * Date：2018/3/11
 * Time：下午6:16
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
     * 消息队列模板
     */
    @Autowired
    private AmqpTemplate amqpTemplate;

    public void sendMessage(Object object) {
        logger.info("写入消息队列内容：{}", JSON.toJSONString(object));
        amqpTemplate.convertAndSend(QueueConstants.MESSAGE_EXCHANGE, QueueConstants.MESSAGE_ROUTE_KEY, object);
    }
}
```
#### 消息消费者
当然我们有了`Provider`必然要有对应的`Consumer`，消费者代码实现如下所示：
```java
/**
 * 消息队列 - 消息消费者
 * @author：于起宇 <br/>
 * ===============================
 * Created with IDEA.
 * Date：2018/3/11
 * Time：下午5:32
 * 简书：http://www.jianshu.com/u/092df3f77bca
 * ================================
 */
@Component
@RabbitListener(queues = QueueConstants.MESSAGE_QUEUE_NAME)
public class MessageConsumer {
    /**
     * logger instance
     */
    static Logger logger = LoggerFactory.getLogger(MessageConsumer.class);

    @RabbitHandler
    public void handler(@Payload MessageEntity messageEntity) {
        logger.info("消费内容：{}", JSON.toJSONString(messageEntity));
    }
}
```
#### 创建测试控制器
我们采用控制器发送`Get`请求的方式进行发送消息，创建名为`TestController`的控制器，并添加测试方法，如下代码所示：
```java
/**
 * 测试控制器
 * @author：于起宇 <br/>
 * ===============================
 * Created with IDEA.
 * Date：2018/3/11
 * Time：下午5:43
 * 简书：http://www.jianshu.com/u/092df3f77bca
 * ================================
 */
@RestController
public class TestController {
    /**
     * 消息队列 - 消息提供者 注入
     */
    @Autowired
    private MessageProvider messageProvider;

    /**
     * 测试发送消息队列方法
     *
     * @param messageEntity 发送消息实体内容
     * @return
     */
    @RequestMapping(value = "/index")
    public String index(MessageEntity messageEntity) {
        // 将实体实例写入消息队列
        messageProvider.sendMessage(messageEntity);
        return "Success";
    }
}
```

#### 测试RabbitMQ默认实体传输

> 下面我们启动项目，首先先来测试`RabbitMQ`默认的实体类方式，当然这种默认的方式不会产生信任`package`的情况。

我们为了证实这一点，来访问(http://localhost:8080/index?content=admin)[http://localhost:8080/index?content=admin]，我们传递`content`的值为`admin`，访问效果控制台输出内容如下：
```bash
2018-03-13 21:59:08.844  INFO 16047 --- [nio-8080-exec-1] c.h.chapter48.provider.MessageProvider   : 写入消息队列内容：{"content":"admin"}
2018-03-13 21:59:08.898  INFO 16047 --- [cTaskExecutor-1] c.h.chapter48.consumer.MessageConsumer   : 消费内容：{"content":"admin"}
```
可以看到控制台的输出内容，直接完成了消息的消费，是没有任何问题的，下面我们对`RabbitMQ`添加自定义`MessageConverter`的配置，使用`fastjson`替代默认转换方式。

#### MessageConverter
我们先来创建一个转换的实现类，只需要继承抽象类`AbstractMessageConverter`并实现内部的`createMessage`、`fromMessage`两个方法就可以完成实体类的`序列化`与`反序列化`的转换，代码如下所示：
```java
/**
 * 自定义消息转换器
 * 采用FastJson完成消息转换
 *
 * @author：于起宇 <br/>
 * ===============================
 * Created with Eclipse.
 * Date：2017/10/26
 * Time：19:28
 * 简书：http://www.jianshu.com/u/092df3f77bca
 * ================================
 */
public class RabbitMqFastJsonConverter
        extends AbstractMessageConverter {
    /**
     * 日志对象实例
     */
    private Logger logger = LoggerFactory.getLogger(RabbitMqFastJsonConverter.class);
    /**
     * 消息类型映射对象
     */
    private static ClassMapper classMapper = new DefaultClassMapper();
    /**
     * 默认字符集
     */
    private static String DEFAULT_CHART_SET = "UTF-8";

    /**
     * 创建消息
     *
     * @param o                 消息对象
     * @param messageProperties 消息属性
     * @return
     */
    @Override
    protected Message createMessage(Object o, MessageProperties messageProperties) {
        byte[] bytes = null;
        try {
            String jsonString = JSON.toJSONString(o);
            bytes = jsonString.getBytes(DEFAULT_CHART_SET);
        } catch (IOException e) {
            throw new MessageConversionException(
                    "Failed to convert Message content", e);
        }
        messageProperties.setContentType(MessageProperties.CONTENT_TYPE_JSON);
        messageProperties.setContentEncoding(DEFAULT_CHART_SET);
        if (bytes != null) {
            messageProperties.setContentLength(bytes.length);
        }
        classMapper.fromClass(o.getClass(), messageProperties);
        return new Message(bytes, messageProperties);
    }

    /**
     * 转换消息为对象
     *
     * @param message 消息对象
     * @return
     * @throws MessageConversionException
     */
    @Override
    public Object fromMessage(Message message) throws MessageConversionException {
        Object content = null;
        MessageProperties properties = message.getMessageProperties();
        if (properties != null) {
            String contentType = properties.getContentType();
            if (contentType != null && contentType.contains("json")) {
                String encoding = properties.getContentEncoding();
                if (encoding == null) {
                    encoding = DEFAULT_CHART_SET;
                }
                try {
                    Class<?> targetClass = classMapper.toClass(
                            message.getMessageProperties());

                    content = convertBytesToObject(message.getBody(),
                            encoding, targetClass);
                } catch (IOException e) {
                    throw new MessageConversionException(
                            "Failed to convert Message content", e);
                }
            } else {
                logger.warn("Could not convert incoming message with content-type ["
                        + contentType + "]");
            }
        }
        if (content == null) {
            content = message.getBody();
        }
        return content;
    }

    /**
     * 将字节数组转换成实例对象
     *
     * @param body     Message对象主体字节数组
     * @param encoding 字符集
     * @param clazz    类型
     * @return
     * @throws UnsupportedEncodingException
     */
    private Object convertBytesToObject(byte[] body, String encoding,
                                        Class<?> clazz) throws UnsupportedEncodingException {
        String contentAsString = new String(body, encoding);
        return JSON.parseObject(contentAsString, clazz);
    }
}
```
在该转换类内我们使用了`DefaultClassMapper`来作为类的映射，我们可以先来看下该类相关信任`package`的源码，如下所示：
```java
......
public class DefaultClassMapper implements ClassMapper, InitializingBean {
    public static final String DEFAULT_CLASSID_FIELD_NAME = "__TypeId__";
    private static final String DEFAULT_HASHTABLE_TYPE_ID = "Hashtable";
    // 默认信任的package列表
    private static final List<String> TRUSTED_PACKAGES = Arrays.asList("java.util", "java.lang");
    private final Set<String> trustedPackages;
    private volatile Map<String, Class<?>> idClassMapping;
    private volatile Map<Class<?>, String> classIdMapping;
    private volatile Class<?> defaultMapClass;
    private volatile Class<?> defaultType;

    public DefaultClassMapper() {
        // 构造函数初始化信任的package为默认的pakcage列表
        // 仅支持java.util、java.lang两个package
        this.trustedPackages = new LinkedHashSet(TRUSTED_PACKAGES);
        this.idClassMapping = new HashMap();
        this.classIdMapping = new HashMap();
        this.defaultMapClass = LinkedHashMap.class;
        this.defaultType = LinkedHashMap.class;
    }
......
```

#### RabbitMqConfiguration
下面我们需要将该转换设置到`RabbitTemplate`、`SimpleRabbitListenerContainerFactory`内，让`RabbitMQ`支持自定义的消息转换，如下所示：
```java
/**
 * rabbitmq 相关配置
 * @author：于起宇 <br/>
 * ===============================
 * Created with IDEA.
 * Date：2018/3/11
 * Time：下午5:42
 * 简书：http://www.jianshu.com/u/092df3f77bca
 * ================================
 */
@Configuration
public class RabbitMqConfiguration {


    /**
     * 配置消息队列模版
     * 并且设置MessageConverter为自定义FastJson转换器
     * @param connectionFactory
     * @return
     */
    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(new RabbitMqFastJsonConverter());
        return template;
    }

    /**
     * 自定义队列容器工厂
     * 并且设置MessageConverter为自定义FastJson转换器
     * @param connectionFactory
     * @return
     */
    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(ConnectionFactory connectionFactory) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(new RabbitMqFastJsonConverter());
        factory.setDefaultRequeueRejected(false);
        return factory;
    }

}
```
#### 重启测试
上面的代码配置我们已经把`MessageConverter`改成了`fastjson`，重启项目，再次访问[http://localhost:8080/index?content=admin](http://localhost:8080/index?content=admin)路径，看下控制台输出日志内容如下所示：
```bash
Caused by: java.lang.IllegalArgumentException: The class 'com.hengyu.chapter48.entity.MessageEntity' is not in the trusted packages: [java.util, java.lang]. If you believe this class is safe to deserialize, please provide its name. If the serialization is only done by a trusted source, you can also enable trust all (*).
	at org.springframework.amqp.support.converter.DefaultClassMapper.toClass(DefaultClassMapper.java:211) ~[spring-amqp-2.0.2.RELEASE.jar:2.0.2.RELEASE]
	at org.springframework.amqp.support.converter.DefaultClassMapper.toClass(DefaultClassMapper.java:199) ~[spring-amqp-2.0.2.RELEASE.jar:2.0.2.RELEASE]
	at com.hengyu.chapter48.RabbitMqFastJsonConverter.fromMessage(RabbitMqFastJsonConverter.java:88) ~[classes/:na]
	at org.springframework.amqp.rabbit.listener.adapter.AbstractAdaptableMessageListener.extractMessage(AbstractAdaptableMessageListener.java:246) ~[spring-rabbit-2.0.2.RELEASE.jar:2.0.2.RELEASE]
	at org.springframework.amqp.rabbit.listener.adapter.MessagingMessageListenerAdapter$MessagingMessageConverterAdapter.extractPayload(MessagingMessageListenerAdapter.java:266) ~[spring-rabbit-2.0.2.RELEASE.jar:2.0.2.RELEASE]
	at org.springframework.amqp.support.converter.MessagingMessageConverter.fromMessage(MessagingMessageConverter.java:118) ~[spring-amqp-2.0.2.RELEASE.jar:2.0.2.RELEASE]
	at org.springframework.amqp.rabbit.listener.adapter.MessagingMessageListenerAdapter.toMessagingMessage(MessagingMessageListenerAdapter.java:168) ~[spring-rabbit-2.0.2.RELEASE.jar:2.0.2.RELEASE]
	at org.springframework.amqp.rabbit.listener.adapter.MessagingMessageListenerAdapter.onMessage(MessagingMessageListenerAdapter.java:115) ~[spring-rabbit-2.0.2.RELEASE.jar:2.0.2.RELEASE]
	at org.springframework.amqp.rabbit.listener.AbstractMessageListenerContainer.doInvokeListener(AbstractMessageListenerContainer.java:1414) ~[spring-rabbit-2.0.2.RELEASE.jar:2.0.2.RELEASE]
	... 8 common frames omitted

```
可以看到控制台已经输出了不信任`com.hengyu.chapter48.entity.MessageEntity`实体的错误信息，也表明了仅信任`java.util`、`java.lang`两个`package`，下面我们就需要继承`DefaultClassMapper`来重写构造函数完成信任指定的`package`。

#### 重写DefaultClassMapper构造函数
创建一个名为`RabbitMqFastJsonClassMapper`的类并且继承`DefaultClassMapper`，如下所示：
```java
/**
 * fastjson 转换映射
 *
 * @author：于起宇 <br/>
 * ===============================
 * Created with IDEA.
 * Date：2018/3/13
 * Time：下午10:17
 * 简书：http://www.jianshu.com/u/092df3f77bca
 * ================================
 */
public class RabbitMqFastJsonClassMapper extends DefaultClassMapper {
    /**
     * 构造函数初始化信任所有pakcage
     */
    public RabbitMqFastJsonClassMapper() {
        super();
        setTrustedPackages("*");
    }
}
```
在上面构造函数内我们设置了信任全部的`package`，添加了`RabbitMqFastJsonClassMapper`类后，需要让`MessageConverter`使用该类作为映射，修改`RabbitMqFastJsonConverter`部分代码如下所示：
```java
/**
 * 消息类型映射对象
 */
private static ClassMapper classMapper = new DefaultClassMapper();
>>> 修改为 >>>
/**
* 消息类型映射对象
*/
private static ClassMapper classMapper = new RabbitMqFastJsonClassMapper();
```
#### 再次重启测试
我们再次重启项目后，仍然访问[http://localhost:8080/index?content=admin](http://localhost:8080/index?content=admin)路径，查看控制台日志如下所示：
```bash
2018-03-13 22:23:35.414  INFO 16121 --- [nio-8080-exec-1] c.h.chapter48.provider.MessageProvider   : 写入消息队列内容：{"content":"admin"}
2018-03-13 22:23:35.493  INFO 16121 --- [cTaskExecutor-1] c.h.chapter48.consumer.MessageConsumer   : 消费内容：{"content":"admin"}
```
根据日志输出已经证明可以正常的完成消息的消费。

# 总结
如果使用`RabbitMQ`默认的转换方式，并不会涉及到本章遇到的信任`package`问题，如果想自定义消息转换并且使用`DefaultClassMapper`作为映射，肯定会出现信任`package`的问题，所以如果需要自定义转换的小伙伴，记住要设置`trustedPackages`。

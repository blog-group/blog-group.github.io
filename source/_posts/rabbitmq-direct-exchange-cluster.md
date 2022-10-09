---
id: rabbitmq-direct-exchange-cluster
title: 消息队列RabbitMQ的Direct类型消息多节点集群消费
article_type: 原创
article_author: 于起宇
enable_comment: true
news: true
tags:
  - 消息队列
  - SpringBoot
categories:
  - SpringBoot
date: 2019-09-29 16:07:47
keywords: rabbitmq,springboot,消息队列
description: '消息队列RabbitMQ的Direct类型消息多节点集群消费'
---

在上一章{% post_path rabbitmq-direct-exchange 消息队列RabbitMQ的Direct类型消息消费 %}我们讲解到了``RabbitMQ``消息队列的``DirectExchange``路由键消息单个消费者消费，源码请访问[SpringBoot对应章节源码](https://gitee.com/hengboy/spring-boot-chapter)下载查看，消息队列目的是完成消息的分布式消费，那么我们是否可以为一个``Provider``创建并绑定多个``Consumer``呢？

<!--more-->

# 本章目标
基于``SpringBoot``平台整合``RabbitMQ``消息队列，完成一个``Provider``绑定多个``Consumer``进行消息消费。

# 构建项目
我们基于上一章的项目进行升级，我们先来将``Chapter41``项目``Copy``一份命名为``Chapter42``。

### 构建 rabbitmq-consumer-node2
基于我们复制的``Chapter42``项目，创建一个``Module``子项目命名为``rabbitmq-consumer-node2``，用于消费者的第二个节点，接下来我们为``rabbitmq-consumer-node2``项目创建一个入口启动类``RabbitmqConsumerNode2Application``，代码如下所示：
```java
/**
 * 消息队列消息消费者节点2入口
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
public class RabbitmqConsumerNode2Application
{
    static Logger logger = LoggerFactory.getLogger(RabbitmqConsumerNode2Application.class);

    /**
     * rabbitmq消费者启动入口
     * @param args
     */
    public static void main(String[] args)
    {
        SpringApplication.run(RabbitmqConsumerNode2Application.class,args);

        logger.info("【【【【【消息队列-消息消费者节点2启动成功.】】】】】");
    }
}
```
为了区分具体的消费者节点，我们在项目启动成功后打印了相关的日志信息，下面我们来编写``application.properties``配置文件信息，可以直接从``rabbitmq-consumer``子项目内复制内容，复制后需要修改``server.port``以及``spring.application.name``，如下所示：
```properties
#端口号
server.port=1112
#项目名称
spring.application.name=rabbitmq-consumer-node2


#rabbitmq相关配置
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
因为我们是本地测试项目，所以需要修改对应的端口号，防止端口被占用。
##### 创建用户注册消费者
复制``rabbitmq-consumer``子项目内的``UserConsumer``类到``rabbitmq-consumer-node2``子项目对应的``package``内，如下所示：
```java
/**
 * 用户注册消息消费者
 * 分布式节点2
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

    /**
     * logback
     */
    private Logger logger = LoggerFactory.getLogger(UserConsumer.class);

    @RabbitHandler
    public void execute(Long userId)
    {
        logger.info("用户注册消费者【节点2】获取消息，用户编号：{}",userId);

        //...//自行业务逻辑处理
    }
}
```
为了区分具体的消费者输出内容，我们在上面``UserConsumer``消费者消费方法内打印了相关日志输出，下面我们同样把``rabbitmq-consumer``子项目内``UserConsumer``的消费方法写入相关日志，如下所示：
```java
@RabbitHandler
    public void execute(Long userId)
    {
        logger.info("用户注册消费者【节点1】获取消息，用户编号：{}",userId);

        //...//自行业务逻辑处理
    }
```
> 到目前为止我们的多节点``RabbitMQ``消费者已经编写完成，下面我们来模拟多个用户注册的场景，来查看用户注册消息是否被转发并唯一性的分配给不同的消费者节点。
# 运行测试

我们打开上一章编写的``UserTester``测试类，为了模拟多用户注册请求，我们对应的创建一个内部线程类``BatchRabbitTester``，在线程类内编写注册请求代码，如下所示：
```java
 /**
     * 批量添加用户线程测试类
     * run方法发送用户注册请求
     */
    class BatchRabbitTester implements Runnable
    {
        private int index;
        public BatchRabbitTester() { }

        public BatchRabbitTester(int index) {
            this.index = index;
        }


        @Override
        public void run() {
            try {
                mockMvc.perform(MockMvcRequestBuilders.post("/user/save")
                        .param("userName","yuqiyu" + index)
                        .param("name","恒宇少年" + index)
                        .param("age","23")
                )
                        .andDo(MockMvcResultHandlers.log())
                        .andReturn();
            }catch (Exception e){
                e.printStackTrace();
            }

        }
    }
```
为了区分每一个注册信息是否都已经写入到数据库，我们为``BatchRabbitTester``添加了一个有参的构造方法，将for循环的``i``值对应的传递为``index``的值。下面我们来编写对应的批量注册的测试方法，如下所示：
```java
 /**
     * 测试用户批量添加
     * @throws Exception
     */
    @Test
    public void testBatchUserAdd() throws Exception
    {
        for (int i = 0 ; i < 10 ; i++) {
            //创建用户注册线程
            Thread thread = new Thread(new BatchRabbitTester(i));
            //启动线程
            thread.start();
        }
        //等待线程执行完成
        Thread.sleep(2000);
    }
```
我们循环10次来测试用户注册请求，每一次都会创建一个线程去完成发送注册请求逻辑，在方法底部添加了``sleep``方法，目的是为了阻塞测试用例的结束，因为我们测试用户完成方法后会自动停止，不会去等待其他线程执行完成，所以这里我们阻塞测试主线程来完成发送注册线程请求逻辑。
#### 执行批量注册测试方法
我们在执行测试批量注册用户消息之前，先把``rabbitmq-consumer``、``rabbitmq-consumer-node2``两个消费者子项目启动，项目启动完成后可以看到控制台输出启动成功日志，如下所示：
```bash
rabbitmq-consumer：
2017-12-10 17:10:36.961  INFO 15644 --- [           main] s.b.c.e.t.TomcatEmbeddedServletContainer : Tomcat started on port(s): 1111 (http)
2017-12-10 17:10:36.964  INFO 15644 --- [           main] c.h.r.c.RabbitmqConsumerApplication      : Started RabbitmqConsumerApplication in 2.405 seconds (JVM running for 3.39)
2017-12-10 17:10:36.964  INFO 15644 --- [           main] c.h.r.c.RabbitmqConsumerApplication      : 【【【【【消息队列-消息消费者启动成功.】】】】】

rabbitmq-consumer-node2：
2017-12-10 17:11:31.679  INFO 13812 --- [           main] s.b.c.e.t.TomcatEmbeddedServletContainer : Tomcat started on port(s): 1112 (http)
2017-12-10 17:11:31.682  INFO 13812 --- [           main] c.h.c.RabbitmqConsumerNode2Application   : Started RabbitmqConsumerNode2Application in 2.419 seconds (JVM running for 3.129)
2017-12-10 17:11:31.682  INFO 13812 --- [           main] c.h.c.RabbitmqConsumerNode2Application   : 【【【【【消息队列-消息消费者节点2启动成功.】】】】】

```
接下来我们来运行``testBatchUserAdd``方法，查看测试控制台输出内容如下所示：
```
2017-12-10 17:15:02.619  INFO 14456 --- [       Thread-3] o.s.a.r.c.CachingConnectionFactory       : Created new connection: rabbitConnectionFactory#528df369:0/SimpleConnection@39b6ba57 [delegate=amqp://guest@127.0.0.1:5672/, localPort= 60936]
 回调id:194b5e67-6913-474a-b2ac-6e938e1e85e8
消息发送成功
 回调id:e88ce59c-3eb9-433c-9e25-9429e7076fbe
消息发送成功
 回调id:3e5b8382-6f63-450f-a641-e3d8eee255b2
消息发送成功
 回调id:39103357-6c80-4561-acb7-79b32d6171c9
消息发送成功
 回调id:9795d227-b54e-4cde-9993-a5b880fcfe39
消息发送成功
 回调id:e9b8b828-f069-455f-a366-380bf10a5909
消息发送成功
 回调id:6b5b4a9c-5e7f-4c53-9eef-98e06f8be867
消息发送成功
 回调id:619a42f3-cb94-4434-9c75-1e28a04ce350
消息发送成功
 回调id:6b720465-b64a-4ed9-9d8c-3e4dafa4faed
消息发送成功
 回调id:b4296f7f-98cc-423b-a4ef-0fc31d22cb08
消息发送成功
```
可以看到确实已经成功的发送了10条用户注册消息到``RabbitMQ``服务端，那么是否已经正确的成功的将消息转发到消费者监听方法了呢？我们来打开``rabbitmq-consumer``子项目的启动控制台查看日志输出内容如下所示：
```
2017-12-10 17:10:36.964  INFO 15644 --- [           main] c.h.r.c.RabbitmqConsumerApplication      : 【【【【【消息队列-消息消费者启动成功.】】】】】
2017-12-10 17:15:02.695  INFO 15644 --- [cTaskExecutor-1] c.h.rabbitmq.consumer.user.UserConsumer  : 用户注册消费者【节点1】获取消息，用户编号：20
2017-12-10 17:15:02.718  INFO 15644 --- [cTaskExecutor-1] c.h.rabbitmq.consumer.user.UserConsumer  : 用户注册消费者【节点1】获取消息，用户编号：22
2017-12-10 17:15:02.726  INFO 15644 --- [cTaskExecutor-1] c.h.rabbitmq.consumer.user.UserConsumer  : 用户注册消费者【节点1】获取消息，用户编号：26
2017-12-10 17:15:02.729  INFO 15644 --- [cTaskExecutor-1] c.h.rabbitmq.consumer.user.UserConsumer  : 用户注册消费者【节点1】获取消息，用户编号：21
2017-12-10 17:15:02.789  INFO 15644 --- [cTaskExecutor-1] c.h.rabbitmq.consumer.user.UserConsumer  : 用户注册消费者【节点1】获取消息，用户编号：28
```
可以看到成功的接受了``5``条对应用户注册消息内容，不过这里具体接受的条数并不是固定的，这也是``RabbitMQ``消息转发权重内部问题。
下面我们打开``rabbitmq-consumer-node2``子项目控制台查看日志输出内容如下所示：
```
2017-12-10 17:11:31.682  INFO 13812 --- [           main] c.h.c.RabbitmqConsumerNode2Application   : 【【【【【消息队列-消息消费者节点2启动成功.】】】】】
2017-12-10 17:15:02.708  INFO 13812 --- [cTaskExecutor-1] com.hengyu.consumer.user.UserConsumer    : 用户注册消费者【节点2】获取消息，用户编号：25
2017-12-10 17:15:02.717  INFO 13812 --- [cTaskExecutor-1] com.hengyu.consumer.user.UserConsumer    : 用户注册消费者【节点2】获取消息，用户编号：23
2017-12-10 17:15:02.719  INFO 13812 --- [cTaskExecutor-1] com.hengyu.consumer.user.UserConsumer    : 用户注册消费者【节点2】获取消息，用户编号：24
2017-12-10 17:15:02.727  INFO 13812 --- [cTaskExecutor-1] com.hengyu.consumer.user.UserConsumer    : 用户注册消费者【节点2】获取消息，用户编号：27
2017-12-10 17:15:02.790  INFO 13812 --- [cTaskExecutor-1] com.hengyu.consumer.user.UserConsumer    : 用户注册消费者【节点2】获取消息，用户编号：29
```
同样获得了``5``条用户注册消息，不过并没有任何规律可言，编号也不是顺序的。
> 所以多节点时消息具体分发到哪个节点并不是固定的，完全是``RabbitMQ``分发机制来控制。

# 总结
本章完成了基于``SpringBoot``平台整合``RabbitMQ``单个``Provider``对应绑定多个``Consumer``来进行多节点分布式消费者消息消费，实际生产项目部署时完全可以将消费节点分开到不同的服务器，只要消费节点可以访问到``RabbitMQ``服务端，可以正常通讯，就可以完成消息消费。

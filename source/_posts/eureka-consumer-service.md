---
title: SpringCloud下使用Eureka的服务发现与消费
article_type: 原创
article_author: 于起宇
enable_comment: true
news: true
tags: [微服务,Spring Cloud,Eureka]
categories: [微服务]
keywords: eureka,SpringCloud,SpringBoot
date: 2018-10-04 15:30:23
id: eureka-service-consumer
description: 'SpringCloud下使用Eureka的服务发现与消费'
---
在之前的章节我们已经把服务注册到`Eureka Server`，那么我们该怎么调用已经注册后的服务呢？
我们本章来简单的介绍我们具体该怎么调用`服务节点`请求内容。
<!--more-->
### 本章目标
消费`Eureka`注册的`服务节点`的请求信息。
### 构建项目
我们只需要创建一个`服务节点项目`即可，因为服务`提供者`也是`消费者`，然后将本项目注册到之前编写的`服务注册中心`，下载文章{% post_path eureka-server 搭建Eureka服务注册中心 %}源码运行即可。
我们使用`idea`开发工具创建一个`SpringBoot`项目，对应的选择`spring-boot-starter-web`、`spring-cloud-starter-netflix-ribbon`、`spring-cloud-starter-netflix-eureka-client`三个依赖，`pom.xml`配置文件如下所示：
```xml
<properties>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
    <java.version>1.8</java.version>
    <spring-cloud.version>Finchley.SR1</spring-cloud.version>
</properties>

<dependencies>
    <!--Web依赖-->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <!--ribbon-->
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-netflix-ribbon</artifactId>
    </dependency>
    <!--client-->
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
    </dependency>

    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```
添加完依赖后我们需要对本项目进行配置，让本项目注册到服务中心，在之前的章节{% post_path eureka-register-service 将服务注册到Eureka %}有讲过，这里就不做过多的赘述。
#### 配置Eureka客户端
打开`XxxApplication`入口类，添加`@EnableDiscoveryClient`注解，如下所示：
```java
@SpringBootApplication
@EnableDiscoveryClient
public class SpringCloudEurekaConsumerApplication {
 //...
}
```
#### 修改application.yml配置文件
下面我们修改`application.yml`配置文件，添加`Eureka Client`对应的配置信息，如下所示：
```yaml
# 服务名称
spring:
  application:
    name: hengboy-spring-cloud-eureka-consumer
# 启动端口号
server:
  port: 20002
# Eureka 服务注册中心配置
eureka:
  client:
    service-url:
      defaultZone: http://localhost:10000/eureka/
  # 配置优先使用IP地址注册服务
  instance:
    prefer-ip-address: true
```
### 获取服务实例信息
如果你只是将服务注册到`服务注册中心`也就是`Eureka Server`上，到现在已经完全没有问题了，但是我们想要通过`服务名`(`spring.application.name`)来获取`服务实例列表`该怎么操作呢？

本章内容涉及一点有关`Ribbon`的知识点，我们通过添加依赖`spring-cloud-starter-netflix-ribbon`就可以直接使用`RestTemplate`类进行发送`http请求`，而且`RestTemnplate`可以直接使用`服务名`进行发送请求！！！

#### 实例化RestTemplate
`spring-cloud-starter-netflix-ribbon`依赖并没有为我们实例化`RestTemplate`，我们需要手动进行实例化，我采用`@Bean`方式进行实例化，在`XxxApplication`类内添加如下代码：
```java
/**
 * 实例化RestTemplate对象实例
 *
 * @return
 */
@Bean
@LoadBalanced
public RestTemplate restTemplate() {
    return new RestTemplate();
}
```
在这里有个`@LoadBalanced`注解，我们后续章节会对它详细的讲解，[博客](https://blog.minbox.org)搜索关键字`LoadBalanced`查询文章信息，不过如果你不添加并使用这个注解，你是没有办法通过`服务名`直接发送请求的，会出现错误信息。
#### 了解DiscoveryClient
我们需要创建一个`发送请求`以及`请求消费`的`Controller`，如下所示：
```java
/**
 * 消费者控制器
 *
 * @author：于起宇 <p>
 * ================================
 * Created with IDEA.
 * Date：2018/9/29
 * Time：5:55 PM
 * 简书：http://www.jianshu.com/u/092df3f77bca
 * 码云：https://gitee.com/hengboy
 * GitHub：https://github.com/hengyuboy
 * ================================
 * </p>
 */
@RestController
@RequestMapping(value = "/consumer")
public class ConsumerController {
    /**
     * logger instance
     */
    static Logger logger = LoggerFactory.getLogger(ConsumerController.class);
    /**
     * 注入服务客户端实例
     */
    @Autowired
    private DiscoveryClient discoveryClient;
    /**
     * 注入restTemplate模板
     */
    @Autowired
    private RestTemplate restTemplate;

    /**
     * 服务消费者业务逻辑方法
     * 该方法使用restTemplate访问获取返回数据
     *
     * @return
     */
    @RequestMapping(value = "/logic")
    public String home() {
        return "this is home page";
    }

    /**
     * 请求地址
     * 输出服务的基本信息
     */
    @RequestMapping(value = "/index")
    public void index() {
        discoveryClient.getInstances("hengboy-spring-cloud-eureka-consumer")
                .stream()
                .forEach(
                        instance -> {
                            logger.info("服务地址：{}，服务端口号：{}，服务实例编号：{}，服务地址：{}", instance.getHost(), instance.getPort(), instance.getServiceId(), instance.getUri());
                            String response = restTemplate.getForEntity("http://" + instance.getServiceId() + "/consumer/logic", String.class).getBody();
                            logger.info("响应内容：{}", response);
                        }

                );
    }
}

```


在上面代码中我们注入了`DiscoveryClient`，这是一个`接口类`，具体该接口的实现类是什么要取决你使用的是什么`服务注册中心`，我们本章采用的`Eureka`理所当然使用的是`Eureka`实现类，源码可以查看`org.springframework.cloud.netflix.eureka.EurekaDiscoveryClient`，在`EurekaDiscoveryClient`内可以看到具体是怎么通过`服务名`获取实例的列表，部分源码如下所示：
```
@Override
public List<ServiceInstance> getInstances(String serviceId) {
    List<InstanceInfo> infos = this.eurekaClient.getInstancesByVipAddress(serviceId,
            false);
    List<ServiceInstance> instances = new ArrayList<>();
    for (InstanceInfo info : infos) {
        instances.add(new EurekaServiceInstance(info));
    }
    return instances;
}
```
你如果对具体的源码执行流程感兴趣，可以使用断点来一步一步的观察。
在获取`ServiceInstance`服务实例后，可以得到实例的一些基本信息如：
- `serviceId`：服务名称、服务的实例编号，也就是`spring.application.name`配置信息
- `host`：注册该实例的`hostName`
- `port`：注册该实例的端口号，对应`server.port`配置信息
- `uri`：服务地址
- `metadata`：服务自定义的元数据`map`集合
#### 请求转发流程
> 执行流程：我们在访问`/consumer/index`请求地址时，会通过`RestTemplate`转发请求访问`http://hengboy-spring-cloud-eureka-consumer/consumer/logic`地址并返回信息`this is home page`。

### 运行测试
我们的测试流程如下：
> 1. 启动服务注册中心
> 2. 启动本章项目
> 3. 访问`http://localhost:20002/consumer/index`
> 4. 查看控制台输出内容是否有`this is home page`

访问有多种形式，你可以浏览器直接访问地址，我通过`curl`命令来访问地址，打开`terminal`输入以下命令：
```bash
curl http://localhost:20002/consumer/index
```
请求正常，查看控制台输出内容如下所示：
```
2018-10-04 15:23:36.333  INFO 29075 --- [io-20002-exec-5] c.y.c.h.s.e.consumer.ConsumerController  : 服务地址：192.168.1.75，服务端口号：20002，服务实例编号：HENGBOY-SPRING-CLOUD-EUREKA-CONSUMER，服务地址：http://192.168.1.75:20002
......
2018-10-04 15:23:36.748  INFO 29075 --- [io-20002-exec-5] c.y.c.h.s.e.consumer.ConsumerController  : 响应内容：this is home page
```
### 总结
本章通过`Ribbon`简单的实现了服务节点的消费，通过`RestTemplate`发送请求来获取响应内容，需要注意的是我们并不是通过`IP`:`Port`的形式，而是通过`服务名`的形式发送请求，这都归功于`@LoadBalanced`这个注解，这个注解在讲解`Ribbon`时会详细的说明。
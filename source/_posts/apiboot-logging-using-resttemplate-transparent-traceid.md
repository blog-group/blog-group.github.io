---
id: apiboot-logging-using-resttemplate-transparent-traceid
title: ApiBoot Logging使用RestTemplate透传链路信息
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: true
news: true
tags: [ApiBoot,日志组件]
categories: [ApiBoot]
keywords: apiboot,resttemplate,logging
description: 'ApiBoot Logging使用RestTemplate透传链路信息'
date: 2019-11-06 14:15:57
article_url:
---
在上一篇文章【{% post_path apiboot-logging-using-openfeign-transparent-traceid %}】中我们详细的讲解了`ApiBoot Logging`整合`SpringCloud`通过`Openfeign`进行透传链路信息，包括`traceId`（链路编号）、`parentSpanId`（上级单元编号）等信息。
`ApiBoot Logging`不仅仅可以使用`Openfeign`传递链路信息，还支持`RestTemplate`方式，本篇文章来详细的讲解下具体的使用方式。
<!--more-->
## 搭建Logging Admin
我们需要搭建`Logging Admin`服务，用于接收`业务服务`上报的请求日志信息，请参考【{% post_path apiboot-report-logs-by-logging-to-admin %}】文章内容.
## 添加ApiBoot统一版本
由于本章采用是`Maven 多模块`的方式构建源码，所以我们只需要将`ApiBoot`统一版本的依赖配置在`root`项目的`pom.xml`内，如下所示：
```xml
<properties>
  <java.version>1.8</java.version>
  <!--ApiBoot版本号-->
  <api.boot.version>2.1.5.RELEASE</api.boot.version>
</properties>
<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>org.minbox.framework</groupId>
      <artifactId>api-boot-dependencies</artifactId>
      <version>${api.boot.version}</version>
      <type>pom</type>
      <scope>import</scope>
    </dependency>
  </dependencies>
</dependencyManagement>
```
接下来我们营造本篇文章的`模拟场景`，**查询用户基本信息时一并查询出用户的账号余额**。

## 创建账户服务

创建一个名为`account-service`的`SpringBoot`项目。

### 添加相关依赖

在项目`pom.xml`配置文件内添加相关依赖，如下所示：

```xml
<dependencies>
  <!--SpringBoot Web-->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
  </dependency>
  <!--ApiBoot Logging-->
  <dependency>
    <groupId>org.minbox.framework</groupId>
    <artifactId>api-boot-starter-logging</artifactId>
  </dependency>
</dependencies>
```

### 配置上报的Logging Admin

在`application.yml`配置文件内添加请求日志上报的`Logging Admin`地址，如下所示：

```yaml
spring:
  application:
    name: account-service
server:
  port: 9090

api:
  boot:
    logging:
      # 控制台打印请求日志
      show-console-log: true
      # 美化请求日志
      format-console-log-json: true
      # Logging Admin地址
      admin:
        server-address: 127.0.0.1:8081
```

> 注意：`server-address`配置参数不需要添加`http://`前缀

### 启用Logging Client

添加完成依赖后我们通过`@EnableLoggingClient`注解来启用`ApiBoot Logging`，在`AccountServiceApplication`类上添加如下所示：

```java
/**
 * 账户服务
 *
 * @author 恒宇少年
 */
@SpringBootApplication
@EnableLoggingClient
public class AccountServiceApplication {
    /**
     * logger instance
     */
    static Logger logger = LoggerFactory.getLogger(AccountServiceApplication.class);

    public static void main(String[] args) {
        SpringApplication.run(AccountServiceApplication.class, args);
        logger.info("{}服务启动成功.", "账户");
    }
}
```

> `@EnableLoggingClient`注解就实例化部分`ApiBoot Logging`内部所需要的类，将实例放置到`Spring IOC`容器内。

### 查询账户余额代码实现

我们创建一个名为`AccountController`的控制器来提供查询账户的余额信息，代码实现如下所示：

```java
/**
 * 账户服务实现
 *
 * @author 恒宇少年
 */
@RestController
@RequestMapping(value = "/account")
public class AccountController {

    /**
     * 示例，内存账户列表
     */
    static final HashMap<Integer, Double> ACCOUNTS = new HashMap() {{
        put(1, 1233.22);
        put(2, 69269.22);
    }};

    /**
     * 获取指定账户的余额
     *
     * @param accountId
     * @return
     */
    @GetMapping(value = "/{accountId}")
    public Double getBalance(@PathVariable("accountId") Integer accountId) {
        return ACCOUNTS.get(accountId);
    }
}
```



> 至此我们的账户服务已经编写完成，下面我们来编写`用户服务`。


## 创建用户服务

我们来创建一个名为`user-service`的`SpringBoot`项目。

### 添加相关依赖

在项目`pom.xml`配置文件内添加相关依赖，如下所示：

```xml
<dependencies>
  <!--SpringBoot Web-->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
  </dependency>
  <!--ApiBoot Logging-->
  <dependency>
    <groupId>org.minbox.framework</groupId>
    <artifactId>api-boot-starter-logging</artifactId>
  </dependency>
</dependencies>
```

### 配置上报的Logging Admin

本章我们使用指定`Logging Admin`地址的方式配置，修改`application.yml`配置文件如下所示：

```yaml
spring:
  application:
    name: user-service
server:
  port: 9091

api:
  boot:
    logging:
      # 控制台打印请求日志
      show-console-log: true
      # 美化请求日志
      format-console-log-json: true
      # Logging Admin地址
      admin:
        server-address: 127.0.0.1:8081
```

### 启用Logging Client

添加完依赖后我们需要在`XxxApplication`入口类上添加`@EnableLoggingClient`注解来启用`ApiBoot Logging`，如下所示：

```java
/**
 * 用户服务
 *
 * @author 恒宇少年
 */
@SpringBootApplication
@EnableLoggingClient
public class UserServiceApplication {
    /**
     * logger instance
     */
    static Logger logger = LoggerFactory.getLogger(UserServiceApplication.class);

    public static void main(String[] args) {
        SpringApplication.run(UserServiceApplication.class, args);
        logger.info("{}服务启动成功.", "用户");
    }
}
```

### 实例化RestTemplate对象

在`user-service`需要访问`账户服务`获取当前用户的余额，所以我们需要在`user-service`内实例化`RestTemplate`，这样我们才可以通过`RestTemplate`访问获取用户账户余额信息，我们直接在`UserServiceApplication`类内添加实例，如下所示：

```java
    /**
     * 实例化RestTemplate
     *
     * @return {@link RestTemplate}
     */
    @Bean
    @ConditionalOnMissingBean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
```

**注解解释：**

- `@ConditionalOnMissingBean`：这是`SpringBoot`条件注入其中的一个注解，表示当`IOC`容器内不存在`RestTemplate`类型的实例时才会去执行`restTemplate()`方法创建对象。

### 查询用户信息代码实现

```java
/**
 * 用户基本信息控制器
 *
 * @author 恒宇少年
 */
@RestController
@RequestMapping(value = "/user")
public class UserController {
    /**
     * 示例，用户列表
     */
    static final HashMap<Integer, User> USERS = new HashMap() {{
        put(1, new User(1, "恒宇少年"));
        put(2, new User(2, "于起宇"));
    }};
    /**
     * 注入RestTemplate
     */
    @Autowired
    private RestTemplate restTemplate;

    /**
     * 获取用户基本信息
     *
     * @param userId 用户编号
     * @return
     */
    @GetMapping(value = "/{userId}")
    public User getUserInfo(@PathVariable("userId") Integer userId) {
        ResponseEntity<Double> responseEntity = restTemplate.getForEntity("http://localhost:9090/account/{accountId}", Double.class, userId);
        Double balance = responseEntity.getBody();
        User user = USERS.get(userId);
        if (ObjectUtils.isEmpty(user)) {
            throw new RuntimeException("用户：" + userId + "，不存在.");
        }
        user.setBalance(balance);
        return user;
    }

    @Data
    public static class User {
        private Integer id;
        private String name;
        private Double balance;

        public User(Integer id, String name) {
            this.id = id;
            this.name = name;
        }
    }
}
```



我们所需要的两个服务都已经编写完成，下面我们来测试`RestTemplate`是可以透传`ApiBoot Logging`的链路信息？

## 运行测试

依次启动`logging-admin` > `user-service` > `account-service`。

### 测试点：透传链路信息

我们使用`curl`命令访问`user-service`提供的地址`/user`，如下所示：

```bash
➜ ~ curl http://localhost:9091/user/1
{"id":1,"name":"恒宇少年","balance":1233.22}
```

下面我看来看下`logging-admin`控制台接收到的请求日志。

**接收user-service请求日志**

```json
Receiving Service: 【user-service -> 127.0.0.1】, Request Log Report，Logging Content：[
	{
		"endTime":1573032865311,
		"httpStatus":200,
		"requestBody":"",
		"requestHeaders":{
			"host":"localhost:9091",
			"user-agent":"curl/7.64.1",
			"accept":"*/*"
		},
		"requestIp":"0:0:0:0:0:0:0:1",
		"requestMethod":"GET",
		"requestParam":"{}",
		"requestUri":"/user/1",
		"responseBody":"{\"id\":1,\"name\":\"恒宇少年\",\"balance\":1233.22}",
		"responseHeaders":{},
		"serviceId":"user-service",
		"serviceIp":"127.0.0.1",
		"servicePort":"9091",
		"spanId":"f8cff018-42d5-481f-98df-c19b7196b3c3",
		"startTime":1573032865130,
		"timeConsuming":181,
		"traceId":"16ad1dd4-beaa-4110-b4b7-fc7d952d9a57"
	}
]
```



**接收account-service请求日志**

```json
Receiving Service: 【account-service -> 127.0.0.1】, Request Log Report，Logging Content：[
	{
		"endTime":1573032865309,
		"httpStatus":200,
		"parentSpanId":"f8cff018-42d5-481f-98df-c19b7196b3c3",
		"requestBody":"",
		"requestHeaders":{
			"minbox-logging-x-parent-span-id":"f8cff018-42d5-481f-98df-c19b7196b3c3",
			"minbox-logging-x-trace-id":"16ad1dd4-beaa-4110-b4b7-fc7d952d9a57",
			"host":"localhost:9090",
			"connection":"keep-alive",
			"accept":"application/json, application/*+json",
			"user-agent":"Java/1.8.0_211"
		},
		"requestIp":"127.0.0.1",
		"requestMethod":"GET",
		"requestParam":"{}",
		"requestUri":"/account/1",
		"responseBody":"1233.22",
		"responseHeaders":{},
		"serviceId":"account-service",
		"serviceIp":"127.0.0.1",
		"servicePort":"9090",
		"spanId":"63b18b40-5718-431c-972f-78956ce78380",
		"startTime":1573032865307,
		"timeConsuming":2,
		"traceId":"16ad1dd4-beaa-4110-b4b7-fc7d952d9a57"
	}
]
```

- 当我们访问`user-service`服务内的`/user`路径时，因为是第一次访问`ApiBoot Logging`会主动创建`traceId`（链路编号）、`spanId`（单元编号），因为没有`上级单元`所以`parentSpanId`为`null`.
- 而通过查看`account-service`服务上报的请求日志时，可以看到`ApiBoot Logging`相关的链路信息是通过`HttpHeader`的方式进行传递的
  - `minbox-logging-x-trace-id` -> `链路编号`
  - `minbox-logging-x-parent-span-id` -> `上级单元编号`

## 敲黑板，划重点

`ApiBoot Logging`在内部自动化实现了`RestTemplate`的拦截器配置，所以我们只需要创建实例就可以，而不需要主动去配置拦截器信息，具体源码请访问`org.minbox.framework.logging.client.http.rest.LoggingRestTemplateInterceptor`查看。

不管你一次请求跨度几个服务，都可以将`请求入口`生成的`链路信息`进行依次传递，而上下级关系则是根据`parentSpanId`、`spanId`进行绑定的。

## 代码示例
如果您喜欢本篇文章请为源码仓库点个`Star`，谢谢！！！
本篇文章示例源码可以通过以下途径获取，目录为`apiboot-logging-using-resttemplate-transparent-traceid`：

- Gitee：[https://gitee.com/minbox-projects/api-boot-chapter](https://gitee.com/minbox-projects/api-boot-chapter)
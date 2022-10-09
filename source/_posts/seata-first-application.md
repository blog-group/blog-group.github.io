---
id: seata-first-application
title: SpringCloud与Seata分布式事务初体验
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: true
news: true
tags:
  - SpringCloud
  - Seata
categories:
  - SpringCloud
keywords: seata,springcloud,springboot
date: 2019-10-10 16:14:04
description: 'SpringCloud与Seata分布式事务初体验'
---
在本篇文章中我们在`SpringCloud`环境下通过使用`Seata`来模拟用户`购买商品`时由于用户**余额不足**导致本次订单提交失败，来验证下在`MySQL`数据库内事务是否会`回滚`。

<!--more-->


本章文章只涉及所需要测试的`服务列表`以及`Seata`配置部分。

用户提交订单购买商品大致分为以下几个步骤：

1. **减少库存**
2. **扣除金额**
3. **提交订单**

## 1. 准备环境

- **Seata Server**

  如果对`Seata Server`部署方式还不了解，请访问：{% post_path seata-init-env %}

- **Eureka Server**

  服务注册中心，如果对`Eureka Server`部署方式还不了解，请访问{% post_path eureka-server %}

## 2. 准备测试服务

为了方便学习的同学查看源码，我们本章节源码采用`Maven Module`（多模块）的方式进行构建。

我们用于测试的服务所使用的第三方依赖都一致，各个服务的`pom.xml`文件内容如下所示：

```xml
<dependencies>
  <!--Web-->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
  </dependency>
  <!--openfeign接口定义-->
  <dependency>
    <groupId>org.minbox.chapter</groupId>
    <artifactId>openfeign-service</artifactId>
    <version>0.0.1-SNAPSHOT</version>
  </dependency>
  <!--公共依赖-->
  <dependency>
    <groupId>org.minbox.chapter</groupId>
    <artifactId>common-service</artifactId>
    <version>0.0.1-SNAPSHOT</version>
  </dependency>

  <!--seata-->
  <dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-seata</artifactId>
  </dependency>

  <dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-openfeign</artifactId>
  </dependency>

  <!--Eureka Client-->
  <dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
  </dependency>

  <dependency>
    <groupId>com.zaxxer</groupId>
    <artifactId>HikariCP</artifactId>
  </dependency>
  <dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
  </dependency>
  <dependency>
    <groupId>org.minbox.framework</groupId>
    <artifactId>api-boot-starter-mybatis-enhance</artifactId>
  </dependency>
</dependencies>
```

### 2.1 Openfeign接口定义模块

由于我们服务之间采用的`Openfeign`方式进行相互调用，所以创建了一个模块`openfeign-service`来提供`服务接口的定义`。

- **账户服务提供的接口定义**

`账户服务`对外所提供的`Openfeign`接口定义如下所示：

```java
/**
 * 账户服务接口
 *
 * @author 恒宇少年
 */
@FeignClient(name = "account-service")
@RequestMapping(value = "/account")
public interface AccountClient {
    /**
     * 扣除指定账户金额
     *
     * @param accountId 账户编号
     * @param money     金额
     */
    @PostMapping
    void deduction(@RequestParam("accountId") Integer accountId, @RequestParam("money") Double money);
}
```

- **商品服务提供的接口定义**

  `商品服务`对外所提供的`Openfeign`接口定义如下所示：

  ```java
  /**
   * 商品服务接口定义
   *
   * @author 恒宇少年
   */
  @FeignClient(name = "good-service")
  @RequestMapping(value = "/good")
  public interface GoodClient {
      /**
       * 查询商品基本信息
       *
       * @param goodId {@link Good#getId()}
       * @return {@link Good}
       */
      @GetMapping
      Good findById(@RequestParam("goodId") Integer goodId);
  
      /**
       * 减少商品的库存
       *
       * @param goodId {@link Good#getId()}
       * @param stock  减少库存的数量
       */
      @PostMapping
      void reduceStock(@RequestParam("goodId") Integer goodId, @RequestParam("stock") int stock);
  }
  ```

  

### 2.2 公共模块

公共模块`common-service`内所提供的类是`共用的`，各个服务都可以调用，其中最为重要的是将`Seata`所提供的数据源代理（`DataSourceProxy`）实例化配置放到了这个模块中，数据库代理相关配置代码如下所示：

```java
/**
 * Seata所需数据库代理配置类
 *
 * @author 恒宇少年
 */
@Configuration
public class DataSourceProxyAutoConfiguration {
    /**
     * 数据源属性配置
     * {@link DataSourceProperties}
     */
    private DataSourceProperties dataSourceProperties;

    public DataSourceProxyAutoConfiguration(DataSourceProperties dataSourceProperties) {
        this.dataSourceProperties = dataSourceProperties;
    }

    /**
     * 配置数据源代理，用于事务回滚
     *
     * @return The default datasource
     * @see DataSourceProxy
     */
    @Primary
    @Bean("dataSource")
    public DataSource dataSource() {
        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setJdbcUrl(dataSourceProperties.getUrl());
        dataSource.setUsername(dataSourceProperties.getUsername());
        dataSource.setPassword(dataSourceProperties.getPassword());
        dataSource.setDriverClassName(dataSourceProperties.getDriverClassName());
        return new DataSourceProxy(dataSource);
    }
}
```

**该配置类在所需要的服务中使用`@Import`注解进行导入使用。**

### 2.3 账户服务

- **服务接口实现**

  `账户服务`用于提供接口的服务实现，通过实现`openfeign-service`内提供的`AccountClient`服务定义接口来对应提供服务实现，实现接口如下所示：

  ```java
  /**
   * 账户接口实现
   *
   * @author 恒宇少年
   */
  @RestController
  public class AccountController implements AccountClient {
      /**
       * 账户业务逻辑
       */
      @Autowired
      private AccountService accountService;
  
      @Override
      public void deduction(Integer accountId, Double money) {
          accountService.deduction(accountId, money);
      }
  }
  ```

- **服务配置（application.yml）**

  ```yaml
  # 服务名
  spring:
    application:
      name: account-service
    # seata分组
    cloud:
      alibaba:
        seata:
          tx-service-group: minbox-seata
    # 数据源
    datasource:
      url: jdbc:mysql://localhost:3306/test
      username: root
      password: 123456
      type: com.zaxxer.hikari.HikariDataSource
      driver-class-name: com.mysql.cj.jdbc.Driver
  
  # eureka
  eureka:
    client:
      service-url:
        defaultZone: http://service:nodev2@10.180.98.83:10001/eureka/
  ```

  通过`spring.cloud.alibaba.seata.tx-service-group`我们可以指定服务所属事务的分组，该配置非必填，默认为`spring.application.name`配置的内容加上字符串`-fescar-service-group`，如：`account-service-fescar-service-group`，详见`com.alibaba.cloud.seata.GlobalTransactionAutoConfiguration`配置类源码。

  > 在我本地测试环境的`Eureka Server`在`10.180.98.83`服务器上，这里需要修改成你们自己的地址，数据库连接信息也需要修改成你们自己的配置。

- **导入Seata数据源代理配置**

  ```java
  /**
   * @author 恒宇少年
   */
  @SpringBootApplication
  @Import(DataSourceProxyAutoConfiguration.class)
  public class AccountServiceApplication {
      /**
       * logger instance
       */
      static Logger logger = LoggerFactory.getLogger(AccountServiceApplication.class);
  
      public static void main(String[] args) {
          SpringApplication.run(AccountServiceApplication.class, args);
          logger.info("账户服务启动成功.");
      }
  }
  ```

  通过`@Import`导入我们`common-service`内提供的`Seata`数据源代理配置类`DataSourceProxyAutoConfiguration`。

### 2.4 商品服务

- **服务接口实现**

  商品服务提供商品的查询以及库存扣减接口服务，实现`openfeign-service`提供的`GoodClient`服务接口定义如下所示：

  ```java
  /**
   * 商品接口定义实现
   *
   * @author 恒宇少年
   */
  @RestController
  public class GoodController implements GoodClient {
      /**
       * 商品业务逻辑
       */
      @Autowired
      private GoodService goodService;
  
      /**
       * 查询商品信息
       *
       * @param goodId {@link Good#getId()}
       * @return
       */
      @Override
      public Good findById(Integer goodId) {
          return goodService.findById(goodId);
      }
  
      /**
       * 扣减商品库存
       *
       * @param goodId {@link Good#getId()}
       * @param stock  减少库存的数量
       */
      @Override
      public void reduceStock(Integer goodId, int stock) {
          goodService.reduceStock(goodId, stock);
      }
  }
  ```

  

- **服务配置（application.yml）**

  ```yaml
  spring:
    application:
      name: good-service
    cloud:
      alibaba:
        seata:
          tx-service-group: minbox-seata
    datasource:
      url: jdbc:mysql://localhost:3306/test
      username: root
      password: 123456
      type: com.zaxxer.hikari.HikariDataSource
      driver-class-name: com.mysql.cj.jdbc.Driver
  
  
  eureka:
    client:
      service-url:
        defaultZone: http://service:nodev2@10.180.98.83:10001/eureka/
  server:
    port: 8081
  ```

  

- **导入Seata数据源代理配置**

  ```java
  /**
   * @author 恒宇少年
   */
  @SpringBootApplication
  @Import(DataSourceProxyAutoConfiguration.class)
  public class GoodServiceApplication {
      /**
       * logger instance
       */
      static Logger logger = LoggerFactory.getLogger(GoodServiceApplication.class);
  
      public static void main(String[] args) {
          SpringApplication.run(GoodServiceApplication.class, args);
          logger.info("商品服务启动成功.");
      }
  }
  ```

  

### 2.5 订单服务

- **服务接口**

  `订单服务`提供了下单的接口，通过调用该接口完成下单功能，下单接口会通过`Openfeign`调用`account-service`、`good-service`所提供的服务接口来完成数据验证，如下所示：

  ```java
  
  /**
   * @author 恒宇少年
   */
  @RestController
  @RequestMapping(value = "/order")
  public class OrderController {
      /**
       * 账户服务接口
       */
      @Autowired
      private AccountClient accountClient;
      /**
       * 商品服务接口
       */
      @Autowired
      private GoodClient goodClient;
      /**
       * 订单业务逻辑
       */
      @Autowired
      private OrderService orderService;
  
      /**
       * 通过{@link GoodClient#reduceStock(Integer, int)}方法减少商品的库存，判断库存剩余数量
       * 通过{@link AccountClient#deduction(Integer, Double)}方法扣除商品所需要的金额，金额不足由account-service抛出异常
       *
       * @param goodId    {@link Good#getId()}
       * @param accountId {@link Account#getId()}
       * @param buyCount  购买数量
       * @return
       */
      @PostMapping
      @GlobalTransactional
      public String submitOrder(
              @RequestParam("goodId") Integer goodId,
              @RequestParam("accountId") Integer accountId,
              @RequestParam("buyCount") int buyCount) {
  
          Good good = goodClient.findById(goodId);
  
          Double orderPrice = buyCount * good.getPrice();
  
          goodClient.reduceStock(goodId, buyCount);
  
          accountClient.deduction(accountId, orderPrice);
  
          Order order = toOrder(goodId, accountId, orderPrice);
          orderService.addOrder(order);
          return "下单成功.";
      }
  
      private Order toOrder(Integer goodId, Integer accountId, Double orderPrice) {
          Order order = new Order();
          order.setGoodId(goodId);
          order.setAccountId(accountId);
          order.setPrice(orderPrice);
          return order;
      }
  }
  ```

  

- **服务配置（application.yml）**

  ```yaml
  spring:
    application:
      name: order-service
    cloud:
      alibaba:
        seata:
          tx-service-group: minbox-seata
    datasource:
      url: jdbc:mysql://localhost:3306/test
      username: root
      password: 123456
      type: com.zaxxer.hikari.HikariDataSource
      driver-class-name: com.mysql.cj.jdbc.Driver
  
  
  eureka:
    client:
      service-url:
        defaultZone: http://service:nodev2@10.180.98.83:10001/eureka/
  server:
    port: 8082
  ```

  

- **启用Openfeign & 导入Seata数据源代理配置**

  ```java
  /**
   * @author 恒宇少年
   */
  @SpringBootApplication
  @EnableFeignClients(basePackages = "org.minbox.chapter.seata.openfeign")
  @Import(DataSourceProxyAutoConfiguration.class)
  public class OrderServiceApplication {
      /**
       * logger instance
       */
      static Logger logger = LoggerFactory.getLogger(OrderServiceApplication.class);
  
      public static void main(String[] args) {
          SpringApplication.run(OrderServiceApplication.class, args);
          logger.info("订单服务启动成功.");
      }
  }
  ```

  我们仅在`order-service`调用了其他服务的`Openfeign`接口，所以我们只需要在`order-service`内通过`@EnableFeignClients`注解启用`Openfeign`接口实现代理。

## 3. 服务连接Seata Server

服务想要连接到`Seata Server`需要添加两个配置文件，分别是`registry.conf`、`file.conf`。

- **registry.conf**

  注册到`Seata Server`的配置文件，里面包含了注册方式、配置文件读取方式，内容如下所示：

  ```
  registry {
    # file、nacos、eureka、redis、zk、consul
    type = "file"
  
    file {
      name = "file.conf"
    }
  
  }
  
  config {
    type = "file"
  
    file {
      name = "file.conf"
    }
  }
  ```

  

- **file.conf**

  该配置文件内包含了使用`file`方式连接到`Eureka Server`的配置信息以及`存储分布式事务信息`的方式，如下所示：

  ```
  transport {
    # tcp udt unix-domain-socket
    type = "TCP"
    #NIO NATIVE
    server = "NIO"
    #enable heartbeat
    heartbeat = true
    #thread factory for netty
    thread-factory {
      boss-thread-prefix = "NettyBoss"
      worker-thread-prefix = "NettyServerNIOWorker"
      server-executor-thread-prefix = "NettyServerBizHandler"
      share-boss-worker = false
      client-selector-thread-prefix = "NettyClientSelector"
      client-selector-thread-size = 1
      client-worker-thread-prefix = "NettyClientWorkerThread"
      # netty boss thread size,will not be used for UDT
      boss-thread-size = 1
      #auto default pin or 8
      worker-thread-size = 8
    }
  }
  ## transaction log store
  store {
    ## store mode: file、db
    mode = "file"
  
    ## file store
    file {
      dir = "sessionStore"
  
      # branch session size , if exceeded first try compress lockkey, still exceeded throws exceptions
      max-branch-session-size = 16384
      # globe session size , if exceeded throws exceptions
      max-global-session-size = 512
      # file buffer size , if exceeded allocate new buffer
      file-write-buffer-cache-size = 16384
      # when recover batch read size
      session.reload.read_size = 100
      # async, sync
      flush-disk-mode = async
    }
  
    ## database store
    db {
      datasource = "druid"
      db-type = "mysql"
      driver-class-name = "com.mysql.jdbc.Driver"
      url = "jdbc:mysql://10.180.98.83:3306/iot-transactional"
      user = "dev"
      password = "dev2019."
    }
  
  }
  service {
    vgroup_mapping.minbox-seata = "default"
    default.grouplist = "10.180.98.83:8091"
    enableDegrade = false
    disable = false
  }
  client {
    async.commit.buffer.limit = 10000
    lock {
      retry.internal = 10
      retry.times = 30
    }
  }
  ```

  配置文件内`service`部分需要注意，我们在`application.yml`配置文件内配置了事务分组为`minbox-seata`，在这里需要进行对应配置`vgroup_mapping.minbox-seata = "default"`,通过`  default.grouplist = "10.180.98.83:8091"`配置`Seata Server`的服务列表。

> **将上面两个配置文件在各个服务`resources`目录下创建。**

## 4. 编写下单逻辑

在前面说了那么多，只是做了准备工作，我们要为每个参与下单的服务添加对应的业务逻辑。

- **账户服务**

  在`account-service`内添加账户余额扣除业务逻辑类，`AccountService`如下所示：

  ```java
  
  /**
   * 账户业务逻辑处理
   *
   * @author 恒宇少年
   */
  @Service
  @Transactional(rollbackFor = Exception.class)
  public class AccountService {
      
      @Autowired
      private EnhanceMapper<Account, Integer> mapper;
  
      /**
       * {@link EnhanceMapper} 具体使用查看ApiBoot官网文档https://apiboot.minbox.org/zh-cn/docs/api-boot-mybatis-enhance.html
       *
       * @param accountId {@link Account#getId()}
       * @param money     扣除的金额
       */
      public void deduction(Integer accountId, Double money) {
          Account account = mapper.selectOne(accountId);
          if (ObjectUtils.isEmpty(account)) {
              throw new RuntimeException("账户：" + accountId + "，不存在.");
          }
          if (account.getMoney() - money < 0) {
              throw new RuntimeException("账户：" + accountId + "，余额不足.");
          }
          account.setMoney(account.getMoney().doubleValue() - money);
          mapper.update(account);
      }
  }
  ```

  

- **商品服务**

  在`good-service`内添加查询商品、扣减商品库存的逻辑类，`GoodService`如下所示：

  ```java
  /**
   * 商品业务逻辑实现
   *
   * @author 恒宇少年
   */
  @Service
  @Transactional(rollbackFor = Exception.class)
  public class GoodService {
  
      @Autowired
      private EnhanceMapper<Good, Integer> mapper;
  
      /**
       * 查询商品详情
       *
       * @param goodId {@link Good#getId()}
       * @return {@link Good}
       */
      public Good findById(Integer goodId) {
          return mapper.selectOne(goodId);
      }
  
      /**
       * {@link EnhanceMapper} 具体使用查看ApiBoot官网文档https://apiboot.minbox.org/zh-cn/docs/api-boot-mybatis-enhance.html
       * 扣除商品库存
       *
       * @param goodId {@link Good#getId()}
       * @param stock  扣除的库存数量
       */
      public void reduceStock(Integer goodId, int stock) {
          Good good = mapper.selectOne(goodId);
          if (ObjectUtils.isEmpty(good)) {
              throw new RuntimeException("商品：" + goodId + ",不存在.");
          }
          if (good.getStock() - stock < 0) {
              throw new RuntimeException("商品：" + goodId + "库存不足.");
          }
          good.setStock(good.getStock() - stock);
          mapper.update(good);
  
      }
  }
  ```

  

## 5. 提交订单测试

我们在执行测试之前在数据库内的`seata_account`、`seata_good`表内对应添加两条测试数据，如下所示：

```sql
-- seata_good
INSERT INTO `seata_good` VALUES (1,'华为Meta 30',10,5000.00);	

-- seata_account
INSERT INTO `seata_account` VALUES (1,10000.00,'2019-10-11 02:37:35',NULL);
```

### 5.1 启动服务

将我们本章所使用`good-server`、`order-service`、`account-service`三个服务启动。

### 5.2 测试点：正常购买

我们添加的账户余额测试数据够我们购买两件商品，我们先来购买一件商品验证下接口访问是否成功，通过如下命令访问下单接口：

```bash
~ curl -X POST http://localhost:8082/order\?goodId\=1\&accountId\=1\&buyCount\=1
下单成功.
```

通过我们访问`/order`下单接口，根据响应的内容我们确定商品已经购买成功。

通过查看`order-service`控制台内容：

```bash
2019-10-11 16:52:15.477  INFO 13142 --- [nio-8082-exec-4] i.seata.tm.api.DefaultGlobalTransaction  : [10.180.98.83:8091:2024417333] commit status:Committed
2019-10-11 16:52:16.412  INFO 13142 --- [atch_RMROLE_2_8] i.s.core.rpc.netty.RmMessageListener     : onMessage:xid=10.180.98.83:8091:2024417333,branchId=2024417341,branchType=AT,resourceId=jdbc:mysql://localhost:3306/test,applicationData=null
2019-10-11 16:52:16.412  INFO 13142 --- [atch_RMROLE_2_8] io.seata.rm.AbstractRMHandler            : Branch committing: 10.180.98.83:8091:2024417333 2024417341 jdbc:mysql://localhost:3306/test null
2019-10-11 16:52:16.412  INFO 13142 --- [atch_RMROLE_2_8] io.seata.rm.AbstractRMHandler            : Branch commit result: PhaseTwo_Committed
```

我们可以看到本次事务已经成功`Committed`。

再去验证下数据库内的`账户余额`、`商品库存`是否有所扣减。

### 5.3 测试点：库存不足

测试商品添加了`10`个库存，在之前测试已经销售掉了一件商品，我们测试购买数量超过库存数量时，是否有回滚日志，执行如下命令：

```bash
~ curl -X POST http://localhost:8082/order\?goodId\=1\&accountId\=1\&buyCount\=10
{"timestamp":"2019-10-11T08:57:13.775+0000","status":500,"error":"Internal Server Error","message":"status 500 reading GoodClient#reduceStock(Integer,int)","path":"/order"}
```

在我们`good-service`服务控制台已经打印了商品库存不足的异常信息：

```java
java.lang.RuntimeException: 商品：1库存不足.
	at org.minbox.chapter.seata.service.GoodService.reduceStock(GoodService.java:42) ~[classes/:na]
	....
```

我们再看`order-service`的控制台打印日志：

```bash
Begin new global transaction [10.180.98.83:8091:2024417350]
2019-10-11 16:57:13.771  INFO 13142 --- [nio-8082-exec-5] i.seata.tm.api.DefaultGlobalTransaction  : [10.180.98.83:8091:2024417350] rollback status:Rollbacked
```

通过日志可以查看本次事务进行了`回滚`。

由于**库存的验证在账户余额扣减之前**，所以我们本次并不能从数据库的数据来判断事务是真的回滚。

### 5.4 测试点：余额不足

既然商品库存不足我们不能直接验证数据库事务回滚，我们从账户余额不足来下手，在之前成功购买了一件商品，账户的余额还够购买一件商品，商品库存目前是`9件`，我们本次测试购买`5件`商品，这样就会出现购买商品`库存充足`而`余额不足`的应用场景，执行如下命令发起请求：

```bash
~ curl -X POST http://localhost:8082/order\?goodId\=1\&accountId\=1\&buyCount\=5
{"timestamp":"2019-10-11T09:03:00.794+0000","status":500,"error":"Internal Server Error","message":"status 500 reading AccountClient#deduction(Integer,Double)","path":"/order"}
```

我们通过查看`account-service`控制台日志可以看到：

```bash
java.lang.RuntimeException: 账户：1，余额不足.
	at org.minbox.chapter.seata.service.AccountService.deduction(AccountService.java:33) ~[classes/:na]
```

已经抛出了`余额不足`的异常。

通过查看`good-service`、`order-serivce`控制台日志，可以看到事务进行了回滚操作。

接下来查看`seata_account`表数据，我们发现账户余额没有改变，账户服务的`事务回滚`**验证成功**。

查看`seata_good`表数据，我们发现商品的库存也没有改变，商品服务的`事务回滚`**验证成功**。

## 6. 总结

本章主要来验证分布式事务框架`Seata`在`MySQL`下提交与回滚有效性，是否能够完成我们预期的效果，`Seata`作为`SpringCloud Alibaba`的核心框架，更新频率比较高，快速的解决使用过程中遇到的问题，是一个潜力股，不错的选择。

由于本章设计的代码比较多，请结合源码进行学习。

## 7. 本章源码

请访问<a href="https://gitee.com/hengboy/spring-cloud-chapter" target="_blank">https://gitee.com/hengboy/spring-cloud-chapter</a>查看本章源码，建议使用`git clone https://gitee.com/hengboy/spring-cloud-chapter.git`将源码下载到本地。
---
id: why_doesnot_spring_declarative_transactions_roll_back
title: Spring声明式事务为何不回滚
article_type: 转载
article_author: rabbitGYK
enable_comment: true
news: true
tags:
  - 技术杂谈
categories:
  - 技术杂谈
keywords: spring,事务,springboot
date: 2019-10-23 11:04:37
article_url: https://www.jianshu.com/p/f5fc14bde8a0
---
疑问，确实像往常一样在service上添加了注解 `@Transactional`，为什么查询数据库时还是发现有数据不一致的情况，想想肯定是事务没起作用，出现异常的时候数据没有回滚。于是就对相关代码进行了一番测试，结果发现一下踩进了两个坑，确实是事务未回滚导致的数据不一致。
<!--more-->
下面总结一下经验教训：

### Spring事务的管理操作方法
下面先总结一下Spring的事务管理方式，spring支持两种事务管理的操作方式，编程式的和声明式的（xml或者注解）。
- 编程式的事务管理
- 实际应用中很少使用
- 通过使用`TransactionTemplate`手动管理事务
- 声明式的事务管理
- 开发中推荐使用（代码侵入最少）
- Spring的声明式事务是通过AOP实现的

主要掌握声明式的事务管理。

#### spring事务不回滚的两个原因
总结一下导致事务不回滚的两个原因，一是Service类内部方法调用，二是try...catch异常。

#### 1. Service类内部方法调用
大概就是 Service 中有一个方法 A，会内部调用方法 B， 方法 A 没有事务管理，方法 B 采用了声明式事务，通过在方法上声明 Transactional 的注解来做事务管理。示例代码如下：
```java
@Service
public class RabbitServiceImpl implements RabbitService {

    @Autowired
    private RabbitDao rabbitDao;
    @Autowired
    private TortoiseDao tortoiseDao;
    
    @Override
    public Rabbit methodA(String name){
        return methodB(name);
    }
    
    @Transactional(propagation = Propagation.REQUIRED, isolation = Isolation.READ_COMMITTED)
    public boolean methodB(String name){
        rabbitDao.insertRabbit(name);
        tortoiseDao.insertTortoise(name);
        return true;
    }
    
}
```
单元测试代码如下：
```java
public class RabbitServiceImplTest {

    @Autowired
    private RabbitService rabbitService;
    
    // 事务未开启
    @Test
    public void testA(){
        rabbitService.methodA("rabbit");
    }
    
    // 事务开启
    @Test
    public void testB(){
        rabbitService.methodB("rabbit");
    }
}
```
从上一节中可以看到，声明式事务是通通过AOP动态代理实现的，这样会产生一个代理类来做事务管理，而目标类（service）本身是不能感知代理类的存在的。

对于加了@Transactional注解的方法来说，在调用代理类的方法时，会先通过拦截器TransactionInterceptor开启事务，然后在调用目标类的方法，最后在调用结束后，TransactionInterceptor 会提交或回滚事务，大致流程如下图：
![事务的调用原理](/images/post/why_doesnot_spring_declarative_transactions_roll_back-1.png)

总结，在方法 A 中调用方法 B，实际上是通过“this”的引用，也就是直接调用了目标类的方法，而非通过 Spring 上下文获得的代理类，所以事务是不会开启的。

#### 2. try...catch异常
在一段业务逻辑中对数据库异常进行了处理，使用了try...catch子句捕获异常并throw了一个自定义异常，这种情况导致了事务未回滚，示例代码如下：
```java
@Transactional(propagation = Propagation.REQUIRED, isolation = Isolation.READ_COMMITTED)
public boolean methodB(String name) throws BizException {
    try {
        rabbitDao.insertRabbit(name);
        tortoiseDao.insertTortoise(name);
    } catch (Exception e) {
        throw new BizException(ReturnCode.EXCEPTION.code, ReturnCode.EXCEPTION.msg);
    }
    return true;
}
```
BizException的定义如下：
```java
public class BizException extends Exception {
    // 自定义异常
}
```
上面代码中的声明式事务在出现异常的时候，事务是不会回滚的。在代码中我虽然捕获了异常，但是同时我也抛出了异常，为什么事务未回滚呢？猜测是异常类型不对，于是开始查询原因，翻看了[Spring的官方文档](https://docs.spring.io/spring/docs/current/spring-framework-reference/#transaction)，找到了答案。下面是翻译自Spring官网。

##### 17.5.3 声明式事务的回滚
上一节中介绍了如何设置开启Spring事务，一般在你的应用的Service层代码中设置，这一节将介绍在简单流行的声明式事务中如何控制事务回滚。

在Spring FrameWork 的事务框架中推荐的事务回滚方法是，在当前执行的事务上下文中抛出一个异常。如果异常未被处理，当抛出异常调用堆栈的时候，Spring FrameWork 的事务框架代码将捕获任何未处理的异常，然后并决定是否将此事务标记为回滚。
- 在默认配置中，Spring FrameWork 的事务框架代码只会将出现runtime, unchecked 异常的事务标记为回滚；也就是说事务中抛出的异常时RuntimeException或者是其子类，这样事务才会回滚（默认情况下Error也会导致事务回滚）。在默认配置的情况下，所有的 checked 异常都不会引起事务回滚。
> 注：Unchecked Exception包括Error与RuntimeException. RuntimeException的所有子类也都属于此类。另一类就是checked Exception。
- 你可以精确的配置异常类型，指定此异常类事务回滚，包括 checked 异常。下面的xml代码片段展示了如何配置checked异常引起事务回滚，应用自定义异常类型：
```xml
<tx:advice id="txAdvice" transaction-manager="txManager">
    <tx:attributes>
    <tx:method name="get*" read-only="true" rollback-for="NoProductInStockException"/>
    <tx:method name="*"/>
    </tx:attributes>
</tx:advice>
```
与其有同等作用的注解形式如下：
```java
@Transactional(rollbackForClassName={"NoProductInStockException"})
或者
@Transactional(rollbackFor={NoProductInStockException.class})
```
- 在你遇到异常不想回滚事务的时候，同样的你也可指定不回滚的规则，下面的一个例子告诉你，即使遇到未处理的 InstrumentNotFoundException 异常时，Spring FrameWork 的事务框架同样会提交事务，而不回滚。

```xml
<tx:advice id="txAdvice">
    <tx:attributes>
    <tx:method name="updateStock" no-rollback-for="InstrumentNotFoundException"/>
    <tx:method name="*"/>
    </tx:attributes>
</tx:advice>
```
与其有同样作用的注解形式如下：
```java
@Transactional(noRollbackForClassName={"InstrumentNotFoundException"})
或者
@Transactional(noRollbackFor={InstrumentNotFoundException.class})
```
- 还有更灵活的回滚规则配置方法，同时指定什么异常回滚，什么异常不回滚。当Spring FrameWork 的事务框架捕获到一个异常的时候，会去匹配配置的回滚规则来决定是否标记回滚事务，使用匹配度最强的规则结果。因此，下面的配置例子表达的意思是，除了异常 InstrumentNotFoundException 之外的任何异常都会导致事务回滚。
```xml
<tx:advice id="txAdvice">
    <tx:attributes>
    <tx:method name="*" rollback-for="Throwable" no-rollback-for="InstrumentNotFoundException"/>
    </tx:attributes>
</tx:advice>
```
- 你也可以通过编程式的方式回滚一个事务，尽管方法非常简单，但是也有非常强的代码侵入性，使你的业务代码和Spring FrameWork 的事务框架代码紧密的绑定在一起，示例代码如下：
```java
public void resolvePosition() {
    try {
        // some business logic...
    } catch (NoProductInStockException ex) {
        // trigger rollback programmatically
        TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
    }
}
```

如果可能的话，强烈推荐您使用声明式事务方式回滚事务，对于编程式事务，如果你强烈需要它，也是可以使用的，but its usage flies in the face of achieving a clean POJO-based architecture.(没懂...)

看完官方文档这节内容找到了问题的答案，原来是因为我们自定义的异常不是 RuntimeException。我的解决办法是，在注解@Transactional中添加 rollbackFor={BizException.class}。可能你会问我为什么不将自定义异常修改为继承RuntimeException，因为我需要BizException是一个checked 异常。

> 结束语：终于将spring事务中的异常回滚机制搞明白啦，欢迎读者在评论区添加其他导致spring事务不回滚的原因。
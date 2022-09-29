---
id: springboot-exception-handler-advice
title: 使用ControllerAdvice完成异常统一处理
article_type: 原创
article_author: 于起宇
enable_comment: true
news: true
tags:
  - Spring
  - ControllerAdvice
  - ExceptionHandler
  - SpringBoot
categories:
  - SpringBoot
date: 2019-09-29 17:15:22
keywords: advice,exception,springboot
description: '使用ControllerAdvice完成异常统一处理'
---
在我们平时的项目研发过程中，异常一般都是程序员最为头疼的问题，异常的抛出、捕获、处理等既涉及事务回滚，还会涉及返回前端消息提醒信息。那么我们怎么设计可以解决上面的两个的痛点呢？我们可不可以统一处理业务逻辑然后给出前端对应的异常提醒内容呢？
<!--more-->
# 本章目标
基于`SpringBoot`平台构建业务逻辑异常统一处理，异常消息内容格式化。

# 构建项目
我们将逻辑异常核心处理部分提取出来作为单独的`jar`供其他模块引用，创建项目在`parent`项目`pom.xml`添加公共使用的依赖，配置内容如下所示：
```xml
<dependencies>
  <!--Lombok-->
  <dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <optional>true</optional>
  </dependency>
  <!--测试模块依赖-->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
  </dependency>
  <!--web依赖-->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
  </dependency>
</dependencies>
```
项目创建完成后除了`.idea`、`iml`、`pom.xml`保留，其他的都删除。
### 异常处理核心子模块
我们创建一个名为`springboot-core-exception`的子模块，在该模块内自定义一个`LogicException`运行时异常类，继承`RuntimeException`并重写构造函数，代码如下所示：
```java
/**
 * 自定义业务逻辑异常类
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2018/1/7
 * Time：下午2:38
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 *
 * @author yuqiyu
 */
public class LogicException extends RuntimeException {

    /**
     * 日志对象
     */
    private Logger logger = LoggerFactory.getLogger(LogicException.class);

    /**
     * 错误消息内容
     */
    protected String errMsg;
    /**
     * 错误码
     */
    protected String errCode;
    /**
     * 格式化错误码时所需参数列表
     */
    protected String[] params;


    /**
     * 获取错误消息内容
     * 根据errCode从redis内获取未被格式化的错误消息内容
     * 并通过String.format()方法格式化错误消息以及参数
     *
     * @return
     */
    public String getErrMsg() {
        return errMsg;
    }

    /**
     * 获取错误码
     *
     * @return
     */
    public String getErrCode() {
        return errCode;
    }

    /**
     * 获取异常参数列表
     *
     * @return
     */
    public String[] getParams() {
        return params;
    }

    /**
     * 构造函数设置错误码以及错误参数列表
     *
     * @param errCode 错误码
     * @param params  错误参数列表
     */
    public LogicException(String errCode, String... params) {
        this.errCode = errCode;
        this.params = params;
        //获取格式化后的异常消息内容
        this.errMsg = ErrorMessageTools.getErrorMessage(errCode, params);
        //错误信息
        logger.error("系统遇到如下异常，异常码：{}>>>异常信息：{}", errCode, errMsg);
    }
}
```
在重写的构造函数内需要传递两个参数`errCode`、`params`，其目的是为了初始化类内的全局变量。
* `errCode`：该字段是对应的异常码，我们在后续文章内容中创建一个存放异常错误码的枚举，而`errCode`就是枚举对应的字符串的值。
* `params`：这里是对应`errCode`字符串含义描述时所需要的参数列表。
* `errMsg`：格式化后的业务逻辑异常消息描述，我们在构造函数内可以看到调用了`ErrorMessageTools.getErrorMessage(errCode,params);`，这个方法作用是通过异常码在数据库内获取未格式化的异常描述，通过传递的参数进行格式化异常消息描述。

> 创建异常核心包的目的就是让其他模块直接添加依赖，那异常描述内容该怎么获取呢？

#### 定义异常消息获取接口

我们在`springboot-exception-core`模块内添加一个接口`LogicExceptionMessage`，该接口提供通过异常码获取未格式化的异常消息描述内容方法，接口定义如下所示：
```java
/**
 * 逻辑异常接口定义
 * 使用项目需要实现该接口方法并提供方法实现
 * errCode对应逻辑异常码
 * getMessage返回字符串为逻辑异常消息内容
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2018/1/7
 * Time：下午2:41
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 * @author yuqiyu
 */
public interface LogicExceptionMessage {

    /**
     * 获取异常消息内容
     * @param errCode 错误码
     * @return
     */
    public String getMessage(String errCode);
}
```
在需要加载`springboot-exception-core`依赖的项目中，创建实体类实现`LogicExceptionMessage`接口并重写`getMessage(String errCode)`方法我们就可以通过`spring IOC`获取实现类实例进行操作获取数据，下面我们在编写使用异常模块时会涉及到。

#### 格式化异常消息工具类
下面我们再回头看看构造函数格式化异常消息工具类`ErrorMessageTools`，该工具类内提供`getErrorMessage`方法用于获取格式化后的异常消息描述，代码实现如下所示：
```java
/**
 * 异常消息描述格式化工具类
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2018/1/7
 * Time：下午2:40
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 *
 * @author yuqiyu
 */
public class ErrorMessageTools {
    /**
     * 异常消息获取
     *
     * @param errCode 异常消息码
     * @param params  格式化异常参数所需参数列表
     * @return
     */
    public static String getErrorMessage(String errCode, Object... params) {
        //获取业务逻辑消息实现
        LogicExceptionMessage logicExceptionMessage = SpringBeanTools.getBean(LogicExceptionMessage.class);
        if (ObjectUtils.isEmpty(logicExceptionMessage)) {
            try {
                throw new Exception("请配置实现LogicExceptionMessage接口并设置实现类被SpringIoc所管理。");
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        //获取错误消息内容
        String errMsg = logicExceptionMessage.getMessage(errCode);
        //格式化错误消息内容
        return ObjectUtils.isEmpty(params) ? errMsg : String.format(errMsg, params);
    }
}
```
> 注意：由于我们的工具类都是静态方法调用方式，所以无法直接使用`Spring IOC`注解注入的方式获取`LogicExceptionMessage`实例。

由于无法注入实例，在`getErrorMessage`方法内，我们通过工具类`SpringBeanTools`来获取`ApplicationContext`上下文实例，再通过上下文来获取指定类型的`Bean`；获取到`LogicExceptionMessage`实例后调用`getMessage`方法，根据传入的`errCode`就可以直接从接口实现类实例中获取到未格式化的异常描述！
> 当然实现类可以是以`Redis`、`Map集合`、`数据库`、`文本`作为数据来源。

获取到未格式化的异常描述后通过`String.format`方法以及传递的参数直接就可以获取格式化后的字符串，如：
```
未格式化异常消息 => 用户：%s已被冻结，无法操作.
格式化代码 => String.format("%s已被冻结，无法操作.","恒宇少年");
格式化后效果 => 用户：恒宇少年已被冻结，无法操作.
```
具体的格式化特殊字符含义可以去查看`String.format`文档，如何获取`ApplicationContext`上下文对象，请访问[第三十二章：如何获取SpringBoot项目的applicationContext对象](https://www.jianshu.com/p/3cd2d4e73eb7)查看。

我们再回到`LogicException`构造函数内，这时`errMsg`字段对应的值就会是格式化后的异常消息描述，在外部我们调用`getErrMsg`方法就可以直接得到异常描述。

到目前为止，我们已经将`springboot-exception-core`模块代码编码完成，下面我们来看下怎么来使用我们自定义的业务逻辑异常并且获取格式化后的异常消息描述。

### 异常示例模块

基于`parent`我们来创建一个名为`springboot-exception-example`的子模块项目，项目内需要添加一些额外的配置依赖，当然也需要将我们的`springboot-exception-core`依赖添加进入，`pom.xml`配置文件内容如下所示：
```xml
<dependencies>
      <!--异常核心依赖-->
      <dependency>
          <groupId>com.hengyu</groupId>
          <artifactId>springboot-exception-core</artifactId>
          <version>0.0.1-SNAPSHOT</version>
      </dependency>
      <!--spring data jpa依赖-->
      <dependency>
          <groupId>org.springframework.boot</groupId>
          <artifactId>spring-boot-starter-data-jpa</artifactId>
      </dependency>
      <!--数据库驱动-->
      <dependency>
          <groupId>mysql</groupId>
          <artifactId>mysql-connector-java</artifactId>
          <scope>runtime</scope>
      </dependency>
      <!--druid依赖-->
      <dependency>
          <groupId>com.alibaba</groupId>
          <artifactId>druid-spring-boot-starter</artifactId>
          <version>1.1.6</version>
      </dependency>
</dependencies>
```
下面我们来配置下我们示例项目`application.yml`文件需要的配置，如下所示：
```yaml
spring:
  application:
    name: springboot-exception-core
    #数据源配置
  datasource:
    druid:
      url: jdbc:mysql://localhost:3306/test?useUnicode=true&characterEncoding=UTF-8&autoReconnect=true
      username: root
      password: 123456
      driver-class-name: com.mysql.jdbc.Driver
  jpa:
    properties:
      hibernate:
        #配置显示sql
        show_sql: true
        #配置格式化sql
        format_sql: true
```
在上面我们有讲到`LogicExceptionMessage`获取的内容可以从很多种数据源中读取，我们还是采用数据库来进行读取，建议正式环境放到`redis`缓存内！！！

#### 异常信息表
接下来在数据库内创建异常信息表`sys_exception_info`，语句如下：
```sql
DROP TABLE IF EXISTS `sys_exception_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sys_exception_info` (
  `EI_ID` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键自增',
  `EI_CODE` varchar(30) DEFAULT NULL COMMENT '异常码',
  `EI_MESSAGE` varchar(50) DEFAULT NULL COMMENT '异常消息内容',
  PRIMARY KEY (`EI_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8 COMMENT='系统异常基本信息';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sys_exception_info`
--

LOCK TABLES `sys_exception_info` WRITE;
/*!40000 ALTER TABLE `sys_exception_info` DISABLE KEYS */;
INSERT INTO `sys_exception_info` VALUES (1,'USER_NOT_FOUND','用户不存在.'),(2,'USER_STATUS_FAILD','用户状态异常.');
/*!40000 ALTER TABLE `sys_exception_info` ENABLE KEYS */;
UNLOCK TABLES;
```
我们通过`spring-data-jpa`来实现数据读取，下面对应数据表创建对应的`Entity`。
#### 异常信息实体
```java
/**
 * 系统异常基本信息实体
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2018/1/7
 * Time：下午3:35
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 * @author yuqiyu
 */
@Data
@Entity
@Table(name = "sys_exception_info")
public class ExceptionInfoEntity implements Serializable{
    /**
     * 异常消息编号
     */
    @Id
    @GeneratedValue
    @Column(name = "EI_ID")
    private Integer id;
    /**
     * 异常消息错误码
     */
    @Column(name = "EI_CODE")
    private String code;
    /**
     * 异常消息内容
     */
    @Column(name = "EI_MESSAGE")
    private String message;
}
```
#### 异常信息数据接口
```java
/**
 * 异常数据接口定义
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2018/1/7
 * Time：下午3:34
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 * @author yuqiyu
 */
public interface ExceptionRepository
    extends JpaRepository<ExceptionInfoEntity,Integer>
{
    /**
     * 根据异常码获取异常配置信息
     * @param code 异常码
     * @return
     */
    ExceptionInfoEntity findTopByCode(String code);
}
```
在数据接口内通过`spring-data-jpa`方法查询方式，通过`errCode`读取异常信息实体内容。

在开发过程中异常跑出时所用到的`errCode`一般存放在枚举类型或者常量接口内，在这里我们选择可扩展相对来说比较强的`枚举类型`，代码如下：
```java
/**
 * 错误码枚举类型
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2018/1/7
 * Time：下午3:25
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 * @author yuqiyu
 */
public enum ErrorCodeEnum {
    /**
     * 用户不存在.
     */
    USER_NOT_FOUND,
    /**
     * 用户状态异常.
     */
    USER_STATUS_FAILD,
    //...添加其他错误码
}
```
异常码枚举内容项是需要根据数据库异常信息表对应变动的，能够保证我们在抛出异常时，在数据库内有对应的信息。  

#### LogicExceptionMessage实现类定义
我们在`springboot-exception-core`核心模块内添加了`LogicExceptionMessage`接口定义，需要我们实现该接口的`getMessage`方法核心模块，这样才可以获取数据库内对应的异常信息，实现类如下所示：
```java
/**
 * 业务逻辑异常消息获取实现类
 * - 消息可以从数据库内获取
 * - 消息可从Redis内获取
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2018/1/7
 * Time：下午3:16
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 * @author yuqiyu
 */
@Component
public class LogicExceptionMessageSupport implements LogicExceptionMessage {

    /**
     * 异常数据接口
     */
    @Autowired
    private ExceptionRepository exceptionRepository;

    /**
     * 根据错误码获取错误信息
     * @param errCode 错误码
     * @return
     */
    @Override
    public String getMessage(String errCode) {
        ExceptionInfoEntity exceptionInfoEntity = exceptionRepository.findTopByCode(errCode);
        if(!ObjectUtils.isEmpty(exceptionInfoEntity)) {
            return exceptionInfoEntity.getMessage();
        }
        return "系统异常";
    }
}
```
在`getMessage`方法内通过`ExceptionRepository`数据接口定义的`findTopByCode`方法获取指定异常吗的异常信息，当存在异常信息时返回未格式化的异常描述。

#### 统一返回实体定义

对于接口项目（包括前后分离项目）在处理返回统一格式时，我们通常会采用固定实体的方式，这样对于前端调用接口的开发者来说解析内容是比较方便的，同样在开发过程中会约定遇到系统异常、业务逻辑异常时返回的格式内容，当然这跟请求接口正确返回的格式是一样的，只不过字段内容有差异。
统一返回实体`ApiResponseEntity<T extends Object>`如下：
```java
/**
 * 接口响应实体
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2018/1/9
 * Time：下午3:04
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 * @author yuqiyu
 */
@Data
@Builder
public class ApiResponseEntity<T extends Object> {
    /**
     * 错误消息
     */
    private String errorMsg;
    /**
     * 数据内容
     */
    private T data;
}
```
在`ApiResponseEntity`实体内，采用了`Lombok`的构造者设计模式`@Builder`注解，配置该注解的实体会自动在`.class`文件内添加内部类实现设计模式，部分自动生成代码如下：
```java
// ...
public static class ApiResponseEntityBuilder<T> {
        private String errorMsg;
        private T data;

        ApiResponseEntityBuilder() {
        }

        public ApiResponseEntity.ApiResponseEntityBuilder<T> errorMsg(String errorMsg) {
            this.errorMsg = errorMsg;
            return this;
        }

        public ApiResponseEntity.ApiResponseEntityBuilder<T> data(T data) {
            this.data = data;
            return this;
        }

        public ApiResponseEntity<T> build() {
            return new ApiResponseEntity(this.errorMsg, this.data);
        }

        public String toString() {
            return "ApiResponseEntity.ApiResponseEntityBuilder(errorMsg=" + this.errorMsg + ", data=" + this.data + ")";
        }
    }
// ...
```  
到目前为止，我们并未添加全局异常相关的配置，而全局异常配置这块，我们采用之前章节讲到的`@ControllerAdvice`来实现，`@ControllerAdvice`相关的内容请访问[第二十一章：SpringBoot项目中的全局异常处理](https://www.jianshu.com/p/1c6207d8ee9d)。

#### 全局异常通知定义
我们本章节仅仅添加业务逻辑异常的处理，具体编码如下所示：
```java
/**
 * 控制器异常通知类
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2018/1/7
 * Time：下午5:30
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 *
 * @author yuqiyu
 */
@ControllerAdvice(annotations = RestController.class)
@ResponseBody
public class ExceptionAdvice {

    /**
     * logback new instance
     */
    Logger logger = LoggerFactory.getLogger(this.getClass());

    /**
     * 处理业务逻辑异常
     *
     * @param e 业务逻辑异常对象实例
     * @return 逻辑异常消息内容
     */
    @ExceptionHandler(LogicException.class)
    @ResponseStatus(code = HttpStatus.OK)
    public ApiResponseEntity<String> logicException(LogicException e) {
        logger.error("遇到业务逻辑异常：【{}】", e.getErrCode());
        // 返回响应实体内容
        return ApiResponseEntity.<String>builder().errorMsg(e.getErrMsg()).build();
    }
}
```
> 最近技术群内有同学问我，既然我们用的是`@RestController`为什么这里还需要配置`@ResponseBody`？这里给大家一个解释，我们控制器通知确实是监听的`@RestController`，而`@RestController`注解的控制器统一都是返回`JSON`格式的数据。那么我们在遇到异常后，请求已经不再控制器内了，已经交付给控制器通知类，那么我们通知类如果同样想返回`JSON`数据，这里就需要配置`@ResponseBody`注解来实现。

我们来看上面`logicException()`方法，该方法返回值是我们定义的统一返回实体，目的是为了遇到业务逻辑异常时同样返回与正确请求一样的格式。
- `@ ExceptionHandler `配置了将要处理`LogicException`类型的异常，也就是只要系统遇到`LogicException`异常并且抛给了控制器，就会调用该方法。
- `@ResponseStatus`配置了返回的状态值，因为我们遇到业务逻辑异常前端肯定需要的不是500错误，而是一个200状态的`JSON`业务异常描述。

在方法返回时使用`构造者设计模式`并将异常消息传递给`errorMsg()`方法，这样就实现了字段`errorMsg`的赋值。

# 测试
异常相关的编码完成，下面我们来创建一个测试的控制器模拟业务逻辑发生时，系统是怎么做出的返回？
测试控制内容如下所示：
```java
/**
 * 测试控制器
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2018/1/7
 * Time：下午3:12
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 *
 * @author yuqiyu
 */
@RestController
public class IndexController {
    /**
     * 首页方法
     *
     * @return
     */
    @RequestMapping(value = "/index")
    public ApiResponseEntity<String> index() throws LogicException {
        /**
         * 模拟用户不存在
         * 抛出业务逻辑异常
         */
        if (true) {
            throw new LogicException(ErrorCodeEnum.USER_STATUS_FAILD.toString());
        }
        return ApiResponseEntity.<String>builder().data("this is index mapping").build();
    }
}
```
根据上面代码含义，当我们在访问`/index`时就会发生`USER_STATUS_FAILD`业务逻辑异常，按照我们之前的全局异常配置以及统一返回实体实例化，访问后会出现`ApiResponseEntity`格式`JSON`数据，下面我们运行项目访问查看效果。
界面输出内容如下所示：
```json
{
    "errorMsg": "用户状态异常.",
    "data": null
}
```
而在控制台由于我们编写了日志信息，也同样有对应的输出，如下所示：
```sql
Hibernate: 
    select
        exceptioni0_.ei_id as ei_id1_0_,
        exceptioni0_.ei_code as ei_code2_0_,
        exceptioni0_.ei_message as ei_messa3_0_ 
    from
        sys_exception_info exceptioni0_ 
    where
        exceptioni0_.ei_code=? limit ?
2018-01-09 18:54:00.647 ERROR 2024 --- [nio-8080-exec-1] c.h.s.exception.core.LogicException      : 系统遇到如下异常，异常码：USER_STATUS_FAILD>>>异常信息：用户状态异常.
2018-01-09 18:54:00.649 ERROR 2024 --- [nio-8080-exec-1] c.h.s.e.c.advice.ExceptionAdvice         : 遇到业务逻辑异常：【USER_STATUS_FAILD】
```
> 如果业务逻辑异常在`Service`层时，我们根本不需要去操心事务回滚的问题，因为`LogicException`本身就是运行时异常，而项目中抛出运行时异常时事务就会自动回滚。

我们把业务逻辑异常屏蔽掉，把`true`改成`false`查看正确时返回的格式，如下所示：
```json
{
    "errorMsg": null,
    "data": "this is index mapping"
}
```
如果想把对应的`null`改成空字符串，请访问查看[第五章：配置使用FastJson返回Json视图](https://www.jianshu.com/p/14df78573cb2)。

# 总结
本章将之前章节的部分内容进行了整合，主要是全局异常、统一格式返回等；这种方式是目前我们公司产品中正在使用的方式，已经可以满足平时的业务逻辑异常定义以及返回，将异常消息存放到`数据库`中我们可以随时更新提示内容，这一点还是比较易用的。
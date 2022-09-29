---
id: aop-resource-load
title: 资源与业务分离Aop的实现方式
article_type: 原创
article_author: 于起宇
enable_comment: true
news: true
tags:
  - SpringBoot
categories:
  - SpringBoot
date: 2019-09-29 17:07:09
keywords: aop,spring
description: 'SpringBoot项目中资源与业务分离Aop的实现方式'
---
本章内容比较偏向系统设计方面，简单的封装就可以应用到系统中使用，从而提高我们的编码效率以及代码的可读性。统一资源在系统内是不可避免的模块，资源分类也有很多种，比较常见如：图片资源、文本资源、视频资源等，那么资源统一处理的好处是什么呢？大家有可能会有疑问，我把资源存放到业务表内岂不更好吗？这样查询起来也方便，并不需要关联资源信息表！当然设计不分好坏，只有更适合、更简单！接下来带着疑问进入本章的内容。
<!--more-->
# 本章目标
基于``SpringBoot``平台结合``AOP``完成统一资源的自动查询映射。
# 构建项目
本章使用到的依赖相对来说比较多，大致：``Web``、``MapStruct``、``SpringDataJpa``、``LomBok``等，数据库方面采用``MySQL``来作为数据支持。

### 数据初始化
本章用到的数据表结构以及初始化的数据之前都是放在项目的``resources``目录下，为了大家使用方面我在这里直接贴出来，如下所示：
```sql
--
-- Table structure for table `hy_common_resource`
--

DROP TABLE IF EXISTS `hy_common_resource`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `hy_common_resource` (
  `CR_ID` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键自增',
  `CR_TARGET_ID` varchar(36) DEFAULT 'NULL' COMMENT '所属目标编号，关联其他信息表主键，如：用户头像关联用户编号',
  `CR_TYPE_ID` varchar(36) DEFAULT NULL COMMENT '资源类型编号',
  `CR_URL` varchar(200) DEFAULT 'NULL' COMMENT '资源路径，如：图片地址',
  `CR_CREATE_TIME` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '资源添加时间',
  `CR_ORDER` int(11) DEFAULT 0 COMMENT '排序字段',
  PRIMARY KEY (`CR_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8 COMMENT='系统资源信息表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hy_common_resource`
--

LOCK TABLES `hy_common_resource` WRITE;
/*!40000 ALTER TABLE `hy_common_resource` DISABLE KEYS */;
INSERT INTO `hy_common_resource` VALUES (1,'bc4c8e38-edd6-11e7-969c-3c15c2e4a8a6','ce66916c-edd7-11e7-969c-3c15c2e4a8a6','https://upload.jianshu.io/users/upload_avatars/4461954/f09ba256-f6db-41ed-a4ac-b2d23737f0ac.jpg?imageMogr2/auto-orient/strip|imageView2/1/w/96/h/96','2017-12-31 03:08:46',0),(2,'bc4c8e38-edd6-11e7-969c-3c15c2e4a8a6','f84f12c4-edd7-11e7-969c-3c15c2e4a8a6','https://upload.jianshu.io/collections/images/358868/android.graphics.Bitmap_d88b4de.jpeg?imageMogr2/auto-orient/strip|imageView2/1/w/240/h/240','2017-12-31 03:12:38',0),(3,'bc4c8e38-edd6-11e7-969c-3c15c2e4a8a6','f84f12c4-edd7-11e7-969c-3c15c2e4a8a6','https://upload.jianshu.io/collections/images/522928/kafka_diagram.png?imageMogr2/auto-orient/strip|imageView2/1/w/240/h/240','2017-12-31 09:13:32',0);
/*!40000 ALTER TABLE `hy_common_resource` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hy_common_resource_type`
--

DROP TABLE IF EXISTS `hy_common_resource_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `hy_common_resource_type` (
  `CRT_ID` varchar(36) NOT NULL COMMENT '类型编号',
  `CRT_NAME` varchar(20) DEFAULT NULL COMMENT '类型名称',
  `CRT_FLAG` varchar(30) DEFAULT NULL COMMENT '资源标识',
  `CRT_CREATE_TIME` timestamp NOT NULL DEFAULT current_timestamp() COMMENT '创建时间',
  PRIMARY KEY (`CRT_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='资源类型信息表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hy_common_resource_type`
--

LOCK TABLES `hy_common_resource_type` WRITE;
/*!40000 ALTER TABLE `hy_common_resource_type` DISABLE KEYS */;
INSERT INTO `hy_common_resource_type` VALUES ('ce66916c-edd7-11e7-969c-3c15c2e4a8a6','用户头像','USER_HEAD_IMAGE','2017-12-31 03:07:59'),('f84f12c4-edd7-11e7-969c-3c15c2e4a8a6','用户背景图片','USER_BACK_IMAGE','2017-12-31 03:09:09');
/*!40000 ALTER TABLE `hy_common_resource_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hy_user_info`
--

DROP TABLE IF EXISTS `hy_user_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `hy_user_info` (
  `UI_ID` varchar(36) NOT NULL COMMENT '主键',
  `UI_NAME` varchar(10) DEFAULT NULL COMMENT '名称',
  `UI_NICK_NAME` varchar(20) DEFAULT NULL COMMENT '昵称',
  `UI_AGE` int(11) DEFAULT NULL COMMENT '年龄',
  `UI_ADDRESS` varchar(50) DEFAULT NULL COMMENT '所居地',
  PRIMARY KEY (`UI_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='用户基本信息表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hy_user_info`
--

LOCK TABLES `hy_user_info` WRITE;
/*!40000 ALTER TABLE `hy_user_info` DISABLE KEYS */;
INSERT INTO `hy_user_info` VALUES ('bc4c8e38-edd6-11e7-969c-3c15c2e4a8a6','hengboy','恒宇少年',23,'山东省济南市');
/*!40000 ALTER TABLE `hy_user_info` ENABLE KEYS */;
UNLOCK TABLES;
```
> 用到的数据库为``resources``，可以自行创建或者更换其他数据库使用。
### 搭建项目
本章我们把统一资源单独拿出来作为一个项目子模块来构建，而用户服务作为另外一个单独模块构建，下面先来贴出父项目的``pom.xml``配置文件内容，如下所示：
```xml
....//
<parent>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-parent</artifactId>
  <version>1.5.9.RELEASE</version>
  <relativePath/> <!-- lookup parent from repository -->
</parent>

<properties>
  <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
  <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
  <java.version>1.8</java.version>
  <org.mapstruct.version>1.2.0.Final</org.mapstruct.version>
</properties>

<dependencies>
  <!--mapStruct-->
  <dependency>
    <groupId>org.mapstruct</groupId>
    <artifactId>mapstruct-jdk8</artifactId>
    <version>${org.mapstruct.version}</version>
  </dependency>
  <dependency>
    <groupId>org.mapstruct</groupId>
    <artifactId>mapstruct-processor</artifactId>
    <version>${org.mapstruct.version}</version>
    <scope>provided</scope>
  </dependency>
  <dependency>
    <groupId>javax.inject</groupId>
    <artifactId>javax.inject</artifactId>
    <version>1</version>
  </dependency>
  <!--Spring data jpa-->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
  </dependency>
  <!--web-->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
  </dependency>
  <!--MySQL-->
  <dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
    <scope>runtime</scope>
  </dependency>
  <!--Lombok-->
  <dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <optional>true</optional>
  </dependency>
  <!--druid-->
  <dependency>
    <groupId>com.alibaba</groupId>
    <artifactId>druid-spring-boot-starter</artifactId>
    <version>1.1.6</version>
  </dependency>
</dependencies>
....//
```
接下来我们开始创建``common-resource``子模块，将资源处理完全独立出来，在创建子模块时要注意``package``命名要保证可以被``SpringBoot``运行时扫描到！！！
#### common-resource
我们需要先创建一个``BaseEntity``作为所有实体的父类存在，如下所示：
```java
/**
 * 所有实体的父类
 * 作为类型标识存在
 * @author yuqiyu
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2017/12/31
 * Time：下午3:35
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
public class BaseEntity
    implements Serializable{}
```
该类仅仅实现了``Serializable ``接口，在创建业务实体时需要继承该类，这也是基本的设计规则，方便后期添加全局统一的字段或者配置。

- 资源实体
```java
/**
 * 资源实体
 * @author yuqiyu
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2017/12/31
 * Time：上午11:21
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
@Data
@Entity
@Table(name = "hy_common_resource")
public class CommonResourceEntity
    extends BaseEntity
{
    /**
     * 资源编号
     */
    @Column(name = "CR_ID")
    @Id
    @GeneratedValue
    private Integer resourceId;
    /**
     * 资源所属目标编号
     */
    @Column(name = "CR_TARGET_ID")
    private String targetId;
    /**
     * 类型编号
     */
    @Column(name = "CR_TYPE_ID")
    private String typeId;
    /**
     * 资源路径
     */
    @Column(name = "CR_URL")
    private String resourceUrl;
    /**
     * 创建时间
     */
    @Column(name = "CR_CREATE_TIME")
    private Timestamp createTime;
    /**
     * 排序
     */
    @Column(name = "CR_ORDER")
    private int order;
}
```
- 资源类型实体
```java
/**
 * 资源类型实体
 * @author yuqiyu
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2017/12/31
 * Time：上午11:22
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
@Data
@Entity
@Table(name = "hy_common_resource_type")
public class CommonResourceTypeEntity
    extends BaseEntity
{
    /**
     * 类型编号
     */
    @Id
    @Column(name = "CRT_ID")
    @GeneratedValue(generator = "system-uuid")
    @GenericGenerator(name = "system-uuid", strategy = "uuid")
    private String id;
    /**
     * 类型名称
     */
    @Column(name = "CRT_NAME")
    private String name;
    /**
     * 类型标识
     */
    @Column(name = "CRT_FLAG")
    private String flag;
    /**
     * 类型添加时间
     */
    @Column(name = "CRT_CREATE_TIME")
    private Timestamp createTime;
}
```
下面我们来创建对应实体的数据接口，我们采用``SpringDataJPA``的方法名查询规则来查询对应的数据。

- 资源数据接口
```java
/**
 * 资源数据接口
 * @author yuqiyu
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2017/12/31
 * Time：上午11:31
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
public interface CommonResourceRepository
    extends JpaRepository<CommonResourceEntity,Integer>
{
    /**
     * 根据类型编号 & 目标编号查询出资源实体
     * @param typeId 类型编号
     * @param targetId 目标编号
     * @return
     */
    List<CommonResourceEntity> findByTypeIdAndTargetId(String typeId, String targetId);
}
```
- 资源类型数据接口
```java
/**
 * 资源类型数据接口
 * @author yuqiyu
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2017/12/31
 * Time：上午11:32
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
public interface CommonResourceTypeRepository
    extends JpaRepository<CommonResourceTypeEntity,String>
{
    /**
     * 根据类别标识查询
     * @param flag 资源类型标识
     * @return
     */
    CommonResourceTypeEntity findTopByFlag(String flag);
}
```
接下来我们开始编写根据资源类型获取指定目标编号的资源列表业务逻辑方法，创建名为``CommonResourceService``统一资源业务逻辑实现类，如下所示：
```java
/**
 * 公共资源业务逻辑实现类
 * @author yuqiyu
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2017/12/31
 * Time：下午4:18
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
@Service
@Transactional(rollbackFor = Exception.class)
public class CommonResourceService {
    /**
     * 资源类型数据接口
     */
    @Autowired
    private CommonResourceTypeRepository resourceTypeRepository;
    /**
     * 资源数据接口
     */
    @Autowired
    private CommonResourceRepository resourceRepository;

    /**
     * 根据资源标识 & 所属目标编号查询资源路径路边
     *
     * @param resourceFlag 资源标识
     * @param targetId     目标编号
     * @return
     */
    public List<String> selectUrlsByFlag(CommonResourceFlag resourceFlag, String targetId) throws Exception {
        /**
         * 获取资源类型
         */
        CommonResourceTypeEntity resourceType = selectResourceTypeByFlag(resourceFlag);
        /**
         * 查询该目标编号 & 类型的资源列表
         */
        List<CommonResourceEntity> resources = resourceRepository.findByTypeIdAndTargetId(resourceType.getId(), targetId);

        return convertUrl(resources);
    }

    /**
     * 转换路径
     * 通过实体集合转换成路径集合
     *
     * @param resources 资源实体列表
     * @return
     */
    List<String> convertUrl(List<CommonResourceEntity> resources) {
        List<String> urls = null;
        if (!ObjectUtils.isEmpty(resources)) {
            urls = new ArrayList();
            for (CommonResourceEntity resource : resources) {
                urls.add(resource.getResourceUrl());
            }
        }

        return urls;
    }

    /**
     * 根据资源类型标识查询资源类型基本信息
     *
     * @param resourceFlag 资源类型标识
     * @return
     * @throws Exception
     */
    CommonResourceTypeEntity selectResourceTypeByFlag(CommonResourceFlag resourceFlag) throws Exception {
        /**
         * 查询资源类型
         */
        CommonResourceTypeEntity resourceType = resourceTypeRepository.findTopByFlag(resourceFlag.getName());
        if (ObjectUtils.isEmpty(resourceFlag)) {
            throw new Exception("未查询到资源");
        }
        return resourceType;
    }

}
```
在``CommonResourceService``提供了对外的方法``selectUrlsByFlag``可以查询指定目标编号 & 指定类型的多个资源地址。
#### 统一资源映射
在``common-resource``子模块项目内添加统一资源的相关映射内容，我们预计的目标效果是根据我们自定义的注解结合``AOP``来实现指定方法的结果处理映射，我们需要创建两个自定义的注解来完成我们的预想效果，注解分别为：``ResourceField``、``ResourceMethod``，下面我们来看看``ResourceField``注解的属性定义，如下所示：
```java

/**
 * 配置统一资源字段
 * 该注解配置在普通字段上，根据配置信息自动查询对应的资源地址
 * Demo：
 *
 * @ResourceField(flag=CommonResourceFlagEnum.SHOP_COVER_IMG)
 * private String shopCoverImage;
 *
 * 其中multiple不需要配置，因为封面只有一张，使用默认值即可
 * flag设置为对应的资源标识，资源类型不存在时不执行查询
 * @ResourceTargetId 如果注解不存在或目标编号不存在或者为null、""时不执行查询资源
 *
 * @author：于起宇 <br/>
 * ===============================
 * Created with Eclipse.
 * Date：2017/12/31
 * Time：13:11
 * 简书：http://www.jianshu.com/u/092df3f77bca
 * ================================
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
@Documented
public @interface ResourceField {

    /**
     * 读取资源是单条或者多条
     * true：读取多条资源地址，对应设置到List<String>集合内
     * false：读取单条资源地址，对应设置配置ResourceField注解的字段value
     * @return
     */
    boolean multiple() default false;

    /**
     * 配置读取统一资源的标识类型
     * @return
     */
    CommonResourceFlag flag();

    /**
     * 如果配置该字段则不会去找@Id配置的字段
     * 该字段默认为空，则默认使用@Id标注的字段的值作为查询统一资源的target_id
     * @return
     */
    String targetIdField() default "";
}
```
``ResourceField``注解用于配置在查询结果的字段上，如：我们查询用户头像时定义的字段为``userHeadImage``，我们这时仅仅需要在``userHeadImage``字段上添加``ResourceField ``即可。
另外一个注解``ResourceMethod``的作用仅仅是为了``AOP``根据该注解切面方法，也是只有被该注解切面的方法才会去执行``AOP``切面方法的返回值进行处理，代码如下所示：
```java
/**
 * 配置指定方法将会被AOP切面类ResourceAspect所拦截
 * 拦截后会根据自定义注解进行查询资源 & 设置资源等逻辑
 * @author：于起宇 <br/>
 * ===============================
 * Created with Eclipse.
 * Date：2017/12/15
 * Time：14:04
 * 简书：http://www.jianshu.com/u/092df3f77bca
 * ================================
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@Documented
public @interface ResourceMethod { }
```
我们的自定义注解已经编写完成，转过头来我们先看看``@Around``切面方法所需要的逻辑实现方法，创建``ResourcePushService``接口添加如下两个方法：
```java

/**
 * 统一资源设置业务逻辑定义接口
 * @author：于起宇 <br/>
 * ===============================
 * Created with Eclipse.
 * Date：2017/12/15
 * Time：14:58
 * 简书：http://www.jianshu.com/u/092df3f77bca
 * ================================
 */
public interface ResourcePushService
{
    /**
     * 设置单个实例的资源信息
     * @param object 需要设置资源的实例
     */
    void push(Object object) throws Exception;

    /**
     * 设置多个实例的资源信息
     * @param objectList 需要设置资源的实例列表
     */
    void push(List<Object> objectList) throws Exception;
}
```
分别提供了设置单个、多个资源的方法，由于实现类内容比较多这里就不贴出具体的实现代码了，详细请下载源码进行查看，源码地址：[spring-boot-chapter](https://gitee.com/hengboy/spring-boot-chapter)内的``Chapter44``项目。

##### 资源切面类

我们一直都在说资源统一切面映射，那么我们的资源的切面该如何去配置切面切入点呢？在之前我们创建了``ResourceMethod``注解，我们就用它作为方法切入点完成切面的``环绕``实现，  ``ResourceAspect``代码如下所示：
```java
/**
 * 统一资源Aop切面定义
 * 根据自定义注解配置自动设置配置的资源类型到指定的字段
 * @author：于起宇 <br/>
 * ===============================
 * Created with Eclipse.
 * Date：2017/12/15
 * Time：14:05
 * 简书：http://www.jianshu.com/u/092df3f77bca
 * ================================
 */
@Component
@Aspect
public class ResourceAspect
{
    /**
     * logback
     */
    Logger logger = LoggerFactory.getLogger(ResourceAspect.class);

    /**
     * 资源处理业务逻辑
     */
    @Autowired
    @Qualifier("ResourcePushSupport")
    ResourcePushService resourcePushService;

    /**
     * 资源设置切面方法
     * 拦截配置了@ResourceMethod注解的class method，cglib仅支持class 方法切面，接口切面不支持
     * @param proceedingJoinPoint 切面方法实例
     * @param resourceMethod 方法注解实例
     * @return
     * @throws Throwable
     */
    @Around(value = "@annotation(resourceMethod)")
    public Object resourcePutAround(ProceedingJoinPoint proceedingJoinPoint, ResourceMethod resourceMethod)
        throws Throwable
    {
        logger.info("开始处理资源自动设置Aop切面逻辑");
        /**
         * 执行方法，获取返回值
         */
        Object result = proceedingJoinPoint.proceed();
        if(StringUtils.isEmpty(result)) {return result;}
        /**
         * 返回值为List集合时
         */
        if(result instanceof List) {
            List<Object> list = (List<Object>) result;
            resourcePushService.push(list);
        }
        /**
         * 返回值为单值时，返回的实例类型必须继承BaseEntity
         */
        else if(result instanceof BaseEntity) {
            resourcePushService.push(result);
        }
        logger.info("资源自动设置Aop切面逻辑处理完成.");
        return result;
    }
}
```
切面环绕方法``resourcePutAround ``大致流程为：
1. 执行需要切面的方法，获取方法结果
2. 根据方法返回的结果判断是单个、多个对象进行调用不同的方法
3. 统一资源方法自动根据``@ResourceField``注解配置信息以及对象类型配置``@Id``字段的值作为目标对象编号设置资源到返回对象内。
4. 返回处理后的对象实例

为了方便配置我们在``@ResourceField``注解内添加了``CommonResourceFlag``枚举类型的``flag``属性，该属性就是配置了资源类型的标识，切面会根据该标识去查询资源的类型编号，再拿着资源类型的编号 & 目标编号去查询资源列表，``CommonResourceFlag``枚举代码如下所示：
```java
/**
 * 资源标识枚举
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2017/12/31
 * Time：下午3:40
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
@Getter
public enum CommonResourceFlag
{
    /**
     * 用户头像
     */
    USER_HEAD_IMAGE("USER_HEAD_IMAGE"),
    /**
     * 用户背景图片
     */
    USER_BACK_IMAGE("USER_BACK_IMAGE");
    private String name;

    CommonResourceFlag(String name) {
        this.name = name;
    }
}
```
以上我们简单介绍了``common-resource``子模块的核心内容以及基本的运行流程原理，下面我们来创建一个``user-provider``子模块来使用同一资源查询用户的头像、用户背景图片列表。
### user-provider
``user-provider``子模块目内我们预计添加一个查询用户详情的方法，在方法上配置``@ResourceMethod``注解，这样可以让切面切到该方法，然后在查询用户详情方法返回的对象类型内字段上添加``@ResourceField``注解并添加对应的资源类型标识配置，这样我们就可以实现资源的自动映射。

由于该模块需要数据库的支持，在``application.yml``配置文件内添加对应的数据库链接配置信息，如下所示：
```yaml
#数据源配置
spring:
  jpa:
    properties:
      hibernate:
        show_sql: true
        format_sql: true
  datasource:
    druid:
      driver-class-name: com.mysql.jdbc.Driver
      username: root
      password: 123456
      url: jdbc:mysql://127.0.0.1:3306/resources?characterEncoding=utf8
```
配置文件内使用的``druid``是``alibaba``针对``SpringBoot``封装的``jar``，提供了``yml``配置文件相关支持以及提示。

#### 用户实体构建
针对数据库内的用户基本信息表我们需要创建对应的``Entity``实体，代码如下所示：
```java
/**
 * 用户基本信息实体
 * @author yuqiyu
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2017/12/31
 * Time：上午11:18
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
@Data
@Entity
@Table(name = "hy_user_info")
public class UserInfoEntity
    extends BaseEntity
{
    /**
     * 用户编号
     */
    @Id
    @GeneratedValue(generator = "system-uuid")
    @GenericGenerator(name = "system-uuid", strategy = "uuid")
    @Column(name = "UI_ID")
    private String userId;
    /**
     * 用户名
     */
    @Column(name = "UI_NAME")
    private String userName;
    /**
     * 昵称
     */
    @Column(name = "UI_NICK_NAME")
    private String nickName;
    /**
     * 年龄
     */
    @Column(name = "UI_AGE")
    private int age;
    /**
     * 所居地
     */
    @Column(name = "UI_ADDRESS")
    private String address;
}
```
由于我们的用户头像以及用户背景图片并没有在``用户基本信息表``内所以我们需要单独创建一个用户详情实体并继承用户基本信息实体，如下所示：
```java
/**
 * 用户详情dto映射实体
 * @author yuqiyu
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2017/12/31
 * Time：上午11:54
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
@Data
public class UserDetailDTO
    extends UserInfoEntity
{
    /**
     * 用户头像
     */
    @ResourceField(flag = CommonResourceFlag.USER_HEAD_IMAGE)
    private String headImage;
    /**
     * 背景图片
     */
    @ResourceField(flag = CommonResourceFlag.USER_BACK_IMAGE,multiple = true)
    private List<String> backImage;
}
```
在上面实体内我们仅仅是配置了字段所需的资源类型枚举。
> 我们一般在开发过程中，用户表内对应的实体是不允许根据业务逻辑修改的，如果你需要变动需要继承实体后添加对应的字段即可。

- 用户数据接口
```java
/**
 * 用户基本信息数据接口
 * @author yuqiyu
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2017/12/31
 * Time：上午11:30
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
public interface UserInfoRepository
    extends JpaRepository<UserInfoEntity,String>
{
    /**
     * 根据用户名称查询
     * @param userName
     * @return
     */
    UserInfoEntity findUserInfoEntityByUserName(String userName);
}
```
- 用户业务逻辑实现
```java
/**
 * 用户基本信息业务逻辑实现
 *
 * @author yuqiyu
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2017/12/31
 * Time：上午11:53
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
@Service
@Transactional(rollbackFor = Exception.class)
public class UserInfoService {
    /**
     * 用户数据接口
     */
    @Autowired
    private UserInfoRepository userInfoRepository;

    /**
     * 更新用户名称查询用户详情
     * @param userName 用户名
     * @return
     */
    @ResourceMethod
    public UserDetailDTO selectByUserName(String userName) {
        /**
         * 获取用户基本信息
         */
        UserInfoEntity userInfoEntity = userInfoRepository.findUserInfoEntityByUserName(userName);
        /**
         * 通过mapStruct转换detailDto
         */
        UserDetailDTO detailDTO = UserMapStruct.INSTANCE.fromUserEntity(userInfoEntity);
        return detailDTO;
    }
}
```
我们在方法``selectByUserName ``上配置了``@ResourceMethod``，让统一资源可以切面到该方法上，在``selectByUserName ``方法内我们只需要去处理根据用户名查询的业务逻辑，通过``MapStruct``进行``UserInfoEntity``与``UserDetailDTO``转换。在方法返回对象时就会被资源自动处理分别将查询到的资源设置到``UserDetailDTO``内的``headImage``、``backImage``。

- 用户控制器
我们在控制器内添加一个根据用户名查询用户详情的方法，如下所示：
```java
/**
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2017/12/31
 * Time：下午3:09
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
@RestController
@RequestMapping(value = "/user")
public class UserInfoController
{
    /**
     * 用户基本信息业务逻辑实现
     */
    @Autowired
    private UserInfoService userInfoService;

    /**
     * 根据用户名查询详情
     * @param userName 用户名
     * @return
     */
    @RequestMapping(value = "/{userName}",method = RequestMethod.GET)
    public UserDetailDTO detail(@PathVariable("userName") String userName)
    {
        return userInfoService.selectByUserName(userName);
    }
}
```
下面我们来编写一个测试用例，查看是否能够达到我们预计的效果。
# 测试
我们在``src/test``下创建一个名为``CommonResourceTester``测试类，代码如下所示：
```java
/**
 * 测试用例
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2017/12/31
 * Time：下午5:04
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
@SpringBootTest(classes = Chapter44Application.class)
@RunWith(SpringRunner.class)
public class CommonResourceTester
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
     * 测试查询用户详情
     * @throws Exception
     */
    @Test
    public void selectDetail() throws Exception
    {
        /**
         * 发起获取请求
         */
        MvcResult mvcResult = mockMvc.perform(MockMvcRequestBuilders.get("/user/hengboy"))
        .andDo(MockMvcResultHandlers.log())
        .andReturn();

        int status = mvcResult.getResponse().getStatus();

        mvcResult.getResponse().setCharacterEncoding("UTF-8");
        String responseString = mvcResult.getResponse().getContentAsString();

        Assert.assertEquals("请求错误", 200, status);

        System.out.println(responseString);
    }
}
```
接下来我们执行``selectDetail``测试方法，看下控制台输出对应的  ``JSON``内容，格式化后如下所示：
```json
{
    "userId": "bc4c8e38-edd6-11e7-969c-3c15c2e4a8a6", 
    "userName": "hengboy", 
    "nickName": "恒宇少年", 
    "age": 23, 
    "address": "山东省济南市", 
    "headImage": "https://upload.jianshu.io/users/upload_avatars/4461954/f09ba256-f6db-41ed-a4ac-b2d23737f0ac.jpg?imageMogr2/auto-orient/strip|imageView2/1/w/96/h/96", 
    "backImage": [
        "https://upload.jianshu.io/collections/images/358868/android.graphics.Bitmap_d88b4de.jpeg?imageMogr2/auto-orient/strip|imageView2/1/w/240/h/240", 
        "https://upload.jianshu.io/collections/images/522928/kafka_diagram.png?imageMogr2/auto-orient/strip|imageView2/1/w/240/h/240"
    ]
}
```
根据结果我们可以看到，我们已经自动的读取了配置的资源列表，也通过反射自动设置到字段内。

# 总结
本章的代码比较多，还是建议大家根据源码比对学习，这种方式也是我们在平时开发中总结出来的，我们仅仅需要配置下``@ResourceField``以及``@ResourceMethod``就可以了完成资源的自动映射，资源与业务逻辑的耦合度得到的很好的降低。
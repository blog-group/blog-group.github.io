---
id: apiboot-custom-logging-traceid
title: 自定义ApiBoot Logging链路以及单元ID
article_type: 原创
article_author: 于起宇
enable_comment: true
news: true
hot: true
tags:
  - ApiBoot
  - Logging
categories:
  - ApiBoot
keywords: apiboot,logging,springboot
description: 'SpringBoot整合ApiBoot分布式链路日志组件自定义链路以及单元ID'
date: 2019-10-21 16:44:52
article_url:
---

`ApiBoot Logging`会为每一个请求都对应创建链路编号（`TraceID`）以及单元编号（`SpanID`），用于归类每一次请求日志，通过一个链路下日志单元的`Parent SpanID`可以进行上下级关系的梳理。

<!--more-->

## 前文回顾

- {% post_link apiboot-unified-manage-request-logs %}

- {% post_link apiboot-report-logs-by-logging-to-admin %}

## 了解链路编号的传递方式
![](/images/post/apiboot-custom-logging-traceid-1.png)

在每一次请求中链路编号（`traceId`）、单元编号`（spanId）`都是通过`HttpHeader`的方式进行传递，日志的起始位置会主动生成`traceId`、`spanId`，而起始位置的`Parent SpanId`则是不存在的，值为`null`。

这样每次通过`restTemplate`、`Openfeign`的形式访问其他服务的接口时，就会**携带起始位置生成的`traceId`、`spanId`到下一个服务单元**。


## 默认编号

`ApiBoot Logging`内部提供了默认的编号格式，默认为通用格式，没有区分性，无法从编号上进行区分日志的具体归类。

### 默认的链路编号

`ApiBoot Logging`内部通过集成`minbox-logging`日志组件来完成日志的采集等基本功能，每一次生成采集的日志时都会通过**LoggingTraceGenerator**接口进行生成链路编号（`TraceID`），该接口源码如下所示：

```java
/**
 * ApiBoot Logging Tracer
 * Create new traceId
 *
 * @author：恒宇少年 - 于起宇
 * <p>
 * DateTime：2019-07-10 17:01
 * Blog：http://blog.yuqiyu.com
 * WebSite：http://www.jianshu.com/u/092df3f77bca
 * Gitee：https://gitee.com/hengboy
 * GitHub：https://github.com/hengboy
 */
public interface LoggingTraceGenerator {
    /**
     * create new traceId
     *
     * @return traceId
     * @throws MinBoxLoggingException exception
     */
    String createTraceId() throws MinBoxLoggingException;

}
```



`ApiBoot Logging`默认的链路编号（`TraceID`）采用的是**UUID随机字符串**的方式生成的，内部实现是通过**LoggingTraceGenerator**接口的默认实现类**LoggingDefaultTraceGenerator**进行生成，生成类源码如下所示：

```java
/**
 * ApiBoot Logging Tracer Default Support Instance
 *
 * @author：恒宇少年 - 于起宇
 * <p>
 * DateTime：2019-07-10 17:28
 * Blog：http://blog.yuqiyu.com
 * WebSite：http://www.jianshu.com/u/092df3f77bca
 * Gitee：https://gitee.com/hengboy
 * GitHub：https://github.com/hengboy
 */
public class LoggingDefaultTraceGenerator implements LoggingTraceGenerator {
    /**
     * Use UUID as the default traceId
     *
     * @return traceId
     * @throws MinBoxLoggingException Exception
     */
    @Override
    public String createTraceId() throws MinBoxLoggingException {
        return UUID.randomUUID().toString();
    }
}

```



### 默认的单元编号

`单元编号`是一条链路下经过的每一个业务单元的唯一标识，在`SpringCloud`微服务的场景下每发起一个请求内部通过`Openfeign`可能会经过多个`服务`，这样每经过的一个服务称之为单元，而当前这条链路下的单元唯一标识字符串就称为`单元编号`。

`minbox-logging`提供了生成`单元编号`的接口**LoggingSpanGenerator**，源码如下所示：

```java
/**
 * ApiBoot Logging Span
 * Create new spanId
 *
 * @author：恒宇少年 - 于起宇
 * <p>
 * DateTime：2019-07-10 17:02
 * Blog：http://blog.yuqiyu.com
 * WebSite：http://www.jianshu.com/u/092df3f77bca
 * Gitee：https://gitee.com/hengboy
 * GitHub：https://github.com/hengboy
 */
public interface LoggingSpanGenerator {
    /**
     * create new spanId
     *
     * @return span id
     * @throws MinBoxLoggingException exception
     */
    String createSpanId() throws MinBoxLoggingException;
}
```

`spanId`默认采用的跟`traceId`生成方式一致，都是`UUID`随机字符串，`minbox-logging`提供了**LoggingSpanGenerator**接口默认的实现**LoggingDefaultSpanGenerator**，源码如下所示：

```java
/**
 * ApiBoot Logging Default Span
 * Use By Create New SpanId
 *
 * @author：恒宇少年 - 于起宇
 * <p>
 * DateTime：2019-07-15 17:24
 * Blog：http://blog.yuqiyu.com
 * WebSite：http://www.jianshu.com/u/092df3f77bca
 * Gitee：https://gitee.com/hengboy
 * GitHub：https://github.com/hengboy
 */
public class LoggingDefaultSpanGenerator implements LoggingSpanGenerator {
    /**
     * Create New SpanId
     *
     * @return SpanId
     * @throws MinBoxLoggingException Exception
     */
    @Override
    public String createSpanId() throws MinBoxLoggingException {
        return UUID.randomUUID().toString();
    }
}
```

## 自定义编号

我们可以根据自己的业务进行自定义`traceId`、`spanId`，可以加入一些自己业务的元素，只需要提供`minbox-logging`提供的生成`traceId`的接口**LoggingTraceGenerator**、生成`spanId`的接口**LoggingSpanGenerator**对应的实现类，并将实现类交给`LoggingFaceBean`管理即可。

### 自定义链路编号

```java
/**
 * 自定义traceId生成策略
 *
 * @author 恒宇少年
 */
public class CustomTraceIdGenerator implements LoggingTraceGenerator {
    /**
     * 链路编号前缀
     */
    private static final String TRACE_ID_PREFIX = "local";
    
    @Override
    public String createTraceId() throws MinBoxLoggingException {
        return TRACE_ID_PREFIX + UUID.randomUUID().toString().hashCode();
    }
}
```

我们创建名为`CustomTraceIdGenerator`的类并实现`LoggingTraceGenerator`接口，实现`createTraceId()`方法的返回值根据`local-`作为前缀，拼接`UUID`随机字符串的`hashCode`值作为后缀。

### 自定义单元编号

```java
/**
 * 自定义单元编号生成策略
 *
 * @author 恒宇少年
 */
public class CustomSpanIdGenerator implements LoggingSpanGenerator {
    /**
     * 单元编号前缀
     */
    private static final String SPAN_ID_PREFIX = "group";

    @Override
    public String createSpanId() throws MinBoxLoggingException {
        return SPAN_ID_PREFIX + UUID.randomUUID().toString().hashCode();
    }
}
```

我们创建名为`CustomSpanIdGenerator`的类并实现`LoggingSpanGenerator`接口，在`createSpanId()`方法的返回值根据`group-`作为前缀，使用`UUID`随机字符串的`hashCode`值作为后缀。

在上面我们已经创建了自定义`traceId`以及`spanId`的实现类，我们需要将实现类的实例交给`LoggingFactoryBean`管理，这样我们才可以实现自定义编号。

### LoggingFactoryBeanCustomizer

`ApiBoot Logging`提供了一个自定义设置`LoggingFactoryBean`的接口**LoggingFactoryBeanCustomizer**，通过该接口可以修改`LoggingFactoryBean`内允许修改的任意值。

我们创建名为**CustomCreateTraceAndSpanId**类并实现`LoggingFactoryBeanCustomizer`接口，源码如下所示：

```java
/**
 * 自定义创建链路以及单元编号
 *
 * @author 恒宇少年
 * @see LoggingFactoryBeanCustomizer
 * @see LoggingFactoryBean
 * @see org.minbox.framework.logging.client.tracer.LoggingTraceGenerator
 * @see org.minbox.framework.logging.client.span.LoggingSpanGenerator
 */
@Component
public class CustomCreateTraceAndSpanId implements LoggingFactoryBeanCustomizer {
    /**
     * {@link CustomTraceIdGenerator} 自定义链路编号生成策略
     * {@link CustomSpanIdGenerator} 自定义单元编号生成策略
     *
     * @param factoryBean {@link LoggingFactoryBean}
     */
    @Override
    public void customize(LoggingFactoryBean factoryBean) {
        CustomTraceIdGenerator traceIdGenerator = new CustomTraceIdGenerator();
        factoryBean.setTraceGenerator(traceIdGenerator);

        CustomSpanIdGenerator spanIdGenerator = new CustomSpanIdGenerator();
        factoryBean.setSpanGenerator(spanIdGenerator);
    }
}

```

`customize`这种设计方式是在`SpringBoot`中比较常见的，`ApiBoot`也沿用了这种设计方式，`customize（）`方法提供了`LoggingFactoryBean`对象实例作为参数，我们可以直接通过`setXxx`方法进行修改内定义的默认配置。

通过`facetory.setTraceGenerator`方法可以修改默认的`traceId`生成策略。

通过`facetory.setSpanGenerator`方法可以修改默认的`spanId`生成策略。

## 测试

启动项目后我们来查看控制台打印的日志内容，确认是否修改成功。

```json
{
	"endTime":1571711067664,
	"httpStatus":200,
	"requestBody":"",
	"requestHeaders":{
		"accept":"*/*",
		"host":"localhost:8080",
		"user-agent":"curl/7.64.1"
	},
	"requestIp":"0:0:0:0:0:0:0:1",
	"requestMethod":"GET",
	"requestParam":"{}",
	"requestUri":"/index",
	"responseBody":"this is index.",
	"responseHeaders":{},
	"serviceId":"apiboot-custom-logging-traceid",
	"serviceIp":"127.0.0.1",
	"servicePort":"8080",
	"spanId":"group-1780993769",
	"startTime":1571711067643,
	"timeConsuming":21,
	"traceId":"local1111437283"
}
```

`traceId`、`spanId`已经修改成我们自定义的编号生成策略方式。

## 敲黑板划重点

本章节主要是讲到了如何自定义`traceId`以及`spanId`，我们可以通过`LoggingFactoryBeanCustomizer`对`LoggingFactoryBean`对象进行深度的自定义配置，有关`ApiBoot Logging`使用的正确姿势还有很多，敬请期待。

> 请结合文中前文回顾部分进行编写测试。


## 代码示例
如果您喜欢本篇文章请为源码仓库点个`Star`，谢谢！！！
本篇文章示例源码可以通过以下途径获取，目录为`apiboot-custom-logging-traceid`：
- Gitee：[https://gitee.com/minbox-projects/api-boot-chapter](https://gitee.com/minbox-projects/api-boot-chapter)
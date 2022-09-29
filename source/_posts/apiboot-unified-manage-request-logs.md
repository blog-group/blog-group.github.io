---
id: apiboot-unified-manage-request-logs
title: 使用ApiBoot Logging进行统一管理请求日志
article_type: 原创
article_author: 于起宇
enable_comment: true
news: true
hot: true
tags:
  - Logging
  - ApiBoot
categories:
  - ApiBoot
keywords: apiboot,logging,springboot
description: '使用ApiBoot Logging进行统一管理请求日志'
date: 2019-10-15 21:35:57
---
`ApiBoot Logging`通过集成`minbox-logging`来进行管理每一次请求的日志信息，包含`头信息`、`参数`、`主体内容`、`路径`、发生的`服务器`相关信息等，根据接口的响应状态还可以记录响应的头信息、响应的内容以及发生异常时的`堆栈信息`。
<!--more-->

## minbox-projects开源组织

`“org.minbox.framework”` 致力于向广大开发者提供一系列的 `“开箱即用”` 的框架落地实现解决方案。 

自从`ApiBoot`框架的落地，内部集成的`第三方插件（plugin）`日渐增多也同样导致了`ApiBoot`的源码太过于冗肿，针对这个问题`minbox-projects`开源组织就诞生了，`ApiBoot`第一个加入了该组织，并且会将`ApiBoot`内集成的`第三方插件`进行陆续分离，将每一个插件作为独立的开源项目加入`minbox-projects`开源组织，方便各个项目的单独维护以及更新发版。

组织首页：[https://gitee.com/minbox-projects](https://gitee.com/minbox-projects)

## minbox-logging日志组件

`minbox-logging`日志组件是`minbox-projects`开源组织内的一员，是一款**分布式零侵入式、链路式请求日志分析框架**。

提供Admin端点进行`采集日志`、`分析日志`、`日志告警通知`、`服务性能分析`等。通过Admin Ui可查看实时`链路日志`信息、在线`业务服务列表`，致力解决`request -> response`整个业务请求的日志分析以及记录。

minbox-logging日志组件源码：[https://gitee.com/minbox-projects/minbox-logging](https://gitee.com/minbox-projects/minbox-logging)

## 创建示例项目

通过`idea`开发工具创建一个`SpringBoot`项目。

- **pom.xml依赖**

```xml
<!--配置参数-->
<properties>
  <java.version>1.8</java.version>
  <api.boot.version>2.1.4.RELEASE</api.boot.version>
</properties>

<dependencies>
  <!--Web-->
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

<dependencyManagement>
  <!--ApiBoot统一版本依赖-->
  <dependencies>
    <dependency>
      <groupId>org.minbox.framework</groupId>
      <artifactId>api-boot-dependencies</artifactId>
      <type>pom</type>
      <scope>import</scope>
      <version>${api.boot.version}</version>
    </dependency>
  </dependencies>
</dependencyManagement>
```

- **测试控制器**

添加一个用于测试的`LoggingSampleController`控制器，源码如下所示：

```java
/**
 * 请求日志示例
 *
 * @author 恒宇少年
 */
@RestController
@RequestMapping(value = "/test")
public class LoggingSampleController {
    /**
     * 验证请求参数以及相应内容
     *
     * @param name
     * @return
     */
    @GetMapping
    public String hello(@RequestParam("name") String name) {
        return "你好：" + name;
    }

    /**
     * 验证主体请求内容以及相应内容
     *
     * @param user
     * @return
     */
    @PostMapping
    public String bodyHello(@RequestBody User user) {
        return "你好：" + user.getName();
    }

    /**
     * RequestBody 示例类
     */
    @Data
    public static class User {
        private String name;
    }
}
```

- **application.yml**

```yaml
spring:
  application:
    name: apiboot-unified-manage-request-logs
server:
  port: 8080
```

由于`ApiBoot Logging`需要记录日志产生的服务器相关信息，所以`spring.application.name`以及`server.port`这两个参数必须配置，要不然启动项目时会抛出错误信息。

- **@EnableLoggingClient注解**

```java
@SpringBootApplication
@EnableLoggingClient
public class ApibootUnifiedManageRequestLogsApplication {

    public static void main(String[] args) {
        SpringApplication.run(ApibootUnifiedManageRequestLogsApplication.class, args);
    }

}
```

使用`@EnableLoggingClient`注解来开启日志的**客户端**，将该注解配置在入口类上，内部通过`ImportBeanDefinitionRegistrar`进行注册`minbox-logging-client`所需要的`Bean`。

### ApiBoot的版本统一依赖

我们在使用`SpringBoot`时发现我们添加的依赖并不需要指定具体的`版本号`，这就是版本统一依赖起到的作用，主要还是`Maven继承关系`缘故。

在`ApiBoot`内也存在这么一个统一维护依赖版本的模块`api-boot-dependencies`，这个模块源码仅一个`pom.xml`文件，主要用来配置每一个第三方依赖或者内置的依赖的具体版本。

我们通过在项目中的`pom.xml`配置文件内添加如下版本管理依赖：

```xml
<dependencyManagement>
  <!--ApiBoot统一版本依赖-->
  <dependencies>
    <dependency>
      <groupId>org.minbox.framework</groupId>
      <artifactId>api-boot-dependencies</artifactId>
      <type>pom</type>
      <scope>import</scope>
      <version>${api.boot.version}</version>
    </dependency>
  </dependencies>
</dependencyManagement>
```

就可以不指定版本号使用`ApiBoot`所提供的全部依赖。

> 最新版的ApiBoot，请访问：<a href="https://search.maven.org/search?q=a:api-boot-dependencies" target="_blank">https://search.maven.org/search?q=a:api-boot-dependencies</a>进行查询。

### 测试请求

项目准备完成，我们先来把项目通过`SpringBoot Application`方式进行启动，通过如下`curl`命令访问我们的测试接口：

```bash
curl http://localhost:8080/test\?name\=hengboy
```

访问完成后，请求成功，但是控制台并没有打印任何请求日志信息，倒是有一个警告的日志：

```
Not set 【LoggingAdminDiscovery】in LoggingFactoryBean，don't invoke report request logs.
```

这个警告告知的很清楚，我们并未配置`logging-admin`，所以无法执行日志的上报，我们本章节是独立使用`ApiBoot Logging`日志组件，所以这个警告信息可以忽略。

### 控制台打印请求日志

`ApiBoot Logging`提供了一个配置`api.boot.logging.show-console-log`，该配置默认值为`false`，通过该配置可以实现在控制台打印请求日志。

在`application.yml`配置文件内添加配置如下所示：

```yaml
api:
  boot:
    # ApiBoot Logging 日志组件配置
    logging:
      show-console-log: true
```

添加完成后，**重启项目**，再次访问测试接口，控制台打印如下所示：

```json
2019-10-16 10:20:18.489  INFO 3930 --- [         task-1] o.m.f.l.c.n.support.LoggingLocalNotice   : Request Uri：/test， Logging：
{"endTime":1571192418416,"httpStatus":200,"requestBody":"","requestHeaders":{"host":"localhost:8080","user-agent":"curl/7.64.1","accept":"*/*"},"requestIp":"0:0:0:0:0:0:0:1","requestMethod":"GET","requestParam":"{\"name\":\"hengboy\"}","requestUri":"/test","responseBody":"你好：hengboy","responseHeaders":{},"serviceId":"apiboot-unified-manage-request-logs","serviceIp":"127.0.0.1","servicePort":"8080","spanId":"35a22772-5015-438a-a441-ba407926b789","startTime":1571192418391,"timeConsuming":25,"traceId":"ec53d162-314e-4516-8c24-5d5e03181543"}
```

这时我们就可以看到打印的请求日志信息了，不过打印的日志内容并未进行美化，不要着急，`ApiBoot Logging`同样提供了一个配置来进行美化输出内容。

### 控制台美化请求日志

`ApiBoot Logging`提供了配置`api.boot.logging.format-console-log-json`，该参数默认为`false`，我们通过修改该配置的值可以实现美化打印请求日志。

在`application.yml`配置文件内添加配置如下所示：

```yaml
api:
  boot:
    # ApiBoot Logging 日志组件配置
    logging:
      show-console-log: true
      format-console-log-json: true
```

添加完成后我们再次来**重启项目**后，访问测试接口，控制台打印如下所示：

```json
2019-10-16 10:24:05.480  INFO 4051 --- [         task-1] o.m.f.l.c.n.support.LoggingLocalNotice   : Request Uri：/test， Logging：
{
	"endTime":1571192645404,
	"httpStatus":200,
	"requestBody":"",
	"requestHeaders":{
		"accept":"*/*",
		"host":"localhost:8080",
		"user-agent":"curl/7.64.1"
	},
	"requestIp":"0:0:0:0:0:0:0:1",
	"requestMethod":"GET",
	"requestParam":"{\"name\":\"hengboy\"}",
	"requestUri":"/test",
	"responseBody":"你好：hengboy",
	"responseHeaders":{},
	"serviceId":"apiboot-unified-manage-request-logs",
	"serviceIp":"127.0.0.1",
	"servicePort":"8080",
	"spanId":"277c0973-8042-4740-a8e7-2dbb0c7bb42c",
	"startTime":1571192645381,
	"timeConsuming":23,
	"traceId":"7a742942-f3cc-4d72-9493-d828b090f1cc"
}
```

这样是不是很直接明了的看到了请求的详细信息了？不过建议根据自己项目的实际情况来配置，美化后的日志会占用更多的**控制台行**。

### LoggingNotice日志通知

`ApiBoot Logging`提供了日志通知的接口，我们只需要实现该接口就可以获取到`每一次请求`的`日志对象`，还可以自定义每一个日志通知实现类的`执行顺序`。

在`ApiBoot Logging`内部提供的实现类如下图所示：

![](/images/post/apiboot-unified-manage-request-logs-1.png)

- **LoggingLocalNotice**

  该类就是用于在控制台打印请求日志以及美化请求日志的实现，优先级为：`Ordered#HIGHEST_PRECEDENCE`（最高优先级）。

- **LoggingAdminNotice**

  该类用于将请求日志上报到`Logging Admin`，优先级为：`Ordered#HIGHEST_PRECEDENCE +1`，仅低于`LoggingLocalNotice`。

### 使用LoggingNotice添加Header

在上面我们已经知道了两个内置的`LoggingNotice`实现类，优先级我们也已经清楚了，那么我们如果添加自定义的`LoggingNotice`实现类来向本次请求日志的`RequestHeader`内添加一个我们自定义的头信息该怎么做呢？

**AddHeaderLoggingNotice**通知类源码如下所示：

```java
/**
 * 通过{@link LoggingNotice}向日志的请求header内添加区域信息
 *
 * @author 恒宇少年
 */
@Component
public class AddHeaderLoggingNotice implements LoggingNotice {
    /**
     * 区域头信息key
     */
    private static final String SERVER_REGION = "server-region";

    @Override
    public void notice(MinBoxLog minBoxLog) {
        minBoxLog.getRequestHeaders().put(SERVER_REGION, "JiNan");
    }

    /**
     * 最大优先级
     *
     * @return
     */
    @Override
    public int getOrder() {
        return HIGHEST_PRECEDENCE;
    }
}
```

由于`minbox-logging`在设计初期就已经考虑到了这一点，所以添加起来比较简单，我们只需要调整我们自定义日志通知的优先级，然后通过`#notice`方法修改本次请求日志对象的值即可。

## 敲黑板划重点

本章节我们介绍了`ApiBoot Logging`的集成使用，可用于采集请求日志，能力确不仅仅如此，使用得当它会很强大，`日志通知设计`可以使我们很好的控制一个请求的日志，对日志进行`添加标识`、`归类`等，可以通过配置来控制`日志打印`以及`美化`。

## 代码示例
如果您喜欢本篇文章请为源码仓库点个`Star`，谢谢！！！
本篇文章示例源码可以通过以下途径获取，目录为`apiboot-unified-manage-request-logs`：
- Gitee：[https://gitee.com/minbox-projects/api-boot-chapter](https://gitee.com/minbox-projects/api-boot-chapter)

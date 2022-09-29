---
id: apiboot-report-logs-by-logging-to-admin
title: 将ApiBoot Logging采集的日志上报到Admin
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
description: '将ApiBoot Logging采集的日志上报到Admin'
date: 2019-10-17 10:35:20
article_url:
---
通过`ApiBoot Logging`可以将每一条请求的详细信息获取到，在分布式部署方式中，一个请求可能会经过多个服务，如果是每个服务都`独立保存`请求日志信息，我们没有办法做到统一的控制，而且还会存在`日志数据库`与`业务数据库`不一致的情况出现（可能会用到多数据源配置），正因为这个问题`ApiBoot Logging`提供了一个`Admin`的概念，将客户端采集到的的每一条日志都进行上报到`Admin`，由`Admin`进行分析、保存等操作。
<!--more-->

## 创建Logging Admin项目

`ApiBoot Logging Admin`既然可以汇总每一个`业务服务`（ApiBoot Logging）的请求日志，因此我们需要将每一个`业务服务`采集单的日志进行上报到`Admin`，所以应该使用**独立的方式**进行部署，我们单独创建一个服务来专门采集请求日志然后进行保存。

### 初始化Logging Admin项目依赖

使用`idea`创建一个`SpringBoot`项目，`pom.xml`配置文件内的依赖如下所示：

```xml
<dependencies>
  <!--Web-->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
  </dependency>
  <!--ApiBoot Logging Admin-->
  <dependency>
    <groupId>org.minbox.framework</groupId>
    <artifactId>api-boot-starter-logging-admin</artifactId>
  </dependency>
  <!--MySQL-->
  <dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
  </dependency>
  <dependency>
    <groupId>com.zaxxer</groupId>
    <artifactId>HikariCP</artifactId>
  </dependency>
  <!--ApiBoot MyBatis Enhance-->
  <dependency>
    <groupId>org.minbox.framework</groupId>
    <artifactId>api-boot-starter-mybatis-enhance</artifactId>
  </dependency>
</dependencies>
```

我们需要将采集到的请求日志进行保存到数据库，所以在项目内需要添加`数据库驱动`、`数据库连接池`相关的依赖，`ApiBoot Logging Admin`内部通过`DataSource`进行操作数据，通过`ApiBoot MyBatis Enhance`的依赖可以自动化创建`DataSource`，摆脱手动创建并加入`Spring IOC`容器。

### 添加ApiBoot统一版本依赖

```xml
<dependencyManagement>
  <dependencies>
    <!--ApiBoot统一版本依赖-->
    <dependency>
      <groupId>org.minbox.framework</groupId>
      <artifactId>api-boot-dependencies</artifactId>
      <version>2.1.4.RELEASE</version>
      <scope>import</scope>
      <type>pom</type>
    </dependency>
  </dependencies>
</dependencyManagement>
```

> 最新版的ApiBoot，请访问：<a href="https://search.maven.org/search?q=a:api-boot-dependencies" target="_blank">https://search.maven.org/search?q=a:api-boot-dependencies</a>进行查询。

### 启用Logging Admin

添加`ApiBoot Logging Admin`依赖后还不能完全使用`Admin`的功能，我们需要通过`@EnableLoggingAdmin`注解来启用，该注解会自动将`Logging Admin`内所需要的部分类自动注册到`Spring IOC`，在入口类添加注解如下所示：

```java
/**
 * ApiBoot Logging Admin入口类
 */
@SpringBootApplication
@EnableLoggingAdmin
public class ApibootReportLogsByLoggingToAdminApplication {

  public static void main(String[] args) {
    SpringApplication.run(ApibootReportLogsByLoggingToAdminApplication.class, args);
  }

}
```

### 配置日志数据源

`application.yml`配置文件内数据源配置如下所示：

```yaml
# 服务名称
spring:
  application:
    name: apiboot-report-logs-by-logging-to-admin
  # 数据源相关配置
  datasource:
    driver-class-name: com.mysql.cj.jdbc.Driver
    url: jdbc:mysql://localhost:3306/test
    username: root
    password: 123456
    type: com.zaxxer.hikari.HikariDataSource
# 服务端口号
server:
  port: 8081
```



### 控制台打印上报日志

`ApiBoot Logging Admin`可以通过配置文件的方式进行控制是否在控制台打印采集到的请求日志信息，在`application.yml`配置文件内添加如下内容：

```yaml
api:
  boot:
    logging:
      # Logging Admin相关配置
      admin:
        # 控制台显示采集的日志信息
        show-console-report-log: true
```

> 注意：这里不要跟ApiBoot Logging所提供的`api.boot.logging.show-console-log`配置混淆。

### 美化控制台打印的上报日志

```yaml
api:
  boot:
    logging:
      # Logging Admin相关配置
      admin:
        # 控制台输出时美化采集到的日志
        format-console-log-json: true
```

> 注意：这里不要跟`api.boot.logging.format-console-log-json`配置混淆。

## 初始化日志表结构

`ApiBoot Logging Admin`内部通过**固定的表结构**来进行存储`请求日志`、`服务信息`，建表语句如下所示：

```sql
SET NAMES utf8mb4 ;

--
-- Table structure for table `logging_request_logs`
--

CREATE TABLE `logging_request_logs` (
  `lrl_id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL COMMENT '主键，UUID',
  `lrl_service_detail_id` varchar(36) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '服务详情编号，关联logging_service_details主键',
  `lrl_trace_id` varchar(36) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '链路ID',
  `lrl_parent_span_id` varchar(36) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '上级跨度ID',
  `lrl_span_id` varchar(36) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '跨度ID',
  `lrl_start_time` mediumtext COLLATE utf8mb4_general_ci COMMENT '请求开始时间',
  `lrl_end_time` mediumtext COLLATE utf8mb4_general_ci COMMENT '请求结束时间',
  `lrl_http_status` int(11) DEFAULT NULL COMMENT '请求响应状态码',
  `lrl_request_body` longtext COLLATE utf8mb4_general_ci COMMENT '请求主体内容',
  `lrl_request_headers` text COLLATE utf8mb4_general_ci COMMENT '请求头信息',
  `lrl_request_ip` varchar(30) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '发起请求客户端的IP地址',
  `lrl_request_method` varchar(10) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '请求方式',
  `lrl_request_uri` varchar(200) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '请求路径',
  `lrl_response_body` longtext COLLATE utf8mb4_general_ci COMMENT '响应内容',
  `lrl_response_headers` text COLLATE utf8mb4_general_ci COMMENT '响应头信息',
  `lrl_time_consuming` int(11) DEFAULT NULL COMMENT '请求耗时',
  `lrl_create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '日志保存时间',
  `lrl_request_params` text COLLATE utf8mb4_general_ci,
  `lrl_exception_stack` text COLLATE utf8mb4_general_ci,
  PRIMARY KEY (`lrl_id`),
  KEY `logging_request_logs_LRL_SERVICE_DETAIL_ID_index` (`lrl_service_detail_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='请求日志信息表';

--
-- Table structure for table `logging_service_details`
--

CREATE TABLE `logging_service_details` (
  `lsd_id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `lsd_service_id` varchar(200) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '上报服务的ID，对应spring.application.name配置值',
  `lsd_service_ip` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '上报服务的IP地址',
  `lsd_service_port` int(11) DEFAULT NULL COMMENT '上报服务的端口号',
  `lsd_last_report_time` timestamp NULL DEFAULT NULL COMMENT '最后一次上报时间，每次上报更新',
  `lsd_create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '首次上报时创建时间',
  PRIMARY KEY (`lsd_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='上报日志的客户端服务详情';

```

`ApiBoot Logging Admin`目前为止已经准备完毕，接下来我们需要修改`业务服务`将请求日志上报到`Logging Admin`。

## 上报日志到指定Logging Admin

我们将修改{% post_link apiboot-unified-manage-request-logs %}文章源码，在`application.yml`添加`Logging Admin`的地址，如下所示：

```yaml
api:
  boot:
    # ApiBoot Logging 日志组件配置
    logging:
      # 配置Logging Admin地址
      admin:
        server-address: 127.0.0.1:8081
```

`api.boot.logging.admin-service-address`的配置格式为：`Ip:Port`，我们只需要修改这一个地方即可，其他的工作都交付给`ApiBoot Logging`内部完成。

## 测试

我们将`ApiBoot Logging Admin`以及`业务服务`通过`Application`的形式进行启动。

使用`curl`访问测试地址如下所示：

```bash
~ curl http://localhost:8080/test\?name\=admin
你好：admin
```

我们查看`ApiBoot Logging Admin`控制台日志如下所示：

```json
Receiving Service: 【apiboot-unified-manage-request-logs -> 127.0.0.1】, Request Log Report，Logging Content：[
	{
		"endTime":1571641723779,
		"httpStatus":200,
		"requestBody":"",
		"requestHeaders":{
			"server-region":"JiNan",
			"host":"localhost:8080",
			"user-agent":"curl/7.64.1",
			"accept":"*/*"
		},
		"requestIp":"0:0:0:0:0:0:0:1",
		"requestMethod":"GET",
		"requestParam":"{\"name\":\"admin\"}",
		"requestUri":"/test",
		"responseBody":"你好：admin",
		"responseHeaders":{},
		"serviceId":"apiboot-unified-manage-request-logs",
		"serviceIp":"127.0.0.1",
		"servicePort":"8080",
		"spanId":"95a73ca0-831b-45df-aa43-2b5887e8d98d",
		"startTime":1571641723776,
		"timeConsuming":3,
		"traceId":"25a7de96-b3dd-48e5-9854-1a8069a4a681"
	}
]
```

我们已经看到了`Logging Admin`控制台打印的上报请求日志，而这条请求的日志是否已经被保存到数据库了还不确定，下面我使用命令行来查看数据库的日志信息。

**查看logging_service_details表内数据**

```sql
mysql> select * from logging_service_details\G;
*************************** 1. row ***************************
              lsd_id: b069366a-25dc-41ec-8f09-242d81755cd0
      lsd_service_id: apiboot-unified-manage-request-logs
      lsd_service_ip: 10.180.98.112
    lsd_service_port: 8080
lsd_last_report_time: 2019-10-21 02:14:26
     lsd_create_time: 2019-10-21 15:14:26
```

`logging_service_details`存放了每一个上报请求日志的`业务服务`基本信息，每一个服务基本信息会在`Logging Admin`内存中缓存一份，方便获取`service_id`进行存储日志，根据`ip`+`port`+`service_id`进行**确定唯一性**，同一个服务只进行保存一次。

**查看logging_request_logs表内数据**

```sql
mysql> select * from logging_request_logs\G;
*************************** 1. row ***************************
               lrl_id: c42761f6-b072-4744-8a17-d8e6097b85de
lrl_service_detail_id: b069366a-25dc-41ec-8f09-242d81755cd0
         lrl_trace_id: 055329a0-cfc1-4606-baf0-4fb0cc905ba2
   lrl_parent_span_id: NULL
          lrl_span_id: aab83092-7749-4f88-8cb6-a949cc060197
       lrl_start_time: 1571642065262
         lrl_end_time: 1571642065286
      lrl_http_status: 200
     lrl_request_body: 
  lrl_request_headers: {"server-region":"JiNan","host":"localhost:8080","user-agent":"curl/7.64.1","accept":"*/*"}
       lrl_request_ip: 0:0:0:0:0:0:0:1
   lrl_request_method: GET
      lrl_request_uri: /test
    lrl_response_body: 你好：admin
 lrl_response_headers: {}
   lrl_time_consuming: 24
      lrl_create_time: 2019-10-21 15:14:26
   lrl_request_params: {"name":"admin"}
  lrl_exception_stack: NULL
```



## 敲黑板画重点

本章我们进行集成了`ApiBoot Logging Admin`，将`业务服务`的每一次请求日志都进行上报到`Logging Admin`，通过数据库的方式进行保存请求日志，然后也可以通过其他的方式，而且可以通过`spanId`以及`traceId`查看每一条请求链路的日志上下级关系以及每一个请求内耗时最多的`span`，可以精准的进行优化服务性能。



## 代码示例
如果您喜欢本篇文章请为源码仓库点个`Star`，谢谢！！！
本篇文章示例源码可以通过以下途径获取，目录为`apiboot-report-logs-by-logging-to-admin`：
- Gitee：[https://gitee.com/minbox-projects/api-boot-chapter](https://gitee.com/minbox-projects/api-boot-chapter)
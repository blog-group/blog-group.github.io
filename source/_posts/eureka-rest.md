---
id: eureka-rest
article_type: 原创
article_author: 于起宇
enable_comment: true
news: true
tags: 
    - SpringCloud
    - Eureka
categories: 
    - SpringCloud
keywords: eureka,SpringBoot,恒宇少年
date: 2018-10-11 13:22:51
title: Eureka服务注册中心内置的REST节点列表
description: 'Eureka服务注册中心内置的REST节点列表'
---
你有没有考虑过`Eureka Client`与`Eureka Server`是通过什么方式进行通讯的？
为什么`Client`启动成功后`Server`就会被注册到`Server`的服务列表内？
为什么我们在正常关闭`Client`后`Server`会有所感知？

既然这么多问题，带着这些问题来进行本章的学习吧。

<!--more-->

### 本章目标
熟悉`Eureka Server`内部提供的`REST`服务维护请求节点。
### 构建项目
我们本章知识点不需要涉及到代码的编写，所以我们只需要运行之前章节{% post_path eureka-server 搭建Eureka服务注册中心 %}的源码即可。

### REST节点一览
`Eureka Server`内部通过`JAX-RS`(Java API for RESTful Web Services)规范提供了一系列的管理`服务节点`的请求节点，这样也保证了在非`JVM`环境运行的程序可以通过`HTTP REST`方式进行管理维护指定`服务节点`，所以只要遵循`Eureka`协议的`服务节点`都可以进行`注册`到`Eureka Server`。

`Eureka`提供的`REST`请求可以支持`XML`以及`JSON`形式通信，默认采用`XML`方式，`REST`列表如表所示：

|请求名称|请求方式|HTTP地址|请求描述|
|---|---|---|---|
|注册新服务|POST|/eureka/apps/`{appID}`|传递JSON或者XML格式参数内容，HTTP code为204时表示成功|
|取消注册服务|DELETE|/eureka/apps/`{appID}`/`{instanceID}`|HTTP code为200时表示成功|
|发送服务心跳|PUT|/eureka/apps/`{appID}`/`{instanceID}`|HTTP code为200时表示成功|
|查询所有服务|GET|/eureka/apps|HTTP code为200时表示成功，返回XML/JSON数据内容|
|查询指定appID的服务列表|GET|/eureka/apps/`{appID}`|HTTP code为200时表示成功，返回XML/JSON数据内容|
|查询指定appID&instanceID|GET|/eureka/apps/`{appID}`/`{instanceID}`|获取指定appID以及InstanceId的服务信息，HTTP code为200时表示成功，返回XML/JSON数据内容|
|查询指定instanceID服务列表|GET|/eureka/apps/instances/`{instanceID}`|获取指定instanceID的服务列表，HTTP code为200时表示成功，返回XML/JSON数据内容|
|变更服务状态|PUT|/eureka/apps/`{appID}`/`{instanceID}`/status?value=DOWN|服务上线、服务下线等状态变动，HTTP code为200时表示成功|
|变更元数据|PUT|/eureka/apps/`{appID}`/`{instanceID}`/metadata?key=value|HTTP code为200时表示成功|
|查询指定IP下的服务列表|GET|/eureka/vips/`{vipAddress}`|HTTP code为200时表示成功|
|查询指定安全IP下的服务列表|GET|/eureka/svips/`{svipAddress}`|HTTP code为200时表示成功|

在上面列表中参数解释
- `{appID}`：服务名称，对应`spring.application.name`参数值
- `{instanceID}`：实例名称，如果已经自定义`instanceId`则对应`eureka.instance.instance-id`参数值

#### 服务注册
在`Eureka Client`启动成功后会发送`POST`方式的请求到`/eureka/apps/{appID}`，发送注册请求时的`主体内容`在官网也有介绍，如果我们根据指定的`主体内容`发送请求到`Eureka Server`时也是可以将服务注册成功的，`主体内容`要以`XML`/`JSON`格式的`XSD`传递：
```xml
<?xml version="1.0" encoding="UTF-8"?>
<xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified" attributeFormDefault="unqualified">
    <xsd:element name="instance">
        <xsd:complexType>
            <xsd:all>
                <!-- hostName in ec2 should be the public dns name, within ec2 public dns name will
                     always resolve to its private IP -->
                <xsd:element name="hostName" type="xsd:string" />
                <xsd:element name="app" type="xsd:string" />
                <xsd:element name="ipAddr" type="xsd:string" />
                <xsd:element name="vipAddress" type="xsd:string" />
                <xsd:element name="secureVipAddress" type="xsd:string" />
                <xsd:element name="status" type="statusType" />
                <xsd:element name="port" type="xsd:positiveInteger" minOccurs="0" />
                <xsd:element name="securePort" type="xsd:positiveInteger" />
                <xsd:element name="homePageUrl" type="xsd:string" />
                <xsd:element name="statusPageUrl" type="xsd:string" />
                <xsd:element name="healthCheckUrl" type="xsd:string" />
               <xsd:element ref="dataCenterInfo" minOccurs="1" maxOccurs="1" />
                <!-- optional -->
                <xsd:element ref="leaseInfo" minOccurs="0"/>
                <!-- optional app specific metadata -->
                <xsd:element name="metadata" type="appMetadataType" minOccurs="0" />
            </xsd:all>
        </xsd:complexType>
    </xsd:element>

    <xsd:element name="dataCenterInfo">
        <xsd:complexType>
             <xsd:all>
                 <xsd:element name="name" type="dcNameType" />
                 <!-- metadata is only required if name is Amazon -->
                 <xsd:element name="metadata" type="amazonMetdataType" minOccurs="0"/>
             </xsd:all>
        </xsd:complexType>
    </xsd:element>

    <xsd:element name="leaseInfo">
        <xsd:complexType>
            <xsd:all>
                <!-- (optional) if you want to change the length of lease - default if 90 secs -->
                <xsd:element name="evictionDurationInSecs" minOccurs="0"  type="xsd:positiveInteger"/>
            </xsd:all>
        </xsd:complexType>
    </xsd:element>

    <xsd:simpleType name="dcNameType">
        <!-- Restricting the values to a set of value using 'enumeration' -->
        <xsd:restriction base = "xsd:string">
            <xsd:enumeration value = "MyOwn"/>
            <xsd:enumeration value = "Amazon"/>
        </xsd:restriction>
    </xsd:simpleType>

    <xsd:simpleType name="statusType">
        <!-- Restricting the values to a set of value using 'enumeration' -->
        <xsd:restriction base = "xsd:string">
            <xsd:enumeration value = "UP"/>
            <xsd:enumeration value = "DOWN"/>
            <xsd:enumeration value = "STARTING"/>
            <xsd:enumeration value = "OUT_OF_SERVICE"/>
            <xsd:enumeration value = "UNKNOWN"/>
        </xsd:restriction>
    </xsd:simpleType>

    <xsd:complexType name="amazonMetdataType">
        <!-- From <a class="jive-link-external-small" href="http://docs.amazonwebservices.com/AWSEC2/latest/DeveloperGuide/index.html?AESDG-chapter-instancedata.html" target="_blank">http://docs.amazonwebservices.com/AWSEC2/latest/DeveloperGuide/index.html?AESDG-chapter-instancedata.html</a> -->
        <xsd:all>
            <xsd:element name="ami-launch-index" type="xsd:string" />
            <xsd:element name="local-hostname" type="xsd:string" />
            <xsd:element name="availability-zone" type="xsd:string" />
            <xsd:element name="instance-id" type="xsd:string" />
            <xsd:element name="public-ipv4" type="xsd:string" />
            <xsd:element name="public-hostname" type="xsd:string" />
            <xsd:element name="ami-manifest-path" type="xsd:string" />
            <xsd:element name="local-ipv4" type="xsd:string" />
            <xsd:element name="hostname" type="xsd:string"/>       
            <xsd:element name="ami-id" type="xsd:string" />
            <xsd:element name="instance-type" type="xsd:string" />
        </xsd:all>
    </xsd:complexType>

    <xsd:complexType name="appMetadataType">
        <xsd:sequence>
            <!-- this is optional application specific name, value metadata -->
            <xsd:any minOccurs="0" maxOccurs="unbounded" processContents="skip"/>
        </xsd:sequence>
    </xsd:complexType>
</xsd:schema>
```
我们本章先来使用之前章节{% post_path eureka-register-service 将服务注册到Eureka %}源码进行`自动注册服务`，在之后的章节内我们再来细讲具体怎么通过符合以上`XSD`主体内容的`XML`/`JSON`手动注册。

在下面我们来看下通过`REST`来维护`服务实例`，在这之前我们需要通过以下步骤进行启动服务，为后续`REST`请求维护`服务实例`提供环境：
> 1. 启动`Eureka Server`，源码查看{% post_path eureka-server 搭建Eureka服务注册中心 %}
> 2. 启动`Eureka Client`，源码查看{% post_path eureka-register-service 将服务注册到Eureka %}


#### 服务状态变更
我们可以直接修改`服务实例`的运行状态，比如服务关闭，会从`UP`转换为`DOWN`，我们通过`curl`命令来测试服务的状态变更，如下所示：
```
curl -v -X PUT http://localhost:10000/eureka/apps/HENGBOY-SPRING-CLOUD-EUREKA-PROVIDER/hengboy-spring-cloud-eureka-provider:20000:v1.0/status\?value\=DOWN
```
其中参数`HENGBOY-SPRING-CLOUD-EUREKA-PROVIDER`为`appID`，`hengboy-spring-cloud-eureka-provider:20000:v1.0`为`instanceID`。
执行完成后可以打开`Eureka Server`管理平台查看`服务实例列表`查看服务状态，如下图所示：
![服务状态变更](https://upload-images.jianshu.io/upload_images/4461954-4bbe36df0cc19528.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
服务的状态已经由原本的`UP`改为了`DOWN`。


#### 服务基本信息获取

`Eureka`提供获取指定`appID`以及`instanceID`的详细信息，可以详细的返回`服务实例`的配置内容，获取信息的命令如下：
```
curl http://localhost:10000/eureka/apps/HENGBOY-SPRING-CLOUD-EUREKA-PROVIDER/hengboy-spring-cloud-eureka-provider:20000:v1.0
```
执行命令返回值的格式化如下所示：
```xml
<instance>
  <instanceId>hengboy-spring-cloud-eureka-provider:20000:v1.0</instanceId>
  <hostName>192.168.1.75</hostName>
  <app>HENGBOY-SPRING-CLOUD-EUREKA-PROVIDER</app>
  <ipAddr>192.168.1.75</ipAddr>
  <status>UP</status>
  <overriddenstatus>UNKNOWN</overriddenstatus>
  <port enabled="true">20000</port>
  <securePort enabled="false">443</securePort>
  <countryId>1</countryId>
  <dataCenterInfo class="com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo">
    <name>MyOwn</name>
  </dataCenterInfo>
  <leaseInfo>
    <renewalIntervalInSecs>30</renewalIntervalInSecs>
    <durationInSecs>90</durationInSecs>
    <registrationTimestamp>1539223540390</registrationTimestamp>
    <lastRenewalTimestamp>1539229835439</lastRenewalTimestamp>
    <evictionTimestamp>0</evictionTimestamp>
    <serviceUpTimestamp>1539223539774</serviceUpTimestamp>
  </leaseInfo>
  <metadata>
    <management.port>20000</management.port>
    <jmx.port>54581</jmx.port>
  </metadata>
  <homePageUrl>http://192.168.1.75:20000/</homePageUrl>
  <statusPageUrl>http://192.168.1.75:20000/actuator/info</statusPageUrl>
  <healthCheckUrl>http://192.168.1.75:20000/actuator/health</healthCheckUrl>
  <vipAddress>hengboy-spring-cloud-eureka-provider</vipAddress>
  <secureVipAddress>hengboy-spring-cloud-eureka-provider</secureVipAddress>
  <isCoordinatingDiscoveryServer>false</isCoordinatingDiscoveryServer>
  <lastUpdatedTimestamp>1539223540390</lastUpdatedTimestamp>
  <lastDirtyTimestamp>1539223539732</lastDirtyTimestamp>
  <actionType>ADDED</actionType>
</instance>
```
返回值的比较详细，如需选择使用。

#### 服务剔除
当然我们同样可以主动将服务从`Eureka`剔除，剔除后会直接从`服务实例列表`中删除，可执行如下命令：
```bash
curl -v -X DELETE localhost:10000/eureka/apps/HENGBOY-SPRING-CLOUD-EUREKA-PROVIDER/hengboy-spring-cloud-eureka-provider:20000:v1.0
```
> 注意：由于`Eureka Client`一直在运行，删除后也会自动通过`注册服务`的`REST`注册实例。

### 总结
本章讲解了怎么通过`主动`以及`自动同步`的方式将`Eureka Client`注册到`服务注册中心集群环境`中，为了保证完整性，还是建议手动进行配置，自动同步也有不成功的情况存在。

---
id: eureka-register-away-code
title: Eureka服务注册方式流程源码分析
article_type: 原创
article_author: 于起宇
enable_comment: true
news: true
tags:
  - SpringCloud
  - Eureka
categories:
  - SpringCloud
date: 2019-09-29 13:49:34
keywords: eureka,SpringCloud,SpringBoot
description: 'Eureka服务注册方式流程源码分析'
---
{% post_path eureka-register-away Eureka服务注册是采用主机名还是IP地址？%}文章中我们讲到了`服务注册`的几种`注册方式`，那么这几种`注册方式`的源码是怎么实现的呢？我们带着这一个疑问来阅读本章内容能够让你更深入了解这块的知识点！！！
<!--more-->
### 本章目标
分析每一种`服务注册方式`源码执行流程。

### 构建项目
本章以分析源码为主，所以不去新创建项目来讲解相关内容，我们使用{% post_path eureka-register-away Eureka服务注册是采用主机名还是IP地址？ %}源码作为`注册服务`，{% post_path eureka-server 搭建Eureka服务注册中心 %}源码作为`服务注册中心`，还是按照之前的运行流程：
> 1. 启动服务注册中心
> 2. 启动本章服务项目
> 3. 查看服务列表，服务注册方式
 
### 配置信息获取执行流程
在开始讲解本章`注册方式`之前，我们需要了解整体的`配置信息`获取的流程信息，这样才可以分析指定的`注册方式`执行流程。
##### 第一步：实例化`EurekaInstanceConfigBean`配置实体

在项目启动时由于依赖`spring-cloud-starter-netflix-eureka-client`内通过配置`spring.factories`文件来让项目启动时自动加载并实例化`org.springframework.cloud.netflix.eureka.EurekaClientAutoConfiguration`配置类，`EurekaClientAutoConfiguration`内会自动实例化`EurekaInstanceConfigBean`并且自动绑定`eureka.instance`开头的配置信息（具体为什么会自动映射可以去了解下`@ConfigurationProperties`注解作用），部分源码如下所示：
```java
public class EurekaClientAutoConfiguration {
    //省略部分源码
    @Bean
    @ConditionalOnMissingBean(value = EurekaInstanceConfig.class, search        = SearchStrategy.CURRENT)
    public EurekaInstanceConfigBean eurekaInstanceConfigBean(InetUtils inetUtils,                                                       ManagementMetadataProvider managementMetadataProvider) {
      //省略部分源码
      // 传递
      EurekaInstanceConfigBean instance = new EurekaInstanceConfigBean(inetUtils);
      // 省略部分源码
    }
    //省略部分源码
}
```
`EurekaClientAutoConfiguration#eurekaInstanceConfigBean`方法只有满足`@ConditionalOnMissingBean(value = EurekaInstanceConfig.class, search = SearchStrategy.CURRENT)`表达式后才会去实例化，并且把实例化对象放入到`IOC`容器内容，`BeanId`为`eurekaInstanceConfigBean`，也就是方法的名称。
在`EurekaClientAutoConfiguration#eurekaInstanceConfigBean`方法中有这么一行代码我们可以进行下一步的分析
```java
// 通过有参构造函数实例化EurekaInstanceConfigBean配置实体
EurekaInstanceConfigBean instance = new EurekaInstanceConfigBean(inetUtils);
```
通过调用`EurekaInstanceConfigBean(InetUtils inetUtils)`构造函数来进行实例化`EurekaInstanceConfigBean`对象，在这个构造函数内也有一些实例化的工作，源码如下：
```java
public EurekaInstanceConfigBean(InetUtils inetUtils) {
    this.inetUtils = inetUtils;
    this.hostInfo = this.inetUtils.findFirstNonLoopbackHostInfo();
    this.ipAddress = this.hostInfo.getIpAddress();
    this.hostname = this.hostInfo.getHostname();
}
```

##### 第二步：`InetUtils#findFirstNonLoopbackHostInfo`获取主机基本信息
在构造函数`EurekaInstanceConfigBean(InetUtils inetUtils)`源码实现内`hostInfo`主机信息通过了`InetUtils#findFirstNonLoopbackHostInfo`方法来进行实例化，我们来看看这个方法的具体实现逻辑，它会自动读取系统`网卡列表`然再进行`循环遍历`查询正在`UP`状态的网卡信息，如果没有查询到网卡信息，则使用默认的`HostName`、`IpAddress`配置信息，源码如下所示：
```java
public HostInfo findFirstNonLoopbackHostInfo() {
    InetAddress address = findFirstNonLoopbackAddress();
    if (address != null) {
        return convertAddress(address);
    }
    HostInfo hostInfo = new HostInfo();
    hostInfo.setHostname(this.properties.getDefaultHostname());
    hostInfo.setIpAddress(this.properties.getDefaultIpAddress());
    return hostInfo;
}

public InetAddress findFirstNonLoopbackAddress() {
    InetAddress result = null;
    try {
        int lowest = Integer.MAX_VALUE;
        for (Enumeration<NetworkInterface> nics = NetworkInterface
                .getNetworkInterfaces(); nics.hasMoreElements();) {
            NetworkInterface ifc = nics.nextElement();
            if (ifc.isUp()) {
                log.trace("Testing interface: " + ifc.getDisplayName());
                if (ifc.getIndex() < lowest || result == null) {
                    lowest = ifc.getIndex();
                }
                else if (result != null) {
                    continue;
                }

                // @formatter:off
                if (!ignoreInterface(ifc.getDisplayName())) {
                    for (Enumeration<InetAddress> addrs = ifc
                            .getInetAddresses(); addrs.hasMoreElements();) {
                        InetAddress address = addrs.nextElement();
                        if (address instanceof Inet4Address
                                && !address.isLoopbackAddress()
                                && isPreferredAddress(address)) {
                            log.trace("Found non-loopback interface: "
                                    + ifc.getDisplayName());
                            result = address;
                        }
                    }
                }
                // @formatter:on
            }
        }
    }
    catch (IOException ex) {
        log.error("Cannot get first non-loopback address", ex);
    }

    if (result != null) {
        return result;
    }

    try {
        return InetAddress.getLocalHost();
    }
    catch (UnknownHostException e) {
        log.warn("Unable to retrieve localhost");
    }

    return null;
}
```
默认的`HostName`、`IpAddress`属性配置信息在`InetUtilsProperties`配置实体类内，如果不进行设置则直接使用默认值，如果你想`更换默认值`，那么你可以在`application.yml`配置文件内通过设置`spring.cloud.inetutils.defaultHostname`、`spring.cloud.inetutils.defaultIpAddress`进行修改默认值，源码如下所示：
```java
public class InetUtilsProperties {
    public static final String PREFIX = "spring.cloud.inetutils";

    /**
     * The default hostname. Used in case of errors.
     */
    private String defaultHostname = "localhost";

    /**
     * The default ipaddress. Used in case of errors.
     */
    private String defaultIpAddress = "127.0.0.1";
}
```
##### 第三步：`EurekaInstanceConfigBean#getHostName`方法实现
`getHostName`是一个`Override`的方法，继承于`com.netflix.appinfo.EurekaInstanceConfig`接口，该方法有个`boolean`类型的参数`refresh`来判断是否需要刷新重新获取主机网络基本信息，当传递`refresh=false`并且在`application.yml`配置文件内并没有进行手动设置`eureka.instance.hostname`以及`eureka.instance.ip-address`参数则会根据`eureka.instance.prefer-ip-address`设置的值进行返回信息，源码如下所示：
```java
@Override
public String getHostName(boolean refresh) {
    if (refresh && !this.hostInfo.override) {
        this.ipAddress = this.hostInfo.getIpAddress();
        this.hostname = this.hostInfo.getHostname();
    }
    return this.preferIpAddress ? this.ipAddress : this.hostname;
}
```
### 默认注册方式源码分析
由于在实例化`EurekaInstanceConfigBean`配置实体类时，构造函数进行了获取`第一个非回环主机信息`，默认的`hostName`以及`ipAddress`参数则是会直接使用`InetUtils#findFirstNonLoopbackHostInfo`方法返回的相对应的值。
### IP优先注册方式源码分析
`EurekaInstanceConfigBean#getHostName`方法直接调用本类重载方法`getHostName(boolean refresh)`并且传递参数为`false`，根据第三步源码我们就可以看到：
```
return this.preferIpAddress ? this.ipAddress : this.hostname;
```
如果`eureka.instance.prefer-ip-address`参数设置了`true`就会返回`eureka.instance.ip-address`的值，这样我们就可以从中明白为什么主动设置`eureka.instance.ip-address`参数后需要同时设置`eureka.instance.prefer-ip-address`参数才可以生效。
### 指定IP、HostName源码分析
我们通过`application.yml`配置文件进行设置`eureka.instance.hostname`以及`eureka.instance.ip-address`后会直接替换原默认值，在`EurekaInstanceConfigBean#getHostName`中也是返回的`this.hostname`、`this.ipAddress`所以在这里设置后会直接生效作为返回的配置值。

### 总结
我们通过源码进行分析`服务注册方式`执行流程，这样在以后进行配置`eureka.instance.hostname`、`eureka.instance.prefer.ip-address`、`eureka.instance.ip-address`三个配置信息时就可以根据优先级顺序达到预期的效果，避免没有必要的错误出现。

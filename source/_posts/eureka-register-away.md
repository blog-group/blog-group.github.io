---
id: eureka-register-away
title: Eureka服务注册是采用主机名还是IP地址？
article_type: 原创
article_author: 于起宇
enable_comment: true
news: true
tags:
  - SpringCloud
categories:
  - SpringCloud
date: 2019-09-29 13:54:59
keywords: SpringCloud,SpringBoot
description: 'Eureka服务注册是采用主机名还是IP地址？'
---
我们一直在使用`Eureka`进行注册服务，然而你有可能很少关心`服务`在注册到`Eureka Server`时是采用的`主机名`的方式？还是`IP地址`的方式？
<!--more-->
### 构建项目
我们把之前章节{% post_link eureka-register-service 将服务注册到Eureka %}的源码复制一份修改项目名称为`hengboy-spring-cloud-eureka-register-away`，并简单的对`application.yml`配置文件进行修改,如下所示：
```yaml
# 服务名称
spring:
  application:
    name: hengboy-spring-cloud-eureka-register-away

# 服务提供者端口号
server:
  port: 20001

# 配置Eureka Server 信息
eureka:
  client:
    service-url:
      defaultZone: http://localhost:10000/eureka/
  # 自定义实例编号
  instance:
    instance-id: ${spring.application.name}:${server.port}:@project.version@
```
在上面配置中，并没有对注册方式进行任何修改，如果现在启动当然就是采用的默认方式进行注册，接下来我们来看看默认的方式是采用的哪种？
### 查看默认方式
我们仍然使用{% post_path eureka-server 搭建Eureka服务注册中心 %}源码作为`服务注册中心`(Eureka Server)来完成本章的测试工作。
##### 测试步骤：
> 1. 启动服务注册中心
> 2. 启动本章项目
> 3. 访问`http://localhost:10000`打开`服务注册中心`管理界面
> 4. 点击服务列表服务，查看地址栏地址

当我们点击`hengboy-spring-cloud-eureka-register-away:20001:v1.0`服务名称后会跳转到服务的`监控信息`界面，不过我们并没有添加`监控`相关的依赖或者配置，所以这里跳转后是`404`访问不到页面，即使是这样我们还是可以看到跳转的网址是`http://192.168.1.75:20001/actuator/info`，这也证实了一点`Eureka Client`向`Eureka Server`进行注册的时候默认采用的是`IP Address`方式。

那么如果你想采用主机名的方式进行`注册服务`，该怎么配置呢？请继续阅读。

### 配置使用主机名
我们如果采用主机名的方式进行`注册服务`，只需要修改`application.yml`配置文件内的`eureka.instance.hostname`配置信息即可，如下所示：
```yaml
# 配置Eureka Server 信息
eureka:
  client:
    service-url:
      defaultZone: http://localhost:10000/eureka/
  # 自定义实例编号
  instance:
    instance-id: ${spring.application.name}:${server.port}:@project.version@
    # 配置使用主机名注册服务
    hostname: node1
```
`node1`是我本机配置的其中一个主机名
- `OS X`/`Linux`系统下修改主机名

我是采用的`MAC OS X`系统作为运行环境，所以修改`/etc/hosts`文件对应的添加`主机名`、`IP`地址的映射即可，如下所示：
```
##
# Host Database
#
# localhost is used to configure the loopback interface
# when the system is booting.  Do not change this entry.
##
127.0.0.1       localhost
255.255.255.255 broadcasthost
::1             localhost
127.0.0.1       node1
127.0.0.1       node2
```
- `Windows`系统下修改主机名

如果你是采用的`Windows`系统作为运行环境，你可以修改`C:\Windows\System32\drivers\etc\hosts`文件内容并添加映射关系。

> 修改完成主机名后，一定不要忘记是需要让主机名生效的，修改完成后最有效的办法是`重启你的计算机`可以`生效主机名`。

##### 接下来我们需要按照下面的步骤进行测试`主机名方式注册`是否已经生效？
> 1. 重启本章项目
> 2. 刷新`Eureka Server`管理平台界面
> 3. 点击服务名称查看跳转地址

我们可以发现跳转的路径由原本默认的`http://192.168.1.75:20001/actuator/info`方式修改成了`http://node1:20001/actuator/info`，可以看到已经是使用了`主机名`的方式进行的`注册服务`！！！
### 配置优先使用IP
如果你在部署的时候某种原因导致的无法使用`主机名`方式进行部署，当然你可以选择不配置`eureka.instance.hostname`参数，如果你配置后仍然想使用`IP Address`方式进行`服务注册`，这时我们可以通过`eureka.instance.prefer-ip-address`参数来进行设置，如果该参数设置为`true`，则`优先使用IP Address`进行`服务注册`。
配置如下所示：
```yaml
# 配置Eureka Server 信息
eureka:
  client:
    service-url:
      defaultZone: http://localhost:10000/eureka/
  # 自定义实例编号
  instance:
    instance-id: ${spring.application.name}:${server.port}:@project.version@
    # 配置使用主机名注册服务
    hostname: node1
    # 优先使用IP地址方式进行注册服务
    prefer-ip-address: true
```
##### 具体的测试过程与上述`配置使用主机名`一致，可以进行尝试运行测试。

既然我们可以`优先使用IP`进行`注册服务`，我们想根据`指定的IP地址`进行注册该怎么配置呢？

### 配置使用指定IP

配置使用`指定IP`也比较简单，我们可以进行设置`eureka.instance.ip-address`参数的值来进行修改注册的`IP 地址`。
我们基于上面步骤的配置文件进行修改内容如下所示：
```yaml
# 配置Eureka Server 信息
eureka:
  client:
    service-url:
      defaultZone: http://localhost:10000/eureka/
  # 自定义实例编号
  instance:
    instance-id: ${spring.application.name}:${server.port}:@project.version@
    # 配置使用主机名注册服务
    hostname: node1
    # 优先使用IP地址方式进行注册服务
    prefer-ip-address: true
    # 配置使用指定IP
    ip-address: 127.0.0.1
```
配置文件修改完成后，进行如下步骤进行测试是否失效：
> 1. 重启本章项目
> 2. 刷新`Eureka Server`管理平台界面
> 3. 点击服务名称，查看跳转地址信息

我们发现跳转地址栏的地址已经使用了我们配置的`ip-address`参数，地址为：`http://127.0.0.1:20001/actuator/info`。

> 注意：如果配置`ip-address`参数后并没有开启`prefer-ip-address: true`，那么仍然使用`主机名`或者`默认`的注册方式。

### 总结
我们通过几种不同的`服务注册方式`来全面讲解了`Eureka Client`在注册到`服务注册中心`时使用的主机信息，这几种注册方式也是存在一定的`优先级顺序`的，这一知识点我们在下一章结合`Eureka`源码进行分别全面剖析这几种`注册方式`以及`优先级顺序`。
---
id: use-nginx-loadbalance-upgrade-service
title: 使用nginx的负载均衡机制实现用户无感更新服务
sort_title: 使用nginx负载均衡无痛更新服务
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: true
news: true
disable_toc: false
customize: false
tags: [技术杂谈]
categories: [技术杂谈]
keywords: 无痛更新,负载均衡,nginx
date: 2020-01-07 22:02:57
article_url:
description: '使用nginx的负载均衡机制实现用户无感更新服务'
---
## 前言

用户请求的转发是接口服务在部署时必须要做的一步。

请求转发的步骤大约分为如下几步：

1. **域名解析到转发服务器**
2. **转发服务器会根据权重(weight)、备用(backup)配置转发到统一网关**
3. **如果统一网关存在灰度的配置，需要根据身份或者头信息过滤请求**
4. **转发到具体的业务服务**

目前市面上优秀的`请求转发`有很多种，比如：`Nginx`、`F5`、`Kong`、`Tengine`等，其中`Tengine`是阿里巴巴基于`Nginx`进行封装，我们本章的内容基于`Nginx`进行讲解，我们先来准备下`nginx`的测试环境。

## 准备环境

如果你的测试环境没有安装`Nginx`，下面我通过两种方式来说下具体的安装过程。

### 使用Brew安装Nginx

如果你是`OSX`系统，可以直接使用`brew`管理工具进行安装，这种方式比较简单，自动从远程服务器下载最新稳定的版本进行解压、配置环境等。

```bash
# 安装nginx
➜  ~ brew install nginx
```

静静等待~

安装完成后，我们先来修改下端口号（brew安装包把默认的监听端口号改为了`8080`，一般在使用解压的方式安装时监听端口都是`80`）。

我们需要先找到`nginx.conf`这个文件的位置：

```bash
➜  ~ sudo find / -name nginx.conf           
/usr/local/etc/nginx/nginx.conf
```

找到文件后，我们通过`sudo vi /usr/local/etc/nginx/nginx.conf`命令来修改默认的端口号，位置如下：

```
server {
        listen       80;
        server_name  localhost;
        #...
}        
```

修改后保存退出。

最后不要忘记重启`Nginx`服务。

```bash
➜  ~ brew services restart nginx
```



### 解压包方式

首先去`nginx`官方提供 [http://nginx.org/download](http://nginx.org/download/) 的下载地址去挑选自己中意的版本，下面以`1.17.7`版本示例：

- [http://nginx.org/download/nginx-1.17.7.tar.gz](http://nginx.org/download/nginx-1.17.7.tar.gz)

点击下载完成后解压安装即可（注意编译环境，可能会缺少一些依赖库，本机安装对应的依赖就可以了）

```bash
# 解压nginx
tar -xvf nginx-1.17.7.tar.gz
# 进入目录
cd nginx-1.17.7
# 配置
./configure --prefix=/usr/local/nginx
# 编译
sudo make
# 安装
sudo make install
# 进入nginx执行目录
cd /usr/local/nginx/sbin
# 启动nginx
./nginx
```

安装完成如果访问 [http://127.0.0.1](http://127.0.0.1) 可以看到`Welcome to nginx!`字样，说明我们已经安装成功了。

## 示例项目

为了演示更新服务用户无痛感知，我们先来创建一个简单的`SpringBoot`示例项目，在项目内添加一个测试接口，项目`pom.xml`依赖如下所示：

```xml
<dependencies>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
  </dependency>
</dependencies>
```

### 示例接口

创建一个名为`TestController`的测试控制器，如下所示：

```java
/**
 * 测试控制器
 *
 * @author 恒宇少年
 */
@RestController
@RequestMapping(value = "/test")
public class TestController {
    @Autowired
    private ServerProperties serverProperties;

    @GetMapping
    public String hello() {
        return "请求分发到了，端口号：" + serverProperties.getPort() + "的服务，接口访问成功.";
    }
}
```

## 配置转发

我们测试所需要的请求接口已经准备好了，接下来需要在访问`nginx`时将请求转发到我们测试的接口，配置转发时需要用到`nginx`的两个关键字，分别是`upstream`、`location`。

- **upstream**：服务器组，配置请求分发到组内多台服务器。
- **location**：转发的路径前缀，如："/user/"，当我们访问`http://127.0.0.1/user/1`时，就会执行该`location`的转发业务。

**upstream转发流程如下图所示：**

![](https://blog.yuqiyu.com/images/post/use-nginx-loadbalance-upgrade-service-1.png)

### 配置UpStream

在`nginx.conf`文件`http`内添加转发的`服务器组`(upstream)，如下所示：

```
# 负载配置
upstream test {
	server 127.0.0.1:8080 weight=1;
	server 127.0.0.1:9090 weight=2;
	server 127.0.0.1:9000 backup;
}
```

### 配置Location

在上面已经配置好了服务器组，我们需要把名为`test`的服务器组作为代理的方式配置在`location`，在`location`的`server`下新增一个`location`，如下所示：

```
# 配置"/lb/"路径的请求全部转发到本地8080端口
location /lb/ {
	proxy_pass http://test/;
	proxy_set_header Host $host;
	proxy_set_header X-Real-IP $remote_addr;
	proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
	proxy_connect_timeout       50;
	proxy_read_timeout          50;
	proxy_send_timeout          50;
}
```

### 重启Nginx

我这里是使用`brew`的方式安装的`nginx`，所以重启的命令如下所示：

```bash
brew services restart nginx
```

如果你是`安装包`的方式安装：

```bash
# 进入安装包目录
cd /usr/local/nginx/sbin
# 重载
./nginx -s reload
```



## 权重配置

在`nginx`中有一个权重的概念，根据权重值的大小来控制请求流量，当权重的配值越大时，流量分发就会越多，我们在`test`服务器组内配置权重解释：

- `server 127.0.0.1:8080 weight 1;`  权重占比为`1/3`，每3次请求会转发1次到这台服务器上。
- `server 127.0.0.1:9090 weight 2;`  权重占比为`2/3`，每3次请求会转发2次到这台服务器上。

## 备用配置

当我们在`upstream`内的`server`尾部添加`backup`时，表示这台服务器是备用服务器，只有其他服务器都停机时才会启用，我们更新时其实就利用的这一点。

## 运行测试

为了演示方便我们直接将本章测试项目`package`打包后，通过`--server.port`来指定运行的端口号来模拟多台服务器的场景。

```bash
# 启动127.0.0.1:8080服务器
java -jar target/use-nginx-loadbalance-upgrade-service-0.0.1-SNAPSHOT.jar --server.port=8080
# 启动127.0.0.1:9090服务器
java -jar target/use-nginx-loadbalance-upgrade-service-0.0.1-SNAPSHOT.jar --server.port=9090
# 启动127.0.0.1:9000备用服务器
java -jar target/use-nginx-loadbalance-upgrade-service-0.0.1-SNAPSHOT.jar --server.port=9000
```

> 注意：使用多个终端窗口运行服务。

在`nginx.conf`>`server`中配置`location`的转发条件为`/lb/`路径前缀，所以我们访问 [http://127.0.0.1/lb/test](http://127.0.0.1/lb/test) （由于`nginx`监听的端口号是**80**，所以通过`nginx`访问转发时不需要携带端口号）就会被转发到`test`服务器组内的服务器上。

### 测试点：权重转发

```bash
curl http://localhost/lb/test
端口号：8080，接口访问成功.                                                                                                        

curl http://localhost/lb/test
端口号：9090，接口访问成功.

curl http://localhost/lb/test                                                                                                       
端口号：9090，接口访问成功.

curl http://localhost/lb/test                                                                                                      
端口号：8080，接口访问成功. 
```

根据访问的结果来看，`8080`端口号的服务是每3次中请求了`1次`，而`9090`则是每3次中请求了`2次`，这一点正是符合我们配置的权重（`weight`），测试通过。

### 测试点：备用生效

我们把`8080`、`9090`这两个服务都停掉，再次访问  [http://127.0.0.1/lb/test](http://127.0.0.1/lb/test) 。

```bash
curl http://localhost/lb/test
端口号：9000，接口访问成功.

curl http://localhost/lb/test                                                                                                       
端口号：9000，接口访问成功.      

curl http://localhost/lb/test                                                                                                  
端口号：9000，接口访问成功.
```

可以看到我们的备用服务器启用了，已经把全部的请求流量转发到`9000`这台服务上，测试通过。

## 敲黑板，划重点

当我们把`8080`、`9090`都停掉时，备用服务器会启用，这时我们就可以来更新`8080`、`9090`这两个服务的运行代码，更新完成后重启，只要`8080`、`9090`这两台服务器有一台处于运行状态，`nginx`就不会把流量分发到备用的`9000`，以此类推把全部的服务都更新完成。

## 代码示例
如果您喜欢本篇文章请为源码仓库点个`Star`，谢谢！！！
本篇文章示例源码可以通过以下途径获取，目录为`use-nginx-loadbalance-upgrade-service`：

- Gitee：[https://gitee.com/hengboy/spring-boot-chapter](https://gitee.com/hengboy/spring-boot-chapter/tree/2.x/)

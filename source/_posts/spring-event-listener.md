---
id: spring-event-listener
title: 业务解耦利器Event/Listener
article_type: 原创
article_author: 于起宇
enable_comment: true
news: true
tags: [SpringBoot]
categories: [SpringBoot]
date: 2019-09-29 14:39:50
keywords: event,listener,springboot
description: '业务解耦利器Event/Listener'
---
``ApplicationEvent``以及``Listener``是Spring为我们提供的一个事件监听、订阅的实现，内部实现原理是观察者设计模式，设计初衷也是为了系统业务逻辑之间的解耦，提高可扩展性以及可维护性。事件发布者并不需要考虑谁去监听，监听具体的实现内容是什么，发布者的工作只是为了发布事件而已。
<!--more-->
> 我们平时日常生活中也是经常会有这种情况存在，如：我们在平时拔河比赛中，裁判员给我们吹响了开始的信号，也就是给我们发布了一个开始的事件，而拔河双方人员都在监听着这个事件，一旦事件发布后双方人员就开始往自己方使劲。而裁判并不关心你比赛的过程，只是给你发布事件你执行就可以了。
# 本章目标
我们本章在``SpringBoot``平台上通过ApplicationEvents以及Listener来完成简单的注册事件流程。

# 构建项目
我们本章只是简单的讲解如何使用ApplicationEvent以及Listener来完成业务逻辑的解耦，不涉及到数据交互所以依赖需要引入的也比较少，项目pom.xml配置文件如下所示：
```xml
.....//省略
<dependencies>
		<!--web-->
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-web</artifactId>
		</dependency>
		<!--lombok-->
		<dependency>
			<groupId>org.projectlombok</groupId>
			<artifactId>lombok</artifactId>
			<version>1.16.16</version>
		</dependency>
		<!--test-->
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-test</artifactId>
			<scope>test</scope>
		</dependency>
	</dependencies>
.....//省略
```
其中lombok依赖大家有兴趣可以去深研究下，这是一个很好的工具，它可以结合Idea开发工具完成对实体的动态添加构造函数、Getter/Setter方法、toString方法等。

### 创建UserRegisterEvent事件
我们先来创建一个事件，监听都是围绕着事件来挂起的。事件代码如下所示：
```java
package com.yuqiyu.chapter27.event;

import com.yuqiyu.chapter27.bean.UserBean;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

/**
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2017/7/21
 * Time：10:08
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
@Getter
public class UserRegisterEvent extends ApplicationEvent
{
    //注册用户对象
    private UserBean user;

    /**
     * 重写构造函数
     * @param source 发生事件的对象
     * @param user 注册用户对象
     */
    public UserRegisterEvent(Object source,UserBean user) {
        super(source);
        this.user = user;
    }
}
```
我们自定义事件UserRegisterEvent继承了ApplicationEvent，继承后必须重载构造函数，构造函数的参数可以任意指定，其中source参数指的是发生事件的对象，一般我们在发布事件时使用的是this关键字代替本类对象，而user参数是我们自定义的注册用户对象，该对象可以在监听内被获取。
> 在Spring内部中有多种方式实现监听如：@EventListener注解、实现ApplicationListener泛型接口、实现SmartApplicationListener接口等，我们下面来讲解下这三种方式分别如何实现。

### 创建UserBean
我们简单创建一个用户实体，并添加两个字段：用户名、密码。实体代码如下所示：
```java
package com.yuqiyu.chapter27.bean;
import lombok.Data;
/**
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2017/7/21
 * Time：10:05
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
@Data
public class UserBean
{
    //用户名
    private String name;
    //密码
    private String password;
}
```
### 创建UserService
UserService内添加一个注册方法，该方法只是实现注册事件发布功能，代码如下所示：
```java
package com.yuqiyu.chapter27.service;

import com.yuqiyu.chapter27.bean.UserBean;
import com.yuqiyu.chapter27.event.UserRegisterEvent;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;

/**
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2017/7/21
 * Time：10:11
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
@Service
public class UserService
{
    @Autowired
    ApplicationContext applicationContext;

    /**
     * 用户注册方法
     * @param user
     */
    public void register(UserBean user)
    {
        //../省略其他逻辑

        //发布UserRegisterEvent事件
        applicationContext.publishEvent(new UserRegisterEvent(this,user));
    }
}

```
事件发布是由ApplicationContext对象管控的，我们发布事件前需要注入ApplicationContext对象调用publishEvent方法完成事件发布。
### 创建UserController
创建一个@RestController控制器，对应添加一个注册方法简单实现，代码如下所示：
```java
package com.yuqiyu.chapter27.controller;

import com.yuqiyu.chapter27.bean.UserBean;
import com.yuqiyu.chapter27.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 用户控制器
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2017/7/21
 * Time：10:05
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
@RestController
public class UserController
{
    //用户业务逻辑实现
    @Autowired
    private UserService userService;

    /**
     * 注册控制方法
     * @param user 用户对象
     * @return
     */
    @RequestMapping(value = "/register")
    public String register
            (
                    UserBean user
            )
    {
        //调用注册业务逻辑
        userService.register(user);
        return "注册成功.";
    }
}
```
### @EventListener实现监听
注解方式比较简单，并不需要实现任何接口，具体代码实现如下所示：
```java
package com.yuqiyu.chapter27.listener;

import com.yuqiyu.chapter27.bean.UserBean;
import com.yuqiyu.chapter27.event.UserRegisterEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * 使用@EventListener方法实现注册事件监听
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2017/7/21
 * Time：10:50
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
@Component
public class AnnotationRegisterListener {

    /**
     * 注册监听实现方法
     * @param userRegisterEvent 用户注册事件
     */
    @EventListener
    public void register(UserRegisterEvent userRegisterEvent)
    {
        //获取注册用户对象
        UserBean user = userRegisterEvent.getUser();

        //../省略逻辑

        //输出注册用户信息
        System.out.println("@EventListener注册信息，用户名："+user.getName()+"，密码："+user.getPassword());
    }
}
```
我们只需要让我们的监听类被Spring所管理即可，在我们用户注册监听实现方法上添加@EventListener注解，该注解会根据方法内配置的事件完成监听。下面我们启动项目来测试下我们事件发布时是否被监听者所感知。
#### 测试事件监听
使用SpringBootApplication方式启动成功后，我们来访问下地址：[http://127.0.0.1:8080/register?name=admin&password=123456](http://127.0.0.1:8080/register?name=admin&password=123456)，界面输出内容肯定是“注册成功”，这个是没有问题的，我们直接查看控制台输出内容，如下所示：
```bash
2017-07-21 11:09:52.532  INFO 10460 --- [nio-8080-exec-1] o.a.c.c.C.[Tomcat].[localhost].[/]       : Initializing Spring FrameworkServlet 'dispatcherServlet'
2017-07-21 11:09:52.532  INFO 10460 --- [nio-8080-exec-1] o.s.web.servlet.DispatcherServlet        : FrameworkServlet 'dispatcherServlet': initialization started
2017-07-21 11:09:52.545  INFO 10460 --- [nio-8080-exec-1] o.s.web.servlet.DispatcherServlet        : FrameworkServlet 'dispatcherServlet': initialization completed in 13 ms
@EventListener注册信息，用户名：admin，密码：123456
```
可以看到我们使用@EventListener注解配置的监听已经生效了，当我们在UserService内发布了注册事件时，监听方法自动被调用并且输出内信息到控制台。

### ApplicationListener实现监听
这种方式也是Spring之前比较常用的监听事件方式，在实现ApplicationListener接口时需要将监听事件作为泛型传递，监听实现代码如下所示：
```java
package com.yuqiyu.chapter27.listener;

import com.yuqiyu.chapter27.bean.UserBean;
import com.yuqiyu.chapter27.event.UserRegisterEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.stereotype.Component;

/**
 * 原始方式实现
 * 用户注册监听
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2017/7/21
 * Time：10:24
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
@Component
public class RegisterListener implements ApplicationListener<UserRegisterEvent>
{
    /**
     * 实现监听
     * @param userRegisterEvent
     */
    @Override
    public void onApplicationEvent(UserRegisterEvent userRegisterEvent) {
        //获取注册用户对象
        UserBean user = userRegisterEvent.getUser();

        //../省略逻辑

        //输出注册用户信息
        System.out.println("注册信息，用户名："+user.getName()+"，密码："+user.getPassword());
    }
}
```
我们实现接口后需要使用@Component注解来声明该监听需要被Spring注入管理，当有UserRegisterEvent事件发布时监听程序会自动调用onApplicationEvent方法并且将UserRegisterEvent对象作为参数传递。
我们UserService内的发布事件不需要修改，我们重启下项目再次访问之前的地址查看控制台输出的内容如下所示：
```bash
2017-07-21 13:03:35.399  INFO 4324 --- [nio-8080-exec-2] o.a.c.c.C.[Tomcat].[localhost].[/]       : Initializing Spring FrameworkServlet 'dispatcherServlet'
2017-07-21 13:03:35.399  INFO 4324 --- [nio-8080-exec-2] o.s.web.servlet.DispatcherServlet        : FrameworkServlet 'dispatcherServlet': initialization started
2017-07-21 13:03:35.411  INFO 4324 --- [nio-8080-exec-2] o.s.web.servlet.DispatcherServlet        : FrameworkServlet 'dispatcherServlet': initialization completed in 12 ms
注册信息，用户名：admin，密码：123456
```
我们看到了控制台打印了我们监听内输出用户信息，事件发布后就不会考虑具体哪个监听去处理业务，甚至可以存在多个监听同时需要处理业务逻辑。

> 我们在注册时如果不仅仅是记录注册信息到数据库，还需要发送邮件通知用户，当然我们可以创建多个监听同时监听UserRegisterEvent事件，接下来我们先来实现这个需求。

### 邮件通知监听
我们使用注解的方式来完成邮件发送监听实现，代码如下所示：
```java
package com.yuqiyu.chapter27.listener;

import com.yuqiyu.chapter27.event.UserRegisterEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * 注册用户事件发送邮件监听
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2017/7/21
 * Time：13:08
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
@Component
public class RegisterUserEmailListener
{
    /**
     * 发送邮件监听实现
     * @param userRegisterEvent 用户注册事件
     */
    @EventListener
    public void sendMail(UserRegisterEvent userRegisterEvent)
    {
        System.out.println("用户注册成功，发送邮件。");
    }
}
```
监听编写完成后，我们重启项目，再次访问注册请求地址查看控制台输出内容如下所示：
```bash
2017-07-21 13:09:20.671  INFO 7808 --- [nio-8080-exec-1] o.a.c.c.C.[Tomcat].[localhost].[/]       : Initializing Spring FrameworkServlet 'dispatcherServlet'
2017-07-21 13:09:20.671  INFO 7808 --- [nio-8080-exec-1] o.s.web.servlet.DispatcherServlet        : FrameworkServlet 'dispatcherServlet': initialization started
2017-07-21 13:09:20.685  INFO 7808 --- [nio-8080-exec-1] o.s.web.servlet.DispatcherServlet        : FrameworkServlet 'dispatcherServlet': initialization completed in 14 ms
用户注册成功，发送邮件。
注册信息，用户名：admin，密码：123456
```
我们看到控制台输出的内容感到比较疑惑，我注册时用户信息写入数据库应该在发送邮件前面，为什么没有在第一步执行呢？
好了，证明了一点，事件监听是无序的，监听到的事件先后顺序完全随机出现的。我们接下来使用SmartApplicationListener实现监听方式来实现该逻辑。

### SmartApplicationListener实现有序监听
我们对注册用户以及发送邮件的监听重新编写，注册用户写入数据库监听代码如下所示：
```java
package com.yuqiyu.chapter27.listener;

import com.yuqiyu.chapter27.bean.UserBean;
import com.yuqiyu.chapter27.event.UserRegisterEvent;
import com.yuqiyu.chapter27.service.UserService;
import org.springframework.context.ApplicationEvent;
import org.springframework.context.event.SmartApplicationListener;
import org.springframework.stereotype.Component;

/**
 * 用户注册>>>保存用户信息监听
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2017/7/21
 * Time：10:09
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
@Component
public class UserRegisterListener implements SmartApplicationListener
{
    /**
     *  该方法返回true&supportsSourceType同样返回true时，才会调用该监听内的onApplicationEvent方法
     * @param aClass 接收到的监听事件类型
     * @return
     */
    @Override
    public boolean supportsEventType(Class<? extends ApplicationEvent> aClass) {
        //只有UserRegisterEvent监听类型才会执行下面逻辑
        return aClass == UserRegisterEvent.class;
    }

    /**
     *  该方法返回true&supportsEventType同样返回true时，才会调用该监听内的onApplicationEvent方法
     * @param aClass
     * @return
     */
    @Override
    public boolean supportsSourceType(Class<?> aClass) {
        //只有在UserService内发布的UserRegisterEvent事件时才会执行下面逻辑
        return aClass == UserService.class;
    }

    /**
     *  supportsEventType & supportsSourceType 两个方法返回true时调用该方法执行业务逻辑
     * @param applicationEvent 具体监听实例，这里是UserRegisterEvent
     */
    @Override
    public void onApplicationEvent(ApplicationEvent applicationEvent) {

        //转换事件类型
        UserRegisterEvent userRegisterEvent = (UserRegisterEvent) applicationEvent;
        //获取注册用户对象信息
        UserBean user = userRegisterEvent.getUser();
        //.../完成注册业务逻辑
        System.out.println("注册信息，用户名："+user.getName()+"，密码："+user.getPassword());
    }

    /**
     * 同步情况下监听执行的顺序
     * @return
     */
    @Override
    public int getOrder() {
        return 0;
    }
}
```
> SmartApplicationListener接口继承了全局监听ApplicationListener，并且泛型对象使用的ApplicationEvent来作为全局监听，可以理解为使用SmartApplicationListener作为监听父接口的实现，监听所有事件发布。

既然是监听所有的事件发布，那么SmartApplicationListener接口添加了两个方法supportsEventType、supportsSourceType来作为区分是否是我们监听的事件，只有这两个方法同时返回true时才会执行onApplicationEvent方法。

可以看到除了上面的方法，还提供了一个getOrder方法，这个方法就可以解决执行监听的顺序问题，return的数值越小证明优先级越高，执行顺序越靠前。

注册成功发送邮件通知监听代码如下所示：
```java
package com.yuqiyu.chapter27.listener.order;

import com.yuqiyu.chapter27.bean.UserBean;
import com.yuqiyu.chapter27.event.UserRegisterEvent;
import com.yuqiyu.chapter27.service.UserService;
import org.springframework.context.ApplicationEvent;
import org.springframework.context.event.SmartApplicationListener;
import org.springframework.stereotype.Component;

/**
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2017/7/21
 * Time：13:38
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
@Component
public class UserRegisterSendMailListener implements SmartApplicationListener
{
    /**
     *  该方法返回true&supportsSourceType同样返回true时，才会调用该监听内的onApplicationEvent方法
     * @param aClass 接收到的监听事件类型
     * @return
     */
    @Override
    public boolean supportsEventType(Class<? extends ApplicationEvent> aClass) {
        //只有UserRegisterEvent监听类型才会执行下面逻辑
        return aClass == UserRegisterEvent.class;
    }

    /**
     *  该方法返回true&supportsEventType同样返回true时，才会调用该监听内的onApplicationEvent方法
     * @param aClass
     * @return
     */
    @Override
    public boolean supportsSourceType(Class<?> aClass) {
        //只有在UserService内发布的UserRegisterEvent事件时才会执行下面逻辑
        return aClass == UserService.class;
    }

    /**
     *  supportsEventType & supportsSourceType 两个方法返回true时调用该方法执行业务逻辑
     * @param applicationEvent 具体监听实例，这里是UserRegisterEvent
     */
    @Override
    public void onApplicationEvent(ApplicationEvent applicationEvent) {
        //转换事件类型
        UserRegisterEvent userRegisterEvent = (UserRegisterEvent) applicationEvent;
        //获取注册用户对象信息
        UserBean user = userRegisterEvent.getUser();
        System.out.println("用户："+user.getName()+"，注册成功，发送邮件通知。");
    }

    /**
     * 同步情况下监听执行的顺序
     * @return
     */
    @Override
    public int getOrder() {
        return 1;
    }
}
```
在getOrder方法内我们返回的数值为“1”，这就证明了需要在保存注册用户信息监听后执行，下面我们重启项目访问注册地址查看控制台输出内容如下所示：
```bash
2017-07-21 13:40:43.104  INFO 10128 --- [nio-8080-exec-1] o.a.c.c.C.[Tomcat].[localhost].[/]       : Initializing Spring FrameworkServlet 'dispatcherServlet'
2017-07-21 13:40:43.104  INFO 10128 --- [nio-8080-exec-1] o.s.web.servlet.DispatcherServlet        : FrameworkServlet 'dispatcherServlet': initialization started
2017-07-21 13:40:43.119  INFO 10128 --- [nio-8080-exec-1] o.s.web.servlet.DispatcherServlet        : FrameworkServlet 'dispatcherServlet': initialization completed in 15 ms
注册信息，用户名：admin，密码：123456
用户：admin，注册成功，发送邮件通知。
```
这次我们看到了输出的顺序就是正确的了，先保存信息然后再发送邮件通知。

> 如果说我们不希望在执行监听时等待监听业务逻辑耗时，发布监听后立即要对接口或者界面做出反映，我们该怎么做呢？

### 使用@Async实现异步监听
@Aysnc其实是Spring内的一个组件，可以完成对类内单个或者多个方法实现异步调用，这样可以大大的节省等待耗时。内部实现机制是线程池任务ThreadPoolTaskExecutor，通过线程池来对配置@Async的方法或者类做出执行动作。

#### 线程任务池配置
我们创建一个ListenerAsyncConfiguration，并且使用@EnableAsync注解开启支持异步处理，具体代码如下所示：
```java
package com.yuqiyu.chapter27;

import org.springframework.aop.interceptor.AsyncUncaughtExceptionHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * 异步监听配置
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2017/7/21
 * Time：14:04
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
@Configuration
@EnableAsync
public class ListenerAsyncConfiguration implements AsyncConfigurer
{
    /**
     * 获取异步线程池执行对象
     * @return
     */
    @Override
    public Executor getAsyncExecutor() {
        //使用Spring内置线程池任务对象
        ThreadPoolTaskExecutor taskExecutor = new ThreadPoolTaskExecutor();
        //设置线程池参数
        taskExecutor.setCorePoolSize(5);
        taskExecutor.setMaxPoolSize(10);
        taskExecutor.setQueueCapacity(25);
        taskExecutor.initialize();
        return taskExecutor;
    }

    @Override
    public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
        return null;
    }
}
```
我们自定义的监听异步配置类实现了AsyncConfigurer接口并且实现内getAsyncExecutor方法以提供线程任务池对象的获取。
我们只需要在异步方法上添加@Async注解就可以实现方法的异步调用，为了证明这一点，我们在发送邮件onApplicationEvent方法内添加线程阻塞3秒，修改后的代码如下所示：
```java
 /**
     * supportsEventType & supportsSourceType 两个方法返回true时调用该方法执行业务逻辑
     * @param applicationEvent 具体监听实例，这里是UserRegisterEvent
     */
    @Override
    @Async
    public void onApplicationEvent(ApplicationEvent applicationEvent) {
        try {
            Thread.sleep(3000);//静静的沉睡3秒钟
        }catch (Exception e)
        {
            e.printStackTrace();
        }
        //转换事件类型
        UserRegisterEvent userRegisterEvent = (UserRegisterEvent) applicationEvent;
        //获取注册用户对象信息
        UserBean user = userRegisterEvent.getUser();
        System.out.println("用户："+user.getName()+"，注册成功，发送邮件通知。");
    }
```
下面我们重启下项目，访问注册地址，查看界面反映是否也有延迟。
我们测试发现访问界面时反映速度要不之前还要快一些，我们去查看控制台时，可以看到注册信息输出后等待3秒后再才输出邮件发送通知，而在这之前界面已经做出了反映。

> 注意：如果存在多个监听同一个事件时，并且存在异步与同步同时存在时则不存在执行顺序。

# 总结
我们在传统项目中往往各个业务逻辑之间耦合性较强，因为我们在service都是直接引用的关联service或者jpa来作为协作处理逻辑，然而这种方式在后期更新、维护性难度都是大大提高了。然而我们采用事件通知、事件监听形式来处理逻辑时耦合性则是可以降到最小。

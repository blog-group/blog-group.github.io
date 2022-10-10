---
id: spring-boot-basic-events-and-listeners
title: SpringBoot2.x基础篇：应用程序在启动时发布ApplicationEvents要怎么注册监听？
sort_title: SpringBoot2.x监听应用程序在启动时发布Events
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: false
news: true
disable_toc: false
customize: false
tags: [SpringBoot2.x]
categories: [SpringBoot]
keywords: 'springboot,event,listener'
date: 2020-02-25 17:29:22
article_url:
description: 'SpringBoot2.x基础篇：应用程序在启动时发布ApplicationEvents要怎么注册监听？'
---

在`SpringFramework`编写过程中使用了大量的`Event/Listener`来做一些解耦的任务工作，当然在`SpringBoot`内同样也沿用了这一点，如果你看过我写的 [业务解耦利器Event/Listener](https://blog.minbox.org/spring-event-listener.html) ，你应该了解事件的发布都是由`ApplicationContext`进行控制，但是在`SpringBoot`启动过程中有一些`Event`是在`ApplicationContext`实例化之前发布的，那我们要怎么去监听这些`Events`呢？

<!--more-->
## 推荐阅读
- [SpringBoot2.x 教程汇总](http://blog.minbox.org/spring-boot-2-x-articles.html)


## ApplicationEvents

在`SpringBoot`编写的应用程序启动过程中会发布一些`Event`，它们都是`org.springframework.boot.context.event.SpringApplicationEvent`的实现类，分别对应了应用程序在启动过程中的每一个生命周期阶段，`ApplicationEvents`在应用程序运行过程中顺序如下图所示：

![](https://blog.minbox.org/images/post/spring-boot-basic-events-and-listeners/ApplicationEvents.png)

- `ApplicationStartingEvent` 在应用程序开始运行时发布。

- `ApplicationEnvironmentPreparedEvent` 在`ApplicationContext`使用应用环境时并在创建`ApplicationContext`之前发布。

- `ApplicationContextInitializedEvent` 在准备`ApplicationContext`并调用`ApplicationContextInitializers`之后但在加载任何`Bean`之前发布。

- `ApplicationPreparedEvent` 在刷新开始之前但在加载bean定义之后发布。

- `ApplicationStartedEvent` 在刷新`ApplicationContext`之后但在调用任何应用程序和命令行运行程序之前发布。

- `ApplicationReadyEvent` 在调用任何应用程序和命令行运行程序之后发布。 表示应用程序已准备就绪，可以处理请求。

- `ApplicationFailedEvent` 在应用程序启动时发生异常后发布。

上图中是继承于`SpringApplicationEvent`事件的全部子类，而且这些事件都有一个共性，使用`@Bean`标注的监听器是没有办法监听到的，主要原因还是有些事件在`ApplicationContext`创建之前就已经发布了，那我们该怎么进行注册监听呢？继续往下看，你就会明白了。

## 创建示例Event

下面我们来创建一个`ApplicationStartedEvent`事件的示例监听器，在项目启动时打印系统的全部环境变量，如下所示：

```java
/**
 * {@link ApplicationStartedEvent} 示例
 *
 * @author 恒宇少年
 */
public class ApplicationStartedEventListener implements SmartApplicationListener {
  @Override
  public boolean supportsEventType(Class<? extends ApplicationEvent> eventType) {
    // 判断事件的类型，只监听ApplicationStartedEvent事件类型
    return eventType == ApplicationStartedEvent.class;
  }

  @Override
  public void onApplicationEvent(ApplicationEvent event) {
    // 将ApplicationEvent转换为ApplicationStartedEvent实例
    ApplicationStartedEvent startedEvent = (ApplicationStartedEvent) event;
    ConfigurableEnvironment environment = startedEvent.getApplicationContext().getEnvironment();
    // 获取系统环境变量
    Map<String, Object> props = environment.getSystemEnvironment();
    Iterator<String> iterator = props.keySet().iterator();
    while (iterator.hasNext()) {
      String key = iterator.next();
      Object value = props.get(key);
      System.out.println("Key : " + key + " , Value : " + value);
    }
    System.out.println("启动成功了.");
  }
}
```



## 监听ApplicationEvents

`SpringApplicationEvent`类型的事件有**两种方式**可以实现注册监听器，我么可以通过启动类`SpringApplication#addListeners`方法进行手动注册，也可以在`META-INF`目录下创建`spring.factories`文件来自动注册，接下来我们分别介绍下使用方式。

### 手动注册

手动注册是通过`SpringApplication#addListeners`方法实现，如下所示：

```java
@SpringBootApplication
public class DevelopingFirstApplication {

  public static void main(String[] args) {
    // 注释掉原启动方式
    //SpringApplication.run(DevelopingFirstApplication.class, args);
	
    // 手动实例化SpringApplication方式
    SpringApplication application = new SpringApplication(DevelopingFirstApplication.class);
    // 添加注册监听器
    application.addListeners(new ApplicationStartedEventListener());
    // 启动应用程序
    application.run(args);

  }
}
```

> 由于我们需要使用`addListeners`方法，原本`SpringApplication#run`方法的使用需要进行修改。

### 自动注册

自动注册相对于手动注册比较简单明了，我们只需要在`resources/META-INF`目录下创建名为`spring.factories`的文件，内容如下所示：

```
org.springframework.context.ApplicationListener=\
  org.minbox.chapter.developing.first.application.ApplicationStartedEventListener
```

`org.springframework.context.ApplicationListener`用来配置接收事件监听器列表。

由于内部采用的是反射的机制，所以我们在配置监听器时要填写`类全路径`，如果有多个监听器需要配置时在末尾添加`,\`，如下所示：

```
org.springframework.context.ApplicationListener=\
  org.minbox.chapter.developing.first.application.ApplicationStartedEventListener,\
  org.minbox.chapter.developing.first.application.ApplicationStartedEventListener
```



## 运行测试

当我们应用启动成功后会在控制台看到以下内容：

```

  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::        (v2.2.4.RELEASE)
......
2020-02-27 15:39:00.723  INFO 1630 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat started on port(s): 8080 (http) with context path ''
2020-02-27 15:39:00.725  INFO 1630 --- [           main] o.m.c.d.f.a.DevelopingFirstApplication   : Started DevelopingFirstApplication in 1.343 seconds (JVM running for 1.938)

Key : PATH , Value : /usr/local/opt/node@10/bin:/usr/local/opt/node@10/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/MacGPG2/bin:/Users/yuqiyu/soft/apache-maven-3.6.3/bin
Key : SHELL , Value : /bin/zsh
Key : PAGER , Value : less
Key : LSCOLORS , Value : Gxfxcxdxbxegedabagacad
Key : OLDPWD , Value : /Applications/IntelliJ IDEA.app/Contents/bin
Key : USER , Value : yuqiyu
Key : ZSH , Value : /Users/yuqiyu/.oh-my-zsh
Key : TMPDIR , Value : /var/folders/f3/5bk_kqsn3ljf3z2ccjqcx4440000gn/T/
Key : SSH_AUTH_SOCK , Value : /private/tmp/com.apple.launchd.VyfCdMBxH6/Listeners
Key : XPC_FLAGS , Value : 0x0
Key : VERSIONER_PYTHON_VERSION , Value : 2.7
Key : M2_HOME , Value : /Users/yuqiyu/soft/apache-maven-3.6.3
Key : __CF_USER_TEXT_ENCODING , Value : 0x1F5:0x19:0x34
Key : LOGNAME , Value : yuqiyu
Key : LESS , Value : -R
Key : JAVA_MAIN_CLASS_1630 , Value : org.minbox.chapter.developing.first.application.DevelopingFirstApplication
Key : LC_CTYPE , Value : zh_CN.UTF-8
Key : PWD , Value : /Users/yuqiyu/study/article-source-code/spring-boot-chapter/developing-first-application
Key : XPC_SERVICE_NAME , Value : com.jetbrains.intellij.9644
Key : HOME , Value : /Users/yuqiyu
启动成功了.

```



## 总结

其实有很多事件并不是经常使用的，我们也应该知道它们的存在，这样方便在有业务使用时能够得心应手，在`SpringBoot`内部是使用事件来处理各种任务的，而从本文来看，了解应用启动的生命周期也是尤为重要的。
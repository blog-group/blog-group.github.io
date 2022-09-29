---
id: spring-get-application-context
title: 非注入方式获取ApplicationContext上下文
article_type: 原创
article_author: 于起宇
enable_comment: true
news: true
tags:
  - 技术杂谈
categories:
  - 技术杂谈
date: 2019-09-29 15:09:53
keywords: context,spring,springboot
description: '非注入方式获取ApplicationContext上下文'
---
``ApplicationContext``对象是``Spring``开源框架的上下文对象实例，在项目运行时自动装载``Handler``内的所有信息到内存。传统的获取方式有很多种，不过随着``Spring``版本的不断迭代，官方也慢慢的不建议使用部分方式。下面我简单介绍一种``Spring``官方推荐使用的方式！
<!--more-->
# 本章目标
基于SpringBoot平台完成``ApplicationContext``对象的获取，并通过实例手动获取``Spring``管理的``bean``.

# 构建项目
本章项目不需要太多的内容，添加Web依赖就可以了。

## ApplicationContextAware
这个接口对象就是我们今天的主角，其实以实现``ApplicationContextAware``接口的方式获取``ApplicationContext``对象实例并不是SpringBoot特有的功能，早在Spring3.0x版本之后就存在了这个接口，在传统的``Spring``项目内同样是可以获取到``ApplicationContext``实例的，下面我们看看该如何编码才能达到我们的效果呢？
### 实现ApplicationContextAware接口
创建一个实体类并实现``ApplicationContextAware``接口，重写接口内的``setApplicationContext``方法来完成获取``ApplicationContext``实例的方法，代码如下所示：
```java
package com.xunmei.api;

import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.stereotype.Component;

/**
 * 获取Spring上下文对象
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2017/8/26
 * Time：23:25
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
@Component
public class ApplicationContextProvider
    implements ApplicationContextAware
{
    /**
     * 上下文对象实例
     */
    private ApplicationContext applicationContext;

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        this.applicationContext = applicationContext;
    }

    /**
     * 获取applicationContext
     * @return
     */
    public ApplicationContext getApplicationContext() {
        return applicationContext;
    }

    /**
     * 通过name获取 Bean.
     * @param name
     * @return
     */
    public Object getBean(String name){
        return getApplicationContext().getBean(name);
    }

    /**
     * 通过class获取Bean.
     * @param clazz
     * @param <T>
     * @return
     */
    public <T> T getBean(Class<T> clazz){
        return getApplicationContext().getBean(clazz);
    }

    /**
     * 通过name,以及Clazz返回指定的Bean
     * @param name
     * @param clazz
     * @param <T>
     * @return
     */
    public <T> T getBean(String name,Class<T> clazz){
        return getApplicationContext().getBean(name, clazz);
    }
}
```
我们拿到``ApplicationContext``对象实例后就可以手动获取``Bean``的注入实例对象，在``ApplicationContextProvider``类内我简单的实现了几个方法来获取指定的``Bean``实例，当然你可以添加更多的方法来完成更多的业务逻辑。

如果你是想在非``Spring``管理的实体内使用``ApplicationContext``还不想采用注入``ApplicationContextProvider``来完成实例化，这时我们可以修改``ApplicationContext``实例对象为静态实例，方法改为静态方法，这样在外部同样是可以获取到指定``Bean``的实例。如下所示：
```java
@Component
public class ApplicationContextProvider
    implements ApplicationContextAware
{
    /**
     * 上下文对象实例
     */
    private static ApplicationContext applicationContext;

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        this.applicationContext = applicationContext;
    }

    /**
     * 获取applicationContext
     * @return
     */
    public static ApplicationContext getApplicationContext() {
        return applicationContext;
    }

    /**
     * 通过name获取 Bean.
     * @param name
     * @return
     */
    public static Object getBean(String name){
        return getApplicationContext().getBean(name);
    }

    /**
     * 通过class获取Bean.
     * @param clazz
     * @param <T>
     * @return
     */
    public static <T> T getBean(Class<T> clazz){
        return getApplicationContext().getBean(clazz);
    }

    /**
     * 通过name,以及Clazz返回指定的Bean
     * @param name
     * @param clazz
     * @param <T>
     * @return
     */
    public static <T> T getBean(String name,Class<T> clazz){
        return getApplicationContext().getBean(name, clazz);
    }
}
```
这里要注意``ApplicationContextProvider``类上的``@Component``注解是不可以去掉的，去掉后``Spring``就不会自动调用``setApplicationContext``方法来为我们设置上下文实例。

# 总结
本章内容较少，主要讲解了``SpringBoot``平台下采用``ApplicationContextAware``的方式完成``ApplicationContext``实例的获取，并通过``ApplicationContext``实例完成对``Spring``管理的``Bean``实例手动获取。
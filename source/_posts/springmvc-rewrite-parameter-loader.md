---
id: springmvc-rewrite-parameter-loader
title: 重写SpringMvc参数装载方式
article_type: 原创
article_author: 于起宇
enable_comment: true
news: true
tags:
  - 技术杂谈
categories:
  - 技术杂谈
date: 2019-09-29 15:23:28
keywords: SpringCloud,SpringBoot,恒宇少年,请求参数
description: '重写SpringMvc参数装载方式'
---
在国内企业开发项目中大多数都已经偏向``Spring``家族式的开发风格，在前几年国内项目都是以``Structs2``作为``Web``开发的主导，不过由于近几年发生的事情确实让开发者对它失去了以往的信心。与此同时``Spring``家族发布了``SpringMVC``，而且完美的整合``Spring``来开发企业级大型``Web``项目。它有着比``Structs2``更强大的技术支持以及更灵活的自定义配置，接下来我们就看看本章的内容，我们自定义实现``SpringMVC``参数绑定规则，根据业务定制参数装载实现方式。
<!--more-->
# 本章目标
根据项目定制``SpringMVC``参数状态并了解``SpringMVC``的装载过程以及实现方式。

# 构建项目
我们先来创建一个``SpringBoot``项目，添加本章所需的依赖，pom.xml配置文件如下所示：
```xml
...//省略部分配置
<dependencies>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
  </dependency>
  <!-- spring boot tomcat jsp 支持开启 -->
  <dependency>
    <groupId>org.apache.tomcat.embed</groupId>
    <artifactId>tomcat-embed-jasper</artifactId>
  </dependency>
  <!--servlet支持开启-->
  <dependency>
    <groupId>javax.servlet</groupId>
    <artifactId>javax.servlet-api</artifactId>
  </dependency>
  <!-- jstl 支持开启 -->
  <dependency>
    <groupId>javax.servlet</groupId>
    <artifactId>jstl</artifactId>
  </dependency>
  <!--lombok支持-->
  <dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
  </dependency>
  <!--fastjson支持-->
  <dependency>
    <groupId>com.alibaba</groupId>
    <artifactId>fastjson</artifactId>
    <version>1.2.38</version>
  </dependency>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
  </dependency>
</dependencies>
...//省略部分配置
```
本章需要``JSP``相关的依赖支持，所以需要添加对应的依赖，修改``application.properties``配置文件让``JSP``生效，配置内容如下所示：
```
spring.mvc.view.prefix=/WEB-INF/jsp/
spring.mvc.view.suffix=.jsp
```
相关``JSP``配置可以访问[第二章：SpringBoot与JSP间不可描述的秘密](http://www.jianshu.com/p/90a84c814d0c)查看讲解。

### SpringMVC的参数装载
在讲解我们自定义参数装载之前，我们先来看看``SpringMVC``内部为我们提供的参数装载方式。
###### 添加测试JSP
我们首先来添加一个测试的jsp页面，页面上添加一些输入元素，代码如下所示：
```html
<%--
  Created by IntelliJ IDEA.
  User: hengyu
  Date: 2017/9/17
  Time: 10:33
  To change this template use File | Settings | File Templates.
--%>
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<html>
<head>
    <title>Title</title>
</head>
<body>
    <form method="post" action="/submit">
        教师姓名：<input type="text" name="name"/><br/><br/>
        学生姓名：<input type="text" name="name"/><br/><br/>
        学生年龄：<input type="text" name="age"/><br/><br/>
        <input type="submit"/>
    </form>
</body>
</html>
```
在``index.jsp``内添加了三个``name``的文本输入框，如果我们现在提交到后台``SpringMVC``为默认为我们解析成一个数组，如果根据描述而言的来处理则是不合理的，当然也可以使用各种手段完成字段参数的装载，比如：为教师的``name``添加一个数组或者List集合进行接受，这种方式也是可以实现但``不优雅``。

> 如果你们项目组有严格的开发规范要求，这种方式是不允许出现在``Controller``方法内的。

那这个问题就让人头疼了，在之前我们使用``Struct2``的时候是可以根据指定的前缀，如：``xxx.xxx``来进行映射的，而``SpringMVC``并没有提供这个支持，不过它提供了自定义参数装载的实现方法，那就没有问题了，我们可以手写。

### 自定义的参数装载
既然上面的代码实现满足不了我们的需求，那么我接下来就来重写参数装载。
##### 创建ParameterModel注解
对于一直使用``SpringMVC``的朋友来说，应该对``@RequestParam``很熟悉，而本章我们自定义的注解跟``@RequestParam``类似，主要目的也是标识指定参数完成数据的绑定。下面我们先来看看该注解的源码，如下所示：
```java
package com.yuqiyu.chapter36.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 参数实体映射注解
 * 配置该注解的参数会使用 com.yuqiyu.chapter36.resovler.CustomerArgumentResolver类完成参数装载
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2017/9/16
 * Time：22:19
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
@Target(value = ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
public @interface ParameterModel
{
}
```
该注解目前没有添加任何一个属性，这个也是可以根据项目的需求已经业务逻辑进行相应添加的，比如``@RequestParam``内常用的属性``required``、``defaultValue``等属性，由于我们本章内容不需要自定义注解内的属性所以这里就不添加了。

该注解的作用域是在参数上``@Target(value = ElementType.PARAMETER)``，我们仅可以在方法参数上使用。

### 创建参数接受实体
我们可以回到上面看看``index.jsp``的内容，我们需要教师的基本信息以及学生的基本信息，那我们就为教师、以及学生创建实体（注意：这个实体可以是对应数据库内的实体）

###### 教师实体
```java
package com.yuqiyu.chapter36.bean;

import lombok.Data;

/**
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2017/9/17
 * Time：10:40
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
@Data
public class TeacherEntity {
    //教师姓名
    private String name;
}
```
教师实体内目前为了测试就添加一个跟页面参数有关的字段。
###### 学生实体
```java
package com.yuqiyu.chapter36.bean;

import lombok.Data;

/**
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2017/9/17
 * Time：10:41
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
@Data
public class StudentEntity {
    //学生姓名
    private String name;
    //年龄
    private String age;
}
```
学生实体添加与页面参数对应的字段，名称、年龄。

### 编写CustomerArgumentResolver参数装载
在写参数装载之前，我们需要先了解下它的接口``HandlerMethodArgumentResolver``，该接口内定义了两个方法：
###### supportsParameter
```java
boolean supportsParameter(MethodParameter var1);
```
``supportsParameter``方法顾名思义，是允许装载的参数，也就是说方法返回``true``时才会指定装载方法完成参数装载。

###### resolveArgument
```java
Object resolveArgument(MethodParameter var1, ModelAndViewContainer var2, NativeWebRequest var3, WebDataBinderFactory var4) throws Exception;
```
``resolveArgument``方法是参数状态的实现逻辑方法，该方法返回的值会直接装载到指定的参数上，有木有很神奇啊？下面我们就创建实现类来揭开这位神奇的姑娘的面纱吧！

创建``CustomerArgumentResolver``实现接口``HandlerMethodArgumentResolver``内的两个方法，具体实现代码如下所示：
```java
package com.yuqiyu.chapter36.resovler;

import com.yuqiyu.chapter36.annotation.ParameterModel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeanUtils;
import org.springframework.core.MethodParameter;
import org.springframework.core.convert.ConversionService;
import org.springframework.core.convert.TypeDescriptor;
import org.springframework.util.StringUtils;
import org.springframework.validation.DataBinder;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;
import org.springframework.web.servlet.HandlerMapping;

import java.lang.reflect.Field;
import java.util.*;

/**
 * 自定义参数装载
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2017/9/16
 * Time：22:11
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
public class CustomerArgumentResolver
    implements HandlerMethodArgumentResolver
{
    /**
     * 日志对象
     */
    private Logger logger = LoggerFactory.getLogger(CustomerArgumentResolver.class);
    /**
     * 该方法返回true时调用resolveArgument方法执行逻辑
     * spring家族的架构设计万变不离其宗啊，在之前event & listener也是用到了同样的方式
     * @param methodParameter
     * @return
     */
    @Override
    public boolean supportsParameter(MethodParameter methodParameter) {
        return methodParameter.hasParameterAnnotation(ParameterModel.class);
    }

    /**
     * 装载参数
     * @param methodParameter 方法参数
     * @param modelAndViewContainer 返回视图容器
     * @param nativeWebRequest 本次请求对象
     * @param webDataBinderFactory 数据绑定工厂
     * @return
     * @throws Exception
     */
    @Override
    public Object resolveArgument (
            MethodParameter methodParameter,
            ModelAndViewContainer modelAndViewContainer,
            NativeWebRequest nativeWebRequest,
            WebDataBinderFactory webDataBinderFactory
    )
            throws Exception
    {
        String parameterName = methodParameter.getParameterName();
        logger.info("参数名称：{}",parameterName);
        /**
         * 目标返回对象
         * 如果Model存在该Attribute时从module内获取并设置为返回值
         * 如果Model不存在该Attribute则从request parameterMap内获取并设置为返回值
         */
        Object target = modelAndViewContainer.containsAttribute(parameterName) ?
                modelAndViewContainer.getModel().get(parameterName) : createAttribute(parameterName, methodParameter, webDataBinderFactory, nativeWebRequest);;

        /**
         * 返回内容，这里返回的内容才是最终装载到参数的值
         */
        return target;
    }

    /**
     * 根据参数attributeName获取请求的值
     * @param attributeName 请求参数
     * @param parameter method 参数对象
     * @param binderFactory 数据绑定工厂
     * @param request 请求对象
     * @return
     * @throws Exception
     */
    protected Object createAttribute(String attributeName, MethodParameter parameter,
                                     WebDataBinderFactory binderFactory, NativeWebRequest request) throws Exception {
        /**
         * 获取attributeName的值
         */
        String value = getRequestValueForAttribute(attributeName, request);

        /**
         * 如果存在值
         */
        if (value != null) {
            /**
             * 进行类型转换
             * 检查请求的类型与目标参数类型是否可以进行转换
             */
            Object attribute = convertAttributeToParameterValue(value, attributeName, parameter, binderFactory, request);
            /**
             * 如果存在转换后的值，则返回
             */
            if (attribute != null) {
                return attribute;
            }
        }
        /**
         * 检查request parameterMap 内是否存在以attributeName作为前缀的数据
         * 如果存在则根据字段的类型来进行设置值、集合、数组等
         */
        else
        {
            Object attribute = putParameters(parameter,request);
            if(attribute!=null)
            {
                return attribute;
            }
        }
        /**
         * 如果以上两种条件不符合，直接返回初始化参数类型的空对象
         */
        return BeanUtils.instantiateClass(parameter.getParameterType());
    }

    /**
     * 将attribute的值转换为parameter参数值类型
     * @param sourceValue 源请求值
     * @param attributeName 参数名
     * @param parameter 目标参数对象
     * @param binderFactory 数据绑定工厂
     * @param request 请求对象
     * @return
     * @throws Exception
     */
    protected Object convertAttributeToParameterValue(String sourceValue,
                                                     String attributeName,
                                                     MethodParameter parameter,
                                                     WebDataBinderFactory binderFactory,
                                                     NativeWebRequest request) throws Exception {
        /**
         * 获取类型转换业务逻辑实现类
         */
        DataBinder binder = binderFactory.createBinder(request, null, attributeName);
        ConversionService conversionService = binder.getConversionService();
        if (conversionService != null) {
            /**
             * 源类型描述
             */
            TypeDescriptor source = TypeDescriptor.valueOf(String.class);
            /**
             * 根据目标参数对象获取目标参数类型描述
             */
            TypeDescriptor target = new TypeDescriptor(parameter);
            /**
             * 验证是否可以进行转换
             */
            if (conversionService.canConvert(source, target)) {
                /**
                 * 返回转换后的值
                 */
                return binder.convertIfNecessary(sourceValue, parameter.getParameterType(), parameter);
            }
        }
        return null;
    }

    /**
     * 从request parameterMap集合内获取attributeName的值
     * @param attributeName 参数名称
     * @param request 请求对象
     * @return
     */
    protected String getRequestValueForAttribute(String attributeName, NativeWebRequest request) {
        /**
         * 获取PathVariables参数集合
         */
        Map<String, String> variables = getUriTemplateVariables(request);
        /**
         * 如果PathVariables参数集合内存在该attributeName
         * 直接返回相对应的值
         */
        if (StringUtils.hasText(variables.get(attributeName))) {
            return variables.get(attributeName);
        }
        /**
         * 如果request parameterMap内存在该attributeName
         * 直接返回相对应的值
         */
        else if (StringUtils.hasText(request.getParameter(attributeName))) {
            return request.getParameter(attributeName);
        }
        //不存在时返回null
        else {
            return null;
        }
    }

    /**
     * 获取指定前缀的参数：包括uri varaibles 和 parameters
     *
     * @param namePrefix
     * @param request
     * @return
     * @subPrefix 是否截取掉namePrefix的前缀
     */
    protected Map<String, String[]> getPrefixParameterMap(String namePrefix, NativeWebRequest request, boolean subPrefix) {
        Map<String, String[]> result = new HashMap();
        /**
         * 从PathVariables内获取该前缀的参数列表
         */
        Map<String, String> variables = getUriTemplateVariables(request);

        int namePrefixLength = namePrefix.length();
        for (String name : variables.keySet()) {
            if (name.startsWith(namePrefix)) {

                //page.pn  则截取 pn
                if (subPrefix) {
                    char ch = name.charAt(namePrefix.length());
                    //如果下一个字符不是 数字 . _  则不可能是查询 只是前缀类似
                    if (illegalChar(ch)) {
                        continue;
                    }
                    result.put(name.substring(namePrefixLength + 1), new String[]{variables.get(name)});
                } else {
                    result.put(name, new String[]{variables.get(name)});
                }
            }
        }

        /**
         * 从request parameterMap集合内获取该前缀的参数列表
         */
        Iterator<String> parameterNames = request.getParameterNames();
        while (parameterNames.hasNext()) {
            String name = parameterNames.next();
            if (name.startsWith(namePrefix)) {
                //page.pn  则截取 pn
                if (subPrefix) {
                    char ch = name.charAt(namePrefix.length());
                    //如果下一个字符不是 数字 . _  则不可能是查询 只是前缀类似
                    if (illegalChar(ch)) {
                        continue;
                    }
                    result.put(name.substring(namePrefixLength + 1), request.getParameterValues(name));
                } else {
                    result.put(name, request.getParameterValues(name));
                }
            }
        }

        return result;
    }

    /**
     * 验证参数前缀是否合法
     * @param ch
     * @return
     */
    private boolean illegalChar(char ch) {
        return ch != '.' && ch != '_' && !(ch >= '0' && ch <= '9');
    }

    /**
     * 获取PathVariables集合
     * @param request 请求对象
     * @return
     */
    protected final Map<String, String> getUriTemplateVariables(NativeWebRequest request) {
        Map<String, String> variables =
                (Map<String, String>) request.getAttribute(
                        HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE, RequestAttributes.SCOPE_REQUEST);
        return (variables != null) ? variables : Collections.emptyMap();
    }

    /**
     * 从request内获取parameter前缀的所有参数
     * 并根据parameter的类型将对应字段的值设置到parmaeter对象内并返回
     * @param parameter
     * @param request
     * @return
     */
    protected Object putParameters(MethodParameter parameter,NativeWebRequest request)
    {
        /**
         * 根据请求参数类型初始化空对象
         */
        Object object = BeanUtils.instantiateClass(parameter.getParameterType());
        /**
         * 获取指定前缀的请求参数集合
         */
        Map<String, String[]> parameters = getPrefixParameterMap(parameter.getParameterName(),request,true);
        Iterator<String> iterator = parameters.keySet().iterator();
        while(iterator.hasNext())
        {
            //字段名称
            String fieldName = iterator.next();
            //请求参数值
            String[] parameterValue = parameters.get(fieldName);
            try {
                Field field = object.getClass().getDeclaredField(fieldName);
                field.setAccessible(true);

                //字段的类型
                Class<?> fieldTargetType = field.getType();

                /**
                 * List（ArrayList、LinkedList）类型
                 * 将数组类型的值转换为List集合对象
                 */
                if(List.class.isAssignableFrom(fieldTargetType))
                {
                    field.set(object, Arrays.asList(parameterValue));
                }
                /**
                 *Object数组类型，直接将数组值设置为目标字段的值
                 */
                else if(Object[].class.isAssignableFrom(fieldTargetType))
                {
                    field.set(object, parameterValue);
                }
                /**
                 * 单值时获取数组索引为0的值
                 */
                else {
                    field.set(object, parameterValue[0]);
                }
            }
            catch (Exception e)
            {
                logger.error("Set Field：{} Value Error，In {}",fieldName,object.getClass().getName());
                continue;
            }
        }
        return object;
    }
}
```
> 上面我直接贴出了参数装载的全部实现方法，下面我们就开始按照装载的流程进行讲解。
##### supportsParameter方法实现
```java
 /**
     * 该方法返回true时调用resolveArgument方法执行逻辑
     * spring家族的架构设计万变不离其宗啊，在之前event & listener也是用到了同样的方式
     * @param methodParameter
     * @return
     */
    @Override
    public boolean supportsParameter(MethodParameter methodParameter) {
        return methodParameter.hasParameterAnnotation(ParameterModel.class);
    }
```
我们只对配置了``ParameterModel``注解的参数进行装载。

##### resolveArgument方法实现
```java
 /**
     * 装载参数
     * @param methodParameter 方法参数
     * @param modelAndViewContainer 返回视图容器
     * @param nativeWebRequest 本次请求对象
     * @param webDataBinderFactory 数据绑定工厂
     * @return
     * @throws Exception
     */
    @Override
    public Object resolveArgument (
            MethodParameter methodParameter,
            ModelAndViewContainer modelAndViewContainer,
            NativeWebRequest nativeWebRequest,
            WebDataBinderFactory webDataBinderFactory
    )
            throws Exception
    {
        String parameterName = methodParameter.getParameterName();
        logger.info("参数名称：{}",parameterName);
        /**
         * 目标返回对象
         * 如果Model存在该Attribute时从module内获取并设置为返回值
         * 如果Model不存在该Attribute则从request parameterMap内获取并设置为返回值
         */
        Object target = modelAndViewContainer.containsAttribute(parameterName) ?
                modelAndViewContainer.getModel().get(parameterName) : createAttribute(parameterName, methodParameter, webDataBinderFactory, nativeWebRequest);;

        /**
         * 返回内容，这里返回的内容才是最终装载到参数的值
         */
        return target;
    }
```
该方法作为装载参数逻辑的入口，我们从``MethodParameter ``对象内获取了参数的名称，根据该名称检查Model内是否存在该名称的值，如果存在则直接使用并返回，反则需要从``ParameterMap``内获取对应该参数名称的值返回。
我们下面主要看看从``parameterMap``获取的方法实现
##### createAttribute方法实现
```java
/**
     * 根据参数attributeName获取请求的值
     * @param attributeName 请求参数
     * @param parameter method 参数对象
     * @param binderFactory 数据绑定工厂
     * @param request 请求对象
     * @return
     * @throws Exception
     */
    protected Object createAttribute(String attributeName, MethodParameter parameter,
                                     WebDataBinderFactory binderFactory, NativeWebRequest request) throws Exception {
        /**
         * 获取attributeName的值
         */
        String value = getRequestValueForAttribute(attributeName, request);

        /**
         * 如果存在值
         */
        if (value != null) {
            /**
             * 进行类型转换
             * 检查请求的类型与目标参数类型是否可以进行转换
             */
            Object attribute = convertAttributeToParameterValue(value, attributeName, parameter, binderFactory, request);
            /**
             * 如果存在转换后的值，则返回
             */
            if (attribute != null) {
                return attribute;
            }
        }
        /**
         * 检查request parameterMap 内是否存在以attributeName作为前缀的数据
         * 如果存在则根据字段的类型来进行设置值、集合、数组等
         */
        else
        {
            Object attribute = putParameters(parameter,request);
            if(attribute!=null)
            {
                return attribute;
            }
        }
        /**
         * 如果以上两种条件不符合，直接返回初始化参数类型的空对象
         */
        return BeanUtils.instantiateClass(parameter.getParameterType());
    }
```
该方法的逻辑存在两个分支，首先通过调用``getRequestValueForAttribute``方法从``parameterMap``内获取指定属性名的请求值，如果存在值则需要验证是否可以完成类型转换，验证通过后则直接返回值。

上面的部分其实是``SpringMVC``原有的参数装载的流程，下面我们就来根据需求个性化定制装载逻辑。

##### putParameters方法实现
该方法实现了自定义规则``xxx.xxx``方式进行参数装载的逻辑，我们在前台传递参数的时候只需要将``Controller``内方法参数名称作为传递的前缀即可，如：``teacher.name``、``student.name``。
```java
/**
     * 从request内获取parameter前缀的所有参数
     * 并根据parameter的类型将对应字段的值设置到parmaeter对象内并返回
     * @param parameter
     * @param request
     * @return
     */
    protected Object putParameters(MethodParameter parameter,NativeWebRequest request)
    {
        /**
         * 根据请求参数类型初始化空对象
         */
        Object object = BeanUtils.instantiateClass(parameter.getParameterType());
        /**
         * 获取指定前缀的请求参数集合
         */
        Map<String, String[]> parameters = getPrefixParameterMap(parameter.getParameterName(),request,true);
        Iterator<String> iterator = parameters.keySet().iterator();
        while(iterator.hasNext())
        {
            //字段名称
            String fieldName = iterator.next();
            //请求参数值
            String[] parameterValue = parameters.get(fieldName);
            try {
                Field field = object.getClass().getDeclaredField(fieldName);
                field.setAccessible(true);

                //字段的类型
                Class<?> fieldTargetType = field.getType();

                /**
                 * List（ArrayList、LinkedList）类型
                 * 将数组类型的值转换为List集合对象
                 */
                if(List.class.isAssignableFrom(fieldTargetType))
                {
                    field.set(object, Arrays.asList(parameterValue));
                }
                /**
                 *Object数组类型，直接将数组值设置为目标字段的值
                 */
                else if(Object[].class.isAssignableFrom(fieldTargetType))
                {
                    field.set(object, parameterValue);
                }
                /**
                 * 单值时获取数组索引为0的值
                 */
                else {
                    field.set(object, parameterValue[0]);
                }
            }
            catch (Exception e)
            {
                logger.error("Set Field：{} Value Error，In {}",fieldName,object.getClass().getName());
                continue;
            }
        }
        return object;
    }
```
该方法首先实例化了一个``MethodParameter``类型的``空对象``，然后通过``getPrefixParameterMap``获取``PathVariables``、``ParameterMap``内前缀为``MethodParameter``名称的请求参数列表，遍历列表对应设置
``object ``内的字段，用于完成参数的装载，在装载过程中，我这里分别根据``Collection``、``List``、``Array``、``Single``类型进行了处理（注意：这里需要根据项目需求进行调整装载类型）。
### 配置Spring托管CustomerArgumentResolver
我们将``CustomerArgumentResolver``托管交付给``Spring``框架，我们来创建一个名叫``WebMvcConfiguration``的配置类，该类继承抽象类``WebMvcConfigurerAdapter``，代码如下所示：
```java
/**
 * springmvc 注解式配置类
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2017/9/16
 * Time：22:15
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
@Configuration
public class WebMvcConfiguration
    extends WebMvcConfigurerAdapter
{
    /**
     * 添加参数装载
     * @param argumentResolvers
     */
    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> argumentResolvers) {
        /**
         * 将自定义的参数装载添加到spring内托管
         */
        argumentResolvers.add(new CustomerArgumentResolver());
    }

    /**
     * 配置静态请求视图映射
     * @param registry
     */
    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        registry.addViewController("/index").setViewName("index");
    }
}
```
我们重写了``WebMvcConfigurerAdapter``抽象类内的两个方法``addArgumentResolvers``、``addViewControllers``，其中``addArgumentResolvers``方法完成了参数装载的托管。

``addViewControllers``配置了视图控制器映射，这样我们访问``/index``地址就可以请求到``index.jsp``页面。

### 创建测试控制器
创建名为``IndexController``的控制器并添加数据提交的方法，具体代码如下所示：
```java
/**
 * 表单提交控制器
 * ========================
 * Created with IntelliJ IDEA.
 * User：恒宇少年
 * Date：2017/9/16
 * Time：22:26
 * 码云：http://git.oschina.net/jnyqy
 * ========================
 */
@RestController
public class IndexController
{
    /**
     * 装载参数测试
     * @return
     */
    @RequestMapping(value = "/submit")
    public String resolver(@ParameterModel TeacherEntity teacher, @ParameterModel StudentEntity student)
    {
        return "教师名称："+ JSON.toJSON(teacher.getName()) +"，学生名称："+student.getName()+"，学生年龄："+student.getAge();
    }
}
```
可以看到我们为``TeacherEntity ``、``StudentEntity ``分别添加了注解``@ParameterModel``，也就证明了这两个实体需要使用我们的``CustomerArgumentResolver``完成参数装载。

# 运行测试
在运行测试之前，我们需要修改下``index.jsp``内的参数映射前缀，修改后代码如下所示：
```html
<form method="post" action="/submit">
        教师姓名：<input type="text" name="teacher.name"/><br/><br/>
        学生姓名：<input type="text" name="student.name"/><br/><br/>
        学生年龄：<input type="text" name="student.age"/><br/><br/>
        <input type="submit"/>
    </form>
```
#### 测试单值装载
我们为教师名称、学生名称、学生年龄都分别添加了前缀，下面我们来启动项目，访问项目根下路径``/index``，如下图1所示：

![图1](/images/post/rewrite-springmvc-parameter-loader-1.png)
在上图1中输入了部分请求参数，点击“提交”按钮查看界面输出的效果，图下所示：
```
教师名称：王老师，学生名称：张小跑，学生年龄：23
```
可以看到参数已经被正确的装载到了不同的实体类内。
> 上面的例子只是针对实体内的单个值的装载，下面我们来测试下``List``类型的值是否可以装载？

#### 测试List装载
我们先来修改下教师实体内的名称为List，字段名称不需要变动，如下所示：
```java
//教师姓名
private List<String> name;
```
再来修改下``index.jsp``输入框，如下所示：
```html
    <form method="post" action="/submit">
        语文老师姓名：<input type="text" name="teacher.name"/><br/><br/>
        数学教师姓名：<input type="text" name="teacher.name"/><br/><br/>
        学生姓名：<input type="text" name="student.name"/><br/><br/>
        学生年龄：<input type="text" name="student.age"/><br/><br/>
        <input type="submit"/>
    </form>
```
在上代码中我们添加了两位老师的名称，接下来重启项目，再次提交测试，查看是不是我们想要的效果？
修改后的界面如下图2所示：

![图2](/images/post/rewrite-springmvc-parameter-loader-2.png)

界面输出内容如下所示：
```
教师名称：["王老师","李老师"]，学生名称：张小跑，学生年龄：24
```
可以看到我们已经拿到了两位老师的名称，这也证明了我们的``CustomerArgumentResolver``是可以完成``List``的映射装载的。

# 总结
以上内容就是本章的全部讲解内容，本章简单实现了参数的状态，其中还有很多细节性质的逻辑，如：``@Valid``注解的生效、文件的上传等。在下一章我们会降到如果通过参数装载实现接口服务的安全认证。

---
id: springboot-mvc-configurer
title: SpringBoot2.x内配置WebMvc
article_type: 原创
article_author: 于起宇
enable_comment: true
news: true
tags:
  - SpringBoot
categories:
  - SpringBoot
date: 2019-09-29 17:33:41
keywords: SpringBoot,恒宇少年,拦截器,跨域
description: 'SpringBoot2.x内配置WebMvc'
---
初升级`SpringBoot2.0`版本，在已经使用`SpringBoot1.x`的系统内还是存在一些兼容性的问题，有很多变化！！！也存在一些过时的方法、配置文件信息以及类，我们在之前版本的`SpringBoot1.x`中可以使用`WebMvcConfigurerAdapter`抽象类来处理`SpringMVC`相关的配置，由于`SpringBoot2.0`版本最低支持 `JDK1.8`环境，在`JDK1.8`引入了特殊的关键字`default`，该关键字配置在`interface`接口的方法时子类可以不去实现该方法，相当于抽象类内已经实现的接口方法。
<!--more-->
# 本章目标
代替`WebMvcConfigurerAdapter`抽象类扩展`SpringMVC`相关配置。

# 构建项目
我们本章仅仅使用了`web`相关的依赖，`pom.xml`配置文件如下所示：
```xml
//......
<dependencies>
    <!--添加web依赖配置-->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
</dependencies>
//......
```
新版本我们可以采用两种方式来配置`WebMvcConfigurer`
1. `JavaBean`方式配置`WebMvcConfigurer`
2. `WebMvcConfigurer`实现类方式

#### 方式一：JavaBean配置WebMvcConfigurer
采用`JavaBean`方式我们只需要添加一个`web`相关配置的类型，并且配置`@Configuration`注解，将该配置类托管给`Spring IOC`完成配置，代码配置如下所示：
```java
/**
 * web配置类
 *
 * @author：于起宇 <br/>
 * ===============================
 * Created with IDEA.
 * Date：2018/3/15
 * Time：下午10:29
 * 简书：http://www.jianshu.com/u/092df3f77bca
 * ================================
 */
@Configuration
public class WebJavaBeanConfiguration {
    /**
     * 日志拦截器
     */
    @Autowired
    private LogInterceptor logInterceptor;

    /**
     * 实例化WebMvcConfigurer接口
     *
     * @return
     */
    @Bean
    public WebMvcConfigurer webMvcConfigurer() {
        return new WebMvcConfigurer() {
            /**
             * 添加拦截器
             * @param registry
             */
            @Override
            public void addInterceptors(InterceptorRegistry registry) {
                registry.addInterceptor(logInterceptor).addPathPatterns("/**");
            }
        };
    }
}
```
我们通过`@Bean`注解的返回值来完成`WebMvcConfigurer `的配置实例化，在`WebMvcConfigurer`接口实例内调用`addInterceptors `方法完成添加拦截器配置，跟之前`WebMvcConfigurerAdapter`方式感觉没事区别，只不过是编码形式有一点变化。
#### 测试拦截器
在上面配置内添加了一个`LogInterceptor`拦截器，该拦截器目的很简单，仅仅是测试拦截器配置是否生效，代码也很简单，输出访问地址的`URI`，实现代码如下所示：
```java
@Component
public class LogInterceptor implements HandlerInterceptor {
    /**
     * logger instance
     */
    static Logger logger = LoggerFactory.getLogger(LogInterceptor.class);

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        logger.info("请求路径：{}", request.getRequestURI());
        return true;
    }
}
```
#### 测试控制器
为了测试访问地址被拦截需要添加一个测试控制器请求地址，测试控制器代码如下所示：
```java
/**
 * 测试控制器
 * @author：于起宇 <br/>
 * ===============================
 * Created with IDEA.
 * Date：2018/3/15
 * Time：下午10:34
 * 简书：http://www.jianshu.com/u/092df3f77bca
 * ================================
 */
@RestController
public class TestController {
    /**
     * 测试拦截地址
     * @return
     */
    @RequestMapping(value = "/index")
    public String index() {
        return "Success";
    }
}
```
### 运行测试配置
我们来启动项目，访问地址[http://127.0.0.1:8080/index](http://127.0.0.1:8080/index)，查看控制台输出内容，如下所示：
```bash
2018-03-17 16:51:26.633  INFO 2152 --- [nio-8080-exec-1] c.h.c.interceptors.LogInterceptor        : 请求路径：/index
```
> 根据日志的输出我们判定`JavaBean`配置`WebMvcConfigurer `的方式是可以生效的，回想文章开头说到的关键字`deault`，既然`default`修饰的方法可以不被子类实现，那么我们完全可以实现`WebMvcConfigurer`接口，来添加对应的配置，下面我们来尝试添加一个新的配置类使用实现接口的方式来添加拦截器的配置。

#### 方式二：实现类配置WebMvcConfigurer
我们创建一个名为`WebConfiguration`的配置类并且实现`WebMvcConfigurer`接口，代码如下所示：
```java
/**
 * web相关配置类
 * @author：于起宇 <br/>
 * ===============================
 * Created with IDEA.
 * Date：2018/3/17
 * Time：下午4:45
 * 简书：http://www.jianshu.com/u/092df3f77bca
 * ================================
 */
@Configuration
public class WebConfiguration implements WebMvcConfigurer {

    /**
     * 日志拦截器
     */
    @Autowired
    private LogInterceptor logInterceptor;

    /**
     * 重写添加拦截器方法并添加配置拦截器
     * @param registry
     */
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
         registry.addInterceptor(logInterceptor).addPathPatterns("/**");
    }
}
```
第二种方式有点我们之前使用的感觉，只不过之前是使用的`WebMvcConfigurerAdapter `抽象类，而现在我们直接使用`WebMvcConfigurer`接口。
> 正因为`SpringBoot2.0`是基于`JDK1.8`及以上版本，所以可以完全使用`JDK1.8`新特性提供更好的实现方式。
#### 重启尝试再次测试
我们重启项目，再次访问地址[http://127.0.0.1:8080/index](http://127.0.0.1:8080/index)在控制台查看，输出内容跟`方式一`一样，也就表明了这种配置也是可以生效的。

# 总结
本章介绍了`SpringBoot2.0`版本的`WebMvcConfigurer`两种的配置方式，可以根据自己的喜好在项目中进行配置，不过第二种可能更吻合项目中的开发模式。

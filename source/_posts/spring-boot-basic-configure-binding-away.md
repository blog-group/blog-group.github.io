---
id: spring-boot-basic-configure-binding-away
title: SpringBoot2.x基础篇：谈谈SpringBoot内提供的这几种配置绑定
sort_title: 谈谈SpringBoot内提供的这几种配置绑定
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: true
news: true
disable_toc: false
customize: false
tags: [SpringBoot2.x]
categories: [SpringBoot]
keywords: 'ConfigurationPropertiesScan,ConfigurationProperties,springboot配置'
date: 2020-04-06 17:53:38
article_url:
description: 'SpringBoot2.x基础篇：谈谈SpringBoot内提供的这几种配置绑定'
---

## 常见配置绑定方式
![](https://blog.yuqiyu.com/images/post/spring-boot-basic-configure-binding-away-1.png)

`SpringBoot`在不断地版本迭代中陆续提供了不同的配置参数绑定的方式，我们可以单独获取`一个配置参数`也可以将`一系列的配置`映射绑定到`JavaBean`的属性字段，下面我们来看看这几种方式的配置绑定哪一种是你最常用到的。

## 示例配置参数

```yaml
system:
  config:
    app-id: hengboy
    app-secret: yuqiyu@admin
```

> 上面是一段示例的配置参数，提供给下面的配置绑定方式来使用。

## @Configuration方式绑定

当我们需要将一个配置前缀下的参数映射绑定到`JavaBean`的属性字段时，我们可以考虑使用`@ConfigurationProperties` + `@Configuration`注解组合的方式，使用如下所示：

```java
/**
 * 系统配置
 *
 * @author 恒宇少年
 */
@Configuration
@ConfigurationProperties(prefix = SYSTEM_CONFIG_PREFIX)
@Data
public class SystemConfig {
    /**
     * 系统配置前缀
     */
    public static final String SYSTEM_CONFIG_PREFIX = "system.config";

    private String appId;
    private String appSecret;
}
```

> **注意事项：**配置参数与`JavaBean`属性之间的绑定是通过调用`JavaBean`属性的`Setter`方法来赋值的，所以我们需要提供对应属性字段的`Setter`方法。

由于`@Configuration`注解被`@Component`修饰，所以我们在使用时只需要注入`SystemConfig`配置绑定映射类即可，通过`Getter`方法来获取对应配置参数的值。

## 配置扫描路径方式绑定

如果你系统中需要创建的配置映射类较多，而且每一个类都需要交付给`IOC`容器进行托管，那么可以考虑使用`@ConfigurationPropertiesScan` + `@ConfigurationProperties`注解组合的方式，使用如下所示：

```java
@SpringBootApplication
@ConfigurationPropertiesScan
public class ConfigureBindingAwayApplication {

    public static void main(String[] args) {
        SpringApplication.run(ConfigureBindingAwayApplication.class, args);
    }
}
```

我们首先需要在`XxxApplication`应用程序启动类上添加`@ConfigurationPropertiesScan`注解，表示我们需要使用**自动扫描**的方式来注册`配置映射类`，注解配置参数如下所示：

- **value**：配置扫描的基础`package`，与`basePackages`作用一致，通过数组的形式来接收配置。
- **basePackages**：配置扫描的基础`package`。
- **basePackageClasses**：配置基础扫描类，会将每一个扫描类所处于的`package`作为扫描基础`package`。

> 当我们在使用`@ConfigurationPropertiesScan`注解时，如果不进行自定义扫描路径，默认使用`SpringBoot`应用程序扫描的`packages`。

使用这种方式我们`配置映射类`就不再需要添加`@Configuration`注解了，这是因为我们在使用`@ConfigurationPropertiesScan`注解时，会通过`@Import`方式来引用`配置映射类`的注册实现，详见：`org.springframework.boot.context.properties.ConfigurationPropertiesScanRegistrar#registerBeanDefinitions`，配置映射类如下所示：

```java
/**
 * 系统配置
 *
 * @author 恒宇少年
 */
@ConfigurationProperties(prefix = SYSTEM_CONFIG_PREFIX)
@Data
public class SystemConfig {
    /**
     * 系统配置前缀
     */
    public static final String SYSTEM_CONFIG_PREFIX = "system.config";

    private String appId;
    private String appSecret;
}
```



## 构造函数方式绑定

在上面的两种方式都是通过`Setter`方法来进行映射字段的赋值，而`构造函数`绑定方式是通过构造函数来进行赋值的，我们只需要在`配置映射类`上添加`@ConstructorBinding`注解并提供对应的构造函数即可，使用方式如下所示：

```java
/**
 * 系统配置
 *
 * @author 恒宇少年
 */
@ConfigurationProperties(prefix = SYSTEM_CONFIG_PREFIX)
@ConstructorBinding
@Getter
public class SystemConfig {
    /**
     * 系统配置前缀
     */
    public static final String SYSTEM_CONFIG_PREFIX = "system.config";

    public SystemConfig(String appId, String appSecret) {
        this.appId = appId;
        this.appSecret = appSecret;
    }

    private String appId;
    private String appSecret;
}
```

在之前我也写过一篇关于构造函数映射配置参数的问题，详情访问：[@ConstructorBinding注解的使用](https://blog.yuqiyu.com/springboot-constructor-binding-properties.html)

## 第三方类绑定

如果我们需要将配置参数映射绑定到第三方依赖内提供的`JavaBean`，我们该使用什么方式呢？由于接收参数的类并不是我们自己编写的，所以没有办法对`.class`文件源码进行修改。

这时我们可以将第三方提供的`JavaBean`交给`IOC容器`托管，然后结合`@ConfigurationProperties`注解来映射绑定配置参数，使用方式如下所示：

```java
@Bean
@ConfigurationProperties(prefix = SYSTEM_CONFIG_PREFIX)
public SystemConfig systemConfig() {
	return new SystemConfig();
}
```

> 这种方式也需要第三方提供的`JavaBean`有映射字段的`Setter`方法，否则无法进行赋值。



我们知道通过`@Bean`注解修饰的方法，会将方法的返回值加入到`IOC容器`内，那我们在使用配置时，直接注入`配置映射类`就可以了。

## 总结

上面这几种配置绑定方式都遵循`OOP`实现，当然如果你只需要获取一个配置参数，使用`@Value`也是一个好的选择，没有更好，只有更合适，根据每一种绑定方式的特点合理的选择一个合适业务的方式。
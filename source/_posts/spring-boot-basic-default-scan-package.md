---
id: spring-boot-basic-default-scan-package
title: SpringBoot2.x基础篇：带你了解扫描Package自动注册Bean
sort_title: 带你了解SpringBoot2.x扫描Package自动注册Bean
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: true
news: true
disable_toc: false
customize: false
tags: [SpringBoot2.x]
categories: [SpringBoot]
keywords: 'springboot,默认扫描,base package'
date: 2020-02-24 17:33:19
article_url:
description: 'SpringBoot2.x基础篇：带你了解扫描Package自动注册Bean'
---

我们一直在使用`SpringBoot`来开发应用程序，但是为什么在项目启动时就会自动注册使用注解`@Component`、`@Service`、`@RestController`...标注的`Bean`呢？

<!--more-->
## 推荐阅读
- [SpringBoot2.x 教程汇总](http://blog.yuqiyu.com/spring-boot-2-x-articles.html)

## 默认扫描目录

`SpringBoot`把入口类所在的`Package`作为了默认的扫描目录，这也是一个约束，如果我们把需要被注册到`IOC`的类创建在扫描目录下就可以实现自动注册，否则则不会被注册。

如果你入口类叫做`ExampleApplication`，它位于`org.minbox.chapter`目录下，当我们启动应用程序时就会自动扫描`org.minbox.chapter`**同级目录**、**子级目录**下全部注解的类，如下所示：

```
. src/main/java
├── org.minbox.chapter
│   ├── ExampleApplication.java
│   ├── HelloController.java
│   ├── HelloExample.java
│   └── index
│   │   └── IndexController.java
├── com.hengboy
│   ├── TestController.java
└──
```

`HelloController.java`、`HelloExample.java`与入口类`ExampleApplication.java`在同一级目录下，所以在项目启动时**可以被扫描到**。

`IndexController.java`则是位于入口类的下级目录`org.minbox.chapter.index`内，因为支持下级目录扫描，所以它也**可以被扫描到**。

`TestController.java`位于`com.hengboy`目录下，**默认无法扫描到**。

## 自定义扫描目录

在上面目录结构中位于`com.hengboy`目录下的`TestController.java`类，默认情况下是无法被扫描并注册到`IOC`容器内的，如果想要扫描该目录下的类，下面有两种方法。

**方法一：使用@ComponentScan注解**

```java
@ComponentScan({"org.minbox.chapter", "com.hengboy"})
```

**方法二：使用scanBasePackages属性**

```java
@SpringBootApplication(scanBasePackages = {"org.minbox.chapter", "com.hengboy"})
```



> 注意事项：配置自定义扫描目录后，**会覆盖掉默认的扫描目录**，如果你还需要扫描默认目录，那么你要进行配置扫描目录，在上面自定义配置中，如果仅配置扫描`com.hengboy`目录，则`org.minbox.chapter`目录就不会被扫描。



## 追踪源码

下面我们来看下`SpringBoot`源码是怎么实现自动化扫描目录下的`Bean`，并将`Bean`注册到容器内的过程。

> 由于注册的流程比较复杂，挑选出具有代表性的流程步骤来进行讲解。

### 获取BasePackages

在`org.springframework.context.annotation.ComponentScanAnnotationParser#parse`方法内有着获取`basePackages`的业务逻辑，源码如下所示：

```java
Set<String> basePackages = new LinkedHashSet<>();
// 获取@ComponentScan注解配置的basePackages属性值
String[] basePackagesArray = componentScan.getStringArray("basePackages");
// 将basePackages属性值加入Set集合内
for (String pkg : basePackagesArray) {
  String[] tokenized = StringUtils.tokenizeToStringArray(this.environment.resolvePlaceholders(pkg),
                                                         ConfigurableApplicationContext.CONFIG_LOCATION_DELIMITERS);
  Collections.addAll(basePackages, tokenized);
}
// 获取@ComponentScan注解的basePackageClasses属性值
for (Class<?> clazz : componentScan.getClassArray("basePackageClasses")) {
  // 获取basePackageClasses所在的package并加入Set集合内
  basePackages.add(ClassUtils.getPackageName(clazz));
}
// 如果并没有配置@ComponentScan的basePackages、basePackageClasses属性值
if (basePackages.isEmpty()) {
  // 使用Application入口类的package作为basePackage
  basePackages.add(ClassUtils.getPackageName(declaringClass));
}
```

获取`basePackages`分为了那么三个步骤，分别是：

1. 获取`@ComponentScan`注解`basePackages`属性值
2. 获取`@ComponentScan`注解`basePackageClasses`属性值
3. 将`Application`入口类所在的`package`作为默认的`basePackages`

> 注意事项：根据源码也就证实了，为什么我们配置了`basePackages`、`basePackageClasses`后会把默认值覆盖掉，这里其实也不算是覆盖，是根本不会去获取`Application`入口类的`package`。



### 扫描Packages下的Bean

获取到全部的`Packages`后，通过`org.springframework.context.annotation.ClassPathBeanDefinitionScanner#doScan`方法来扫描每一个`Package`下使用注册注解（`@Component`、`@Service`、`@RestController`...）标注的类，源码如下所示：

```java
protected Set<BeanDefinitionHolder> doScan(String... basePackages) {
  // 当basePackages为空时抛出IllegalArgumentException异常
  Assert.notEmpty(basePackages, "At least one base package must be specified");
  Set<BeanDefinitionHolder> beanDefinitions = new LinkedHashSet<>();
  // 遍历每一个basePackage，扫描package下的全部Bean
  for (String basePackage : basePackages) {
    // 获取扫描到的全部Bean
    Set<BeanDefinition> candidates = findCandidateComponents(basePackage);
    // 遍历每一个Bean进行处理注册相关事宜
    for (BeanDefinition candidate : candidates) {
      // 获取作用域的元数据
      ScopeMetadata scopeMetadata = this.scopeMetadataResolver.resolveScopeMetadata(candidate);
      candidate.setScope(scopeMetadata.getScopeName());
      // 获取Bean的Name
      String beanName = this.beanNameGenerator.generateBeanName(candidate, this.registry);
      if (candidate instanceof AbstractBeanDefinition) {
        postProcessBeanDefinition((AbstractBeanDefinition) candidate, beanName);
      }
      // 如果是注解方式注册的Bean
      if (candidate instanceof AnnotatedBeanDefinition) {
        // 处理Bean上的注解属性，相应的设置到BeanDefinition（AnnotatedBeanDefinition）类内字段
        AnnotationConfigUtils.processCommonDefinitionAnnotations((AnnotatedBeanDefinition) candidate);
      }
      // 检查是否满足注册的条件
      if (checkCandidate(beanName, candidate)) {
        // 声明Bean具备的基本属性
        BeanDefinitionHolder definitionHolder = new BeanDefinitionHolder(candidate, beanName);
        // 应用作用域代理模式
        definitionHolder =
          AnnotationConfigUtils.applyScopedProxyMode(scopeMetadata, definitionHolder, this.registry);
        // 写入返回的集合
        beanDefinitions.add(definitionHolder);
        // 注册Bean
        registerBeanDefinition(definitionHolder, this.registry);
      }
    }
  }
  return beanDefinitions;
}
```



在上面源码中会扫描每一个`basePackage`下通过注解定义的`Bean`，获取`Bean`注册定义对象后并设置一些基本属性。



### 注册Bean

扫描到`basePackage`下的`Bean`后会直接通过`org.springframework.beans.factory.support.BeanDefinitionReaderUtils#registerBeanDefinition`方法进行注册，源码如下所示：

```java
public static void registerBeanDefinition(
  BeanDefinitionHolder definitionHolder, BeanDefinitionRegistry registry)
  throws BeanDefinitionStoreException {

  // 注册Bean的唯一名称
  String beanName = definitionHolder.getBeanName();
  // 通过BeanDefinitionRegistry注册器进行注册Bean
  registry.registerBeanDefinition(beanName, definitionHolder.getBeanDefinition());

  // 如果存在别名，进行注册Bean的别名
  String[] aliases = definitionHolder.getAliases();
  if (aliases != null) {
    for (String alias : aliases) {
      registry.registerAlias(beanName, alias);
    }
  }
}
```

通过`org.springframework.beans.factory.support.BeanDefinitionRegistry#registerBeanDefinition`注册器内的方法可以直接将`Bean`注册到`IOC`容器内，而`BeanName`则是它生命周期内的唯一名称。



## 总结

通过本文的讲解我想你应该已经了解了`SpringBoot`应用程序启动时为什么会自动扫描`package`并将`Bean`注册到`IOC`容器内，虽然项目启动时间很短暂，不过这是一个非常复杂的过程，在学习过程中大家可以使用`Debug`模式来查看每一个步骤的逻辑处理。
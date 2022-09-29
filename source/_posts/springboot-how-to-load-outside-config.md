---
id: springboot-how-to-load-outside-config
title: SpringBoot如何加载jar包外面的配置文件？
article_type: 转载
article_author: 小姐姐味道
enable_comment: true
news: true
tags:
  - SpringBoot
categories:
  - SpringBoot
keywords: springboot,config,外部配置
date: 2019-10-31 08:53:04
article_url: https://juejin.im/post/5dafc7adf265da5b8c03cf5e
---
虽然现在springboot提供了多环境的支持，但是通常修改一下配置文件，都需要重新打包。
在开发springboot框架集成时，我遇到一个问题，就是如何让@PropertySource能够“扫描”和加载jar包外面的properties文件。
<!--more-->
这样，我就可以随时随地的修改配置文件，不需要重新打包。
最粗暴的方式，就是用--classpath指定这些文件。但是这引入了其他问题，“易于部署”、“与容器无关”，让人棘手。而且这个问题在测试环境、多机房部署、以及与配置中心协作时还是很难巧妙解决，因为这里面涉及到不少的硬性规范、甚至沟通成本。
回到技术的本质，我希望基于spring容器，开发一个兼容性套件，能够扫描jar外部的properties文件，考虑到实施便捷性，我们约定这些properties文件总是位于jar文件的临近目录中。

## 设计前提
1、文件目录

文件目录就类似于下面的样式。可以看到配置文件是和jar包平行的。
```
----application.jar  （springboot项目，jarLaucher）  
     |  
     | sample.properties  
     | config/  
             |  
             | sample.properties  

```

### 2、扫描策略（涉及到覆盖优先级问题）
1）我们约定默认配置文件目录为config，也就是最优先的。其余application.jar同级；相对路径起始位置为jar路径。
2）首先查找./config/sample.properties文件是否存在，如果存在则加载。
3）查找./sample.properties文件是否存在，如果存在则加载。
4）否则，使用classpath加载此文件。

### 3、开发策略
1）尽可能使用spring机制，即`Resource`加载机制，而不适用本地文件或者部署脚本干预等。
2）通过研究，扩展自定义的`ResourceLoader`可以达成此目标，但是潜在风险很高，因为springboot、cloud框架内部，对各种Context的支持都有各自的ResourceLoader实现，如果我们再扩展自己的loader会不会导致某些未知问题？于是放弃了此策略。
3）spring提供了`ProtocolResolver`机制，用于匹配自定义的文件schema来加载文件；而且不干扰ResourceLoader的机制，最重要的是它会添加到spring环境下的所有的loader中。我们只需要扩展一个ProtocolResolver类，并将它在合适的实际加入到ResourceLoader即可，此后加载properties文件时我们的ProtocolResolver总会被执行。

## 代码
下面是具体的代码实现。最主要的，就是配置文件解析器的编写。注释很详细，就不多做介绍了。

1、XPathProtocolResolver.java
```java
import org.springframework.core.io.ProtocolResolver;  
import org.springframework.core.io.Resource;  
import org.springframework.core.io.ResourceLoader;  
import org.springframework.util.ResourceUtils;  
  
import java.util.Collection;  
import java.util.LinkedHashSet;  
  
/** 
 * 用于加载jar外部的properties文件，扩展classpath : xjjdog
 * -- app.jar 
 * -- config/a.property   INSIDE order=3 
 * -- a.property          INSIDE order=4 
 * -- config/a.property       OUTSIDE order=1 
 * -- a.property              OUTSIDE order=2 
 * <p> 
 * 例如： 
 * 1、@PropertySource("::a.property") 
 * 查找路径为：./config/a.property,./a.property,如果找不到则返回null,路径相对于app.jar 
 * 2、@PropertySource("::x/a.property") 
 * 查找路径为：./config/x/a.property,./x/a.property,路径相对于app.jar 
 * 3、@PropertySource("*:a.property") 
 * 查找路径为：./config/a.property,./a.property,CLASSPATH:/config/a.property,CLASSPATH:/a.property 
 * 4、@PropertySource("*:x/a.property") 
 * 查找路径为：./config/x/a.property,./x/a.property,CLASSPATH:/config/x/a.property,CLASSPATH:/x/a.property 
 * <p> 
 * 如果指定了customConfigPath，上述路径中的/config则会被替换 
 * 
 * @author xjjdog 
 **/  
public class XPathProtocolResolver implements ProtocolResolver {  
  
    /** 
     * 查找OUTSIDE的配置路径，如果找不到，则返回null 
     */  
    private static final String X_PATH_OUTSIDE_PREFIX = "::";  
  
    /** 
     * 查找OUTSIDE 和inside，其中inside将会转换为CLASS_PATH 
     */  
    private static final String X_PATH_GLOBAL_PREFIX = "*:";  
  
    private String customConfigPath;  
  
    public XPathProtocolResolver(String configPath) {  
        this.customConfigPath = configPath;  
    }  
  
    @Override  
    public Resource resolve(String location, ResourceLoader resourceLoader) {  
        if (!location.startsWith(X_PATH_OUTSIDE_PREFIX) && !location.startsWith(X_PATH_GLOBAL_PREFIX)) {  
            return null;  
        }  
  
        String real = path(location);  
  
        Collection<String> fileLocations = searchLocationsForFile(real);  
        for (String path : fileLocations) {  
            Resource resource = resourceLoader.getResource(path);  
            if (resource != null && resource.exists()) {  
                return resource;  
            }  
        }  
        boolean global = location.startsWith(X_PATH_GLOBAL_PREFIX);  
        if (!global) {  
            return null;  
        }  
  
        Collection<String> classpathLocations = searchLocationsForClasspath(real);  
        for (String path : classpathLocations) {  
            Resource resource = resourceLoader.getResource(path);  
            if (resource != null && resource.exists()) {  
                return resource;  
            }  
        }  
        return resourceLoader.getResource(real);  
    }  
  
    private Collection<String> searchLocationsForFile(String location) {  
        Collection<String> locations = new LinkedHashSet<>();  
        String _location = shaping(location);  
        if (customConfigPath != null) {  
            String prefix = ResourceUtils.FILE_URL_PREFIX + customConfigPath;  
            if (!customConfigPath.endsWith("/")) {  
                locations.add(prefix + "/" + _location);  
            } else {  
                locations.add(prefix + _location);  
            }  
        } else {  
            locations.add(ResourceUtils.FILE_URL_PREFIX + "./config/" + _location);  
        }  
        locations.add(ResourceUtils.FILE_URL_PREFIX + "./" + _location);  
        return locations;  
    }  
  
    private Collection<String> searchLocationsForClasspath(String location) {  
        Collection<String> locations = new LinkedHashSet<>();  
        String _location = shaping(location);  
        if (customConfigPath != null) {  
            String prefix = ResourceUtils.CLASSPATH_URL_PREFIX + customConfigPath;  
            if (!customConfigPath.endsWith("/")) {  
                locations.add(prefix + "/" + _location);  
            } else {  
                locations.add(prefix + _location);  
            }  
        } else {  
            locations.add(ResourceUtils.CLASSPATH_URL_PREFIX + "/config/" + _location);  
        }  
  
        locations.add(ResourceUtils.CLASSPATH_URL_PREFIX + "/" + _location);  
        return locations;  
    }  
  
    private String shaping(String location) {  
        if (location.startsWith("./")) {  
            return location.substring(2);  
        }  
        if (location.startsWith("/")) {  
            return location.substring(1);  
        }  
        return location;  
    }  
  
    /** 
     * remove protocol 
     * 
     * @param location 
     * @return 
     */  
    private String path(String location) {  
        return location.substring(2);  
    }  
}  
```
2、ResourceLoaderPostProcessor.java
```java
import org.springframework.context.ApplicationContextInitializer;  
import org.springframework.context.ConfigurableApplicationContext;  
import org.springframework.core.Ordered;  
import org.springframework.core.env.Environment;  
  
/** 
 * @author xjjdog 
 * 调整优化环境变量，对于boot框架会默认覆盖一些环境变量，此时我们需要在processor中执行 
 * 我们不再需要使用单独的yml文件来解决此问题。原则： 
 * 1）所有设置为系统属性的，初衷为"对系统管理员可见"、"对外部接入组件可见"（比如starter或者日志组件等） 
 * 2）对设置为lastSource，表示"当用户没有通过yml"配置选项时的默认值--担保策略。 
 **/  
public class ResourceLoaderPostProcessor implements ApplicationContextInitializer<ConfigurableApplicationContext>, Ordered {  
  
    @Override  
    public void initialize(ConfigurableApplicationContext applicationContext) {  
        Environment environment = applicationContext.getEnvironment();  
        String configPath = environment.getProperty("CONF_PATH");  
        if (configPath == null) {  
            configPath = environment.getProperty("config.path");  
        }  
        applicationContext.addProtocolResolver(new XPathProtocolResolver(configPath));  
    }  
  
    @Override  
    public int getOrder() {  
        return HIGHEST_PRECEDENCE + 100;  
    }  
}  
```
加上spring.factories，我们越来越像是在做一个starter了。没错，就是要做一个。

3、spring.factories
```
org.springframework.context.ApplicationContextInitializer=\  
com.github.xjjdog.commons.spring.io.ResourceLoaderPostProcessor  
```
PropertyConfiguration.java （springboot环境下，properties加载器）
```java
@Configuration  
@PropertySources(  
    {  
            @PropertySource("*:login.properties"),  
            @PropertySource("*:ldap.properties")  
    }  
)  
public class PropertyConfiguration {  
   
    @Bean  
    @ConfigurationProperties(prefix = "login")  
    public LoginProperties loginProperties() {  
        return new LoginProperties();  
    }  
   
    @Bean  
    @ConfigurationProperties(prefix = "ldap")  
    public LdapProperties ldapProperties() {  
        return new LdapProperties();  
    }  
}  
```
这样，我们的自定义加载器就完成了。我们也为SpringBoot组件，增加了新的功能。

## End
SpringBoot通过设置"spring.profiles.active"可以指定不同的环境，但是需求总是多变的。比如本文的配置需求，可能就是某个公司蛋疼的约定。
SpringBoot提供了多种扩展方式来支持这些自定义的操作，这也是魅力所在。没有什么，不是开发一个spring boot starter不能解决的。
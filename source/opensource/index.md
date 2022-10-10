---
id: opensource
title: 拥抱开源的我
layout: post
enable_comment: true
keywords: apiboot,springboot,minbox
customize: true
---

拖延症晚期的我，原本打算从`2018年`开始编写开源框架，直到`2019年`年初我才着手开始准备。

## 愿景

热爱编码的我，对开源这件事情一直向往。

我从`2013年`开始参加工作以来，大大小小的遇到了太多的三方框架集成的问题，爬过很多坑，走过很多的弯路，浪费了太多的宝贵时间！！！

把浪费的时间做点别的事情不香吗？

希望新进程序员在集成第三方框架时不再那么困难，不再翻阅一篇一篇的文章跟大量的官方文档，把集成的门槛降到最低，有相关框架的基础就可以快速上手，让大家更专注具体的业务实现。

## 开源组织

在编写开源框架之前我建立了名为`minbox-projects`的开源组织，欢迎大家加入进来成为`代码贡献者`，成为开源组织内的一员。

`minbox-projects`内包含了 `GroupId`为`"org.minbox.framework"`的全部开源框架，放在一起方便进行维护升级。

### 组织地址

- Gitee：[https://gitee.com/minbox-projects](https://gitee.com/minbox-projects)
- GitHub：[https://github.com/minbox-projects](https://github.com/minbox-projects)
- 官方文档：[https://www.minbox.io](https://www.minbox.io)

### 组织架构图

<img src="/images/minbox-project组织架构图.png" style="width:600px;"/>

- **核心基础**：提供了`minbox-projects`组织内开源框架的基础支持，公共使用的工具类、统一版本依赖等
- **开源框架**：提供指定业务场景的解决方案，如：`minbox-logging`（分布式链路日志框架）
- **集成实践**：基于`SpringBoot`进行封装`minbox-projects`开源组织内框架的`Starter`，统一命名为：`api-boot-starter-xxx`
- **Apache Maven**：统一使用`oss-parent`发布到`Apache Maven`中央仓库，可直接在项目内添加依赖使用，无需使用源码方式构建到本地

## I. 分布式链路日志

`minbox-logging`是一款分布式零侵入式、链路式请求日志分析框架。提供Admin端点进行采集日志、分析日志、日志告警通知、服务性能分析等。通过Admin Ui可查看实时链路日志信息、在线业务服务列表。

### 链路日志架构图

![](https://www.minbox.io/images/minbox-logging-trace.png)

### 链路日志地址

- Gitee：[https://gitee.com/minbox-projects/minbox-logging](https://gitee.com/minbox-projects/minbox-logging)
- GitHub：[https://github.com/minbox-projects/minbox-logging](https://github.com/minbox-projects/minbox-logging)
- 官方文档：[https://www.minbox.io/logging](https://www.minbox.io/logging/)

## II. ApiBoot

`ApiBoot`为接口服务而生，基于`SpringBoot`完成扩展、自动化配置，通过封装一系列`Starter`来让调用者快速集成组件，降低学习、使用门槛，提高开发效率。

### 架构层级图

![](/images/api-boot架构层级图.png)

- **公共模块(common)**：提供各个组件之间共用的工具类、枚举、常量、实体等。
- **插件(plugins)**：封装第三方框架的中间件，会陆续从`api-boot-plugins`迁移到`minbox-projects`开源组织内
- **统一版本(dependencies)**：提供使用的第三方依赖的指定版本，为`api-boot-starter-xxx`提供固定版本，使用依赖时类似`SpringBoot`可不用添加版本号
- **自动化配置(autoconfigure)**：内部通过`SpringBoot`提供的自动化配置注解来条件式的实例化各个组件所需要的类，也是所有组件的统一自动化集成入口。
- **Starters**：提供使用的具体依赖，每一个`Starter`内仅引用封装的第三方依赖以及`api-boot-autoconfigure`。

### ApiBoot相关地址

- Gitee：[https://gitee.com/minbox-projects/api-boot](https://gitee.com/minbox-projects/api-boot)
- GitHub：[https://github.com/minbox-projects/api-boot](https://github.com/minbox-projects/api-boot)
- 官方文档：[https://apiboot.minbox.org](https://apiboot.minbox.org/)
- 系列使用文章：[https://blog.minbox.org/apiboot-all-articles.html](https://blog.minbox.org/apiboot-all-articles.html)

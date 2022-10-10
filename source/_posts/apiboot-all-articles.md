---
id: apiboot-all-articles
title: ApiBoot开源框架各个组件的系列使用文章汇总
sort_title: ApiBoot组件使用系列文章汇总
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: false
news: false
customize: true
disable_toc: true
tags: [ApiBoot]
categories: [ApiBoot]
keywords: apiboot,springboot,使用详解
description: 'ApiBoot开源框架各个组件的系列使用文章汇总'
date: 2019-12-04 14:48:48
article_url:
---
<br/>

<hr/>


## ApiBoot是什么？

`ApiBoot`是接口服务的落地解决方案，基于`SpringBoot`编写，可以认为是提供了一系列开箱即用的`Starter`，通过封装来简化主流第三方框架的集成，从而提高开发者`开发效率`、`学习成本`、`降低入门门槛`，真正的实现`开箱即用`。
<!--more-->
## 官方文档 & 源码
- 官方文档：[https://apiboot.minbox.org](https://apiboot.minbox.org)
- GitHub：[https://github.com/minbox-projects/api-boot](https://github.com/minbox-projects/api-boot)
- 码云：[https://gitee.com/minbox-projects/api-boot](https://gitee.com/minbox-projects/api-boot)
- 脚手架：[https://gitee.com/minbox-projects/api-boot-admin](https://gitee.com/minbox-projects/api-boot-admin) (`基于 “ApiBoot” 的前后分离管理平台基础解决方案脚手架示例`)
- 使用源码：[https://gitee.com/minbox-projects/api-boot-chapter](https://gitee.com/minbox-projects/api-boot-chapter)

## 请给我支持

`ApiBoot`框架目前是由博客作者编写开源框架，请给我一定的支持，让我坚持去下，为开源做贡献。

- 请关注作者的公众号`“程序员恒宇少年”`，二维码在页面底部，关注后回复`资料`可获取恒宇少年整理的专属电子小册
- 请将该页面分享给更多需要它的技术学习爱好者
- 请给`ApiBoot`源码仓库点个`Star`，`Watching`后可以收到每次发版的通知。
  - [GitHub](https://github.com/minbox-projects/api-boot)
  - [Gitee](https://gitee.com/minbox-projects/api-boot)

## 作者推荐
我整理了极客时间学习热度比较高的课程，相关`SpringCloud`、`SpringBoot`、`K8s`、`数据结构与算法`、`Jvm调优`、`架构师修炼`等更多内容，有兴趣访问 [我的推荐课程](/geektime/) 了解详情，还能领取恒宇少年粉丝专属的 **¥199** 优惠券。

## 任务调度组件
- [分布式任务调度框架ApiBoot Quartz内的两种任务存储方式](https://blog.yuqiyu.com/apiboot-quartz-job-storage-away.html)
- [这种方式整合Quartz你见过吗？](https://blog.yuqiyu.com/apiboot-quartz-integrated-away.html)
- [分布式调度框架Quartz衍生出的三种任务类型，你用过几个？](https://blog.yuqiyu.com/apiboot-quartz-job-types.html)

## 文档组件
- [使用Swagger2作为文档来描述你的接口信息](https://blog.yuqiyu.com/apiboot-swagger-describe-the-interface.html)
- [Swagger2怎么整合OAuth2来在线调试接口？](https://blog.yuqiyu.com/apiboot-swagger-integrated-oauth.html)

## 安全组件
- [OAuth2在内存、Redis、JDBC方式下的多客户端配置](https://blog.yuqiyu.com/apiboot-oauth-multiple-client-config.html)
- [ApiBoot实现零代码整合Spring Security & OAuth2](https://blog.yuqiyu.com/apiboot-security-oauth-zero-code-integration.html)
- [ApiBoot零代码整合Spring Security的JDBC方式获取AccessToken](https://blog.yuqiyu.com/apiboot-security-customize-select-user.html)
- [见过这么简单的方式整合Spring Security & OAuth2的自定义查询用户吗？](https://blog.yuqiyu.com/apiboot-security-oauth-custom-certification-user.html)
- [Spring Security & OAuth2实现短信验证码方式获取AccessToken](https://blog.yuqiyu.com/apiboot-define-oauth-grant-type.html)
- [原来Spring Security整合OAuth2后开放权限拦截路径还能这么玩？](https://blog.yuqiyu.com/apiboot-security-open-paths-without-intercept.html)
- [我以为OAuth2整合JWT是很困难的事情，直到我使用了ApiBoot，一切都变了！](https://blog.yuqiyu.com/apiboot-security-oauth-use-jwt.html)
- [来看看OAuth2怎么设置AccessToken有效期时间时长](https://blog.yuqiyu.com/apiboot-oauth-set-token-expire-time.html)
- [OAuth2使用Redis来存储客户端信息以及AccessToken](https://blog.yuqiyu.com/apiboot-oauth-use-redis-storage.html)

## 分布式日志组件
- [《ApiBoot新特性》GlobalLog全局日志的使用详解](https://blog.yuqiyu.com/apiboot-logging-use-global-log.html)
- [使用ApiBoot Logging进行统一管理请求日志](https://blog.yuqiyu.com/apiboot-unified-manage-request-logs.html)
- [将ApiBoot Logging采集的日志上报到Admin](https://blog.yuqiyu.com/apiboot-report-logs-by-logging-to-admin.html)
- [自定义ApiBoot Logging链路以及单元ID](https://blog.yuqiyu.com/apiboot-custom-logging-traceid.html)
- [修改ApiBoot Logging日志采集的前缀](https://blog.yuqiyu.com/modify-apiboot-logging-collection-prefix.html)
- [ApiBoot Logging忽略路径不进行采集日志](https://blog.yuqiyu.com/ignore-apiboot-logging-collection-path.html)
- [ApiBoot Logging整合Spring Security安全上报日志](https://blog.yuqiyu.com/apiboot-logging-integrates-spring-security.html)
- [ApiBoot Logging整合SpringCloud Eureka负载均衡上报日志](https://blog.yuqiyu.com/apiboot-logging-integrates-eureka-report-logs.html)
- [ApiBoot Logging使用SpringCloud Openfeign透传链路信息](https://blog.yuqiyu.com/apiboot-logging-using-openfeign-transparent-traceid.html)
- [ApiBoot Logging使用RestTemplate透传链路信息](https://blog.yuqiyu.com/apiboot-logging-using-resttemplate-transparent-traceid.html)
- [ApiBoot Logging Admin可视化界面管理日志](https://blog.yuqiyu.com/apiboot-logging-admin-visual-interface-management-log.html)

## 其他组件

更多组件的使用文章正在火热连载更新...

## 作者公众号

  <img src="/images/mp.jpg" width="150"/>

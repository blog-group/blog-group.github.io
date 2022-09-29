---
id: import-osm-data-into-mysql
title: 将OpenStreetMap导出的OSM数据导入MySQL数据库
sort_title: 将OSM数据导入MySQL
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: true
news: true
disable_toc: false
customize: false
tags:
  - 技术杂谈
categories:
  - 技术杂谈
keywords: 'osm,openstreetmap,mysql'
description: import-osm-data-into-mysql
date: 2021-04-16 14:18:15
article_url:
---

## OpenStreetMap

`OpenStreetMap`是一个所有人都可以编辑并自由使用的世界地图。

其中的大部分内容由志愿者从无到有地构建起来，并以开放授权发布， OpenStreetMap版权协议允许所有人自由且免费使用我们的地图图像与地图数据，而且本项目鼓励把数据用于有趣崭新的用途。

**OpenStreetMap：** [https://www.openstreetmap.org](https://www.openstreetmap.org/)

## 导出osm数据

我们访问上面`OpenStreetMap`主页，我们可以看到跟其他提供地图服务的网站一样，也提供了位置导航的功能，也会直接定位到当前浏览的位置，那我们怎么才可以导出地图数据呢？

![1](/images/post/import-osm-data-into-mysql-1.png)

我们访问页面的左上角有个**导出**的按钮，我们点击后可以看到如下图的界面：

![2](/images/post/import-osm-data-into-mysql-2.png)

我们点击红框内的导出按钮可以导出上面默认区域（两个经纬度组成的区域）内的全部地图数据（街道、建筑等），导出数据文件的后缀格式为`.osm`，默认导出文件的名称为`map.osm`。

如果我们需要自定义导出的区域可以点击 “手动选择不同的区域”，通过拖拽的方式来定位区域的位置以及大小，如下图所示：

![](/images/post/import-osm-data-into-mysql-3.png)

点击 `导出` 按钮就可以获得我们选中区域内的地图数据。

> 注意事项：这种区域导出方式有个弊端，不能导出数据量超过50000个经纬度点的数据。

## 安装osmosis

我们已经导出了地图数据（`map.osm`），我们可以通过`osmosis`来实现数据导入数据库，`osx`系统可以通过`brew`进行安装，如下所示：

```sh
yuqiyu@hengyu ~> brew install osmosis
```



## 初始化数据库表

通过`osmosis`导入到数据库时，需要提前创建数据库以及数据表，点击 [下载MySQL建表语句](/files/mysql-apidb06.sql)。

## 导入数据库

```sh
yuqiyu@hengyu ~> osmosis --read-xml file="/Users/yuqiyu/Downloads/map.osm" --write-apidb-0.6 host="127.0.0.1" dbType="mysql" database="api06_test" user="root" password="123456" validateSchemaVersion=no
```



## 敲黑板，划重点

基于`OpenStreetMap`提供的开源道路数据我们可以做的事情有很多，拿到道路上的经纬度（`longitude`、`latitude`）地理位置后做一些独特的业务处理，比如：我可以清楚的知道某一条道路上有哪些业务车辆经过、建立自有业务的地图数据、规划工作路线等。

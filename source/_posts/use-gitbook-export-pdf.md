---
id: use-gitbook-export-pdf
title: 使用Gitbook创建文档并导出PDF
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: false
news: true
customize: false
tags: [技术杂谈]
categories: [技术杂谈]
keywords: gitbook,导出pdf,markdown
date: 2019-11-29 10:00:30
article_url:
description: '使用Gitbook创建文档并导出PDF'
---
导出`PDF`的方式有很多种，之前使用过`马克飞象`的导出功能，不过只是简单的导出并不能添加目录，因为源文件是`markdown`编写的，经过筛选后采用了`gitbook`的方式进行编写文档并且使用`gitbook pdf .`的方式导出为`PDF`文件。
<!--more-->

> 注意：本机需要有`NodeJs`环境。

## 环境准备

想要使用`gitbook`，那么我们本机需要进行安装，通过`npm`命令可以很方便的安装。

### 安装GitBook 
通过`npm`的方式进行安装`gitbook`环境，命令如下所示：
```bash
npm install gitbook -g
```
### 安装calibre & ebook-convert 

使用`gitbook`的导出功能，需要第三方插件`ebook`的支持，下面针对两种不同的操作系统进行配置环境。

#### Linux系统

下载地址：[https://calibre-ebook.com/download_linux](https://calibre-ebook.com/download_linux)

- 下载并安装

  ```bash
  sudo -v && wget -nv -O- https://download.calibre-ebook.com/linux-installer.sh | sudo sh /dev/stdin
  ```

- 配置软链接

  ```bash
  sudo ln -s /usr/bin/nodejs /usr/bin/node
  ```

  

#### Mac系统

下载地址：[https://calibre-ebook.com/download_osx](https://calibre-ebook.com/download_osx)

- 下载并安装

  下载的为`dmg`文件直接双击安装即可。

- 配置软链接

  ```bash
  sudo ln -s ~/Applications/calibre.app/Contents/MacOS/ebook-convert /usr/bin
  ```

### 测试安装

安装完成后通过如下命令进行测试是否已经生效。

```bash
ebook-convert --version
```

## 生成文档

一个新的`gitbook`文档有两个文件组成，分别是`README.md`、`SUMMARY.md`（可自行创建文件夹，在文件夹内创建这两个文件）。

- `README.md`：关于当前文档的详细描述
- `SUMMARY.md`：当前文档的目录层级关系配置，通过初始化命令可直接生成`markdown`文件以及文件夹。

### 编写Summary

下面是一个示例文档的层级关系：

```markdown
# Summary

- 第一级目录
  - [第一级目录的子目录](one/first.md)
- 第二级目录
  - [第二级目录的子目录](two/first.md)
```

### GitBook初始化

`gitbook`内部提供了一个初始化的命令，自动根据`SUMMARY.md`文件的层级内容生成对应的`md`文件以及文件夹，执行如下命令：

```bash
➜ gitbook-example gitbook init
info: create one/first.md 
info: create two/first.md 
info: create SUMMARY.md 
info: initialization is finished 
```

控制台的输出信息已经告诉我们成功创建了`one/first.md`、`two/first.md`这两个文件。

### 配置语言

`gitbook`默认使用的并不是`中文汉子`，我们需要通过配置`book.json`文件来修改默认语言方式（`book.json`文件创建在`SUMMARY.md`同级目录下）如下所示：

```json
{
    "language": "zh-hans"
}
```

## 导出文档

`gitbook`导出文档的方式有多种，下面简单介绍几种导出的方式。

### 导出为PDF

在`SUMMARY.md`文件的同级目录执行`gitbook pdf .`命令进行导出`PDF`文件，执行日志如下所示：

```bash
➜ gitbook-example gitbook pdf .
info: 7 plugins are installed 
info: 6 explicitly listed 
info: loading plugin "highlight"... OK 
info: loading plugin "search"... OK 
info: loading plugin "lunr"... OK 
info: loading plugin "sharing"... OK 
info: loading plugin "fontsettings"... OK 
info: loading plugin "theme-default"... OK 
info: found 3 pages 
info: found 0 asset files 
info: >> generation finished with success in 5.7s ! 
info: >> 1 file(s) generated 
```

> 如果想要自定义生成的`pdf`文件名称，可以使用`gitbook pdf . ./xxxx.pdf`命令。

### 导出为epub

在`SUMMARY.md`文件的同级目录执行`gitbook epub .`命令进行导出`epub`文件，执行日志如下所示：

```bash
➜ gitbook-example gitbook epub .
info: 7 plugins are installed 
info: 6 explicitly listed 
info: loading plugin "highlight"... OK 
info: loading plugin "search"... OK 
info: loading plugin "lunr"... OK 
info: loading plugin "sharing"... OK 
info: loading plugin "fontsettings"... OK 
info: loading plugin "theme-default"... OK 
info: found 3 pages 
info: found 2 asset files 
info: >> generation finished with success in 2.4s ! 
info: >> 1 file(s) generated 
```

### 导出为mobi

在`SUMMARY.md`文件的同级目录执行`gitbook mobi .`命令进行导出`mobi`文件，执行日志如下所示：

```bash
➜ gitbook-example gitbook mobi .
info: 7 plugins are installed 
info: 6 explicitly listed 
info: loading plugin "highlight"... OK 
info: loading plugin "search"... OK 
info: loading plugin "lunr"... OK 
info: loading plugin "sharing"... OK 
info: loading plugin "fontsettings"... OK 
info: loading plugin "theme-default"... OK 
info: found 3 pages 
info: found 3 asset files 
info: >> generation finished with success in 1.9s ! 
info: >> 1 file(s) generated
```

## 导出日志查看

如果你在导出过程中遇到了问题，你可以在执行导出命令时添加`--log=debug`命令参数，这样导出时就可以看到完整的日志信息在控制台输出，如下所示：

```bash
➜ gitbook-example gitbook pdf . ./example.pdf --log=debug
debug: readme found at README.md 
debug: summary file found at SUMMARY.md 
debug: cleanup folder "/var/folders/c1/5mrhntb13_zfrnjg4grnf8zr0000gn/T/tmp-2291a4Jd8P8oNX4l" 
......
```

## 总结
使用`gitbook`可以用来编写公司的接口使用文档、项目设计文档等等，功能远不止如此，它还可以通过`gitbook build`命令来生成静态`html`文件，可以部署到`Nginx`、`阿里云OSS`等静态页面托管的地方。
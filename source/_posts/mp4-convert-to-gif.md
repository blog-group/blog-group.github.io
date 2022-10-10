---
id: mp4-convert-to-gif
title: 无意间发现一个好用的视频转换gif图片的开源框架
sort_title: 好用的视频转换gif图片的开源框架
article_type: 原创
article_author: 于起宇
enable_comment: true
hot: false
news: true
disable_toc: false
customize: false
tags: [技术杂谈]
categories: [技术杂谈]
keywords: 'mp4转gif,gifify'
description: mp4-convert-to-gif
date: 2020-08-04 08:45:12
article_url:
---

## 简介

`Gifify`是一款工具类的开源框架，可以将任何视频文件转换为优化的动画GIF。

- GitHub：[https://github.com/vvo/gifify](https://github.com/vvo/gifify)

> 有些时候我们需要将`视频转换为动画GIF图`，可以更**生动形象**的描述我们想要说明的事物以及框架的使用方式，它对于程序员来说是一个`不可或缺的工具`之一。

## 环境支持

在安装`Gifify`之前首先我们需要先安装它所需要的运行环境：

- **Node.js**（`brew install node`）
- **FFmpeg**（`brew install ffmpeg`）
- **ImageMagick**（`brew install imagemagick`）
- **giflossy**（`brew install giflossy`）

## 安装

可以通过`npm`直接安装`Gifify`，如下所示：

```
npm install -g gifify
```

## 命令行参数

下面是`Gifify`所支持的命令行参数列表。

```
➜  ~ gifify -h
Usage: gifify [options] [file]

Options:
  -V, --version           output the version number
  --colors <n>            Number of colors, up to 255, defaults to 80 (default: 80)
  --compress <n>          Compression (quality) level, from 0 (no compression) to 100, defaults to 40 (default: 40)
  --from <position>       Start position, hh:mm:ss or seconds, defaults to 0
  --fps <n>               Frames Per Second, defaults to 10 (default: 10)
  -o, --output <file>     Output file, defaults to stdout
  --resize <W:H>          Resize output, use -1 when specifying only width or height. `350:100`, `400:-1`, `-1:200`
  --reverse               Reverses movie
  --speed <n>             Movie speed, defaults to 1 (default: 1)
  --subtitles <filepath>  Subtitle filepath to burn to the GIF
  --text <string>         Add some text at the bottom of the movie
  --to <position>         End position, hh:mm:ss or seconds, defaults to end of movie
  --no-loop               Will show every frame once without looping
  -h, --help              output usage information
```

## 视频转换为GIF

我使用Mac自带的屏幕录制软件`QuickTime Player`录制了一个测试视频，根据上面的命令行参数来看如果我们不做一些其他的自定义，只添加`-o、--output`输出的gif文件名即可，如下所示：

```sh
➜ gifify 屏幕录制2020-08-05\ 上午8.58.01.mov --output example.gif
Generating GIF, please wait...
```

当我们看到提示信息`Generating GIF, please wait...`时，说明已经开始转换了，因为视频文件的大小有差异，所以转换所需要的时间也所有不同。

> 自动创建的`example.gif`文件与转换的视频文件在同一目录下。

![](https://blog.minbox.org/images/post/mp4-convert-to-gif-1.gif)

## GIF截取

如果你只需要转换视频中的一个时间段，我们可以通过指定`--from`、`--to`参数来配置，如下所示：

```sh
➜ gifify 屏幕录制2020-08-05\ 上午8.58.01.mov --output example.gif --from 00:00:10 --to 00:00:15
```

## GIF压缩

`Gifify`默认压缩比例为`40%`，压缩后的Gif图可能会比较模糊，我们可以通过`--compress`参数来修改压缩比例，**0**表示无压缩，取值范围为`0~100`，如下所示：

```sh
➜ gifify 屏幕录制2020-08-05\ 上午8.58.01.mov --output example.gif --from 00:00:10 --to 00:00:12 --compress 0
```


## 总结

`Gifify`还有很多隐藏的功能，比如在GIF图片上添加文字描述，缩放视频比例，反转视频等功能，赶快去发掘它的隐藏功能吧。
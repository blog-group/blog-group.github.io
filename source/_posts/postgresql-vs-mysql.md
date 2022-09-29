---
id: postgresql-vs-mysql
title: PostgreSQL和MySQL到底选哪一个？
sort_title: PostgreSQL和MySQL到底选哪一个？
article_type: 转载
article_author: nimapinfotech
enable_comment: true
hot: false
news: true
disable_toc: false
customize: false
tags:
  - 技术杂谈 
categories:
  - 技术杂谈
keywords: 'Postgresql,Mysql'
description: postgresql-vs-mysql
date: 2021-11-19 13:48:48
article_url: https://nimapinfotech.com/blog/postgresql-vs-mysql/
---
![](/images/post/postgresql-vs-mysql.png)

## PostgreSQL VS MySQL

| VS           | PostgreSQL                                                   | MySQL                                                        |
| ------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| 开源         | PostgreSQL是一个免费的开源系统，它受PostgreSQL许可证（自由的开源许可证）的约束。 | MySQL属于Oracle旗下产品，并提供几种付费版本供用户使用        |
| 管理         | PostgreSQL是全球用户共同发展的产品                           | MySQL是GNU通用公共许可以及各种专有协议条款下的产品           |
| 性能         | PostgreSQL适合对读写速度要求很高的大型系统中使用             | MySQL主要用于Web应用程序，该Web应用程序仅需要数据库来进行数据交易。 |
| 遵循ACID     | PostgreSQL从头到尾都遵循ACID原则，并确保满足需求             | MySQL只有在使用InnoDB和NDB集群存储引擎时才符合ACID要求。     |
| SQL 兼容性   | “从文档看，PostgreSQL是兼容大部分SQL的。 PostgreSQL支持SQL:2011的大多数功能。在核心一致性所需的179个强制性功能中，PostgreSQL至少兼容160个。此外，还有一系列受支持的可选功能。” | “从文档看，MySQL在某些版本是兼容部分SQL。 我们对该产品的主要目标之一是继续努力达到SQL标准的要求，但又不牺牲速度或可靠性。我们可以添加SQL扩展或对非SQL功能的支持，如果这样可以极大地提高MySQL服务器在我们大部分用户群中的可用性。” |
| 支持平台     | PostgreSQL可以运行在Linux, Windows (Win2000 SP4 及以上)，FreeBSD，OpenBSD，NetBSD , Mac OS X, AIX, IRIX ,Solaris和 Tu64. 也支持由技术巨头惠普开发的HP-UX OS，以及开源的Unix OS。 | MySQL可以运行在Oracle Solaris，Microsoft Windows, Linux Mac OS X。MySQL扩展了对开源FreeBSD OS的支持 |
| 编程语言支持 | PostgreSQL是用C语言编写的，它支持多种编程语言，最突出的C/C++, Delphi, JavaScript, Java, Python, R , Tcl , Go, Lisp, Erlang和.Net. | PostgreSQL是用C和C++编写的，它支持C/C++, Erlang，PHP，Lisp,和Go, Perl，Java, Delphi, R ,和 Node.js. |
| 物化视图     | PostgreSQL支持物化视图                                       | MySQL不支持物化视图                                          |
| 数据备份     | PostgreSQL支持主备复制，并且还可以通过实现第三方扩展来处理其他类型的复制 | MySQL支持主备复制，其中每个节点都是主节点，并且有权更新数据  |
| 可拓展性     | PostgreSQL是高度可扩展的，您可以添加和拥有数据类型，运算符，索引类型和功能语言。 | MySQL不支持拓展性。                                          |
| 访问方法     | PostgreSQL支持所有标准。                                     | MySQL支持所有标准。                                          |
| 社区支持     | PostgreSQL有一个活跃的社区支持，该社区帮助改善现有功能，其富有创造力的提交者竭尽全力确保该数据库保持最新的功能和最大的安全性，成为最先进的数据库。 | MySQL也有一个庞大的追随者社区，这些社区贡献者，特别是在被Oracle收购之后，主要关注一些偶尔出现的新功能，并维护现有功能。 |
| 安全性       | PostgreSQL为连接提供本机SSL支持，以加密客户端/服务器通信。 PSQL还具有行级安全性。 | MySQL是高度安全的，并且包含多个安全功能。                    |



## 总结

本文中，我们讨论了两种最广泛使用的关系型数据库管理系统 PostgreSQL和MySQL的最先进的特性。这两种数据库管理系统既有相似之处，也有不同之处。如果您需要一个用于Web应用程序的，高安全性的关系型数据库管理系统，或者想要构建一个活跃用户超过数百万的面向消费者的app，那么MySQL将适合您的项目。如果你的需求围绕复杂的程序,复杂的设计,集成和数据完整性、事务支持,而不是在高速，那么,PostgreSQL将会是你项目理想的选择。

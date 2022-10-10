---
id: restful-api-uri
title: RESTful规范Api最佳设计实践
article_type: 原创
article_author: 于起宇
enable_comment: true
news: true
hot: true
tags: [技术杂谈]
categories: [技术杂谈]
date: 2019-10-09 14:08:23
keywords: restful,springboot,恒宇少年
description: 'RESTful规范Api最佳设计实践'
---

`RESTful`是目前比较流行的接口路径设计规范，基于HTTP，一般使用JSON方式定义，通过不同HttpMethod来定义对应接口的资源动作，如：新增（POST）、删除（DELETE）、更新（PUT、PATCH）、查询（GET）等。
<!--more-->

## 路径设计

在`RESTful`设计规范内，每一个接口被认为是一个资源请求，下面我们针对每一种资源类型来看下API路径设计。

`路径设计`的`注意事项`如下所示：

- **资源名使用复数**
- **资源名使用名词**
- **路径内不带特殊字符**
- **避免多级URL**

### 新增资源

| 请求方式 | 示例路径                        |
| -------- | ------------------------------- |
| POST     | https://api.yuqiyu.com/v1/users |

新增资源使用`POST`方式来定义接口，新增资源数据通过`RequestBody`方式进行传递，如下所示：

```bash
curl -X POST -H 'Content-Type: application/json' https://api.yuqiyu.com/v1/users -d '{
    "name": "恒宇少年", 
    "age": 25, 
    "address": "山东济南"
}'
```

新增资源后接口应该返回该资源的唯一标识，比如：主键值。

```json
{
  "id" : 1,
  "name" : "恒宇少年"
}
```

**通过返回的唯一标识来操作该资源的其他数据接口。**

### 删除资源

| 请求方式 | 示例路径                             | 备注         |
| -------- | ------------------------------------ | ------------ |
| DELETE   | https://api.yuqiyu.com/v1/users      | 批量删除资源 |
| DELETE   | https://api.yuqiyu.com/v1/users/{id} | 删除单个资源 |

删除资源使用`DELETE`方式来定义接口。

- 根据主键值删除单个资源

  ```bash
  curl -X DELETE https://api.yuqiyu.com/v1/users/1
  ```

  将资源的`主键值`通过路径的方式传递给接口。

- 删除多个资源

  ```bash
  curl -X DELETE -H 'Content-Type: application/json' https://api.yuqiyu.com/v1/users -d '{
      "userIds": [
          1, 
          2, 
          3
      ]
  }'
  ```

  删除多个资源时通过`RequestBody`方式进行传递删除条件的数据列表，上面示例中通过资源的主键值集合作为删除条件，当然也可以通过资源的其他元素作为删除的条件，比如：`name`

### 更新资源

| 请求方式 | 示例路径                             | 备注                       |
| -------- | ------------------------------------ | -------------------------- |
| PUT      | https://api.yuqiyu.com/v1/users/{id} | 更新单个资源的**全部**元素 |
| PATCH    | https://api.yuqiyu.com/v1/users/{id} | 更新单个资源的**部分**元素 |

在更新资源数据时使用`PUT`方式比较多，也是比较常见的，如下所示：

```bash
curl -X PUT -H 'Content-Type: application/json' https://api.yuqiyu.com/v1/users/1 -d '{
    "name": "恒宇少年", 
    "age": 25, 
    "address": "山东济南"
}'
```



### 查询单个资源

| 请求方式 | 示例路径                                    | 备注               |
| -------- | ------------------------------------------- | ------------------ |
| GET      | https://api.yuqiyu.com/v1/users/{id}        | 查询单个资源       |
| GET      | https://api.yuqiyu.com/v1/users?name={name} | 非唯一标识查询资源 |

- 唯一标识查询单个资源

  ```bash
  curl https://api.yuqiyu.com/v1/users/1
  ```

  通过唯一标识查询资源时，使用路径方式传递标识值，体现出层级关系。

- 非唯一标识查询单个资源

  ```bash
  curl https://api.yuqiyu.com/v1/users?name=恒宇少年
  ```

  查询资源数据时不仅仅都是通过唯一标识值作为查询条件，也可能会使用资源对象内的某一个元素作为查询条件。

### 分页查询资源

| 请求方式 | 示例路径                                       |
| -------- | ---------------------------------------------- |
| GET      | https://api.yuqiyu.com/v1/users?page=1&size=20 |

分页查询资源时，我们一般需要传递两个参数作为分页的条件，`page`代表了当前分页的页码，`size`则代表了每页查询的资源数量。

```bash
curl https://api.yuqiyu.com/v1/users?page=1&size=20
```

如果分页时需要传递查询条件，可以继续追加请求参数。

```bash
https://api.yuqiyu.com/v1/users?page=1&size=20&name=恒宇少年
```



### 动作资源

有时我们需要有动作性的修改某一个资源的元素内容，比如：重置密码。

| 请求方式 | 示例路径                                                     | 备注 |
| -------- | ------------------------------------------------------------ | ---- |
| POST     | https://api.yuqiyu.com/v1/users/{id}/actions/forget-password | -    |

用户的唯一标识在请求路径中进行传递，而修改后的密码通过`RequestBody`方式进行传递，如下所示：

```bash
curl -X POST -H 'Content-Type: application/json' https://api.yuqiyu.com/v1/users/1/actions/forget-password -d '{
    "newPassword": "123456"
}'
```



## 版本号

版本号是用于区分`Api`接口的新老标准，比较流行的分别是`接口路径`、`头信息`这两种方式传递。

- **接口路径方式**

  我们在部署接口时约定不同版本的请求使用`HTTP代理`转发到对应版本的接口网关，常用的请求转发代理比如使用：`Nginx`等。

  这种方式存在一个弊端，如果多个版本同时将请求转发到同一个`网关`时，会导致具体版本的请求转发失败，我们访问`v1`时可能会转发到`v2`，这并不是我们期望的结果，当然可以在`网关`添加一层拦截器，通过提取路径上班的版本号来进行控制转发。

  ```bash
  # v1版本的请求
  curl https://api.yuqiyu.com/v1/users/1
  # v2版本的请求
  curl https://api.yuqiyu.com/v2/users/1
  ```

  

- **头信息方式**

  我们可以将访问的接口版本通过`HttpHeader`的方式进行传递，在`网关`根据提取到的头信息进行控制转发到对应版本的服务，**这种方式资源路径的展现形式不会因为版本的不同而变化**。

  ```bash
  # v1版本的请求
  curl -H 'Accept-Version：v1' https://api.yuqiyu.com/users/1
  # v2版本的请求
  curl -H 'Access-Version: v2' https://api.yuqiyu.com/users/1
  ```

  这两个版本的请求可能请求参数、返回值都不一样，但是请求的路径是一样的。

  版本头信息的`Key`可以根据自身情况进行定义，推荐使用`Accpet`形式，详见<a href="http://www.informit.com/articles/article.aspx?p=1566460" target="_blank">Versioning REST Services</a>。

## 状态码

在`RESTful`设计规范内我们需要充分的里面`HttpStatus`请求的状态码来判断一个请求发送状态，本次请求是否有效，常见的`HttpStatus`状态码如下所示：

| 状态码 | 发生场景                                                     |
| ------ | ------------------------------------------------------------ |
| 200    | 请求成功                                                     |
| 201    | 新资源创建成功                                               |
| 204    | 没有任何内容返回                                             |
| 400    | 传递的参数格式不正确                                         |
| 401    | 没有权限访问                                                 |
| 403    | 资源受保护                                                   |
| 404    | 访问的路径不正确                                             |
| 405    | 访问方式不正确，GET请求使用POST方式访问                      |
| 410    | 地址已经被转移，不可用                                       |
| 415    | 要求接口返回的格式不正确，比如：客户端需要JSON格式，接口返回的是XML |
| 429    | 客户端请求次数超过限额                                       |
| 500    | 访问的接口出现系统异常                                       |
| 503    | 服务不可用，服务一般处于维护状态。                           |

针对不同的状态码我们要做出不同的反馈，下面我们先来看一个常见的`参数异常`错误响应设计方式：

```bash
# 发起请求
curl -X POST -H 'Content-Type: application/json' https://api.yuqiyu.com/v1/users -d '{
    "name": "", 
    "age": 25, 
    "address": "山东济南"
}'
# 响应状态
HttpStatus 200
# 响应内容
{
    "code": "400", 
    "message": "用户名必填."
}
```

在服务端我们可以控制不同状态码、不同异常的固定返回格式，不应该将所有的异常请求都返回`200`，然后对应返回错误，正确的方式：

```bash
# 发起请求
curl -X POST -H 'Content-Type: application/json' https://api.yuqiyu.com/v1/users -d '{
    "name": "", 
    "age": 25, 
    "address": "山东济南"
}'
# 响应状态
HttpStatus 400
# 响应内容
{
    "error": "Bad Request", 
    "message": "用户名必填."
}
```



## 响应格式

接口的响应格式应该`统一`。

每一个请求成功的接口返回值外层格式应该统一，在服务端可以采用实体方式进行泛型返回。

如下所示：

```java
/**
 * Api统一响应实体
 * {@link #data } 每个不同的接口响应的数据内容
 * {@link #code } 业务异常响应状态码
 * {@link #errorMsg} 业务异常消息内容
 * {@link #timestamp} 接口响应的时间戳
 *
 * @author 恒宇少年 - 于起宇
 */
@Data
public class ApiResponse<T> implements Serializable {
    private T data;
    private String code;
    private String errorMsg;
    private Long timestamp;
}
```

- data

  由于每一个`API`的响应数据类型不一致，所以在上面采用的泛型的泛型进行返回，`data`可以返回任意类型的数据。

- code

  业务逻辑异常码，比如：USER_NOT_FOUND（用户不存在）这是接口的约定

- errorMsg

  对应`code`值得描述。

- timestamp

  请求响应的时间戳

  

## 总结

`RESTful`是`API`的设计规范，并不是所有的接口都应该遵循这一套规范来设计，不过我们在设计初期更应该规范性，这样我们在后期阅读代码时根据路径以及请求方式就可以了解接口的主要完成的工作。
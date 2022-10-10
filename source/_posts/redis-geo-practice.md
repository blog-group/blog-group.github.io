---
id: redis-geo-practice
title: 实践：了解Redis Geo范围查询，获取当前位置最近的经纬度点
sort_title: 了解Redis Geo范围查询
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
keywords: 'Redis,Geo,范围检索'
description: 实践，基于Redis Geo实现范围内位置检索
date: 2021-04-07 17:16:02
article_url:
---

近期有个获取车辆所处道路的需求，车辆行驶的范围在一个城市的市区内，针对一个城市的道路**经纬度节点**的数据量会比较大（就济南市而言，目前数据量在20万左右），数据的`准确性`以及`检索效率`是首要考虑的问题。

<!--more-->
## 推荐阅读
- [SpringBoot2.x 教程汇总](https://blog.yuqiyu.com/spring-boot-2-x-articles.html)

## Redis Geo

经过一系列的调研后，由于数据的量级也还可以，决定采用`Redis Geo`来解决这个问题。

`Redis`从**3.2+**版本开始对`Geo`的支持进行了增强，提供了可以根据给定经纬度点位置作为中心点，在指定范围内进行检索距离最近的经纬度点。

美团外卖、饿了么等APP上根据手机位置定位范围中（1km内）的商家，类似于这种的需求也可以使用`Redis Geo`来实现。

```sh
yuqiyu@hengyu ~> redis-cli
127.0.0.1:6379> keys *
(empty list or set)
127.0.0.1:6379> geoadd road:nodes:370100 117.1087416 36.7148919 point1 
(integer) 1
127.0.0.1:6379> geoadd road:nodes:370100 117.1087006 36.7152294 point2 
(integer) 1
127.0.0.1:6379> keys *
1) "road:nodes:370100"

# 查询一条经纬度
127.0.0.1:6379> georadius road:nodes:370100 117.1089668 36.7151653 100 m withdist withcoord count 1
1) 1) "point2"
   2) "24.5815"
   3) 1) "117.10870295763015747"
      2) "36.7152294132502206"

# 查询两条经纬度
127.0.0.1:6379> georadius road:nodes:370100 117.1089668 36.7151653 100 m withdist withcoord count 2
1) 1) "point2"
   2) "24.5815"
   3) 1) "117.10870295763015747"
      2) "36.7152294132502206"
2) 1) "point1"
   2) "36.4573"
   3) 1) "117.10874050855636597"
      2) "36.71489229533602838"
```

### geoadd 命令

```
geoadd key longitude latitude member [longitude latitude member ...]
```

- `key`：geo集合的唯一键
- `longitude`：新增GPS位置的经度
- `latitude`：新增GPS位置的纬度
- `member`：该GPS位置的唯一标识

### georadius 命令

```
georadius key longitude latitude radius m|km|ft|mi [WITHCOORD] [WITHDIST] [WITHHASH] [COUNT count] [ASC|DESC] [STORE key] [STOREDIST key]
```

- `key`：geo集合的唯一键
- `longitude`：待检索的GPS经度
- `latutude`：待检索的GPS纬度
- `radius`：检索的范围，单位可选择：米（m）、千米（km）、英里（mi）、英尺（ft）
- `withcoord`：将匹配的经纬度输出
- `withdist`：将匹配经纬度的距离输出
- `count`：输出匹配的数量
- `asc|desc`：根据距离排序，asc：由近到远，desc：由远到近

> `georadius`指令会将给定的经纬度作为检索的中心点，在指定范围内进行检索匹配的经纬度点的位置。

## 检索实现

在实践的过程中，使用了两种方式来进行测试，发现在检索的效率上有着轻微的差异，下面通过代码实践来进行比对。

## Spring Data 方式检索

`spring-boot-starter-data-redis`是`SpringBoot`提供用于操作`Redis`的依赖，内部集成的是`lettuce`，下面是通过`RedisTemplate`的方式来检索范围内的点的代码实现。

```java
/**
 * Spring Data方式测试Redis Geo
 *
 * @author 恒宇少年
 */
@SpringBootTest
@Slf4j
public class SpringDataRedisGeoTest {
    /**
     * Redis Geo Key
     */
    private static final String GEO_KEY = "road:nodes:370100";
    @Autowired
    private RedisTemplate redisTemplate;

    /**
     * 检索geo集合内的最近位置
     */
    @Test
    public void searchPoint() {
        double longitude = 117.1089668;
        double latitude = 36.7151653;
        Point centerPoint = new Point(longitude, latitude);
        Distance distance = new Distance(100, RedisGeoCommands.DistanceUnit.METERS);
        Circle circle = new Circle(centerPoint, distance);
        RedisGeoCommands.GeoRadiusCommandArgs args = RedisGeoCommands
                .GeoRadiusCommandArgs
                .newGeoRadiusArgs()
                .includeDistance()
                .includeCoordinates()
                .sortAscending()
                .limit(1);
        GeoResults<RedisGeoCommands.GeoLocation<String>> radius = redisTemplate.boundGeoOps(GEO_KEY).radius(circle, args);
        for (GeoResult<RedisGeoCommands.GeoLocation<String>> result : radius) {
            RedisGeoCommands.GeoLocation<String> content = result.getContent();
            log.info("检索的结果，唯一标识：{}，位置：{}，距离：{}.",
                    content.getName(), content.getPoint(), result.getDistance());
        }
    }
}
```



## Redission方式检索

`Redisson`内部自定义封装了操作`Redis`的逻辑，对`Redis Geo`也做了支持，经过测试发现，`Redisson`方式要比`Spring Data`方式检索的效率高。

> 以10万条数据为例，`Spring Data`方式检索需要300ms左右，而`Redisson`方式检索仅需要90ms左右。

```java
/**
 * Redisson方式测试Redis Geo
 *
 * @author 恒宇少年
 */
@SpringBootTest
@Slf4j
public class RedissonRedisGeoTest {
    private static final String GEO_KEY = "road:nodes:370100";
    @Autowired
    private RedissonClient redissonClient;

    @Test
    public void searchPoint() {
        double longitude = 117.1089668;
        double latitude = 36.7151653;
        RGeo<String> geo = redissonClient.getGeo(GEO_KEY, new StringCodec());
        GeoSearchArgs args = GeoSearchArgs.from(longitude, latitude)
                .radius(100, GeoUnit.METERS)
                .order(GeoOrder.ASC)
                .count(1);
        Map<String, Double> resultMap = geo.searchWithDistance(args);
        resultMap.keySet().stream().forEach(member ->
                log.info("检索结果，匹配位置的标识：{}，距离：{}.", member, resultMap.get(member)));
    }
}
```



## 总结

以上两种方式操作`Redis Geo` 都是可以的，有一点要注意，如果集成了`Redisson`依赖，`Spring Data`方式无法获取`范围内点的Distance（距离）`。

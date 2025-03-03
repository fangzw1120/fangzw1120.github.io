---
layout: post
title: "foris's blog"
date: 2025-01-18
author: forisfang 
color: rgb(167,197,235)  # 莫兰迪蓝色 - 温和优雅的天空蓝
# color: rgb(232,198,198)  # 莫兰迪粉色 - 另一个选择
# color: rgb(193,206,185)  # 莫兰迪绿色 - 第三个选择
tags: bigdata 
subtitle: 'Big Data Intro'
published: true
---

### 处理流程

> 数据采集 - 数据处理 - 数据应用

批处理：数据存储 - 离线处理 - 数据存储

流处理：流式处理 - 数据存储

### 框架

![25_01_18_bdi_1.png](../../../assets/25_01_18_bdi_1.png)

### 组件

#### 数据采集
+ Flume
> source、sink支持主流组件，hadoop生态友好，分布式采集、事务性channel保障可靠性；瓶颈在于写入sink或者channel；
+ Logstash
> 插件丰富、插件化的编排，集中式pipeline，支持复杂的filter处理逻辑；瓶颈在于复杂的filter消耗
+ Filebeat
> 部署于数据生成端，agent模式，轻量化采集，数据采集到队列或者其他组件

#### 数据迁移
+ Sqoop

#### 数据库
+ Mongodb
+ HBase

#### 队列
+ Kafka

#### 分布式存储
+ HDFS

#### 分布式计算
+ 批处理框架：MapReduce
+ 流处理框架：Storm
+ 混合处理框架：Spark、Flink
> 流数据是流式不断计算的，因为有checkpoint机制，保证容错和恢复, 滚动窗口、滑动窗口、会话窗口

#### 分布式基础组件
+ Zookeeper

#### 资源管理
+ yarn

#### 数据分析
+ Hive
+ Spark SQL
+ Flink SQL
+ Pig
+ Phoenix

#### 其他

##### 任务调度

+ Azkaban
+ Oozie

##### 集群部署和监控

+ Ambari
+ Cloudera Manager

##### 应用版本

+ 选择 CDH (Cloudera's Distribution, including Apache Hadoop) 版本的安装包。[CDH5][CDH5]

[CDH5]: http://archive.cloudera.com/cdh5/cdh/5/
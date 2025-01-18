---
layout: post
title: "foris's blog"
date: 2025-01-18
author: forisfang 
color: rgb(255,90,90)
# cover: 'http://on2171g4d.bkt.clouddn.com/jekyll-banner.png'
tags: bigdata 
subtitle: 'Big Data Intro'
published: true
---

## 大数据处理流程

> 数据采集 - 数据处理 - 数据应用

在数据处理流程，可以分为批处理：数据存储 - 离线处理 - 数据存储；流处理：流式处理 - 数据存储。

## 大数据框架

![25_01_18_bdi_1.png](../../../assets/25_01_18_bdi_1.png)

#### 数据采集
+ Flume
+ Logstash
+ Filebeat

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
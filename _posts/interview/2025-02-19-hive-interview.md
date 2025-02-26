---
layout: post
title: "foris's blog"
date: 2025-02-19
author: forisfang 
color: rgb(255,90,90)
tags: bigdata interview
subtitle: 'Hive Interview Questions'
published: true
---

### 参考

[2025-02-11-bigdata-Hive](../11/bigdata-Hive.html)


### 1. Hive架构与原理
Hive的核心架构包括：
1. **用户接口**：
   - CLI：命令行界面
   - WebUI：网页界面
   - JDBC/ODBC：程序接口

2. **驱动器（Driver）**：
   - 解析器：SQL解析为AST
   - 编译器：AST转换为执行计划
   - 优化器：优化执行计划

3. **元数据存储 mysql/derby**：
   - 表结构信息
   - 分区信息
   - 列统计信息
   - 存储位置信息

4. **执行引擎**：
   - MapReduce
   - Tez
   - Spark


### 2. 数据倾斜案例
1. **Group By优化**：
   - 开启Map端聚合（hive.map.aggr=true）
   - 设置负载均衡（hive.groupby.skewindata=true）两阶段聚合（第一阶段随机分发）
   - 调整reduce数量（通过数据量自动计算，或者自己配置）
        - 优化原则：
            1. 避免过多reduce消耗资源
            2. 控制输出文件数量
            3. 平衡单个reduce负载
            （map数量，小文件combine，大文件增加map数量减少单个map负载）

2. **Join优化**：
   - 小表左边、使用MapJoin处理小表（<1000条记录）
   - 空值随机分配处理（加盐处理），或者过滤单独任务处理
   - 热点数据分流处理（前后缀分散，reduce阶段再去除）
   - 选择分散度高的字段作为Join key

### 3. 生产实践
1. **SQL优化**：
   - 避免SELECT *，使用列裁剪，注意使用where条件
   - 合理使用JOIN，join的时候加on条件避免笛卡尔积
   - 适当使用视图

2. **数据质量**：
   - 合理使用数据类型
   - 处理空值和异常值
   - 保证数据一致性

3. **运维管理**：
   - 监控作业执行（explain、日志分析）
   - 定期清理数据
   - 备份元数据
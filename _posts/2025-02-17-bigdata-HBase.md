---
layout: post
title: "foris's blog"
date: 2025-02-17
author: forisfang 
color: rgb(255,90,90)
tags: bigdata 
subtitle: 'Big Data - HBase'
published: true
---


**HBase 核心技术精粹：快速随机访问海量数据**

HBase 是构建于 HDFS 之上的 NoSQL 列式数据库，解决 Hadoop 批处理在实时随机访问海量数据方面的不足。HBase 提供高可靠、高性能、可伸缩的海量数据在线服务能力。

**1. HBase 核心特性速览**

*   行级事务原子性：单行读写原子事务。
*   多种数据存储：HDFS 底层，支持结构化/半结构化/非结构化数据。
*   水平可扩展性：易于横向扩展，增加机器提升容量和性能。
*   数据分片 & 负载均衡：自动 Region 分片，Master 负责负载均衡。
*   RegionServer 自动故障转移：故障自动转移 Region，高可用。
*   易用 Java API：方便 Java 客户端开发。
*   BlockCache & 布隆过滤器：提升数据读取性能。
*   谓词下推过滤器：查询效率优化。

**2. HBase 表特点精要**

*   容量大：数十亿行，百万列。
*   面向列存储：按列存储，只访问所需列，降低 I/O。HFile 将数据以 Key-Value 对的形式存储，其中 Key 由 Row Key, 列族, 列限定符, 时间戳 四部分组成， Value 则是单元格中存储的 实际数据 (字节数组)
*   稀疏性：空列不占空间，表结构稀疏灵活。
*   数据多版本：Cell 数据多版本，时间戳索引，最新数据置顶。
*   字节数组存储：底层统一字节数组格式。

**3. HBase 数据模型核心概念**

*   **表 (Table)：**  顶层结构，行和列组成。
*   **行键 (Row Key)：** 主键，唯一标识行，Get/Scan/全表扫描访问方式依赖 Row Key。Row Key 设计至关重要，影响性能。
*   **列族 (Column Family)：** 表 Schema 部分，创建表时定义，列的逻辑分组，同列族数据物理邻近存储，列名前缀，优化 I/O，Schema 设计核心。
*   **列限定符 (Column Qualifier)：** 列族下具体列名，列族名:列限定符组成完整列名。
*   **单元格 (Cell)：**  最小存储单元，行键、列族、列限定符、时间戳四元组确定，含值和时间戳，多版本数据存储。
*   **Region：**  分布式存储和负载均衡最小单元，表水平分割成 Region，存储连续 Row Key 范围数据，数据分片，Master 负责 Region 负载均衡。

**4. HBase 系统架构速览**

*   **ZooKeeper：**
    *   Master 选举，保证单 Master。
    *   存储 META 表 RegionServer 地址，Region 寻址入口。
    *   监控 RegionServer 状态。
    *   存储 HBase Schema 元数据。

*   **Master (HMaster)：**
    *   Region 分配给 RegionServer。
    *   RegionServer 负载均衡。
    *   处理失效 RegionServer，重新分配 Region。
    *   HDFS 垃圾文件回收。
    *   Schema 更新请求处理。

*   **RegionServer (HRegionServer)：**
    *   维护 Master 分配的 Region，处理 IO 请求。
    *   Region 过大时负责 Region 分裂。
    *   组件：
        *   WAL (Write Ahead Log)：预写日志，故障恢复，数据持久性保障。
        *   BlockCache：读缓存，内存缓存热点数据，LRU 淘汰。
        *   MemStore：写缓存，内存缓存新数据，排序，定期 Flush 到磁盘 HFile。
        *   HFile：数据持久化存储文件，Key-Value 形式存储在 HDFS。

*   **Phoenix (SQL 中间层)：**  构建于 HBase 之上，提供标准 SQL 访问 HBase 数据能力。

**5. 数据读写流程概要**

*   **写入流程：**
    1.  Client 请求 RegionServer 写数据。
    2.  RegionServer 定位 Region。
    3.  Region Schema 检查。
    4.  获取时间戳 (客户端未指定时)。
    5.  写入 WAL Log。
    6.  写入 MemStore。
    7.  MemStore 满时 Flush to HFile。

*   **读取流程 (首次)：**
    1.  Client 从 ZooKeeper 获取 META 表 RegionServer 地址。
    2.  Client 访问 META 表 RegionServer，查询 Row Key 所在 RegionServer。
    3.  Client 缓存 META 表和 Region 信息。
    4.  Client 从 Row Key 所在 RegionServer 获取数据 (后续直接访问 RegionServer)。

**6. HBase 容灾备份简述**

*   **CopyTable：** 表级别复制，灵活选项，需预先创建新表，基于 Client API 操作。
*   **Export/Import：**  HDFS 中转，数据导出/导入 HDFS，支持增量备份，依赖 Scan 操作。
*   **Snapshot：**  快速逻辑副本，元数据和 HFile 信息，零拷贝克隆/恢复，高效备份恢复方案。


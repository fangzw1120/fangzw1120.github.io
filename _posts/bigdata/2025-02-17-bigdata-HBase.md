---
layout: post
title: "foris's blog"
date: 2025-02-17
author: forisfang 
color: rgb(167,197,235)  # 莫兰迪蓝色 - 温和优雅的天空蓝
tags: bigdata 
subtitle: 'Big Data - HBase'
published: true
---

### 简介
*   基于 HDFS 的 NoSQL 列式数据库、结构化/半结构/非结构化数据、HDFS 特点、必须有zookeeper
*   解决随机访问数据、rowkey+列族+列限定符+cell多版本、cache-mem(WAL)-hfile机制+布隆过滤器
*   region分片、master负载均衡、提供高可靠、高性能、可伸缩服务
*   zk保障单mater保存元数据保存regionserver状态、master分配region和负载均衡、regionserver读写数据（c-m-h机制 布隆过滤器）
*   容灾：有表API备份数据、export HDFS、快照元数据和hfile
*   优化：预建region和优化hfile大小、rowkey散列、CF合理、每次RPC批量数据、region大小合理、数据存储格式压缩


### **核心特性**

*   行级事务原子性：单行读写原子事务。
*   多种数据存储：HDFS 底层，支持结构化/半结构化/非结构化数据。
*   水平可扩展性：易于横向扩展，增加机器提升容量和性能。
*   数据分片 & 负载均衡：自动 Region 分片，Master 负责负载均衡。
*   BlockCache & 布隆过滤器：提升数据读取性能。


### **表特点**
*   容量大：数十亿行，百万列。
*   面向列存储：按列存储，降低 I/O。Key-Value 形式存储，Key 由 Row Key, 列族, 列限定符, 时间戳 四部分组成， Value 则是单元格中存储的 实际数据 (字节数组)
*   稀疏性：空列不占空间，表结构稀疏灵活。
*   数据多版本：Cell 数据多版本，时间戳索引，最新数据置顶。
*   字节数组存储：底层统一字节数组格式。

### **数据模型**
*   **表 (Table)：**  顶层结构，行和列组成。
*   **行键 (Row Key)：** 主键，唯一标识行，Get/Scan/全表扫描访问方式依赖 Row Key。Row Key 设计至关重要，影响性能。
*   **列族 (Column Family)：** 表 Schema 部分，创建表时定义，列的逻辑分组，同列族数据物理邻近存储，列名前缀，优化 I/O，Schema 设计核心。
*   **列限定符 (Column Qualifier)：** 列族下具体列名，列族名:列限定符组成完整列名。
*   **单元格 (Cell)：**  最小存储单元，行键、列族、列限定符、时间戳四元组确定，含值和时间戳，多版本数据存储。byte[]
*   **Region：**  分布式存储和负载均衡最小单元，表水平分割成 Region，存储连续 Row Key 范围数据，数据分片，Master 负责 Region 负载均衡。

### **系统架构**
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

*   **宕机处理:** ZooKeeper 监控宕机 -> HMaster 失效备援 -> Region 转移 -> WAL 重播数据恢复。  WAL (Write-Ahead Log) 保障数据不丢失。



### **读写流程**

*   **写入流程：**
    1.  Client 先访问 ZooKeeper 获取 META 表位置。
    2.  通过 META 表找到目标 RegionServer。
    3.  Client 请求 RegionServer 写数据。
    4.  RegionServer 定位 Region。
    5.  Region Schema 检查。
    6.  获取时间戳 (客户端未指定时)。
    7.  写入 WAL Log（预写日志）。
    8.  写入 MemStore（写缓存）。
    9.  返回客户端写入成功。
    10. 当 MemStore 达到阈值时异步 Flush 到 HFile。
    11. 多个 HFile 达到阈值时触发 Compaction。

*   **读取流程 (首次)：**
    1.  Client 从 ZooKeeper 获取 META 表 RegionServer 地址。
    2.  Client 访问 META 表 RegionServer，查询 Row Key 所在 RegionServer。
    3.  Client 缓存 META 表和 Region 信息。
    4.  Client 从 Row Key 所在 RegionServer 获取数据 (后续直接访问 RegionServer)。
    5.  RegionServer 读取数据的三个层级：
        - 先查 BlockCache（读缓存）
        - 再查 MemStore（写缓存）
        - 最后查 HFile（磁盘文件）
    6.  合并多个版本/多个地方的数据
    7.  返回结果给 Client

    ---

    > MemStore 的作用

    *   **MemStore**: 内存缓存，有序写入，提升性能。
    *   **WAL 机制**: 先写 WAL, 后写 MemStore,  WAL 重播恢复数据。

### **容灾备份**
*   **CopyTable：** 表级别复制，灵活选项，需预先创建新表，基于 Client API 操作。
*   **Export/Import：**  HDFS 中转，数据导出/导入 HDFS，支持增量备份，依赖 Scan 操作。
*   **Snapshot：**  快速逻辑副本，元数据和 HFile 信息，零拷贝克隆/恢复，高效备份恢复方案。


### 使用优化

> Scan 和 Get 的功能与异同

*   **Get**:  单行查询，RowKey 定位，行级事务。
*   **Scan**:  多行扫描，条件查询，范围限定，过滤器优化。
*   **异同**: Get 单点精确，Scan 范围批量；Get 行级事务，Scan 可优化性能。

---

> Scan 对象的 setCache 和 setBatch 方法

*   **联动**:  `Cache` 控制 RPC 行数, `Batch` 控制 RPC 列数，组合优化扫描性能。
*   **RPC 次数**:  与行数、列数、Cache 和 Batch 大小相关。

---

> HBase 优化方法

*   **四大方向**: 减少调整，减少启停，减少数据量，合理设计。
*   **减少调整**:  预建 Region，优化 HFile Size。
*   **减少启停**:  关闭自动 Compaction（合并文件和版本清理），批量 BulkLoad。
*   **减少数据量**: BloomFilter，数据压缩。使用 Snappy 或 LZO 等压缩算法
*   **合理设计**: RowKey 设计，满足 **散列性、简短性、唯一性、业务性** 原则。Column Family 设计，根据 **数据访问频率** 划分列族，多CF提高读效率，memstore flush增加IO开销。

---

> 提高 HBase 客户端读写性能方法

*   BloomFilter 过滤器，合理内存配置，增大 RPC 数量，提升并发处理能力。**

---

> 将时间戳作为 RowKey，在写入单个 Region 的时候会发生热点问题

*   **热点原因**:  时间戳 RowKey 递增有序，数据集中写入单 Region。
*   **解决方案**:  RowKey 散列化 (高位散列，低位时间戳)。
*   **散列化目的**:  打散 RowKey，数据分散写入不同 Region，负载均衡。
*   **配合预分区**:  预建分区和散列 RowKey 协同，更好解决热点问题。

---

> Region 太小和 Region 太大冲突解决

*   **冲突**: Region 过小 -> Split 频繁; Region 过大 -> Compaction 频繁。
*   **解决**: 平衡 Region 大小，调整 `hbase.hregion.max.filesize`。
*   **`hbase.hregion.max.filesize`**: 控制 Region 最大 StoreFile 大小，默认 256MB，建议适当增大。
*   **权衡**: 增大 `hbase.hregion.max.filesize`  减少 Split/Compaction 频率，但可能增加单次 Compaction 时间和 Region 恢复时间。  根据实际情况调优。


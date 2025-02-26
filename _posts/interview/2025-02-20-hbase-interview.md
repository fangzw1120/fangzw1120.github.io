---
layout: post
title: "foris's blog"
date: 2025-02-20
author: forisfang 
color: rgb(255,90,90)
tags: bigdata interview
subtitle: 'HBase Interview Questions'
published: true
---

### 参考
[2025-02-17-bigdata-Hbase](../17/bigdata-HBase.html)


### 1、 Scan 和 Get 的功能与异同
*   **Get**:  单行查询，RowKey 定位，行级事务。
*   **Scan**:  多行扫描，条件查询，范围限定，过滤器优化。
*   **异同**: Get 单点精确，Scan 范围批量；Get 行级事务，Scan 可优化性能。

---

### 2、Scan 对象的 setCache 和 setBatch 方法
*   **联动**:  `Cache` 控制 RPC 行数, `Batch` 控制 RPC 列数，组合优化扫描性能。
*   **RPC 次数**:  与行数、列数、Cache 和 Batch 大小相关。

---


### 3、HBase 优化方法
*   **四大方向**: 减少调整，减少启停，减少数据量，合理设计。
*   **减少调整**:  预建 Region，优化 HFile Size。
*   **减少启停**:  关闭自动 Compaction（合并文件和版本清理），批量 BulkLoad。
*   **减少数据量**: BloomFilter，数据压缩。使用 Snappy 或 LZO 等压缩算法
*   **合理设计**: RowKey 设计，满足 **散列性、简短性、唯一性、业务性** 原则。Column Family 设计，根据 **数据访问频率** 划分列族。

---

### 4、HRegionServer 宕机处理
ZooKeeper 监控宕机 -> HMaster 失效备援 -> Region 转移 -> WAL 重播数据恢复。  WAL (Write-Ahead Log) 保障数据不丢失。

---

### 5、MemStore 的作用
*   **MemStore**: 内存缓存，有序写入，提升性能。
*   **WAL**: Write-Ahead Log，保障数据可靠性，宕机数据恢复。
*   **WAL 机制**: 先写 WAL, 后写 MemStore,  WAL 重播恢复数据。

---

### 6、Column Family 设计要点
*   **CF 数量**:  1-3 个常见，根据数据特点和访问模式权衡。
*   **划分标准**:  数据访问频度，分离高低频列。
*   **多 CF 优势**: 读效率 (读多写少场景)。
*   **多 CF 劣势**: **MemStore Flush 时， 同一 Region 的 *所有* Store 的 MemStore 都会进行 Flush**， 增加 I/O 开销。

---

### 7、提高 HBase 客户端读写性能方法
BloomFilter 过滤器，合理内存配置，增大 RPC 数量，提升并发处理能力。**

---


### 8、直接将时间戳作为 RowKey，在写入单个 Region 的时候会发生热点问题
*   **热点原因**:  时间戳 RowKey 递增有序，数据集中写入单 Region。
*   **解决方案**:  RowKey 散列化 (高位散列，低位时间戳)。
*   **散列化目的**:  打散 RowKey，数据分散写入不同 Region，负载均衡。
*   **配合预分区**:  预建分区和散列 RowKey 协同，更好解决热点问题。

---

### 9、Region 太小和 Region 太大冲突解决
*   **冲突**: Region 过小 -> Split 频繁; Region 过大 -> Compaction 频繁。
*   **解决**: 平衡 Region 大小，调整 `hbase.hregion.max.filesize`。
*   **`hbase.hregion.max.filesize`**: 控制 Region 最大 StoreFile 大小，默认 256MB，建议适当增大。
*   **权衡**: 增大 `hbase.hregion.max.filesize`  减少 Split/Compaction 频率，但可能增加单次 Compaction 时间和 Region 恢复时间。  根据实际情况调优。


---
layout: post
title: "foris's blog"
date: 2025-02-11
author: forisfang 
color: rgb(167,197,235)  # 莫兰迪蓝色 - 温和优雅的天空蓝
# cover: 'http://on2171g4d.bkt.clouddn.com/jekyll-banner.png'
tags: bigdata 
subtitle: 'Big Data - Hive'
published: true
---


### 简介
*   **数据仓库工具**, 将 **结构化数据文件映射为表**，并提供 **类 SQL 查询 (HQL)**、SQL、元数据共享  
*   文件格式、内外部表、分区分桶、选择合适压缩算法（Gzip、Bzip2等）、视图
*   优化：语句（select、group、where、join on、order by）、map join、streamtable、自动 Skew Join、参数（hive.exec.parallel值为true）、fetch 机制简单查询直接读取文件，不走MapReduce（全局查找、字段查找、limit查找）
*   数据倾斜：skew、map join、加盐、参数调整task数量



### **核心特点**
*   **易用性:** 类 SQL 的 HQL 降低学习门槛。
*   **灵活性:** UDF 自定义函数和存储格式。
*   **高扩展性:** 基于 Hadoop 集群，擅长处理超大数据。
*   **元数据共享:** Metastore 统一管理元数据，多引擎共享。
*   **离线分析:** 擅长海量数据离线处理，延迟高，不适用于实时场景。



### **核心架构**
1. **用户接口**：
    - CLI：命令行界面
        *   **Beeline (推荐):**  基于 JDBC 连接 HiveServer2，**轻量级，多线程并发，更安全，易用性强**。现代 Hive 首选客户端。不需要传统的装整个hive依赖环境。
        *   **Hive CLI (过时):**  直接连接 HiveServer1，**重量级，单线程，安全性弱，交互性差**。  逐渐被 Beeline 取代。
    - WebUI：网页界面
    - JDBC/ODBC：程序接口

2. **驱动器（Driver）**：
   - 解析器：SQL解析为AST
   - 编译器：AST转换为执行计划
   - 优化器：优化执行计划

3. **元数据存储 mysql/derby**：
   - 表结构、分区、列统计、存储位置
   - **多引擎共享**，例如 Presto, Impala, SparkSQL

4. **执行引擎**：
   - MapReduce、Tez、Spark




### **常用文件存储格式**

|格式         | 说明          | 优点          | 缺点           | 适用场景          |
| --------------------- | --------------------- | --------------------- | --------------------- | --------------------- |
| **TextFile**    | 文本文件，默认格式 | 简单易读，兼容性好      | 存储大，效率低    | 小数据量，兼容性要求高       |
| SequenceFile | 二进制，KV格式  | 支持压缩，可分割，IO效率较高 | 可读性差，通用性差    | Hadoop 内部组件数据交换，中间结果  |
| **RCFile**      | 列式存储，行分组  | 列式存储，查询高效，压缩比高 | 写入性能差，加载开销大，需要预处理   | 历史数据归档，冷数据存储，全表扫描，列式查询 |
| **ORC Files**  | RCFile 优化版 | 高度优化列式存储，压缩比更高，查询更优，支持复杂类型  | 相对复杂 | 生产环境首选列式格式，高性能分析  |
| Avro Files    | 数据序列化系统    | 二进制，压缩高，序列化快，Schema Evolution，跨语言兼容 | 列式查询性能不如 Parquet/ORC | 数据集成，跨语言数据交换，Schema Evolution 场景  |
| **Parquet**     | 列式存储，分析优化 | 极致列式存储，压缩比最高，查询最优，生态广泛 | 相对复杂  | 生产环境主流列式格式，交互式查询，高性能 OLAP，Impala/SparkSQL 首选 |

> Parquet 比使用csv等普通文件速度提升10倍左右；通常情况下能够减少75%的存储空间


### 数据结构设计
#### **内部表 vs 外部表：**

| 特性       | 内部表 (Managed Table)         | 外部表 (External Table)   | 核心区别     |
| -------- | ----------------------------------------------------- | ------------------------------------------------------- | ------------------------------- |
| **数据位置** | Hive 数据仓库默认目录   | `LOCATION`  手动指定  | Hive 是否管理数据生命周期        |
| **数据导入** | 数据 **移动** 到仓库目录，Hive 管理数据生命周期    | 数据 **不移动**，Hive 只管理元数据，用户管理数据   | 数据移动 vs 元数据关联  |
| **删除表** | 删除元数据 **和** 数据文件，数据彻底删除 | 仅删除元数据，数据文件 **保留**，数据仍然存在，可被外部访问 | 元数据 & 数据文件是否同时删除       |



#### **分区表 vs 分桶表：**
*   **分区表 (Partitioned Table):**
    *   **原理:** 表按分区列值划分子目录存储。
    *   **优点:**  查询过滤分区列时，**避免全表扫描**，提升查询效率。
    *   **适用场景:**  数据量大，查询常基于分区列过滤。 例如：按日期、地区分区。

*   **分桶表 (Bucketed Table):**
    *   **原理:** 表按分桶列 Hash 散列到固定数量的桶 (文件)。
    *   **优点:**  数据更均匀分布，**优化 JOIN 查询 (Map-Side Join)**，方便数据抽样。
    *   **适用场景:**  需要更均匀数据分布，优化 JOIN，数据抽样分析。

> 分区表：子目录存储，查询避免全表扫描；分桶表：按分桶列hash到固定数量的桶，数据分布均匀，抽样或者map join提高效率。



#### **视图 (View)：逻辑视图，简化查询**
*   **逻辑视图:**  存储查询语句，**不存储数据**。 查询时 **实时计算** 结果。
*   **简化查询:**  封装复杂查询逻辑 (JOIN, 聚合等)，用户查询视图更简单。
*   **定制数据视图:**  隐藏细节，提供简洁数据视图，数据脱敏，权限控制。
*   **只读:**  通常不支持 DML 操作。

> 快照语句，查询时动态计算



### **查询优化**
*   **SQL 优化:**  避免 `SELECT *`，  减少 `JOIN`， 优化 `WHERE` 条件，  合理使用 `GROUP BY` 和 `ORDER BY`。
*   **文件格式选择:**  生产环境首选 **Parquet/ORC** 列式存储，压缩数据，提升 IO 效率。
*   **分区和分桶:**  合理分区 **缩小扫描范围**，分桶 **优化 JOIN** 和数据分布。
*   **Streamtable Hint (STREAMTABLE):**  多表 JOIN 优化，指定最大表为流表，缓存小表，流式扫描大表。 需手动指定，不当使用可能降低性能。
*   **MapJoin Hint (MAPJOIN):**  小表 JOIN 优化，小表全量加载内存，Map 端完成 JOIN，无需 Reduce。 小表必须足够小，避免 OOM。 Hive 会自动优化，Hint 可显式启用。
*   **索引表 (Indexed Table - *不推荐使用*):**  为列创建索引表，缩小扫描范围。 **致命缺陷：索引不会自动 rebuild，易数据不一致，维护成本高，已过时**。 现代 Hive 优化技术更先进，不依赖索引表。
*   **关联小表在前：** Hive: 小表通常应该放在 JOIN 语句的 前面 (最左侧)，原因是多表关联的时候AB表的结果会 shuffle 进行c表关联，小表在前可以使得shuffle 数据量尽量小。MySQL: 表的顺序对现代 MySQL 版本的性能影响很小，甚至可以忽略不计。
*   **并行执行:**  设置并行度参数，利用集群资源。
*   **JVM 调优:**  调整 MapReduce  JVM 参数，避免 OOM。
*   **数据倾斜处理:**  优化倾斜 JOIN， 使用 `distribute by`  和 `sort by`  等。



### **数据倾斜**

在 `JOIN` 和 `GROUP BY` 操作时，少量 Reduce Task 处理了绝大部分数据，导致任务耗时过长。  

*   **SQL 层面:**
    *   **MapJoin:**  将小表广播到所有 Map Task，避免 Shuffle。
    *   **Skew Join Optimization (自动 Skew Join):**  Hive  自动识别倾斜 Key，将倾斜 Key 的数据单独处理，分散到更多 Reduce Task。
    *   **拆分倾斜 Key:**  将倾斜 Key 的数据进行特殊处理，例如  加盐 Hash，  分散 Key 值。

*   **参数调优:**
    *   `hive.groupby.skewindata=true`:  开启 Group By 数据倾斜优化。
    *   调整 MapReduce  Task 数量和资源配置。

---

> **监控和诊断查询性能**

*   **MapReduce 作业运行状态:**  Job Tracker/ResourceManager Web UI， 监控 Map/Reduce Task 进度， 耗时，  数据 Shuffle 情况。
*   **Hive Server 日志:**  查看 Hive Server 日志， 分析 SQL 执行计划，  错误信息，  慢查询日志。
*   **系统资源监控:**  监控 Hadoop 集群 CPU, 内存, 磁盘, 网络 IO  等资源使用情况。
*   **EXPLAIN PLAN:**  分析 SQL  执行计划， 查看 JOIN 类型，  Shuffle 过程，  是否使用索引等。
*   **Hive Profile:**  分析 SQL  执行过程中的各个阶段的性能指标 (例如  Map/Reduce Task 耗时，  数据量，  Shuffle  数据量等)。
*   **日志分析工具:**  使用日志分析工具 (例如  grep,  awk,  日志分析平台) 分析 Hive Server  和 MapReduce  日志。

---

> **Hive 中的排序**
- order by：全局排序，单reducer
- sort by：分区内排序，多reducer
- distribute by：数据分发到不同reducer
- cluster by = distribute by + sort by


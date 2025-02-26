---
layout: post
title: "foris's blog"
date: 2025-02-20
author: forisfang 
color: rgb(255,90,90)
tags: bigdata interview
subtitle: 'Spark Interview Questions'
published: true
---

### 参考
[2025-02-17-bigdata-Spark](../11/bigdata-Spark.html)


### Spark vs MapReduce

*   多样数据源、内存计算、DAG、Lineage：延迟计算 + RDD血缘容错
*   磁盘IO、map-reduce阶段

*   hive是基于sorted-shuffle，map阶段不同key进行哈希并分区排序，默认每个map任务生成一个物理文件，但是内部offset区分不同reduce，结果写入磁盘，支持combine和compress；reduce阶段对文件进行offset的copy，再进行reduce处理和全局排序；
*   spark的Shuffle有Hash Shuffle和Sort Shuffle两种；
*   spark的hash-shuffle是每个map任务有reduce个文件，数据根据hash-key进入不同的文件，文件数量等于map*reduce任务的总数量；reduce阶段拉取不同的shuffle文件汇总进行处理；
*   spark的sorted-shuffle，map阶段根据reduce区分分区，总体一个map任务产生一个临时文件（允许写内存后溢写磁盘，最后会合并），建立索引，内部排序；最后reduce任务进行处理；

> 总结：

> hive sorted-shuffle 分区排序 逻辑上M*R文件实际少于 实现复杂需要写磁盘

> spark hash-shuffle 不排序 物理上M*R文件 实现简单小文件过多（无排序易数据倾斜）

> spark sorted-shuffle 分区排序 物理上M文件+offset文件 实现复杂相对推荐 （减少 IO shuffle内存高一点，提高并行度，数据本地性，压缩。）


### Spark 调度模式

*   **FIFO:**  先来先服务，队列排队，独占资源。
*   **FAIR:**  公平队列，资源共享，动态分配，可选抢占。
*   **CAPACITY:**  多队列，独立配额，层次化，优先级，多租户，弹性资源。


### Spark 累加器特点

*   全局唯一，只增不减，Executor修改Driver读，可跨Job共享。



### Spark 分区器 (Partitioner)

*   HashPartitioner弊端：数据不均，倾斜，低效，不适范围查。
*   RangePartitioner原理：抽样，排序，边界计算，范围分区。
*   **分区特性:** 分区数据量相对均匀，分区间Key有序，分区内无序。



### 内存优化
*   **统一内存管理:**  动态调整 Execution Memory 和 Storage Memory 占比，提升内存利用率。
*   **执行内存 (Execution Memory):**  Task 运行，Shuffle 计算。(默认 0.2) 
*   **存储内存 (Storage Memory):** RDD 缓存，Broadcast 变量。(默认 0.6)
*   **用户内存 (User Memory):**  用户代码数据结构。(默认 0.2) 

*  **缓存策略**：
*   **MEMORY_ONLY:**  内存缓存，速度最快，易 OOM。
*   **MEMORY_AND_DISK:**  内存 + 磁盘，兼顾性能和容错。
*   **OFF_HEAP:**  堆外内存，减少 GC 压力，适用于超大数据量缓存。

*  **`num-executors`**: Executor 数量，推荐 50-100。
*  **`executor-memory`**: Executor 内存，推荐 4-8G。
*  **`executor-cores`**: Executor CPU 核数，推荐 2-4 个。
*  **`driver-memory`**: Driver 内存，按需调整，默认 1G 通常足够。
*  **`spark.default.parallelism`**: Task 数量，推荐 `num-executors * executor-cores` 的 2-3 倍。
*  **`spark.storage.memoryFraction`**: RDD 缓存内存比例，默认 60%，按需调整。
*  **`spark.shuffle.memoryFraction`**: Shuffle 内存比例，默认 20%，按需调整。


### 数据本地性
*   **三种级别 (优先级依次降低):**
    1.  **PROCESS_LOCAL (进程本地化):** Task 和数据在同一 Executor 进程，**速度最快**，内存读取。
    2.  **NODE_LOCAL (节点本地化):** Task 和数据在同一 Worker 节点，但不在同一 Executor 进程，**速度较快**， 磁盘读取。
    3.  **ANY (任意节点):** Task 和数据不在同一 Worker 节点，**速度最慢**， 跨节点网络传输。

*   **DAG Stage 划分阶段确定:**  Task 的运行位置在 DAG Stage 划分阶段就已确定，受数据本地性级别影响。

*   **影响计算性能:**  数据本地性级别越高，数据读取速度越快，Task 执行效率越高，整体 Spark Application 性能越好。  反之，数据本地性级别低，Task 需要跨节点或跨进程读取数据，网络 IO 或磁盘 IO 开销大，性能下降。

### 数据持久化辨析
*   **`cache`:**  `persist(StorageLevel.MEMORY_ONLY)` 的 **特例**， 仅支持 `MEMORY_ONLY` 级别， 功能 **单一**。
*   **`persist`:**  **更通用**，  支持 `MEMORY_ONLY`, `MEMORY_AND_DISK`, `DISK_ONLY`, `OFF_HEAP` 等 **多种存储级别**，  可根据实际场景灵活选择，  **功能更强大**。
*   **`cache` 后的 RDD 仍然可以 *链接其他 Transformation 算子*，  但 会 *失去缓存效果*。**  两者  **不是 Action 操作**，  而是  Transformation 操作，  **惰性求值**。  需要 Action 算子触发 Job 执行才会真正缓存。


### Spark 性能优化方向
*   **平台层面:** JAR 包精简，数据本地性，高效数据格式。`GZIP` (高压缩率, 慢速)，`LZO` (均衡, 可分片)，`Snappy` (高性能, 低压缩率)。
*   **倾斜:**  分区、聚合、加盐，多策略应对。
*   **代码:**  高效 RDD 操作，广播，及时释放。
*   **JVM层面:** 资源配置调优（executor的参数）。
*   并行度`spark.default.parallelism`。默认 Task 数，建议值 CPU 核数 * Executor 数 * (2~3)。影响创建、shuffle未指定分区数量下的task数量。


### 故障处理
*   **OOM:**  分散数据，减小粒度，优化结构，调内存参数。
*   **倾斜:**  过滤，提并行度，自定义分区，两阶段聚合。
*   **任务失败:**  日志分析，重试，资源，数据质量。


### 数据倾斜调优

**1. 数据倾斜的致命后果**

* **OOM (Out Of Memory)** Task 内存溢出；**Task运行缓慢**
* **根因** 分析数据分布不均；shuffle引发特定 Key 的数据过于集中
* 可能是：易触发 Shuffle 的算子（distinct, groupByKey, reduceByKey, join 等）；分析数据分布，识别倾斜的 Key

**2. 典型数据倾斜场景**

* 小表 Join 大表场景
* 聚合操作场景
* 大表 Join 大表（少数/大量 Key 倾斜）

**3. 数据倾斜处理方法**

* **Spark 处理方案**：
     * 上游数据均衡；增加 Shuffle 并行度；调整资源配置
     * 使用 Broadcast Join 替代普通 Join
     * 两阶段聚合（加盐预聚合）、分散倾斜 Key（前缀扩容）

* **Hive 处理方案**：
     * 调整 Reduce 数量
     * MapJoin（小表 Join）
     * 空值随机分配、倾斜 Key 单独处理


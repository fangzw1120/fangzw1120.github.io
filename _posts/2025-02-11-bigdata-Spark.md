---
layout: post
title: "foris's blog"
date: 2025-02-11
author: forisfang 
color: rgb(255,90,90)
tags: bigdata 
subtitle: 'Big Data - Spark'
published: true
---


**核心优势 (性能保证):**

*   DAG 从 **全局视角** 展现计算流程，实现全局优化和高效容错。
*   部署灵活、多数据源接入、流批计算、丰富高级API
*   类似 Yarn 的管理执行过程，client cluster 提交模式，local standalone yarn 部署模式
*   RDD 延迟计算、shuffle、宽窄依赖
*   RDD 和 DataSet/DataFrame、spark SQL 的优劣势
*   spark Streaming 数据接入的推和拉

**核心特点:**

![25_02_11_Spark](../../../assets/202502/25_02_11_Spark.png)

*   **部署灵活:**  支持 **本地模式**、**Standalone (独立集群)** 模式，并可运行在 **Hadoop YARN**、**Mesos**、**Kubernetes** 等集群管理器之上。
*   **数据源广泛:**  可访问 **HDFS**、**Alluxio**、**Cassandra**、**HBase**、**Hive** 及数百种其他数据源。
*   **多计算模式:**  支持 **批处理**、**流处理** 和 **复杂业务分析**。
*   **类库丰富:**  内置 **SQL**、**MLlib (机器学习)**、**GraphX (图计算)** 和 **Spark Streaming (流处理)** 等

**核心执行流程:**

*   Driver Program 启动，**类似 YARN 的 Application Master**，创建 SparkContext，连接到 Master 节点 (集群管理器)。
*   Master 节点 为应用分配资源，指示 Worker 节点 **类似 YARN 的 NodeManager** 启动 Executor 进程。**类似 YARN 的 Resource Manager**
*   Driver 将程序划分为 Task，并发送给 Executor 进程。
*   Executor 进程 **类似 YARN 的 Container** 执行 Task，将状态汇报给 Driver Program，并将资源使用情况汇报给 Master 节点。

**Spark 作业提交模式:**

| 模式                | Client 模式 (客户端模式)                                         | Cluster 模式 (集群模式)                                        | Local 模式 (本地模式)                                        | Standalone vs YARN                                                                     |
| ------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **总结**             | **Client 和 Driver 同 JVM，Client 不可关闭，日志终端可见**                     | **Client 和 Driver 分离，Client 可退出，日志需集群系统查看**                     | **所有组件同 JVM 运行，本地模拟分布式**                               | **资源管理方式不同，执行流程类似**                                                             |




### Spark RDD

**Shuffle 操作 (性能瓶颈):**

*   **Shuffle:**  类似于 MapReduce 的 Shuffle 过程，涉及跨 Executor 的数据交换，**性能开销大，需谨慎使用**。
*   **触发 Shuffle 的常见操作:**
    *   **重新分区:** `repartition`, `coalesce`
    *   **ByKey 操作:** `groupByKey`, `reduceByKey` (除 `countByKey`)
    *   **连接操作:** `cogroup`, `join`

**延迟计算 (Lazy Evaluation):**

*   **Transformations (转换操作):**  仅定义计算逻辑，**不触发实际计算**。
*   **Actions (行动操作):**  触发实际计算，并返回结果或将结果输出。
*   **优势:**  允许 Spark **全局优化 DAG**，减少不必要的计算和数据传输，提升效率。


**窄依赖 vs 宽依赖 (性能 & 容错):**

![25_02_11_spark_wide_deps](../../../assets/202502/25_02_11_spark_wide_deps.png)

| 特性     | 窄依赖 (Narrow Dependency)                                     | 宽依赖 (Wide Dependency)                                     |
| -------- | ------------------------------------------------------------- | ------------------------------------------------------------- |
| **Pipeline** | 支持流水线计算 (Pipeline)                                  | 不支持流水线计算                                                |
| **Shuffle** | 无 Shuffle                                                  | 涉及 Shuffle                                                  |
| **性能**     | 高效                                                       | 低效                                                       |
| **容错**     | 容错性高，数据恢复快 (只需重算父 RDD 对应分区)                              | 容错性相对较低，数据恢复慢 (可能需重算所有父分区并再次 Shuffle)                         |
| **本质**     | 父 RDD 分区与子 RDD 分区 **一对一** 或 **多对一** 的依赖关系             | 子 RDD 分区依赖于 **多个** 父 RDD 分区                               |
| **适用场景** | 数据清洗、转换、过滤等                                        | 分组聚合、排序、Join 等需要跨分区数据交互的操作                               |
| **总结**     | **窄依赖高效，功能有限；宽依赖功能强大，但性能开销大**                 | **优先使用窄依赖，避免不必要的宽依赖**                               |

> 宽依赖是 Stage 划分的边界。一个 Spark 作业会被划分为多个 Stage，每个 Stage 包含一组窄依赖的操作，Stage 之间通过 Shuffle 进行连接


### Spark SQL


**RDD vs DataFrame/Dataset (数据抽象选择):**

> Dataset 是为了解决 Dataframe 类型安全问题而提出的，使用 Dataset 在编译阶段可以提前暴露错误


| 特性           | RDDs (弹性分布式数据集)                                      | DataFrame & Dataset (数据帧/数据集)                                     |
| -------------- | ------------------------------------------------------------ | -------------------------------------------------------------------- |
| **选择建议**     | **非结构化数据，函数式编程，需极致灵活 => RDDs**                    | **结构化数据，性能优先，SQL 分析 => DataFrame/Dataset**                  |
| **核心思想**     | **灵活性 (Flexibility)**                                      | **性能 & 易用性 (Performance & Ease of Use)**                                |
| **总结**         | **RDD 灵活但需手动调优，DataFrame/Dataset 性能更优且易用 (结构化数据场景)** | **"能用 SQL 解决的，就不用 RDD； SQL 解决不了的， 再用 RDD 补充"**                  |



**Spark SQL 优势 vs 劣势:**

*   **优势:**
    *   **简洁易用:** SQL 声明式语言，更贴近业务，开发效率高。
    *   **统一接口:**  统一 DataFrame/Dataset API 访问多种数据源。
*   **劣势:**
    *   **灵活性受限:** SQL 表达能力有限，复杂逻辑和极致调优可能难以实现。


### Spark Streaming


**数据接入方式:**

*   **推送式 (Push-based - Flume-style):** Spark Streaming 监听端口，数据源 (如 Flume) 主动推送数据到该端口。需要容忍数据丢失。
*   **拉取式 (Pull-based - Custom Sink):** 数据先推送到 SparkSink 接收器 (缓冲)，Spark Streaming 定时从接收器拉取数据 (事务性，更可靠), flume and kafka。需要容忍一定延迟。

---


**Q1:  深入解释 Spark DAG 的优化机制。**

**A1:** Spark DAG 优化器 (Catalyst) 经历四个主要阶段： 类似mysql，语法树 - 优化器 - 任务生成

1.  **解析 (Parsing):**  将 SQL 字符串解析成抽象语法树 (AST)。
2.  **逻辑计划优化 (Logical Optimization):**  使用基于规则的优化 (RBO)，例如谓词下推、列裁剪、常量折叠等，优化逻辑执行计划。
3.  **物理计划优化 (Physical Optimization):**  根据逻辑计划，选择最佳物理执行策略，例如 Join 算法选择 (BroadcastHashJoin vs SortMergeJoin)，确定 Shuffle 方式等。
4.  **代码生成 (Code Generation):**  利用 Tungsten 引擎，将物理执行计划编译成优化的 Java 字节码，直接操作二进制数据，提升执行效率。


---

**Q2:  宽依赖 Shuffle 是 Spark 性能瓶颈，如何尽可能优化 Shuffle 性能？**

**A2:**  Shuffle 优化是 Spark 性能调优的关键。 策略包括：

*   **减少 Shuffle 数据量:**
    *   **Filter Pushdown:**  提前过滤不必要的数据。
    *   **Projection Pushdown:**  只选择需要的列。
    *   **数据预聚合:**  Map 端 Combine 提前聚合。
*   **优化 Shuffle 算子:**  优先使用 `reduceByKey` 替代 `groupByKey` 等。
*   **调整 Shuffle 参数:**  `spark.sql.shuffle.partitions`, `spark.shuffle.file.buffer`, `spark.shuffle.memoryFraction` 等，调整 Shuffle 并行度、缓冲区、内存配比。
*   **选择高效 Shuffle 实现:**  Sort-Based Shuffle 通常是默认且推荐的选择。
*   **避免 Shuffle Spill:**  增加 Executor 内存，减少 Shuffle 分区数，优化算法逻辑，避免 Shuffle 溢写磁盘。
*   **Broadcast Hash Join:**  小表 Join 大表场景，使用 Broadcast Hash Join 避免 Shuffle。



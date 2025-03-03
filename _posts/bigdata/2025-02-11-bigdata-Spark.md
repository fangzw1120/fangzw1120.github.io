---
layout: post
title: "foris's blog"
date: 2025-02-11
author: forisfang 
color: rgb(167,197,235)  # 莫兰迪蓝色 - 温和优雅的天空蓝
tags: bigdata 
subtitle: 'Big Data - Spark'
published: true
---

### 简介 
*   client/cluster、local/standalone/yarn/k8s、流批一体、sql/Rdd/mllib/graphx/streaming
*   Driver、Master、Worker、Executor
*   多数据源接入、内存计算、DAG（sparkSQL 任务类似mysql通过语法树 - 优化器 - 任务生成）、宽窄依赖(宽依赖是划分stage的边界)、延迟计算、血缘容错
*   Hash分区+Range分区、数据持久化cache/persist(`MEMORY_ONLY`, `MEMORY_AND_DISK`, `DISK_ONLY`, `OFF_HEAP`)、数据本地性（同executor、同worker、任一worker）
*   shuffle（导致GC和OOM：filter减少数据量、提高shuffle并行度、增加内存、broadcast、算子优化reduceByKey代替groupByKey因为map阶段combine、sort-based shuffle、加盐或者前缀）
*   DataSet数据安全/编译检查、使用SQL优先于RDD、
*   streaming 的推拉模式(容忍丢失还是容忍延时)
*   优化：减少jar包、数据存储格式、编程cache/persist+broadcast优化算子filter数据、executor和内存管理的参数调优、shuffle优化
*   hive sorted-shuffle：分区排序，逻辑上M*R文件实际少于，实现复杂需要写磁盘
*   spark hash-shuffle：不排序，物理上M*R文件，实现简单小文件过多（无排序易数据倾斜）
*   spark sorted-shuffle：分区排序，物理上M文件+offset文件，实现复杂相对推荐 （减少 IO shuffle内存高一点，提高并行度，数据本地性，压缩。）


### **核心优势**

![25_02_11_Spark](../../../assets/202502/25_02_11_Spark.png)

*   DAG 从 **全局视角** 展现计算流程，实现全局优化和高效容错。
*   多数据源接入、流批计算、丰富高级API
    *   可访问 **HDFS**、**Alluxio**、**Cassandra**、**HBase**、**Hive** 
    *   内置 **SQL**、**MLlib (机器学习)**、**GraphX (图计算)** 和 **Spark Streaming (流处理)** 等
*   client cluster 提交模式，local standalone yarn 部署模式
    *   可运行在 **Hadoop YARN**、**Mesos**、**Kubernetes** 等集群管理器之上
*   RDD 延迟计算、shuffle、宽窄依赖；DataSet/DataFrame 与 park SQL 的优劣势
*   spark Streaming 数据接入的推和拉




### **作业流程**

#### **核心执行流程**

*   Driver Program 启动(**类似 YARN 的 Application Master**)，创建 SparkContext，连接到 Master 节点 (集群管理器)。
*   Master 节点(**类似 YARN 的 Resource Manager**) 为应用分配资源，指示 Worker 节点(**类似 YARN 的 NodeManager**) 启动 Executor 进程。（如果是在yarn模式，多数职责yarn负责，master负责application内部的协调，例如监控、调度协调、和app master的通信）
*   Driver 将程序划分为 Task，并发送给 Executor 进程。
*   Executor 进程 (**类似 YARN 的 Container**)执行 Task，将状态汇报给 Driver Program，并将资源使用情况汇报给 Master 节点。


#### **提交模式**

| 模式   | Client 模式 (客户端模式)       | Cluster 模式 (集群模式)   | Local 模式 (本地模式)    | Standalone vs YARN     |
| ------------------- | ------------------- | ------------------- | ------------------- | ------------------- |
| **总结** | **Client 和 Driver 同 JVM，Client 不可关闭，日志终端可见**      | **Client 和 Driver 分离，Client 可退出，日志需集群系统查看**      | **所有组件同 JVM 运行，本地模拟分布式**      | **资源管理方式不同，执行流程类似** yarn 只支持粗粒度，mesos支持粗和细两种粒度        |




### Spark RDD

> **延迟计算 (Lazy Evaluation):**

*   **Transformations (转换操作):**  仅定义计算逻辑，**不触发实际计算**。
*   **Actions (行动操作):**  触发实际计算，并返回结果或将结果输出。
*   **优势:**  允许 Spark **全局优化 DAG**，减少不必要的计算和数据传输，提升效率。

---

> **窄依赖 vs 宽依赖 (性能 & 容错)**

宽依赖是 Stage 划分的边界。一个 Spark 作业会被划分为多个 Stage，每个 Stage 包含一组窄依赖的操作，Stage 之间通过 Shuffle 进行连接

![25_02_11_spark_wide_deps](../../../assets/202502/25_02_11_spark_wide_deps.png)

| 特性     | 窄依赖 (Narrow Dependency)   | 宽依赖 (Wide Dependency)    |
| -------- | -------- | -------- |
| **Pipeline** | 支持流水线计算 (Pipeline)          | 不支持流水线计算      |
| **Shuffle** | 无 Shuffle   | 涉及 Shuffle         |
| **性能**     | 高效                 | 低效                   |
| **容错**     | 容错性高，数据恢复快 (只需重算父 RDD 对应分区)  | 容错性相对较低，数据恢复慢 (可能需重算所有父分区并再次 Shuffle)   |
| **本质**     | 父 RDD 分区与子 RDD 分区 **一对一** 或 **多对一** 的依赖关系      | 子 RDD 分区依赖于 **多个** 父 RDD 分区    |
| **适用场景** | 数据清洗、转换、过滤等                 | 分组聚合、排序、Join 等需要跨分区数据交互的操作   |
| **总结**     | **窄依赖高效，功能有限；宽依赖功能强大，但性能开销大**    | **优先使用窄依赖，避免不必要的宽依赖**   |

---

> **Shuffle 操作 (性能瓶颈)**

*   **Shuffle:**  类似于 MapReduce 的 Shuffle 过程，涉及跨 Executor 的数据交换，**性能开销大，需谨慎使用**。
*   **触发 Shuffle 的常见操作:**
    *   **重新分区:** `repartition`, `coalesce`
    *   **ByKey 操作:** `groupByKey`, `reduceByKey` (除 `countByKey`)
    *   **连接操作:** `cogroup`, `join`
*   **优化 Shuffle 性能**
    *   **避免 Shuffle Spill:**  增加 Executor 内存，减少 Shuffle 分区数，优化算法逻辑，避免 Shuffle 溢写磁盘。
    *   **调整 Shuffle 参数:**  `spark.sql.shuffle.partitions`, `spark.shuffle.file.buffer`, `spark.shuffle.memoryFraction` 等，调整 Shuffle 并行度、缓冲区、内存配比。
    *   **减少 Shuffle 数据量:**提前过滤不必要的数据、只选择需要的列
    *   **优化 Shuffle 算子:**  优先使用 `reduceByKey` 替代 `groupByKey` 等。(Map 端 Combine 提前聚合)
    *   **选择高效 Shuffle 实现:**  Sort-Based Shuffle 通常是默认且推荐的选择。
    *   **Broadcast Hash Join:**  小表 Join 大表场景，使用 Broadcast Hash Join 避免 Shuffle。



---

> **Spark 分区器 (Partitioner)**

*   HashPartitioner弊端：数据不均，倾斜，低效，不适范围查。
*   RangePartitioner原理：抽样，排序，边界计算，范围分区。
*   **分区特性:** 分区数据量相对均匀，分区间Key有序，分区内无序。

---

> **数据持久化**

*   **`cache`:**  `persist(StorageLevel.MEMORY_ONLY)` 的 **特例**， 仅支持 `MEMORY_ONLY` 级别， 功能 **单一**。
*   **`persist`:**  **更通用**，  支持 `MEMORY_ONLY`, `MEMORY_AND_DISK`, `DISK_ONLY`, `OFF_HEAP` 等 **多种存储级别**，  可根据实际场景灵活选择，  **功能更强大**。
*   **`cache` 后的 RDD 仍然可以 *链接其他 Transformation 算子*，  但 会 *失去缓存效果*。**  两者  **不是 Action 操作**，  而是  Transformation 操作，  **惰性求值**。  需要 Action 算子触发 Job 执行才会真正缓存。

---

> **数据本地性**

*  **PROCESS_LOCAL (进程本地化):** Task 和数据在同一 Executor 进程，**速度最快**，内存读取。
*  **NODE_LOCAL (节点本地化):** Task 和数据在同一 Worker 节点，但不在同一 Executor 进程，**速度较快**， 磁盘读取。
*  **ANY (任意节点):** Task 和数据不在同一 Worker 节点，**速度最慢**， 跨节点网络传输。
*   **DAG Stage 划分阶段确定:**  Task 的运行位置在 DAG Stage 划分阶段就已确定，受数据本地性级别影响。
*   **影响计算性能:**  数据本地性级别越高，数据读取速度越快，Task 执行效率越高，整体 Spark Application 性能越好。反之，要跨节点或跨进程读取数据，网络 IO 或磁盘 IO 开销大，性能下降。

---

> **DAG 的优化机制。**

Spark DAG 优化器 (Catalyst) 经历四个主要阶段： 类似mysql，语法树 - 优化器 - 任务生成

*  **解析 (Parsing):**  将 SQL 字符串解析成抽象语法树 (AST)。
*  **逻辑计划优化 (Logical Optimization):**  使用基于规则的优化 (RBO)，例如谓词下推、列裁剪、常量折叠等，优化逻辑执行计划。
*  **物理计划优化 (Physical Optimization):**  根据逻辑计划，选择最佳物理执行策略，例如 Join 算法选择 (BroadcastHashJoin vs SortMergeJoin)，确定 Shuffle 方式等。
*  **代码生成 (Code Generation):**  利用 Tungsten 引擎，将物理执行计划编译成优化的 Java 字节码，直接操作二进制数据，提升执行效率。




### Spark SQL

> **RDD vs DataFrame/Dataset (数据抽象选择):**

Dataset 是为了解决 Dataframe 类型安全问题而提出的，使用 Dataset 在编译阶段可以提前暴露错误

| 特性           | RDDs (弹性分布式数据集)      | DataFrame & Dataset (数据帧/数据集)    |
| -------------- | -------------- | -------------- |
| **选择建议**     | **非结构化数据，函数式编程，需极致灵活 => RDDs**    | **结构化数据，性能优先，SQL 分析 => DataFrame/Dataset**  |
| **核心思想**     | **灵活性 (Flexibility)**                       | **性能 & 易用性 (Performance & Ease of Use)**   |
| **总结**         | **RDD 灵活但需手动调优，DataFrame/Dataset 性能更优且易用 (结构化数据场景)** | **"能用 SQL 解决的，就不用 RDD； SQL 解决不了的， 再用 RDD 补充"**                  |

---

> **Spark SQL 优势 vs 劣势:**

*   **优势:**
    *   **简洁易用:** SQL 声明式语言，更贴近业务，开发效率高。
    *   **统一接口:**  统一 DataFrame/Dataset API 访问多种数据源。
*   **劣势:**
    *   **灵活性受限:** SQL 表达能力有限，复杂逻辑和极致调优可能难以实现。




### Spark Streaming

> **数据接入方式:**

*   **推送式 (Push-based - Flume-style):** Spark Streaming 监听端口，数据源 (如 Flume) 主动推送数据到该端口。需要容忍数据丢失。
*   **拉取式 (Pull-based - Custom Sink):** 数据先推送到 SparkSink 接收器 (缓冲)，Spark Streaming 定时从接收器拉取数据 (事务性，更可靠), flume and kafka。需要容忍一定延迟。




### Spark 优化

#### 优化方向
*   **平台层面:** JAR 包精简，数据本地性，高效数据格式。
    *   `GZIP` (高压缩率, 慢速)，`LZO` (均衡, 可分片)，`Snappy` (高性能, 低压缩率)。
*   **代码:**  高效 RDD 操作，广播，及时释放，cache/persist。
*   **JVM层面:** 资源配置调优（executor的参数）。
    *   并行度`spark.default.parallelism`。默认 Task 数，建议值 CPU 核数 * Executor 数 * (2~3)。影响创建、shuffle未指定分区数量下的task数量。
    *  **`num-executors`**: Executor 数量，推荐 50-100。
    *  **`executor-memory`**: Executor 内存，推荐 5-8G。
    *  **`executor-cores`**: Executor CPU 核数，推荐 2-4 个。
    *  **`driver-memory`**: Driver 内存，按需调整，默认 1G 通常足够。
    *  **`spark.default.parallelism`**: Task 数量，推荐 `num-executors * executor-cores` 的 2-3 倍。
    *  **统一内存管理:**  动态调整 Execution Memory 和 Storage Memory 占比，提升内存利用率。
        *  **`spark.storage.memoryFraction`**: RDD 缓存内存比例，默认 60%，按需调整。
        *  **`spark.shuffle.memoryFraction`**: Shuffle 内存比例，默认 20%，按需调整。
        *  **用户内存 (User Memory):**  用户代码数据结构。(默认 0.2) 
*   **倾斜:**  分区、聚合、加盐，多策略应对。


#### 数据倾斜调优

*   **后果**
    * task不断GC，最后导致**OOM (Out Of Memory)** Task 内存溢出；**Task运行缓慢**
    * **根因** 分析数据分布不均；shuffle引发特定 Key 的数据过于集中
    * 可能是：易触发 Shuffle 的算子（distinct, groupByKey, reduceByKey, join 等）
    * 手段：分析数据分布、识别倾斜的 Key（数据质量），日志分析

*   **场景**
    * 小表 Join 大表场景
    * 大表 Join 大表（少数/大量 Key 倾斜）

*   **处理方法**

    > **Spark 处理方案**：
    
    * 上游数据均衡
    * 增加 Shuffle 并行度；调整资源配置
    * 使用 Broadcast Join 替代普通 Join
    * 两阶段聚合（加盐预聚合）、分散倾斜 Key（前缀扩容）

    > **Hive 处理方案**：
    
    * 上游数据均衡
    * 调整 Reduce 数量
    * MapJoin（小表 Join）
    * 空值随机分配、倾斜 Key 单独处理




#### Spark vs MapReduce
> 各自优势

*   Spark：多样数据源、内存计算、DAG、Lineage：延迟计算 + RDD血缘容错
*   MapReduce：磁盘IO、map-reduce阶段

> shuffle 区别

*   hive是基于sorted-shuffle，map阶段不同key进行哈希并分区排序，默认每个map任务生成一个物理文件，但是内部offset区分不同reduce，结果写入磁盘，支持combine和compress；reduce阶段对文件进行offset的copy，再进行reduce处理和全局排序；
*   spark的Shuffle有Hash Shuffle和Sort Shuffle两种；
*   spark的hash-shuffle是每个map任务有reduce个文件，数据根据hash-key进入不同的文件，文件数量等于map*reduce任务的总数量；reduce阶段拉取不同的shuffle文件汇总进行处理；
*   spark的sorted-shuffle，map阶段根据reduce区分分区，总体一个map任务产生一个临时文件（允许写内存后溢写磁盘，最后会合并），建立索引，内部排序；最后reduce任务进行处理；

> 总结：

*   hive sorted-shuffle：分区排序，逻辑上M*R文件实际少于，实现复杂需要写磁盘
*   spark hash-shuffle：不排序，物理上M*R文件，实现简单小文件过多（无排序易数据倾斜）
*   spark sorted-shuffle：分区排序，物理上M文件+offset文件，实现复杂相对推荐 （减少 IO shuffle内存高一点，提高并行度，数据本地性，压缩。）




#### Spark 累加器特点

*   全局唯一，只增不减，Executor修改Driver读，可跨Job共享。




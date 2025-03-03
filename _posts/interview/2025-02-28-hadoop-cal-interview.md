---
layout: post
title: "foris's blog"
date: 2025-02-28
author: forisfang 
color: rgb(232,198,198)  # 莫兰迪粉色 - 另一个选择
tags: bigdata interview
subtitle: 'Hadoop Calculate Interview Questions'
published: true
---



### 1. 核心架构
1. [**Hive**](../11/bigdata-Hive.html)
   *   **数据仓库工具**, 将 **结构化数据文件映射为表**，并提供 **类 SQL 查询 (HQL)**、SQL、元数据共享  
   *   文件格式、内外部表、分区分桶、选择合适压缩算法（Gzip、Bzip2等）、视图
   *   优化：语句（select、group、where、join on、order by）、map join、streamtable、自动 Skew Join、参数（hive.exec.parallel值为true）、fetch 机制简单查询直接读取文件，不走MapReduce（全局查找、字段查找、limit查找）
   *   数据倾斜：skew、map join、加盐、参数调整task数量
   

2. [**Spark**](../11/bigdata-Spark.html)
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




3. [**Flink**](../17/bigdata-Flink.html)
*   分层API、SQL-DataSet-Stateful Stream
*   JobManager(AM+RM)、TaskManager(NM)、Dispatcher(作业提交入口)
*   窗口(滑动滚动绘画全局、Watermark)、状态也就是中间结果(算子状态、键控状态）、容错性（checkpoint、savepoint）





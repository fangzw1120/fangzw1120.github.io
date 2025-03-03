---
layout: post
title: "foris's blog"
date: 2025-02-10
author: forisfang 
color: rgb(167,197,235)  # 莫兰迪蓝色 - 温和优雅的天空蓝
tags: bigdata 
subtitle: 'Big Data - MapReduce'
published: true
---


### 简介
*  并行两阶段、增加节点高扩展、失败重试高容错；离线大数据；减少shuffle；磁盘IO瓶颈
*  map任务结果文件R个分区、分区有序（compress、combine）、磁盘IO、reduce任务结果排序、磁盘IO
*  优化：任务数量、任务内存、数据格式、数据压缩、数据combine；自定义分区/前后缀处理key防止倾斜



### 核心特性 
*   **简化并行计算 (Simplified Parallel Computing):**  将复杂的分布式并行计算 **抽象成 Map 和 Reduce 两个阶段**，降低开发门槛，  让开发者专注于业务逻辑。
*   **高扩展性 (High Scalability):** 通过 **增加集群节点**  即可线性扩展计算能力。
*   **高容错性 (High Fault Tolerance):**  能够容忍节点故障，  **自动重试失败的任务**，保证任务的可靠执行。
*   **适合离线批处理 (Batch Processing):**  **擅长处理 *离线* 的、*大规模*  数据集**。
*   **数据本地化优化 (Data Locality Optimization):**  尽量将计算 **移动到数据所在的节点**  进行，减少数据网络传输，提高计算效率。

**局限性：**
*   **延迟高，不适合实时计算：**从磁盘读取数据，中间结果也写入磁盘，IO 开销大。
*   **Shuffle  开销大：**  Shuffle  阶段是性能瓶颈，  **数据需要经过网络传输和排序**，  开销较大。



### 工作流程
数据依次经过  Input、Split、Map、Shuffle & Sort、Reduce、Output  等阶段：

![25_02_10_MapReduce](../../../assets/202502/25_02_10_MapReduce.png)

1.  **Input (输入数据):**  输入数据通常在  HDFS 中。
2.  **Split (分片):**  InputFormat  组件负责将输入数据 **切分逻辑分片**，  **每个对应一个 Map Task**。
3.  **Map (映射):**  **多个 Map Task  并行执行**，  **每个 Map Task  调用用户自定义的 Mapper  函数**，  处理分配给它的  InputSplit  数据，  **输出中间结果  <Key, Value>  键值对**。
4.  **Shuffle & Sort (混洗和排序):**  Shuffle  阶段是 MapReduce  的 **核心和性能瓶颈** 所在。  
   
    Shuffle  阶段负责将 **Map Task  输出的中间结果  <Key, Value>  键值对 *按照 Key  进行分区、排序、分组***，  并将 **分组后的  <Key, Value-list>**  作为  Reduce Task  的输入。  
    
    Shuffle  阶段包括  **Map  端的 Shuffle (Partitioner, Sort, Spill, Merge)**  和  **Reduce  端的 Shuffle (Copy, Merge, Sort)**  等复杂步骤。

5.  **Reduce (归约):**  **多个 Reduce Task  并行执行**，  **每个 Reduce Task  调用用户自定义的 Reducer  函数**， 进行最终的数据聚合、分析等计算，  **输出最终结果  <Key, Value>  键值对**。
6.  **Output (输出结果):**  OutputFormat  组件输出的最终结果 **写入  HDFS  等持久化存储系统中**。


### 优化
1. **输入输出优化**：
   - 合理设置 InputSplit 大小
   - 使用合适的 InputFormat
   - 启用数据压缩

2. **Map 阶段优化**：
   - 合理设置 Map 任务数
   - 使用 Combiner 减少数据传输
   - 避免数据倾斜

3. **Reduce 阶段优化**：
   - 调整 Reduce 任务数
   - 优化内存设置
   - 合理使用 SequenceFile


### 常见问题处理
1. **数据倾斜**：
   - 自定义分区策略
   - 增加随机前缀或后缀
   - 使用 Combiner 预处理

2. **内存溢出**：
   - 调整 JVM 参数
   - 优化代码逻辑
   - 增加 Reduce 任务数

3. **作业效率低**：
   - 使用计数器监控
   - 优化数据格式
   - 调整并行度

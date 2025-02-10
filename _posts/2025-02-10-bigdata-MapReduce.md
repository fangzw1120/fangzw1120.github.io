---
layout: post
title: "foris's blog"
date: 2025-02-10
author: forisfang 
color: rgb(255,90,90)
tags: bigdata 
subtitle: 'Big Data - MapReduce'
published: true
---


## MapReduce 分布式计算框架核心解析

MapReduce 是一种经典的大数据 **分布式计算框架**， 擅长 **海量数据离线批处理**。

Map 和 Reduce 阶段拆解计算任务，新增节点扩展计算能力，shuffle 开销大。

### MapReduce 核心特性 (理解这些特点)

*   **简化并行计算 (Simplified Parallel Computing):**  将复杂的分布式并行计算 **抽象成 Map 和 Reduce 两个阶段**，降低开发门槛，  让开发者专注于业务逻辑。
*   **高扩展性 (High Scalability):** 通过 **增加集群节点**  即可线性扩展计算能力。
*   **高容错性 (High Fault Tolerance):**  能够容忍节点故障，  **自动重试失败的任务**，保证任务的可靠执行。
*   **适合离线批处理 (Batch Processing):**  **擅长处理 *离线* 的、*大规模*  数据集**。
*   **数据本地化优化 (Data Locality Optimization):**  尽量将计算 **移动到数据所在的节点**  进行，减少数据网络传输，提高计算效率。

**局限性：**

*   **延迟高，不适合实时计算：**从磁盘读取数据，中间结果也写入磁盘，IO 开销大。
*   **Shuffle  开销大：**  Shuffle  阶段是性能瓶颈，  **数据需要经过网络传输和排序**，  开销较大。



### MapReduce 工作流程 (数据流转过程)

MapReduce  作业的完整工作流程，  数据依次经过  Input、Split、Map、Shuffle & Sort、Reduce、Output  等阶段：

![25_02_10_MapReduce](../../../assets/202502/25_02_10_MapReduce.png)

1.  **Input (输入数据):**  输入数据通常在  HDFS 中。

2.  **Split (分片):**  InputFormat  组件负责将输入数据 **切分逻辑分片**，  **每个对应一个 Map Task**。

3.  **Map (映射):**  **多个 Map Task  并行执行**，  **每个 Map Task  调用用户自定义的 Mapper  函数**，  处理分配给它的  InputSplit  数据，  **输出中间结果  <Key, Value>  键值对**。

4.  **Shuffle & Sort (混洗和排序):**  Shuffle  阶段是 MapReduce  的 **核心和性能瓶颈** 所在。  
    
    Shuffle  阶段负责将 **Map Task  输出的中间结果  <Key, Value>  键值对 *按照 Key  进行分区、排序、分组***，  并将 **分组后的  <Key, Value-list>**  作为  Reduce Task  的输入。  
    
    Shuffle  阶段包括  **Map  端的 Shuffle (Partitioner, Sort, Spill, Merge)**  和  **Reduce  端的 Shuffle (Copy, Merge, Sort)**  等复杂步骤。

5.  **Reduce (归约):**  **多个 Reduce Task  并行执行**，  **每个 Reduce Task  调用用户自定义的 Reducer  函数**， 进行最终的数据聚合、分析等计算，  **输出最终结果  <Key, Value>  键值对**。

6.  **Output (输出结果):**  OutputFormat  组件输出的最终结果 **写入  HDFS  等持久化存储系统中**。



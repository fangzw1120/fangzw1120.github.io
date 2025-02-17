---
layout: post
title: "foris's blog"
date: 2025-02-17
author: forisfang 
color: rgb(255,90,90)
tags: bigdata 
subtitle: 'Big Data - Storm'
published: true
---


Storm 作为成熟的实时计算框架，具备低延迟、高吞吐、高可靠等特性。
Storm 和 Flink 都是主流的实时计算框架，它们在处理流式数据方面各有特点。以下从核心特性进行对比：

**核心特性速览**

| 特性     | Storm                                       | Flink                                         |
| -------- | ------------------------------------------- | --------------------------------------------- |
| 状态管理 | 无状态，需外部系统支持                        | 有状态，内置状态管理                              |
| 窗口支持 | 事件窗口支持基础，需手动缓存，灵活性和效率较低 | 窗口支持完善，内置多种窗口类型，自动状态管理                  |
| 消息语义 | At Most Once, At Least Once (ACK机制)         | At Most Once, At Least Once, Exactly Once (检查点机制) |
| 容错机制 | ACK 机制，全链路跟踪，失败重发，开销较大                | 检查点机制，分布式快照，状态回滚，故障恢复快且语义更强              |

**核心概念精讲**

![25_02_17_Storm](../../../assets/202502/25_02_17_Storm.png)

**1. Topologies（拓扑）**

Storm Topology 是一个由 Spouts 和 Bolts 通过 Streams 连接的有向无环图，代表一个完整的实时流处理应用。Topology 持续运行，处理数据流直至手动停止。

**2. Streams（流）**

Stream 是 Storm 的核心抽象，代表无界的、分布式 Tuple 序列。Tuple 是 Stream 的基本数据载体，类似消息或数据记录。

**3. Spouts**

Spout 是数据源，负责从外部系统读取数据并转换为 Tuple 发射到 Streams。 Spout 分为可靠和不可靠两种，可靠 Spout 具备失败重发机制。

**4. Bolts**

Bolt 是数据处理单元，接收来自 Streams 的 Tuple，进行业务逻辑处理（过滤、聚合、连接等），并将结果Tuple 发射到新的 Streams。

---

**Stream Grouping 策略概览**

Stream Grouping 定义了 Tuple 如何分发到下游 Bolt 的 Task 实例。Storm 内置 8 种 Grouping 策略：

1.  **Shuffle Grouping（随机分组）：**  均匀随机分发，实现负载均衡。
2.  **Fields Grouping（字段分组）：**  按指定字段值分组，相同值路由到同一 Task，利于聚合/Join。
3.  **Partial Key Grouping（部分 Key 分组）：**  字段分组优化，数据倾斜场景下提供更好负载均衡。
4.  **All Grouping（广播分组）：**  复制到所有下游 Task，用于广播全局数据，谨慎使用。
5.  **Global Grouping（全局分组）：**  发送到单个 Task（通常是 ID 最小的），适用于全局处理，不擅长并行。
6.  **None Grouping（无分组）：**  等价于 Shuffle Grouping，随机分发。
7.  **Direct Grouping（直接分组）：**  生产者直接指定 Tuple 由哪个 Task 处理，用于精确控制路由。
8.  **Local or shuffle grouping（本地或随机分组）：**  优先本地 Shuffle，减少网络传输，性能优化策略。

---
**Topology 运行架构速览**

![25_02_17_Storm_arch](../../../assets/202502/25_02_17_Storm_arch.png)

*   **Worker Processes（Worker 进程）：**  Topology 由多个 Worker 进程组成，进程间资源隔离。
*   **Executors（Executor 线程）：**  Worker 默认启动一个 Executor 线程，负责执行 Task。
*   **Tasks（Task 线程）：**  Executor 默认启动一个 Task 线程，Task 是 Spout 和 Bolt 的代码执行单元。

---
**Nimbus 与 Supervisor 的 Fail-Fast 和无状态设计**

Nimbus 和 Supervisor 进程设计为 Fail-Fast 和 Stateless：

*   **Fail-Fast（快速失败）：** 进程遇错自毁，快速隔离故障，依赖监控重启保障可用性。
*   **Stateless（无状态）：**  自身不存状态，状态持久化在 Zookeeper 或磁盘，利于快速重启和容错。



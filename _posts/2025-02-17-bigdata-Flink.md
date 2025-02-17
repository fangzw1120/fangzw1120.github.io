---
layout: post
title: "foris's blog"
date: 2025-02-17
author: forisfang 
color: rgb(255,90,90)
tags: bigdata 
subtitle: 'Big Data - Flink'
published: true
---


**Flink 核心技术精要：API、架构、窗口与状态**

Apache Flink 是领先的实时计算框架，以高性能、强功能和灵活 API 著称。本文精炼 Flink 的核心技术：API 架构、运行时架构、窗口机制和状态管理。

**1. 分层 API 架构：灵活易用**

![25_02_17_Flink_api](../../../assets/202502/25_02_17_Flink_api.png)

Flink 提供分层 API，兼顾易用性与灵活性：

*   **1.1 SQL & Table API：声明式，批流统一**

    *   **特点:** 高阶声明式，批流统一语义，简化开发，内置丰富函数，支持自定义扩展，高度优化性能。
    *   **优势:**  一套 API 应对批流场景，提升开发效率，强大 SQL 功能满足多样查询。

*   **1.2 DataStream & DataSet API：核心 API，灵活转换**

    *   **特点:** 核心命令式 API，Java/Scala 调用，丰富数据转换算子，支持有界/无界数据。
    *   **优势:** 灵活构建复杂数据处理逻辑，底层控制能力强，可精细调优。

*   **1.3 Stateful Stream Processing：底层 API，极致灵活**

    *   **特点:** 最底层 API，Process Function 内嵌 DataStream API，细粒度控制时间/状态。
    *   **优势:** 极致灵活，实现高级流处理模式，适用于性能和灵活性极致要求的场景。

**2. Runtime 层架构：Master-Slave 结构**

Flink Runtime 层为 Master-Slave 架构，负责作业执行和资源管理。

![25_02_17_Flink_client](../../../assets/202502/25_02_17_Flink_client.png)

*   **2.1 JobManager (Master)：作业管理中心(yarn application master)**

    *   **Dispatcher:**  作业入口，接收作业，提供 Web UI 监控。
    *   **ResourceManager:**  资源管理调度，管理 TaskManager Slots，对接 YARN/K8s 等平台弹性伸缩。
    *   **JobManager (核心):**  作业全局管理，作业解析 (JobGraph -> ExecutionGraph)，资源申请调度，任务分发监控，故障恢复。
    *   **高可用性 (HA):** 多 JobManager 部署，Leader 选举，保障高可用。

*   **2.2 TaskManager (Slave/Worker)：任务执行单元(yarn node mannager)**

    *   **Slot 管理:**  注册 Slots 到 ResourceManager，Slot 为资源调度单位。
    *   **任务执行:**  Slot 内启动 Task 实例，执行用户代码。
    *   **数据交换:**  高效网络数据交换，Netty 框架，内存缓冲，反压。
    *   **状态管理:**  管理 Task 状态，状态后端可配置 (Memory, Fs, RocksDB)，本地存储、Checkpoint 和恢复。
    *   **心跳上报:**  定期汇报状态和 Slot 使用情况到 ResourceManager。

*   **2.3 Dispatcher：作业提交入口**

    *   **职责:** 接收作业，预处理，转发给 JobManager，提供 Web UI。

*   **2.4 ResourceManager：资源协调者(yarn resource manager)**

    *   **职责:** Slot 管理，资源分配回收，对接外部资源平台，TaskManager 注册和心跳监控。

**3. 窗口 (Windows) 机制：有界流式计算**

Flink 窗口将无限流切分为有界窗口，进行有界计算。分为时间窗口和计数窗口。

*   **3.1 时间窗口 (Time Windows)：基于时间划分**

    *   **滚动窗口 (Tumbling Windows):** 固定大小，无重叠，独立窗口，适合周期统计。
    *   **滑动窗口 (Sliding Windows):** 固定大小，允许重叠，滑动步长控制频率，适合滑动统计，捕捉细微变化。
    *   **会话窗口 (Session Windows):**  动态大小，会话间隔定边界，捕捉会话行为，适合会话分析。
    *   **全局窗口 (Global Windows):**  所有 Key 相同元素入同一窗口，需自定义 Trigger，适用于全局汇总或事件触发计算。

*   **3.2 计数窗口 (Count Windows)：基于数量划分**

    *   **滚动计数窗口 (Tumbling Count Windows):**  固定元素数量触发，无重叠。`countWindow(1000)`
    *   **滑动计数窗口 (Sliding Count Windows):**  固定元素数量窗口，滑动步长控制频率。 `countWindow(1000, 10)`

**4. 状态 (State) 管理：有状态计算核心**

Flink 支持有状态计算，跨事件维护和访问数据。分为算子状态和键控状态。

*   **4.1 状态类型**

    *   **算子状态 (Operator State):**
        *   **绑定:** 算子实例，实例间隔离，算子级别作用域。
        *   **适用:** 算子自身维护状态，例如 Connector Offset，窗口缓存。
        *   **访问:** 仅当前算子实例访问。
        *   **状态后端:** Memory, Fs, RocksDB。
        *   **集合类型:** ListState, BroadcastState, UnionState。

    *   **键控状态 (Keyed State):**
        *   **绑定:** KeyedStream 的 Key，Key 值分区，Key 级别隔离。
        *   **适用:** 基于 Key 隔离和访问状态，窗口聚合，会话分析。
        *   **访问:** 同 Key 数据访问相同状态实例。
        *   **常用类型:** ValueState, ListState, MapState, ReducingState, AggregatingState。

*   **4.2 状态后端 (State Backends)**

    *   **MemoryStateBackend:**  内存存储，最快，低可靠，小容量，开发测试适用。
    *   **FsStateBackend:**  内存 + 文件系统，兼顾性能可靠性，中等容量，生产环境可选。
    *   **RocksDBStateBackend:**  RocksDB 磁盘存储，高可靠，海量容量，生产环境常用，性能相对内存稍慢。


---
layout: post
title: "foris's blog"
date: 2025-02-20
author: forisfang 
color: rgb(167,197,235)  # 莫兰迪蓝色 - 温和优雅的天空蓝
tags: bigdata
subtitle: 'Big Data - Flume'
published: true
---

### 简介
*   日志收集、source-channel-sink机制、配置生效（hadoop友好但有单点故障）、多管道成agent集群形成处理能力
*   丢包问题与恢复（channel缓冲瓶颈source接受能力瓶颈）（source并行度channel容量sink限流或者推拉）
*   vs.Kafka: 高可靠高吞吐队列/轻量消息采集、单点故障、无sessionID
*   channel可以是内存/文件系统/kafka  


### 使用场景
*   **核心目的**: 在线数据汇集。
*   **典型场景**: 日志收集、事件采集、传统系统数据接入。
*   **优势**: 无需修改应用接口，灵活适配现有系统。


### 组件详解 
**Source-Channel-Sink 管道模型**。

| 组件     | 核心功能           | 关键特性                               | 常见类型                                   |
| -------- | ------------------ | -------------------------------------- | ------------------------------------------ |
| **Source** | **数据 *入口***   | 接收外部数据，传递给 Channel              | Avro, Kafka, SpoolDir, Exec, NetCat, HTTP 等 |
| **Channel**| **数据 *通道***   | Source/Sink 间 *缓冲*，*可靠传输*          | Memory, File, JDBC, Kafka 等                |
| **Sink**   | **数据 *出口***   | 从 Channel 读取，写入目的地/转发，移除 Channel 数据 | HDFS, Hive, HBase, Kafka, ES, Avro, Logger 等|

*   **配置**:  Properties File 属性文件，围绕 Source, Channel, Sink 组件。
*   **集群**:  Agent 集群，非机器集群，多 Agent 组成数据管道，Agent 之间通过配置相互连接。

*   **管道 (Pipeline)**:  串联 (1 -> 1) - 顺序处理。
![25_02_17_Flume_pipe](../../../assets/202502/25_02_17_Flume_pipe.png)
*   **扇入 (Fan-in)**:  汇聚 (多 -> 1) - 多源合一。
![25_02_17_Flume_multi2one](../../../assets/202502/25_02_17_Flume_multi2one.png)
*   **扇出 (Fan-out)**:  复制 (1 -> 多) - 一源多用。
![25_02_17_Flume_one2multi](../../../assets/202502/25_02_17_Flume_one2multi.png)


### 丢包问题
*   可能由于 **Source 接收能力瓶颈**或 **Channel 积压**导致丢包。 
*   应对策略：监控 Flume Agent 日志量、Sink 端数据量等指标，设置丢包率
*   **优化措施**: 增加 Source 并行度、优化 Channel（增加容量或者持久化）、Sink 端限流、替换高效 Source 类型（例如推拉）、自研系统（或者主备）。


### 组件对比

#### Flume 与 Kafka 的选取
*   **Flume**:  专用于数据采集，组件丰富，易用，Hadoop 友好。 适用 Hadoop 生态，组件复用，轻量级开发，单点故障风险。
*   **Kafka**:  通用消息队列，高吞吐，持久化，可靠性高，多系统共享。 适用多系统消费，高可靠性，需自研 Producer/Consumer，外部流处理。
*   **采集方式**: Flume - 流式直推存储层,  Kafka - 消息队列缓存等待消费。
*   **断点续传**: Flume - File Channel持久化,  Agent 重启后 **从 File Channel 恢复数据**；Kafka - Offset 机制。



#### Logger4j 采集日志 vs. Flume 采集 Nginx 日志
*   **Logger4j (应用日志):**  优点 - SessionID, 稳定;  缺点 - 不灵活，代码耦合。
*   **Flume (Nginx 日志):**  优点 - 灵活，独立，Nginx 专注;  缺点 - 缺 SessionID。
*   **选择权衡**:  SessionID 追踪选 Logger4j,  Nginx 流量分析选 Flume,  灵活性 vs. 应用侵入性。


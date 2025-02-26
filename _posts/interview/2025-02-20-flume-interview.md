---
layout: post
title: "foris's blog"
date: 2025-02-20
author: forisfang 
color: rgb(255,90,90)
tags: bigdata interview
subtitle: 'Flume Interview Questions'
published: true
---

> 应用场景、source-channel-sink机制、丢包问题与恢复、优势（配置生效、hadoop友好但有单点故障）

### 1、Flume 使用场景
*   **核心目的**: 在线数据汇集。
*   **典型场景**: 日志收集、事件采集、传统系统数据接入。
*   **优势**: 无需修改应用接口，灵活适配现有系统。

---

### 2、Flume 组件详解 
**Source-Channel-Sink 管道模型**。
*   **核心组件**: Source (数据源), Channel (通道), Sink (数据目的地)。
*   **Source**: 采集数据，数据入口，封装 Event。
*   **Channel**:  桥梁，缓存队列，解耦流控，类似 Channel/Buffer，内存/文件系统/kafka。
*   **Sink**:  数据输出，数据出口，写入存储，可作为下游 Source。

---

### 3、Flume 丢包问题
*   可能由于 **Source 接收能力瓶颈**或 **Channel 积压**导致丢包。 
*   应对策略：监控 Flume Agent 日志量、Sink 端数据量等指标，设置丢包率
*   **优化措施**: 增加 Source 并行度、优化 Channel（增加容量或者持久化）、Sink 端限流、替换高效 Source 类型（例如推拉）、自研系统（或者主备）。

---

### 4、Flume 与 Kafka 的选取
*   **Flume**:  专用于数据采集，组件丰富，易用，Hadoop 友好。 适用 Hadoop 生态，组件复用，轻量级开发，单点故障风险。
*   **Kafka**:  通用消息队列，高吞吐，持久化，可靠性高，多系统共享。 适用多系统消费，高可靠性，需自研 Producer/Consumer，外部流处理。
*   **采集方式**: Flume - 流式直推存储层,  Kafka - 消息队列缓存等待消费。
*   **断点续传**: Flume - File Channel持久化,  Agent 重启后 **从 File Channel 恢复数据**；Kafka - Offset 机制。

---

### 5、Flume 配置与集群详解
*   **配置**:  Properties File 属性文件，围绕 Source, Channel, Sink 组件。
*   **集群**:  Agent 集群，非机器集群，多 Agent 组成数据管道，Agent 之间通过配置相互连接。

---

### 6、Logger4j 采集日志 vs. Flume 采集 Nginx 日志
*   **Logger4j (应用日志):**  优点 - SessionID, 稳定;  缺点 - 不灵活，代码耦合。
*   **Flume (Nginx 日志):**  优点 - 灵活，独立，Nginx 专注;  缺点 - 缺 SessionID。
*   **选择权衡**:  SessionID 追踪选 Logger4j,  Nginx 流量分析选 Flume,  灵活性 vs. 应用侵入性。


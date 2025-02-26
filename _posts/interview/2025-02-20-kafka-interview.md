---
layout: post
title: "foris's blog"
date: 2025-02-20
author: forisfang 
color: rgb(255,90,90)
tags: bigdata interview
subtitle: 'Kafka Interview Questions'
published: true
---

### 参考
[2025-02-17-bigdata-Kafka](../17/bigdata-Kafka.html)

---

### 1、特点
*   **核心**: 高吞吐，低延迟，可扩展，持久可靠，容错，高并发。
*   **关键机制**:  Partition 分区，Consumer Group 并行消费，多副本备份。
*   **核心应用**: 数据管道，消息队列，实时数据处理。
*   **典型场景**: 日志收集，用户行为分析，实时监控，流式计算。

---

### 2、缺点
*   **实时性**:  准实时，非极致实时。
*   **协议支持**:  原生不支持 MQTT，需网关转换。
*   **IoT 接入**:  不支持传感数据直连，需定制 Source 或第三方平台。
*   **全局有序**:  仅 Partition 内有序， Topic 全局无序。
*   **监控**:  原生监控弱，需插件增强。
*   **依赖**:  早期版本依赖 ZooKeeper (运维复杂，单点风险)，新版本 Kraft 模式尝试移除。

---

### 3、分区数增减
*   **增加分区**: 支持，在线操作，相对简单，提高吞吐量。
*   **减少分区**: 不支持，技术实现复杂，数据一致性挑战，消息丢失风险，破坏 Partition 有序性。
*   **替代方案**: 创建新 Topic 并迁移数据 (间接实现，但复杂且可能短暂不可用)。
*   **核心原因**: 数据迁移复杂性，Offset 管理复杂性，消息丢失风险，Partition 有序性破坏。


---
layout: post
title: "foris's blog"
date: 2025-02-10
author: forisfang 
color: rgb(167,197,235)  # 莫兰迪蓝色 - 温和优雅的天空蓝
tags: bigdata 
subtitle: 'Big Data - Yarn'
published: true
---


### 简介
*  统一资源分配管理（作业资源分离）、多框架可用、资源隔离（解决 Hadoop 1.x 扩展瓶颈、单点故障）
*  ApplicationMaster/ResourceManager/NodeManager/Container/Client，资源调度策略（FIFO、公平策略、多队列） 
*  独立MapReduce、为分布式Spark均有独立资源管理，但作业资源耦合 



### **核心特性**

> Hadoop 2.0+ 版本引入的 **集群资源管理系统**

*   **统一资源管理:**  统一管理集群 CPU、内存等资源，提高利用率。
*   **多框架支持:**  支持 MapReduce, Spark, Flink 等多种计算框架。
*   **高扩展性:**  解决 Hadoop 1.x 扩展瓶颈，支持更大规模集群。
*   **资源隔离:**  Container 容器隔离资源，保障系统稳定性。队列机制。
*   **精细资源控制:**  灵活控制资源分配，优化资源利用。



### **核心角色**
*   **RM (ResourceManager): 集群大脑，资源总管，分配资源，启动 AM。** 
*   **NM (NodeManager): 节点代理，资源执行者，汇报资源，运行 Container。负责container的生命周期。** 
*   **AM (ApplicationMaster): 应用管家，任务调度员，申请资源，管理 Task。** 
*   **Container: 资源容器，运行环境，隔离资源，执行 Task。** 
*   **Client: 用户入口，作业提交者，监控作业，与 RM/AM 交互。** 



### **作业执行流程**

![25_02_10_Yarn](../../../assets/202502/25_02_10_Yarn.png)

1.  **客户端提交:** 客户端向 RM 提交应用程序的 Jar 包、配置等信息。 
2.  **ResourceManager 启动 ApplicationMaster:**  RM 在某个 NM 上启动 AM。 
3.  **ApplicationMaster 资源请求分配 :** AM 根据应用需求，向 RM 请求 Container 资源。 RM 调度器为 AM 分配 Container 资源。 
4.  **NodeManager 运行 Task:** NM 在 Container 中启动 Task 执行，并监控资源使用。 
5.  **ApplicationMaster 监控和管理 Task:** AM 监控 Task 状态，处理 Task 失败，并动态调整资源需求。 
6.  **应用程序完成:**  应用完成后，AM 向 RM 注销并释放资源，RM 通知客户端。                                                                                                                                        

### **资源调度**
*   **FIFO Scheduler**：简单先进先出
*   **Capacity Scheduler**：多队列资源分配；支持资源抢占；适合多租户环境
*   **Fair Scheduler**：公平资源分配；动态资源调整；支持资源池



### **早期资源管理**
*   **独立的 MapReduce 集群 (Hadoop 1.x):**  资源管理由 **JobTracker (JT) 和 TaskTracker (TT)** 负责，采用 **JobTracker 集中式管理**。 
*   **独立的 Spark 集群 (Standalone Mode):**  资源管理由 **Spark Standalone Cluster Manager (Master 和 Worker)** 负责，采用 **Standalone Master 集中式管理**。 
*   **Spark 集群 (非 Standalone):**  YARN 通常是 *默认* 且 *首选* 的资源管理器 (Spark on YARN)。
*   **MapReduce 2.x (MRv2):**  *强制性* 使用 YARN 作为资源管理器。



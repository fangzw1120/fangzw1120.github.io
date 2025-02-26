---
layout: post
title: "foris's blog"
date: 2025-02-10
author: forisfang 
color: rgb(255,90,90)
tags: bigdata 
subtitle: 'Big Data - Yarn'
published: true
---


## YARN 一句描述 + 一张图 

**Q1: 什么是 YARN？ 它有哪些核心特性？**

**A1:** YARN (Yet Another Resource Negotiator) 是 Hadoop 2.0+ 版本引入的 **集群资源管理系统**，  它的核心特性包括：

*   **统一资源管理:**  统一管理集群 CPU、内存等资源，提高利用率。
*   **多框架支持:**  支持 MapReduce, Spark, Flink 等多种计算框架。
*   **高扩展性:**  解决 Hadoop 1.x 扩展瓶颈，支持更大规模集群。
*   **资源隔离:**  Container 容器隔离资源，保障系统稳定性。
*   **精细资源控制:**  灵活控制资源分配，优化资源利用。


---

**Q2: YARN 作业执行流程是怎样的？ 详细描述每个步骤。**

**A2:**  YARN 作业执行流程主要包括以下 6 个步骤，  理解这些步骤是掌握 YARN 工作机制的关键：

![25_02_10_Yarn](../../../assets/202502/25_02_10_Yarn.png)

1.  **客户端提交:** 客户端向 RM 提交应用程序的 Jar 包、配置等信息。 
2.  **ResourceManager 启动 ApplicationMaster:**  RM 在某个 NM 上启动 AM。 
3.  **ApplicationMaster 资源请求分配 :** AM 根据应用需求，向 RM 请求 Container 资源。 RM 调度器为 AM 分配 Container 资源。 
4.  **NodeManager 运行 Task:** NM 在 Container 中启动 Task 执行，并监控资源使用。 
5.  **ApplicationMaster 监控和管理 Task:** AM 监控 Task 状态，处理 Task 失败，并动态调整资源需求。 
6.  **应用程序完成:**  应用完成后，AM 向 RM 注销并释放资源，RM 通知客户端。                                                                                                                                        

---

**Q3:  YARN 集群包含哪些核心角色？ 它们分别有什么作用？**

**A3:** YARN 集群包含以下核心角色：

*   **RM (ResourceManager): 集群大脑，资源总管，分配资源，启动 AM。** 
*   **NM (NodeManager): 节点代理，资源执行者，汇报资源，运行 Container。负责container的生命周期。** 
*   **AM (ApplicationMaster): 应用管家，任务调度员，申请资源，管理 Task。** 
*   **Container: 资源容器，运行环境，隔离资源，执行 Task。** 
*   **Client: 用户入口，作业提交者，监控作业，与 RM/AM 交互。** 


---

**Q4:  为什么需要 YARN 这个组件？  它解决了什么问题？**

**A4:**  YARN 的出现是为了 **解决 Hadoop 1.x  架构在资源管理、扩展性和框架支持方面的瓶颈**。 主要解决的问题包括：

*   **解决 Hadoop 1.x JobTracker 的单点故障和性能瓶颈:**  YARN 将资源管理和作业调度分离，ResourceManager 专注资源管理，ApplicationMaster 负责应用管理，提高扩展性和可靠性。
*   **提高集群资源利用率:**  YARN 统一管理资源，动态分配，资源可在不同框架间弹性伸缩，避免浪费。
*   **支持多框架共存:**  YARN 作为通用资源管理平台，支持 MapReduce, Spark, Flink 等多种框架运行在同一集群，实现资源共享和框架多样化。
*   **实现资源隔离:**  Container 容器隔离资源，保障不同应用互不干扰，提高系统稳定性。

---


**Q5:  在同时运行 MapReduce 和 Spark 的 YARN 集群中，  如何进行资源管理？  为什么要配置资源限额？**

**A5:**  在多框架 YARN 集群中，需要 **配置各计算框架的最低使用限额和最高资源使用量**，通过 YARN 的 **队列 (Queue) 机制** 实现资源管理。  


---

**Q6:  如果集群是独立的 MapReduce 集群 (Hadoop 1.x 风格) 或独立的 Spark 集群 (Standalone Mode)，  资源管理还是 YARN 负责吗？**

**A6:**  **不是。  独立的 MapReduce 集群和独立的 Spark 集群 *不使用* YARN 进行资源管理。**

*   **独立的 MapReduce 集群 (Hadoop 1.x):**  资源管理由 **JobTracker (JT) 和 TaskTracker (TT)** 负责，采用 **JobTracker 集中式管理**。 
*   **独立的 Spark 集群 (Standalone Mode):**  资源管理由 **Spark Standalone Cluster Manager (Master 和 Worker)** 负责，采用 **Standalone Master 集中式管理**。 
*   **Spark 集群 (非 Standalone):**  YARN 通常是 *默认* 且 *首选* 的资源管理器 (Spark on YARN)。
*   **MapReduce 2.x (MRv2):**  *强制性* 使用 YARN 作为资源管理器。

---

**Q7： 资源调度**
*   **FIFO Scheduler**：简单先进先出
*   **Capacity Scheduler**：多队列资源分配；支持资源抢占；适合多租户环境
*   **Fair Scheduler**：公平资源分配；动态资源调整；支持资源池
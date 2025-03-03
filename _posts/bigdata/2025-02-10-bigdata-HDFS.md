---
layout: post
title: "foris's blog"
date: 2025-02-10
author: forisfang 
color: rgb(167,197,235)  # 莫兰迪蓝色 - 温和优雅的天空蓝
tags: bigdata 
subtitle: 'Big Data - HDFS'
published: true
---

### 简介
*   容错（多副本）、高吞吐（分布式+并行写）、低成本（磁盘）
*   关键读写流程、NameNode/DataNode、SecondNN/JournalNd/StandbyNN不同模式下的作用
*   副本策略（提交所在节点-首副本不同机架随机节点-次副本同机架不同节点）


### 核心特性
*   **高容错 (High Fault Tolerance):**  **多副本**机制，容忍节点故障，数据不丢失。
*   **高吞吐量 (High Throughput):**  分布式存储 + 并行读写，满足大数据性能需求。
*   **大文件存储 (Large Files):**  擅长存储超大文件，自动分割数据块。
*   **Write-Once-Read-Many:**  **一次写入多次读取**，支持追加写入，**不支持随机修改**。
*   **低成本硬件 (Commodity Hardware):**  可部署在普通硬件，降低存储成本。


### 关键角色
    
![25_02_10_HDFS_arch.png](../../../assets/202502/25_02_10_HDFS_arch.png)

*   **客户端 (Client):**  用户接口，发起读写请求。
*   **NameNode (NN): 名称节点 - 元数据管理者**
    *   **存储元数据 (Metadata):** 文件目录、属性、**数据块位置**。
    *   **内存存储 + 磁盘持久化:**  内存加速访问，磁盘保证可靠。
    *   **不存储数据:**  仅管理元数据信息。
*   **SecondNameNode:** 辅助合并NameNode的日志，并且定时备份NameNode的日志用于故障恢复.
*   **DataNode (DN): 数据节点 - 数据存储者**
    *   **存储数据块 (Data Block):**  存储文件实际数据。
    *   **提供读写服务:**  响应客户端数据读写请求。
    *   **心跳保活:**  定时向 NameNode 发送心跳。
*   **JournalNode：** HA 模式下存储编辑日志.


### 相关参数 
*   **数据块 (Block):**  文件分割成固定大小块，**默认 128MB**。
*   **复制因子 (Replication Factor):**  数据块多副本存储，**默认 3 副本**，提高容错。
*   **心跳间隔**：影响故障检测时间，默认 3 秒。


### 读写流程 
*   **读取流程 (Client -> NameNode -> DataNode):**
    1.  客户端请求 NameNode 获取文件元数据和 DataNode 信息。
    2.  NameNode 返回 DataNode 列表和数据块信息。
    3.  客户端**直接从 DataNode 并行读取数据块**。
    4.  客户端校验数据完整性并合并文件。

    ![25_02_10_HDFS_Read.png](../../../assets/202502/25_02_10_HDFS_Read.png)

*   **写入流程 (Client -> NameNode -> DataNode Pipeline -> NameNode):**
    1.  客户端切分文件为数据块。
    2.  客户端向 NameNode 请求数据块存储节点列表。
    3.  客户端向首个 DataNode 写入数据，**DataNode 间建立复制管道自动复制(并行)**。
    4.  DataNode 复制完成后逐级通知客户端，串行开始下一个数据块传输。
    5.  首个 DataNode 通知 NameNode，NameNode 更新元数据。

    ![25_02_10_HDFS_write.png](../../../assets/202502/25_02_10_HDFS_write.png)


### 写入策略 (副本放置关键原则)
*   **首副本本地优先:** 写入程序所在 DataNode 或随机 DataNode。
*   **次副本远程机架:**  与首副本不同机架的节点。
*   **三副本同机架异节点:** 与次副本同机架但不同节点。
*   **机架内副本数量限制:**  平衡数据分布，提高整体可靠性。

    ![25_02_10_HDFS_storage.png](../../../assets/202502/25_02_10_HDFS_storage.png)

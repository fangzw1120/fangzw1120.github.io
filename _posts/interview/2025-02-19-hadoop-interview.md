---
layout: post
title: "foris's blog"
date: 2025-02-19
author: forisfang 
color: rgb(255,90,90)
tags: bigdata interview
subtitle: 'Hadoop Interview Questions'
published: true
---


### 1. Hadoop 核心架构
Hadoop 主要由三大核心组件构成：
1. **HDFS (分布式文件系统)**
   - NameNode：管理元数据和文件系统命名空间
   - DataNode：存储实际数据，执行数据块读写
   - SecondaryNameNode：定期合并编辑日志，备份日志辅助恢复
   - JournalNode：HA 模式下存储编辑日志
   
   [2025-02-10-bigdata-HDFS](../10/bigdata-HDFS.html)

2. **YARN (资源管理系统)**
   - ResourceManager：全局资源管理和任务调度
   - NodeManager：单节点资源管理和任务执行
   - ApplicationMaster：单个应用程序的资源管理

   [2025-02-10-bigdata-Yarn](../10/bigdata-Yarn.html)

3. **MapReduce (分布式计算框架)**
   - Map：数据分片并行处理
   - Reduce：汇总处理结果

   [2025-02-10-bigdata-MapReduce](../10/bigdata-MapReduce.html)

4. **高可用相关进程**：
   - ZKFailoverController：监控 NameNode 或者 ResourceManager 状态，与 zookeeper 进行协调，实现高可用
   - ZooKeeper：提供分布式协调服务
   - HDFS 使用 HA 机制 (ZKFC 向NN发送健康探测，其他NN进行watch，事件发生，则抢占锁，成功则为attive)
   - Yarn 配置 RM HA；使用 ZooKeeper 进行协调

   [2025-02-10-bigdata-HA-Yarn_HDFS](../10/bigdata-HA-Yarn_HDFS.html)

### 2. Hadoop 运行模式
有三种运行模式：
1. **单机版**：适用于开发测试；所有进程运行在同一 JVM 中

2. **伪分布式**：单机上模拟分布式环境；各个进程运行在不同 JVM 中

3. **完全分布式**：生产环境使用；多台机器组成集群；提供完整的分布式功能



[2025-02-17-bigdata-Storm](../17/bigdata-Storm.html)

[2025-02-17-bigdata-other](../17/bigdata-other.html)
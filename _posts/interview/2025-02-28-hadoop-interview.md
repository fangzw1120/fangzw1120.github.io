---
layout: post
title: "foris's blog"
date: 2025-02-28
author: forisfang 
color: rgb(232,198,198)  # 莫兰迪粉色 - 另一个选择
tags: bigdata interview
subtitle: 'Hadoop Interview Questions'
published: true
---


### 1. 核心架构
1. [**HDFS (分布式文件系统)**](../10/bigdata-HDFS.html)
   *   容错（多副本）、高吞吐（分布式+并行写）、低成本（磁盘）
   *   关键读写流程、NameNode/DataNode、SecondNN/JournalNd/StandbyNN不同模式下的作用
   *   副本策略（提交所在节点-首副本不同机架随机节点-次副本同机架不同节点）
   

2. [**YARN (资源管理系统)**](../10/bigdata-Yarn.html)
   *  统一资源分配管理（作业资源分离）、多框架可用、资源隔离（解决 Hadoop 1.x 扩展瓶颈、单点故障）
   *  ApplicationMaster/ResourceManager/NodeManager/Container/Client，资源调度策略（FIFO、公平策略、多队列） 
   *  独立MapReduce、为分布式Spark均有独立资源管理，但作业资源耦合 


3. [**MapReduce (分布式计算框架)**](../10/bigdata-MapReduce.html)
   *  并行两阶段、增加节点高扩展、失败重试高容错；离线大数据；减少shuffle；磁盘IO瓶颈
   *  map任务结果文件R个分区、分区有序（compress、combine）、磁盘IO、reduce任务结果排序、磁盘IO
   *  优化：任务数量、任务内存、数据格式、数据压缩、数据combine；自定义分区/前后缀处理key防止倾斜


4. [**高可用**](../10/bigdata-HA-Yarn_HDFS.html)
   *   HDFS：DN向主备NN网络链接汇报元数据、ZKFC健康探查并和zookeeper通信保障高可用（临时节点watch）、永久节点+fencing机制防止脑裂
   *   Yarn & Spark：zk保存active/standby数据(非共享内存节点)，无需ZKFC减少脑裂，watch机制zk完成主备切换
   *   ZooKeeper：分布式协调、一致性数据、健康探查、主备切换

5. [**Kafka**](../17/bigdata-Kafka.html)
*   高性能分布式消息队列、依赖zookeeper或者raft、顺序写、零拷贝、内存映射磁盘、pull（允许阻塞等待消息）
*   一个topic多个partition、partition有序、partition对应group单consumer、分区/consumer触发rebalance 
*   多partition在不同broker，partition有leader/follower多副本
*   三种时间语义；ack+重试+幂等保证生产可靠性、事务+手动commit保证消费可靠性；日志收集，用户行为分析，实时监控，流式计算

6. [**Flume**](../20/bigdata-Flume.html)
*   日志收集、source-channel-sink机制、配置生效（hadoop友好但有单点故障）、多管道成agent集群形成处理能力
*   丢包问题与恢复（channel缓冲瓶颈source接受能力瓶颈）（source并行度channel容量sink限流或者推拉）
*   vs.Kafka: 高可靠高吞吐队列/轻量消息采集、单点故障、无sessionID
*   channel可以是内存/文件系统/kafka  

7. [**Zookeeper**](../17/zookeeper.html)
*   开源分布式协调服务。**简单易用(树形结构)、高性能(多角色保证读写)、高可靠(Quorum)、强一致**。 
*   分布式协调、一致性数据（配置管理、服务发现）、集群管理（领导者选举、分布式锁）、顺序一致性（分布式队列）
*   一致性存储、竞争互斥锁、watch机制（一次性机制）、顺序创建节点/执行事务
*   Leader/Follower 参与写操作和选举， Observer 仅提供读服务，不参与核心写流程和选举
*   **读写分离 (leader处理事务)，过半写入（事务变提案），Leader 选举（事务ID最大） + 数据同步 = 高可用 + 强一致**。
*   临时/永久节点、顺序/非顺序节点

8. [**HBase**](../20/bigdata-HBase.html)
*   基于 HDFS 的 NoSQL 列式数据库、结构化/半结构/非结构化数据、HDFS 特点、必须有zookeeper
*   解决随机访问数据、rowkey+列族+列限定符+cell多版本、cache-mem(WAL)-hfile机制+布隆过滤器
*   region分片、master负载均衡、提供高可靠、高性能、可伸缩服务
*   zk保障单mater保存元数据保存regionserver状态、master分配region和负载均衡、regionserver读写数据（c-m-h机制 布隆过滤器）
*   容灾：有表API备份数据、export HDFS、快照元数据和hfile
*   优化：预建region和优化hfile大小、rowkey散列、CF合理、每次RPC批量数据、region大小合理、数据存储格式压缩


### 2. 运行模式
1. **单机版**：所有进程运行在同一 JVM 中
2. **伪分布式**：单机上模拟分布式环境；各个进程运行在不同 JVM 中
3. **完全分布式**：生产环境使用；多台机器组成集群



### 3. 其他生态组件
> 有独立讲解的组件不在这里列举

- [bigdata-Storm](../17/bigdata-Storm.html)
- [bigdata-other](../17/bigdata-other.html)
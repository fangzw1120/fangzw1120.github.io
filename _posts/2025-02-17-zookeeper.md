---
layout: post
title: "foris's blog"
date: 2025-02-17
author: forisfang 
color: rgb(255,90,90)
tags: bigdata zookeeper micro_service 
subtitle: 'zookeeper'
published: true
---



Apache ZooKeeper - 开源分布式协调服务，构建可靠分布式系统基石。核心：**简单易用、高性能、高可靠**。 提供：配置管理、服务发现、领导者选举、分布式锁、队列等关键服务。

### ZooKeeper 核心优势速查

*   **简单模型**:  树形结构 (ZNode)，易理解。
*   **高性能**:  高读取负载优化，读性能卓越。
*   **高可靠性**:  集群多服务器 (Quorum) 保证服务可用性。
*   **强一致性**:  顺序一致性，保证数据视图一致。
*   **开源**:  Apache 顶级项目，社区活跃，应用广泛。



### ZooKeeper 集群角色详解
ZooKeeper 集群由三种角色服务器构成，协同提供高可用协调服务：

*   **Client**:  应用客户端库，连接 Server，发送请求/接收响应。
*   **Leader (领导者)**：
    *   **核心职责**:  **提供读写服务，维护集群状态，*仅 Leader  处理，保证写一致性和顺序性 *事务请求唯一入口***。
    *   **选举产生**:  集群启动或故障恢复时，由集群选举产生 (ZAB 协议)。
*   **Follower (追随者)**：
    *   **核心职责**:  **提供读写服务，*定期汇报节点状态给 Leader***，**参与 *“过半写成功”策略* 和 *Leader 选举***。
*   **Observer (观察者)**：
    *   **核心职责**:  **提供读服务，*定期汇报节点状态给 Leader***，**但不参与 *“过半写成功”策略* 和 *Leader 选举***。
    *   **优势**:  **不影响写性能，*提升集群读性能*** (可水平扩展 Observer 数量)。
**核心差异**:  Follower 参与写操作和选举， Observer 仅提供读服务，不参与核心写流程和选举。




### ZooKeeper 数据模型精要

ZooKeeper 数据模型 - **树形 ZNode 节点结构 (/ 根节点)**，每个 ZNode 存储数据和元信息。
*   **ZNode (数据节点)**:  基本数据单元，类比文件系统 **(根节点 "/")**。
    *   **数据存储**:  少量数据 (KB 级别)。
    *   **节点类型**:
        *   **持久节点 (Persistent)**:  **永久存在，除非显式删除**。
        *   **临时节点 (Ephemeral)**:  **客户端会话失效自动删除** (会话管理、Leader 选举)。
**核心特性**:  树形结构，多类型节点，满足不同协调场景需求。




### ZAB 协议核心流程

ZAB (ZooKeeper Atomic Broadcast) 协议 -  **崩溃恢复的原子广播协议**，保证 ZooKeeper 数据一致性和可靠性。

*   **Leader 中心化处理**:  **所有事务请求 *必须 Leader 处理***。  简化并发控制，保证顺序执行。
*   **事务 Proposal**:  Leader 将事务请求转换为 **事务提案 (Proposal)**。
*   **原子广播 (过半写入)**:
    1.  **Leader  -> Follower**:  Leader  广播 Proposal  给所有 Follower。
    2.  **Follower -> Leader**:  Follower  反馈  ACK  表示接受 Proposal。
    3.  **Leader  Commit**:  **过半 Follower  ACK  后**，Leader  广播  Commit  消息给所有 Follower。
    4.  **Follower  Commit**:  Follower  提交 Proposal  到本地。
    5.  **客户端  ACK**:  Leader  向客户端返回  ACK，写操作完成。
**核心保证**:  **原子性广播，顺序执行，崩溃恢复，数据一致性**。
*   **Leader 选举与崩溃恢复**:
    *   **崩溃恢复模式**:  Leader  崩溃时，集群进入崩溃恢复模式。
    *   **重新选举**:  Replica (Follower)  节点重新选举  Leader (ZAB 协议保证)。
    *   **ZXID 最大者胜出**:  **最新 ZXID (事务 ID)  最大者被选为新 Leader** (数据最新)。
    *   **数据同步**:  新 Leader  与 Follower  同步数据，确保数据一致性后对外提供服务。
**核心思想**:  **读写分离 (部分)，过半写入，Leader 选举 + 数据同步 = 高可用 + 强一致**。



### ZooKeeper 核心应用场景

> 利用zookeeper的三个特点，一个是竞争性创建节点；一个是watch机制；一个是顺序创建节点

*   **数据订阅/发布 (Config Management)**:  配置中心，动态配置更新，服务配置下发。
*   **命名服务 (Naming Service)**:  分布式唯一 ID 生成，服务命名空间管理。
*   **Master 选举 (Leader Election)**:  分布式系统 Master 节点自动选举，故障切换。
*   **分布式锁 (Distributed Lock)**:  资源互斥访问控制，排他锁、公平/非公平锁实现。
*   **集群管理 (Cluster Management)**:  集群成员管理，节点状态监控，集群元数据维护。
*   **分布式队列**: FIFO 队列 (顺序临时节点，按序号消费)。



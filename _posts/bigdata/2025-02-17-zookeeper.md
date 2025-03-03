---
layout: post
title: "foris's blog"
date: 2025-02-17
author: forisfang 
color: rgb(167,197,235)  # 莫兰迪蓝色 - 温和优雅的天空蓝
tags: bigdata zookeeper micro_service 
subtitle: 'zookeeper'
published: true
---


### 简介
*   开源分布式协调服务。**简单易用(树形结构)、高性能(多角色保证读写)、高可靠(Quorum)、强一致**。 
*   分布式协调、一致性数据（配置管理、服务发现）、集群管理（领导者选举、分布式锁）、顺序一致性（分布式队列）
*   一致性存储、竞争互斥锁、watch机制（一次性机制）、顺序创建节点/执行事务
*   Leader/Follower 参与写操作和选举， Observer 仅提供读服务，不参与核心写流程和选举
*   **读写分离 (leader处理事务)，过半写入（事务变提案），Leader 选举（事务ID最大） + 数据同步 = 高可用 + 强一致**。
*   临时/永久节点、顺序/非顺序节点


### 应用场景
*   **数据订阅/发布 (Config Management)**:  配置中心，动态配置更新，服务配置下发。
*   **命名服务 (Naming Service)**:  分布式唯一 ID 生成，服务命名空间管理。
*   **Master 选举 (Leader Election)**:  分布式系统 Master 节点自动选举，故障切换。
*   **分布式锁 (Distributed Lock)**:  资源互斥访问控制，排他锁、公平/非公平锁实现。
*   **集群管理 (Cluster Management)**:  集群成员管理，节点状态监控，集群元数据维护。
*   **分布式队列**: FIFO 队列 (顺序临时节点，按序号消费)。


### 核心优势
*   **简单模型**:  树形结构 (ZNode)，易理解。
*   **高性能**:  高读取负载优化，读性能卓越。
*   **高可靠性**:  集群多服务器 (Quorum) 保证服务可用性。
*   **强一致性**:  顺序一致性，保证数据视图一致。


### 集群角色详解
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

    ---
    
    > **如何扩容**
    
    *   **全部重启 (All-restart)：**  停掉所有服务，修改配置后重启，不影响现有 Session。
    *   **逐个重启 (Rolling-restart)：**  更常用，滚动重启集群节点。
    
    
    ---
    
    > **集群中服务器之间通信**
    
    *   **TCP 连接：**  Leader 与每个 Follower/Observer 建立 TCP 长连接。




### 数据模型
*   **树形 ZNode 节点结构 (/ 根节点)**，每个 ZNode 存储数据和元信息。
*   **数据存储**:  少量数据 (KB 级别)。
*   **节点类型**:
    *   **持久节点 (Persistent)**:  **永久存在，除非显式删除**。
    *   **临时节点 (Ephemeral)**:  **客户端会话失效自动删除** (会话管理、Leader 选举)。
    *   短暂/持久 + 顺序编号/非顺序编号，共四种。
    *   如需创建子节点，父节点应为持久节点。
*   **核心特性**:  树形结构，多类型节点，满足不同协调场景需求。




### 监听机制

#### **使用 watch 的注意事项**
*  **一次性 (One-time trigger)：**  Watch 通知仅触发一次，需重复注册以持续监听。
*  **重连保持 (Reconnection persistence)：**  `CONNECTIONLOSS` 后，Session 未过期内重连，Watch 注册仍然有效。
*  **版本变化触发 (Version change)：** `setData()` 操作，无论数据内容是否改变，只要版本更新，都会触发 `NodeDataChanged` 通知。
*  **节点删除移除 (Node deletion removes watches)：**  监听节点被删除，所有注册在该节点的 Watcher 会被移除，不再通知。
*  **相同 Watch 单次通知 (Single notification for same watch)：** 同一客户端对同一节点注册相同 Watch，一次变更只通知一次。
*  **客户端存储 (Client-side storage)：**  Watcher 对象仅存在客户端，服务端不存储 Watcher 信息。
*   **时间差：**  从数据修改，服务端通知客户端，到客户端再次注册 Watch，存在时间间隔，期间的多次修改可能丢失。
*   **避免误测：**  不要用“修改 n 次，接收 n 次通知”来测试 ZooKeeper 通知机制的可靠性。

    ---

    > **监听原理**

    *   客户端 Listener 进程监听接受通知 + connect 进程向服务端注册 Watcher，服务端监听器列表。

    ---

    > **获取更新数据**

    *   默认不保证立即最新，需显式调用 `sync()` 同步。

    ---

    > **创建的临时节点什么时候会被删除**

    *   **删除时机：**  临时节点在 Session 过期 (`SESSIONEXPIRED`) 后才会被删除。
    *   **延时：**  取决于 `Session_TimeOut` 设置。

    ---

    > **如何处理 CONNECTIONLOSS 和 SESSIONEXPIRED 两类连接异常？**

    *   CONNECTIONLOSS 等待自动重连并确认操作，SESSIONEXPIRED 需重新创建会话。



### ZAB 协议核心流程
**崩溃恢复的原子广播协议**，保证 ZooKeeper 数据一致性和可靠性。
*   **Leader 中心化处理**:  **所有事务请求 *必须 Leader 处理***。简化并发控制，保证顺序执行。
*   **事务 Proposal**:  Leader 将事务请求转换为 **事务提案 (Proposal)**。
*   **原子广播 (过半写入)**:
    1.  **Leader  -> Follower**:  Leader  广播 Proposal  给所有 Follower。
    2.  **Follower -> Leader**:  Follower  反馈  ACK  表示接受 Proposal。
    3.  **Leader  Commit**:  **过半 Follower  ACK  后**，Leader  广播  Commit  消息给所有 Follower。
    4.  **Follower  Commit**:  Follower  提交 Proposal  到本地。
    5.  **客户端  ACK**:  Leader  向客户端返回  ACK，写操作完成。
*   **Leader 选举与崩溃恢复**:
    *   **崩溃恢复模式**:  Leader  崩溃时，集群进入崩溃恢复模式。
    *   **重新选举**:  Replica (Follower)  节点重新选举  Leader (ZAB 协议保证)。
    *   **ZXID 最大者胜出**:  **最新 ZXID (事务 ID)  最大者被选为新 Leader** (数据最新)。
    *   **数据同步**:  新 Leader  与 Follower  同步数据，确保数据一致性后对外提供服务。
*   **选举机制**
    *   **启动状态：** 服务器启动时为 LOOKING 状态，互相投票。
    *   **胜出条件：**  serverId 大者优先。
    *   **Leader 确认：**  需获得超过半数服务器投票才成为 Leader。
    *   **示例说明：**  如 5 台服务器 (ID 1-5) 顺序启动，Server 3 先获过半数 (Server 1, 2, 3) 支持成为 Leader，后续 Server 4, 5 启动后直接成为 Follower。若按 5, 4, 3, 2, 1 倒序启动，Server 5 因 ID 最大且先满足过半数条件，将成为 Leader。



#### **对事务性的支持**

**核心：Multi Operations 事务，保证原子性，要么全成功，要么全失败。**

*   **事务支持：**  通过 `zoo_create_op_init` 等四个函数初始化操作 (operation)。
*   **事务提交：**  使用 `zoo_multi` 提交所有操作，服务端保证事务原子性。
*   **原子性保证：**  事务中任何操作失败，整个事务回滚，所有操作都不生效。
*   **错误处理：**  `zoo_multi` 返回第一个失败操作的状态码，指示事务失败原因。



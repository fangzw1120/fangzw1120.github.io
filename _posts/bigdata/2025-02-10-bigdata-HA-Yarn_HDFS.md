---
layout: post
title: "foris's blog"
date: 2025-02-10
author: forisfang 
color: rgb(255,90,90)
tags: bigdata HA
subtitle: 'Big Data - HDFS YARN HA by Zookeeper'
published: true
---


## YARN 与 HDFS 基于 ZooKeeper 实现高可用核心机制梳理

### 一、 HDFS 基于 ZooKeeper 实现高可用 (HA)

**1. 核心组件与功能：**

*   **Active NameNode & Standby NameNode (NN):**
    *   **功能:**  两台 NameNode 互为备份，实现元数据冗余。 **Active NN**  对外提供服务 (读写)，**Standby NN**  同步元数据，待命接管。同一时刻只有一个 Active NN。
*   **共享存储系统 (例如 QJM):**
    *   **功能:**  **元数据共享存储**，Active NN 将 EditLog 写入共享存储，Standby NN 从共享存储同步 EditLog，实现元数据同步。  QJM 基于 **“过半写入则成功”** 策略保证数据可靠性。

*   **ZooKeeper 集群:**
    *   **功能:**  为 ZKFailoverController 提供支持。
*   **ZKFailoverController (ZKFC):**
    *   **功能:**  **NN 主备切换控制器**，作为独立进程运行。  **监控 NN 健康状态，协调主备切换流程，执行 Fencing 隔离**。
    *   **HealthMonitor (ZKFC 内部组件):**  **健康监控器**，定期检测 Active NN 健康状态。
    *   **ActiveStandbyElector (ZKFC 内部组件):**  **主备选举器**，与 ZooKeeper 交互，进行主备选举，管理 ZooKeeper 上的选举相关节点。

*   **DataNode 节点:**
    *   **功能:**  **数据块存储节点**。  DataNode 同时向 Active NN 和 Standby NN 网络通信发送 **汇报数据块位置信息**，实现数据块元数据共享。



**2. 主要流程 - NameNode 主备切换流程：**

1.  **健康监控 (Health Monitoring):**  ZKFC 中的 **HealthMonitor** 定期检测 Active NN 健康状态。检测到 NN 状态异常。
    ZKFC 删除 ZooKeeper 上的临时节点 `/hadoop-ha/.../ActiveStandbyElectorLock` (或因 Active NN 会话断开，临时节点自动删除)。
2.  **触发主备选举:**  监听器收到 `NodeDeleted` 事件。ZKFC 判断需要切换，使用 **ActiveStandbyElector** 组件启动主备选举。
3.  **ZooKeeper 主备选举:**  ActiveStandbyElector 与 ZooKeeper 交互，竞争 **临时节点 `/hadoop-ha/.../ActiveStandbyElectorLock`** 的创建权，成功创建者当选为新的 Active NN。
4.  **角色转换通知:**  ActiveStandbyElector 选举成功后，回调 ZKFC，通知当前 NN 成为 Active NN 或 Standby NN。
5.  **状态切换执行:**  ZKFC 调用 NN 的 **HAServiceProtocol RPC 接口**，将 NN 切换到 Active 或 Standby 状态。



**3. 重要问题及解决方案 - HDFS 脑裂问题与 Fencing 隔离机制：**

*   **脑裂问题:**  在 HA 场景下，可能出现短暂时间内 **多个 NN 都误认为自己是 Active 状态**，导致数据不一致。  例如，Active NN 假死 (GC 长时间停顿) 导致 ZooKeeper 会话超时，Standby NN 误判为 Active NN 故障并切换，但旧的 Active NN  之后又恢复， 此时集群中可能存在两个 Active NN。
*   **Fencing 隔离机制:**  解决脑裂问题的核心方案，**确保同一时刻只有一个 Active NN 对外提供服务**。
    *   **持久节点 `/hadoop-ha/.../ActiveBreadCrumb`:**  Active NN 选主成功后，创建持久节点记录自身信息。
    *   **Fencing 触发:**  新的 Active NN 选主成功后，检查是否存在旧 Active NN 遗留的持久节点，若存在则触发 Fencing。
    *   **Fencing 操作:**
        *   **尝试柔性隔离:**  调用旧 Active NN 的 `transitionToStandby` 方法，尝试将其切换为 Standby 状态。
        *   **强制隔离 (硬隔离):**  若柔性隔离失败，则执行预定义的 **隔离措施 (sshfence/shellfence)**，强制停止旧 Active NN 进程。




### 二、 YARN 基于 ZooKeeper 实现高可用 (HA)

**1. 核心组件与功能：**

*   **Active ResourceManager & Standby ResourceManager (RM):**
    *   **功能:**  两台 ResourceManager 互为备份，实现资源管理服务冗余。 同一时刻只有一个 Active RM。
*   **ZooKeeper 集群:**
    *   **功能:**  **核心协调器**，负责 **ResourceManager 主备选举，存储 ResourceManager 状态信息**。

**2. 主要流程：**

YARN ResourceManager 的主备切换流程与 HDFS NameNode 类似，但更加简化，主要依赖 ZooKeeper 进行：

1.  **健康监控 (Health Monitoring):**  Active ResourceManager  定期向 ZooKeeper  发送心跳信息，表明自身健康状态。
2.  **状态变化检测:**  ZooKeeper  检测到 Active ResourceManager  心跳丢失 (例如：网络故障，进程宕机)。
3.  **触发主备选举:**  ZooKeeper  触发 ResourceManager  主备选举。
4.  **ZooKeeper 主备选举:**  Standby ResourceManager  竞争成为新的 Active ResourceManager (具体选举机制文本未详细描述，但通常也是基于 ZooKeeper 的 Leader Election 算法)。
    > 两个节点如何成为active，竞争建立临时节点lock，成功则为active，另一个节点watch；同时永久节点写入active的信息；
    > 节点down，其建立的临时节点delete
5.  **状态切换与服务接管:**  新的 Active ResourceManager  从 ZooKeeper  **加载状态信息**，接管资源管理和作业调度服务。



**与 HDFS NameNode HA 的主要区别:**

*   **元数据管理:**  YARN ResourceManager  **不依赖共享存储系统 (如 QJM) 进行元数据同步**，而是将 **状态信息直接存储在 ZooKeeper** 上，Standby RM 从 ZooKeeper 同步状态信息。  这简化了 YARN RM HA 的架构。
*   **脑裂问题:**  YARN ResourceManager  架构中，脑裂问题的风险和影响相对较小。


**与 spark HA 的区别**
* spark HA 和 yarn HA 比较类似，spark 的主 master 节点向 zookeeper 发送心跳， zookeeper 提供选举和主节点信息的存储；从而保证高可用；



### 三、 ZooKeeper 在 YARN & HDFS HA 中的核心作用总结：

*   **分布式协调:**  ZooKeeper  作为分布式协调服务，为 HDFS 和 YARN HA  提供了 **统一的协调平台**，解决分布式环境下的 **一致性、可靠性** 问题。
*   **主备选举 (Leader Election):**  ZooKeeper  利用其 **临时节点和 Watcher 机制**，实现了 **可靠的主备选举**，确保在 Active 组件故障时，能自动、快速地选出新的 Active 组件。
*   **故障检测与监控:**  ZooKeeper  可以 **监控服务节点的健康状态** (例如：通过心跳检测)，并及时 **通知监控组件 (ZKFC)**  触发故障切换。
*   **状态信息共享与同步:**  ZooKeeper  可以 **存储和同步关键的状态信息** (例如：ResourceManager 状态信息)，帮助 Standby 组件快速接管服务。
*   **Fencing 隔离机制 (HDFS):**  ZooKeeper  参与 HDFS 的 **Fencing 隔离机制**，通过持久节点等特性，辅助实现对旧 Active NN 的隔离， **避免脑裂问题，保障数据一致性**。

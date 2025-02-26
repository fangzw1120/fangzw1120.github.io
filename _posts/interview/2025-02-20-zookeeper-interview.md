---
layout: post
title: "foris's blog"
date: 2025-02-20
author: forisfang 
color: rgb(255,90,90)
tags: bigdata interview
subtitle: 'Zookeeper Interview Questions'
published: true
---

#### **参考**

> 应用场景、角色、协议（过半写入、崩溃恢复）

  [2025-02-17-zookeeper](../17/zookeeper.html)
  
> watch 机制

---

### 基础原理


#### **选举机制**
*   **启动状态：** 服务器启动时为 LOOKING 状态，互相投票。
*   **胜出条件：**  serverId 大者优先。
*   **Leader 确认：**  需获得超过半数服务器投票才成为 Leader。
*   **示例说明：**  如 5 台服务器 (ID 1-5) 顺序启动，Server 3 先获过半数 (Server 1, 2, 3) 支持成为 Leader，后续 Server 4, 5 启动后直接成为 Follower。若按 5, 4, 3, 2, 1 倒序启动，Server 5 因 ID 最大且先满足过半数条件，将成为 Leader。

---

#### **对事务性的支持**

**核心：Multi Operations 事务，保证原子性，要么全成功，要么全失败。**

*   **事务支持：**  通过 `zoo_create_op_init` 等四个函数初始化操作 (operation)。
*   **事务提交：**  使用 `zoo_multi` 提交所有操作，服务端保证事务原子性。
*   **原子性保证：**  事务中任何操作失败，整个事务回滚，所有操作都不生效。
*   **错误处理：**  `zoo_multi` 返回第一个失败操作的状态码，指示事务失败原因。

--- 

#### **如何扩容**
*   **全部重启 (All-restart)：**  停掉所有服务，修改配置后重启，不影响现有 Session。
*   **逐个重启 (Rolling-restart)：**  更常用，滚动重启集群节点。

---

#### **集群中服务器之间通信**
*   **TCP 连接：**  Leader 与每个 Follower/Observer 建立 TCP 长连接。

---

#### **部署方式、角色、最少需要几台机器**
*   核心：单机/集群，Leader/Follower/Observer，最少 3 台。**

---

#### **节点类型**
*   短暂/持久 + 顺序编号/非顺序编号，共四种。
*   ZooKeeper 不允许为临时节点创建子节点。
*   如需创建子节点，父节点应为持久节点。


### 监听机制


#### **监听原理**
*   客户端 Listener 进程监听接受通知 + connect 进程向服务端注册 Watcher，服务端监听器列表。

---

#### **一个客户端修改了某个节点的数据，其他客户端能够马上获取到这个最新数据吗？**
*   默认不保证立即最新，需显式调用 `sync()` 同步。

---

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

#### **创建的临时节点什么时候会被删除，是连接一断就删除吗？延时是多少？**
*   **删除时机：**  临时节点在 Session 过期 (`SESSIONEXPIRED`) 后才会被删除。
*   **延时：**  取决于 `Session_TimeOut` 设置。

---

#### **如何处理 CONNECTIONLOSS 和 SESSIONEXPIRED 两类连接异常？**
*   CONNECTIONLOSS 等待自动重连并确认操作，SESSIONEXPIRED 需重新创建会话。


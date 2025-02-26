---
layout: post
title: "foris's blog"
date: 2025-02-17
author: forisfang 
color: rgb(255,90,90)
tags: bigdata 
subtitle: 'Big Data - Kafka'
published: true
---


## 高性能消息队列
高性能分布式流处理平台，消息队列

部署的时候一定要依赖zookeeper或者raft


### 核心优势
*   **顺序写磁盘**:  高效 I/O，机械硬盘亦可高吞吐。
*   **内存映射磁盘**:  Page Cache 内存读写，接近内存速度。
*   **零拷贝**:  `sendfile` 减少数据拷贝，提升网络传输效率。
*   **消息拉取**:  消费者主动拉取，灵活控制消费速率，利于批量处理。


### Kafka 消息特性极简对比
> RocketMQ nameserver：充当元数据的中心，负责维护Broker的注册信息、Topic的路由信息

> RocketMQ controller：协调和管理整个RocketMQ集群的工作

> RocketMQ queue（partition）只存储offset，真正消息在同一个虚拟commitlog；kafka真正消息在partition

> RocketMQ 可以做消息的查询，消息堆到哪里去了，谁消费了，消费到哪儿了

> Kafka 允许 Consumer 在 Broker 无消息时 **阻塞 (long polling)** 等待新消息到达， 避免空轮询消耗资源。

| 特性         | Kafka             | RocketMQ          | RabbitMQ            | **核心差异**                      |
| ------------ | ----------------- | ----------------- | ------------------- | --------------------------------- |
| **消息获取**   | **Pull (拉)**    | **Pull (拉)**   | **Push (推)**         | **消费模式**: 主动 vs 被动            |
| **消息路由**   | **Topic**        | **Topic**    | **多模式** (Topic, 点对点、确定路由、正则路由匹配) | **路由灵活度**: 简单 Topic vs 多种模式 |
| **消息顺序**   | **Partition 有序** | **Queue 有序**    | **Queue 有序**      | **顺序范围**: 分区/队列内有序         |
| **消息堆积**   | **扩 Partition**    | **扩 Queue**       | **扩 Queue**    | **应对策略**: 扩容+限速+增消费者        |
| **消息优先级** | **不支持**          | **不支持**          | **支持**         | **功能差异**: 支持 vs 不支持           |
| **消息容错**   | **跳过+自建死信**  | **原生死信队列**   | **原生死信队列**     | **死信队列**: 自建 vs 原生支持         |
| **消息时序**   | **Topic TTL**      | **消息 TTL，延迟消息** | **消息/队列 TTL**   | **时序控制**: 功能丰富度             |
| **消息留存**   | **根据保留时间、大小的配置项批量清除(覆盖)**   | **删除**       | **删除/转发死信**   | **删除策略**: 覆盖 vs 删除 vs 转发     |
| **重复消费**   | **手动 Commit/幂等** | **手动 Commit/幂等** | **手动 Ack/幂等** | **保证方式**: 消费者手动commit+消费端幂等    |
| **消息可靠性** | **生产者消息ACK+副本**  | **生产者消息ACK+Broker 备份** | **生产者消息ACK+持久化+镜像** | **可靠性保障**: 生产者ACK+持久化+失败重试+生产端id幂等(redis的set保证id幂等，或者mysql的主键保证)              |


### 架构核心
*   **Topic**: 主题，消息分类。(一个topic多个partition，分布在broker)
*   **Broker**: 服务器节点，存储 Partition，提供消息服务。
*   **Partition**: Topic 物理分片，并行处理单元，实现负载均衡提升消费能力。(一个partition只能给不同消费者组的其中一个消费者订阅)
*   **Leader/Follower**:  分区的不同副本，主从副本，保证数据高可用。
*   **Consumer Group**: 消费者组，组内消费者共享 Topic 消息。
*   **分布式事务**:  跨 Partition 原子性写入。
*   **批量/流处理**:  批量收发，内建流处理能力 (Kafka Streams)。
*   **Rebalance**: 分区/消费者变化触发重平衡rebalance，影响消费性能。(topic所有消费者实例都会停止工作，等待Rebalance过程完成)

> 分区策略：首分区首副本随机 Broker。后续分区首副本轮询 Broker list。分区的其他副本按照举例首副本的 `nextReplicaShift` 来决定Broker位置。

> **Coordinator 作用**:  **Consumer Group 管理和 Rebalance 协调中心**。  每个 Consumer Group 选举一个 Coordinator 负责该 Group 的 Rebalance 和 Offset 管理。 Coordinator 通常在 Kafka Broker 集群中选举产生。协调哪个 comsumer 消费哪个 partition

**关键概念：**
*   **AR**:  所有副本集合 (Assigned Replicas) - 全部副本。
*   **ISR**:  同步副本集合 (In-Sync Replicas) - 可选 Leader 集合，表示和leader同步的或者落后不是很多。数据存在于全部ISR才具有数据可见性。
*   **LSO**:  最新稳定位移 (Last Stable Offset) - 事务提交消息末端位移。(指的是 已提交事务 的 最后一条消息 的位移 (Offset))
*   **LEO**:  日志末端位移 (Log End Offset) -  下一条待写入消息位移。(标志着 Partition 副本当前 数据的末端位置)
*   **HW**:  高水位线 (High Watermark) - 已提交消息最大位移。(HW 的值 取决于 ISR 中所有副本的 LEO 的 最小值。 换句话说，只有当消息被 所有 ISR 副本 都成功写入后， HW 才会 向前推进。)Consumer 只能消费 HW 之前的消息，保证数据一致性。


### 消息投递语义
*   **最多一次 (At-Most Once)**:  *快，但可能丢消息* (类似 UDP)。

> Producer 发送消息后不等待 Broker 确认， Consumer 自动提交 Offset。

*   **最少一次 (At-Least Once)**:  *可靠，但可能重复* (超时重试 + ACK)。

> Producer 等待 Broker 确认 (acks=all)， Consumer 先处理消息，后手动提交 Offset。

*   **恰好一次 (Exactly Once)**:  *最可靠，且不重复* (事务 + 幂等，性能略低)。

> Kafka 通过 **幂等 Producer** 和 **事务 Consumer



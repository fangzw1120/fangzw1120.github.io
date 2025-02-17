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



## Kafka 技术精髓：高性能消息队列速览
Apache Kafka - 高性能分布式流处理平台，核心组件：消息队列
部署的时候一定要依赖zookeeper或者raft

### Kafka 核心优势速查

*   **顺序写磁盘**:  高效 I/O，机械硬盘亦可高吞吐。
*   **内存映射磁盘**:  Page Cache 内存读写，接近内存速度。
*   **零拷贝**:  `sendfile` 减少数据拷贝，提升网络传输效率。
*   **消息拉取**:  消费者主动拉取，灵活控制消费速率，利于批量处理。

### Kafka 消息特性极简对比

| 特性         | Kafka             | RocketMQ          | RabbitMQ            | **核心差异**                      |
| ------------ | ----------------- | ----------------- | ------------------- | --------------------------------- |
| **消息获取**   | **Pull (拉)**       | **Pull (拉)**       | **Push (推)**         | **消费模式**: 主动 vs 被动            |
| **消息路由**   | **Topic**         | **Topic**         | **多模式** (Topic, 点对点、确定路由、正则路由匹配) | **路由灵活度**: 简单 Topic vs 多种模式 |
| **消息顺序**   | **Partition 有序** | **Queue 有序**    | **Queue 有序**      | **顺序范围**: 分区/队列内有序         |
| **消息堆积**   | **扩 Partition**    | **扩 Queue**       | **扩 Queue**        | **应对策略**: 扩容+限速+增消费者        |
| **消息优先级** | **不支持**          | **不支持**          | **支持**              | **功能差异**: 支持 vs 不支持           |
| **消息容错**   | **跳过+自建死信**  | **原生死信队列**   | **原生死信队列**     | **死信队列**: 自建 vs 原生支持         |
| **消息时序**   | **Topic TTL**      | **消息 TTL，延迟消息** | **消息/队列 TTL**   | **时序控制**: 功能丰富度             |
| **消息留存**   | **根据保留时间、大小的配置项批量清除(覆盖)**   | **删除**          | **删除/转发死信**   | **删除策略**: 覆盖 vs 删除 vs 转发     |
| **重复消费**   | **手动 Commit/幂等** | **手动 Commit/幂等** | **手动 Ack/幂等** | **保证方式**: 消费者手动确认+消费端幂等,生产端用序列id保证写入幂等(redis的set保证id幂等，或者mysql的主键保证)     |
| **消息可靠性** | **生产者消息ACK+副本**       | **生产者消息ACK+Broker 备份** | **生产者消息ACK+持久化+镜像** | **可靠性保障**: 生产者ACK+持久化+失败重试              |



### Kafka 架构核心速览

*   **Topic**: 主题，消息分类。(一个topic多个partition，分布在broker)
*   **Broker**: 服务器节点，存储 Partition，提供消息服务。
*   **Partition**: 分区，Topic 物理分片，并行处理单元。(一个partition只能给不同消费者组的其中一个消费者订阅；partition有leader和follower副本)
*   **Leader/Follower**:  主从副本，保证数据高可用。
*   **Consumer Group**: 消费者组，组内消费者共享 Topic 消息。
*   **分布式事务**:  跨 Partition 原子性写入。
*   **批量/流处理**:  批量收发，内建流处理能力 (Kafka Streams)。(kafka收发消息是批量操作，并不是单条处理；提供流处理能力)
*   **Rebalance**: 分区/消费者变化触发重平衡，影响消费性能。(pratition调整导致Rebalance：topic所有消费者实例都会停止工作，等待Rebalance过程完成)

**关键概念速记：**

*   **AR**:  所有副本集合 (Assigned Replicas) - 全部副本。
*   **ISR**:  同步副本集合 (In-Sync Replicas) - 可选 Leader 集合，表示和leader同步的或者落后不是很多。数据存在于全部ISR才具有数据可见性。
*   **LSO**:  最新稳定位移 (Last Stable Offset) - 事务提交消息末端位移。(指的是 已提交事务 的 最后一条消息 的位移 (Offset))
*   **LEO**:  日志末端位移 (Log End Offset) -  下一条待写入消息位移。(标志着 Partition 副本当前 数据的末端位置)
*   **HW**:  高水位线 (High Watermark) - 已提交消息最大位移。(HW 的值 取决于 ISR 中所有副本的 LEO 的 最小值。 换句话说，只有当消息被 所有 ISR 副本 都成功写入后， HW 才会 向前推进。)

### Kafka 消息投递语义速记

*   **最多一次 (At-Most Once)**:  *快，但可能丢消息* (类似 UDP)。
*   **最少一次 (At-Least Once)**:  *可靠，但可能重复* (超时重试 + ACK)。
*   **恰好一次 (Exactly Once)**:  *最可靠，且不重复* (事务 + 幂等，性能略低)。



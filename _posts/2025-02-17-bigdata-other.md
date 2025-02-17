---
layout: post
title: "foris's blog"
date: 2025-02-17
author: forisfang 
color: rgb(255,90,90)
tags: bigdata
subtitle: 'Big Data - other'
published: true
---


### Flume 技术速览 (极致精简版)
Apache Flume -  高可用分布式日志采集系统。 核心：**组件化管道，灵活定义数据流**。

**核心组件速查**:

| 组件     | 核心功能           | 关键特性                               | 常见类型                                   |
| -------- | ------------------ | -------------------------------------- | ------------------------------------------ |
| **Source** | **数据 *入口***   | 接收外部数据，传递给 Channel              | Avro, Kafka, SpoolDir, Exec, NetCat, HTTP 等 |
| **Channel**| **数据 *通道***   | Source/Sink 间 *缓冲*，*可靠传输*          | Memory, File, JDBC, Kafka 等                |
| **Sink**   | **数据 *出口***   | 从 Channel 读取，写入目的地/转发，移除 Channel 数据 | HDFS, Hive, HBase, Kafka, ES, Avro, Logger 等|

**数据流转极简流程**:  数据源 -> **Source** -> **Channel (缓冲)** -> **Sink** -> 目的地/下一级 Source。

**核心拓扑速记**:

*   **管道 (Pipeline)**:  串联 (1 -> 1) - 顺序处理。
![25_02_17_Flume_pipe](../../../assets/202502/25_02_17_Flume_pipe.png)
*   **扇入 (Fan-in)**:  汇聚 (多 -> 1) - 多源合一。
![25_02_17_Flume_multi2one](../../../assets/202502/25_02_17_Flume_multi2one.png)
*   **扇出 (Fan-out)**:  复制 (1 -> 多) - 一源多用。
![25_02_17_Flume_one2multi](../../../assets/202502/25_02_17_Flume_one2multi.png)
*   **灵活组合**:  构建复杂数据流。


**组件类型速记**:  Source (入口), Channel (通道/缓冲), Sink (出口)。





### Sqoop 技术速览

Apache Sqoop -  **结构化数据迁移工具**。 核心：**RDBMS (关系型数据库) <-> Hadoop  高效批量数据传输**。

**核心功能**:  **RDBMS  与 Hadoop  生态系统 (HDFS, Hive, HBase) 之间 *批量数据导入导出***。

**核心命令**:

*   **`sqoop import`**:  **RDBMS  -> Hadoop** (导入)。  将 RDBMS  表数据 **批量读取** 并 **写入 Hadoop  存储系统** (HDFS, Hive, HBase)。
*   **`sqoop export`**:  **Hadoop -> RDBMS** (导出)。 将 Hadoop  数据 **批量读取** 并 **写入 RDBMS  表**。

**核心组件**:

*   **Connector**:  **数据库连接器**，用于连接各种 RDBMS  (MySQL, Oracle, SQL Server, PostgreSQL 等)。  Sqoop  基于 Connector  实现与不同数据库的交互。
*   **Import/Export 模块**:  **数据导入/导出模块**，负责数据读取、转换和写入。

**核心应用场景**:

*   **数据仓库 (Data Warehousing)**:  **RDBMS  数据抽取到 Hadoop  进行数据仓库建模和分析**。
*   **ETL (Extract, Transform, Load)**:  **ETL  流程中的数据抽取和加载环节**。  将 RDBMS  数据抽取到 Hadoop  进行清洗转换，再加载回 RDBMS  或 Hadoop  数仓。

**核心特点**:  **批量传输，结构化数据，RDBMS <-> Hadoop  桥梁， ETL  关键工具**。





### Azkaban 技术速览

Azkaban -  **工作流调度和管理系统**。 核心：**定义、调度、监控 Hadoop  批处理工作流 (Workflow)**。

**核心概念**:

*   **Workflow (工作流)**:  **由多个 Job  组成的 *有向无环图 (DAG)***。  描述任务之间的依赖关系和执行顺序。
*   **Job (作业)**:  **工作流中的 *最小执行单元***。  代表一个独立的任务 (例如  MapReduce,  Spark,  Hive  SQL,  Shell 脚本等)。
*   **Flow (流)**:  **Azkaban  对 Workflow  的一种抽象表示**。  Workflow  定义文件通常以  `.flow`  为扩展名。

**核心组件**:

*   **Azkaban Web Server**:  **Web  服务器**，提供 **Web  界面**，用于 **Workflow  的上传、管理、调度、监控和执行**。
*   **Azkaban Exec Server**:  **执行服务器**，负责 **接收 Web Server  提交的 Workflow，  *调度和执行 Job***。
*   **Database (数据库)**:  **存储 Workflow  定义、Job  执行状态、调度信息、用户权限等 *元数据信息***。

**Workflow 定义**:  **Properties  文件** 定义 Workflow  和 Job，描述 Job  依赖关系、执行命令、配置参数等。

**核心应用场景**:

*   **ETL  pipelines (ETL  管道)**:  **构建复杂  ETL  数据处理管道**。  例如， 数据清洗、数据转换、数据加载等  Job  组成  ETL  Workflow。
*   **Batch processing workflows (批处理工作流)**:  **调度和管理 Hadoop  批处理作业**。  例如，  数据分析、报表生成、离线模型训练等  Workflow。

**核心特点**:  **Workflow  定义， 任务依赖管理， 定时调度， Web  监控，  Hadoop  生态系统集成， ETL  利器**。


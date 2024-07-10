---
title: Kafka 基础高可用版本基础安装使用
date: 2024-07-10 21:39:22
tags:
   - zookeeper
categories:
   - 中间件
cover: "https://img0.baidu.com/it/u=1804100733,3764159126&fm=253&fmt=auto&app=120&f=JPEG?w=894&h=500"
---

# Kafka 基础高可用版本基础安装使用

## 说明

　　当前文档为高可用版本`Kafka`安装，需要三台主机，各个节点同时作为管理节点`Zookeeper`及`Kafka`节点。

　　操作系统基于`CentOS 7`，`Kafka`版本为 `kafka_2.13-2.7.2`。

​		zookeeper集群的每个节点zoo.cfg文件都是相同的，每个节点的环境变量也是相同的，所以下列操作在三台主机上都要进行。kafka及zookeeper都使用普通用户部署，本次使用的用户为kafka

​		资源划分如下：

| 序号 |  主机名  |   机器IP   |
| :--: | :------: | :--------: |
|  1   | open0004 | 10.0.0.208 |
|  2   | open0005 | 10.0.0.222 |
|  3   | open0006 | 10.0.0.232 |

## 部署

　　部署过程分为`Zookeeper`管理集群部署及`Kafka`节点部署两部分，其中发`Zookeeper`管理集群部署可以参考《`Zookeeper`基础使用》，其版本为`2.4.13`。

### Zookeeper 部署

　　参考文档即可，需要注意在`1.0.0`之后的`Kafka`版本开始，`Kafka`的客户端节点不在需要与`Zookeeper`节点进行直接交互了，即`Kafka`的客户端节点不需要访问`Zookeeper`。

### Kafka 进程安装

1. 获取安装包`kafka_2.13-2.7.2.tgz`，进行解压即可，假设解压至`/home/kafka`：  
//要改版本

   ```shell
   /home/kafkatar -xzvf kafka_2.13-2.7.2.tgz -C /home/kafka
   ```

   - `2.13`：为`Scala`版本，如果并未使用其语言进行互操作，选定此版本即可
   - `2.7.2`：为`Kafka`版本

2. 调整配置文件内容如下，三个节点的配置文件不完全相同，请仔细查看修改（`/home/kafka/config/server.properties`）：

   ```properties
   # Licensed to the Apache Software Foundation (ASF) under one or more
   # contributor license agreements.  See the NOTICE file distributed with
   # this work for additional information regarding copyright ownership.
   # The ASF licenses this file to You under the Apache License, Version 2.0
   # (the "License"); you may not use this file except in compliance with
   # the License.  You may obtain a copy of the License at
   #
   #    http://www.apache.org/licenses/LICENSE-2.0
   #
   # Unless required by applicable law or agreed to in writing, software
   # distributed under the License is distributed on an "AS IS" BASIS,
   # WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   # See the License for the specific language governing permissions and
   # limitations under the License.
   
   # see kafka.server.KafkaConfig for additional details and defaults
   
   ############################# Server Basics #############################
   
   # The id of the broker. This must be set to a unique integer for each broker.
   broker.id=0
   
   ############################# Socket Server Settings #############################
   
   # The address the socket server listens on. It will get the value returned from 
   # java.net.InetAddress.getCanonicalHostName() if not configured.
   #   FORMAT:
   #     listeners = listener_name://host_name:port
   #   EXAMPLE:
   #     listeners = PLAINTEXT://your.host.name:9092
   listeners=PLAINTEXT://10.0.0.208:9092
   listeners=PLAINTEXT://134.32.51.143:9092
   
   # Hostname and port the broker will advertise to producers and consumers. If not set, 
   # it uses the value for "listeners" if configured.  Otherwise, it will use the value
   # returned from java.net.InetAddress.getCanonicalHostName().
   #advertised.listeners=PLAINTEXT://10.0.0.208:9092
   
   # Maps listener names to security protocols, the default is for them to be the same. See the config documentation for more details
   #listener.security.protocol.map=PLAINTEXT:PLAINTEXT,SSL:SSL,SASL_PLAINTEXT:SASL_PLAINTEXT,SASL_SSL:SASL_SSL
   
   # The number of threads that the server uses for receiving requests from the network and sending responses to the network
   num.network.threads=3
   
   # The number of threads that the server uses for processing requests, which may include disk I/O
   num.io.threads=8
   
   # The send buffer (SO_SNDBUF) used by the socket server
   socket.send.buffer.bytes=102400
   
   # The receive buffer (SO_RCVBUF) used by the socket server
   socket.receive.buffer.bytes=102400
   
   # The maximum size of a request that the socket server will accept (protection against OOM)
   socket.request.max.bytes=104857600
   
   
   ############################# Log Basics #############################
   
   # A comma separated list of directories under which to store log files
   log.dirs=/home/kafka/kafka-logs
   
   # The default number of log partitions per topic. More partitions allow greater
   # parallelism for consumption, but this will also result in more files across
   # the brokers.
   num.partitions=1
   
   # The number of threads per data directory to be used for log recovery at startup and flushing at shutdown.
   # This value is recommended to be increased for installations with data dirs located in RAID array.
   num.recovery.threads.per.data.dir=1
   
   ############################# Internal Topic Settings  #############################
   # The replication factor for the group metadata internal topics "__consumer_offsets" and "__transaction_state"
   # For anything other than development testing, a value greater than 1 is recommended to ensure availability such as 3.
   offsets.topic.replication.factor=3
   transaction.state.log.replication.factor=3
   #如果数据比较重要建议设置如下两个参数
   #transaction.state.log.min.isr=2
   default.replication.factor=3
   
   ############################# Log Flush Policy #############################
   
   # Messages are immediately written to the filesystem but by default we only fsync() to sync
   # the OS cache lazily. The following configurations control the flush of data to disk.
   # There are a few important trade-offs here:
   #    1. Durability: Unflushed data may be lost if you are not using replication.
   #    2. Latency: Very large flush intervals may lead to latency spikes when the flush does occur as there will be a lot of data to flush.
   #    3. Throughput: The flush is generally the most expensive operation, and a small flush interval may lead to excessive seeks.
   # The settings below allow one to configure the flush policy to flush data after a period of time or
   # every N messages (or both). This can be done globally and overridden on a per-topic basis.
   
   # The number of messages to accept before forcing a flush of data to disk
   #log.flush.interval.messages=10000
   
   # The maximum amount of time a message can sit in a log before we force a flush
   #log.flush.interval.ms=1000
   
   ############################# Log Retention Policy #############################
   
   # The following configurations control the disposal of log segments. The policy can
   # be set to delete segments after a period of time, or after a given size has accumulated.
   # A segment will be deleted whenever *either* of these criteria are met. Deletion always happens
   # from the end of the log.
   
   # The minimum age of a log file to be eligible for deletion due to age
   log.retention.hours=168
   
   # A size-based retention policy for logs. Segments are pruned from the log unless the remaining
   # segments drop below log.retention.bytes. Functions independently of log.retention.hours.
   #log.retention.bytes=1073741824
   
   # The maximum size of a log segment file. When this size is reached a new log segment will be created.
   log.segment.bytes=1073741824
   
   # The interval at which log segments are checked to see if they can be deleted according
   # to the retention policies
   log.retention.check.interval.ms=300000
   
   ############################# Zookeeper #############################
   
   # Zookeeper connection string (see zookeeper docs for details).
   # This is a comma separated host:port pairs, each corresponding to a zk
   # server. e.g. "127.0.0.1:3000,127.0.0.1:3001,127.0.0.1:3002".
   # You can also append an optional chroot string to the urls to specify the
   # root directory for all kafka znodes.
   zookeeper.connect=10.0.0.208:2181,10.0.0.222:2181,10.0.0.232:2181
   
   # Timeout in ms for connecting to zookeeper
   zookeeper.connection.timeout.ms=18000
   
   
   ############################# Group Coordinator Settings #############################
   
   # The following configuration specifies the time, in milliseconds, that the GroupCoordinator will delay the initial consumer rebalance.
   # The rebalance will be further delayed by the value of group.initial.rebalance.delay.ms as new members join the group, up to a maximum of max.poll.interval.ms.
   # The default value for this is 3 seconds.
   # We override this to 0 here as it makes for a better out-of-the-box experience for development and testing.
   # However, in production environments the default value of 3 seconds is more suitable as this will help to avoid unnecessary, and potentially expensive, rebalances during application startup.
   group.initial.rebalance.delay.ms=0
   ```

   - 注意：此配置仅调整了最基础配置，此处只做简要说明
   - `broker.id=2`：`id`集群内全局唯一，三个节点可分别设置为`0、1、2`，三个节点一定不能相同 
   - `listeners`：监听的端口及本机地址
   - `log.dirs=/home/kafka/kafka-logs`：`log.dirs`为`Kafka`的数据目录，务必注意进行调整，要先创建/home/kafka/kafka-logs目录
   - `zookeeper.connect`：`Zookeeper`管理集群地址，即全部`Zookeeper`进程的地址，此处我们使用10.0.0.208:2181,10.0.0.222:2181,10.0.0.232:2181

3. 配置文件修改完毕后，各个节点使用如下命令启动即可：

   ```shell
   # 进到命令目录
   cd /home/kafka/bin     
   # 各节点均执行命令如下，同时指定了需要使用的配置文件
   ./kafka-server-start.sh -daemon ../config/server.properties
   
   # 此命令可以将进程停止
   ./kafka-server-stop.sh
   ```

## 基础使用

　　以下是简单基础命令使用，围绕基础`Topic`使用展开。

1. 创建`topic`：

   ```shell
   [kafka@localhost bin]$ ./kafka-topics.sh --create --bootstrap-server 10.0.0.208:9092,10.0.0.222:9092,10.0.0.232:9092 --replication-factor 1 --partitions 1 --topic test
   ```

   - `kafka-topics.sh`：操作及使用`topic`的客户端命令
   - `bootstrap-server`：指定全部`Kafka`节点
   - `replication-factor`：指定创建的`topic`副本数
   - `partitions`：指定创建的`topic`分区数

2. 查看`topic`：

   ```shell
   [kafka@localhost bin]$ ./kafka-topics.sh --list --bootstrap-server 10.0.0.208:9092,10.0.0.222:9092,10.0.0.232:9092
   test
   ```

   - `test`：即上一条命令创建的`topic`名称

3. 发送消息，客户端作为生产者向`Kafka`集群发送消息，发送至之前创建的`test`主题中：

   ```shell
   [kafka@localhost bin]$ ./kafka-console-producer.sh --broker-list 10.0.0.208:9092,10.0.0.222:9092,10.0.0.232:9092 --topic test
   >kafka
   >nihao
   >are you ok?
   >
   ```

   

4. 消费者消费消息：

   ```shell
   [kafka@localhost bin]$ ./kafka-console-consumer.sh --bootstrap-server 10.0.0.208:9092,10.0.0.222:9092,10.0.0.232:9092 --topic test --from-beginning
   kafka
   nihao
   are you ok?
   
   ```

   - `from-beginningkafka`：即当前消费者连接成功后从最初消息开始消费
   - 获取到的消息与生产者发送的消息一致

5. 此时通过生产者客户端继续发送消息，消费者客户端可以立即读取到

6. `topic`删除：

   ```shell
   [kafka@localhost bin]$ ./kafka-topics.sh --delete --bootstrap-server 10.0.0.208:9092,10.0.0.222:9092,10.0.0.232:9092 --topic test
   
   # 此处可以看到，之前创建的 test 主题以及被删除了
   [nanquanyuhao@localhost bin]$ ./kafka-topics.sh --list --bootstrap-server 10.0.0.208:9092,10.0.0.222:9092,10.0.0.232:9092
   __consumer_offsets
   ```

7. 查看活动的消费者组

   ```
   [kafka@localhost bin]$ ./kafka-consumer-groups.sh  --bootstrap-server 10.0.0.208:9092,10.0.0.222:9092,10.0.0.232:9092 --list
   console-consumer-73977
   console-consumer-16609
   ```
   
   
   
7. 查看某消费者组消费的各`topic`的延迟情况：

   ```sh
   [kafka@localhost bin]$ ./kafka-consumer-groups.sh --bootstrap-server 10.0.0.208:9092,10.0.0.222:9092,10.0.0.232:9092 --describe --group  test_agroup
   Consumer group 'test_agroup' has no active members.
   
   TOPIC                                         PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG             CONSUMER-ID     HOST            CLIENT-ID
   aliCloud_describeInstanceMonitorData_original 0          12              12              0               -               -               -
   ```


## 压力测试

　　由于组内平时负责各种基础中间件运维，针对`Kafka`使用后的内存占用情况并不十分清晰，使用自带压测工具做个简单压测，简单观察内存使用情况，只在一个节点做即可。

### 生产端压测

```shell
[kafka@localhost bin]$ ./kafka-producer-perf-test.sh --topic test --record-size 200 --num-records 100000 --throughput 1000 --producer-props bootstrap.servers=10.0.0.208:9092,10.0.0.222:9092,10.0.0.232:9092
4984 records sent, 996.0 records/sec (0.09 MB/sec), 7.3 ms avg latency, 354.0 ms max latency.
5022 records sent, 1004.0 records/sec (0.10 MB/sec), 5.2 ms avg latency, 22.0 ms max latency.
5000 records sent, 1000.0 records/sec (0.10 MB/sec), 1.3 ms avg latency, 13.0 ms max latency.
5002 records sent, 1000.2 records/sec (0.10 MB/sec), 2.8 ms avg latency, 22.0 ms max latency.
5000 records sent, 1000.0 records/sec (0.10 MB/sec), 1.1 ms avg latency, 13.0 ms max latency.
5001 records sent, 1000.2 records/sec (0.10 MB/sec), 0.8 ms avg latency, 14.0 ms max latency.
5002 records sent, 1000.0 records/sec (0.10 MB/sec), 0.8 ms avg latency, 13.0 ms max latency.
5001 records sent, 1000.2 records/sec (0.10 MB/sec), 0.9 ms avg latency, 13.0 ms max latency.
5001 records sent, 1000.0 records/sec (0.10 MB/sec), 0.9 ms avg latency, 13.0 ms max latency.
5002 records sent, 1000.4 records/sec (0.10 MB/sec), 0.9 ms avg latency, 13.0 ms max latency.
5000 records sent, 999.8 records/sec (0.10 MB/sec), 0.8 ms avg latency, 11.0 ms max latency.
5003 records sent, 1000.2 records/sec (0.10 MB/sec), 0.8 ms avg latency, 18.0 ms max latency.
5000 records sent, 1000.0 records/sec (0.10 MB/sec), 1.2 ms avg latency, 36.0 ms max latency.
5002 records sent, 1000.0 records/sec (0.10 MB/sec), 1.0 ms avg latency, 14.0 ms max latency.
5001 records sent, 1000.0 records/sec (0.10 MB/sec), 2.7 ms avg latency, 125.0 ms max latency.
5001 records sent, 1000.2 records/sec (0.10 MB/sec), 0.9 ms avg latency, 21.0 ms max latency.
4995 records sent, 997.2 records/sec (0.10 MB/sec), 0.9 ms avg latency, 12.0 ms max latency.
5002 records sent, 1000.2 records/sec (0.10 MB/sec), 1.2 ms avg latency, 4.0 ms max latency.
5009 records sent, 1000.0 records/sec (0.10 MB/sec), 1.2 ms avg latency, 5.0 ms max latency.
100000 records sent, 999.670109 records/sec (0.10 MB/sec), 1.69 ms avg latency, 354.00 ms max latency, 1 ms 50th, 7 ms 95th, 12 ms 99th, 85 ms 99.9th.
```

- `--record-size 200`：每一条消息的大小为`100`字节
- `--num-records 100000`：压测写入消息的总数量为`100000`
- `--throughput 1000`：写入消息的最大吞吐速率限制为`1000`条每秒

　　据压测结果看，其不会超过限制的最大速率保持为`999.670109 records/sec`，并罗列了延迟时间等相关指标

### 消费端压测

```shell
[kafka@localhost bin]$ ./kafka-consumer-perf-test.sh --broker-list 10.0.0.208:9092,10.0.0.222:9092,10.0.0.232:9092 --topic test --fetch-size 10000 --messages 1000000 --threads 10 


start.time, end.time, data.consumed.in.MB, MB.sec, data.consumed.in.nMsg, nMsg.sec, rebalance.time.ms, fetch.time.ms, fetch.MB.sec, fetch.nMsg.sec
WARNING: Exiting before consuming the expected number of messages: timeout (10000 ms) exceeded. You can use the --timeout option to increase the timeout.
2021-12-30 18:35:16:244, 2021-12-30 18:35:38:681, 28.6102, 1.2751, 300000, 13370.7715, 22, 22415, 1.2764, 13383.8947


WARNING: option [threads] and [num-fetch-threads] have been deprecated and will be ignored by the test
--threads 10 可以不带
```

- `--fetch-size 10000`：指定每次`fetch`的数据的大小为`10000`字节
- `--messages 1000000`：总共要消费的消息个数为`1000000`个
- `--threads 10`： 消费进程数量，默认就是`10`

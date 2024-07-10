---
title: Zookeeper 基础使用
date: 2024-07-10 21:39:22
tags:
   - zookeeper
categories:
   - 中间件
cover: "https://pic2.zhimg.com/v2-06cdb42cc0c548b2c6bf3466b6b3e908_1440w.jpg?source=172ae18b"
---
# Zookeeper 基础使用
## 安装

**zookeeper集群的每个节点zoo.cfg文件都是相同的，每个节点的环境变量也是相同的，所以下列操作在三台主机上都要进行。kafka及zookeeper都使用普通用户部署，本次使用的用户为kafka**

​		资源划分如下：

| 序号 |  主机名  |   机器IP   |
| :--: | :------: | :--------: |
|  1   | open0004 | 10.0.0.208 |
|  2   | open0005 | 10.0.0.222 |
|  3   | open0006 | 10.0.0.232 |

### 下载并上传
1. 下载最新压缩包`zookeeper-3.4.13.tar.gz`，其代码仓库地址：[https://github.com/apache/zookeeper](https://github.com/apache/zookeeper)

2. 使用非`root`用户即可安装，上传至用户预安装的目录下进行解压，三个节点进行相同的操作：

   ```shell
   tar -xzvf zookeeper-3.4.13.tar.gz
   ```
### 启动前配置
#### jdk 环境准备
　　启动前需要修改环境变量，步骤如下：
1. 此前应先准备好`jdk`，此处简单说明，使用`jdk-8u144-linux-x64.tar.gz`，传至对应目录解压：

   ```shell
   tar -xzvf jdk-8u144-linux-x64.tar.gz
   ```
2. 配置属主用户的`.bash_profile`文件，该文件属于隐藏文件，业务用户在家目录ls -a 可看到该文件，修改结果如下：  

   ```shell
   export PATH=/home/kafka/jdk1.8.0_144/bin:$PATH:$HOME/.local/bin:$HOME/bin
   ```

   - `/home/kafka/jdk1.8.0_144/bin:`：新增内容，首先寻找此目录下的命令，即有限使用此`jdk`环境

　　至此，`jdk`配置完毕，重新登录当前用户使用`java -version`可正常使用命令并查看对应版本。

#### zookeeper 准备
1. 修改`.bash_profile`文件，配置文件里增加这几条，修改环境变量结果如下：

   ```shell
   ZOOKEEPER_HOME=/home/kafka/zookeeper/zookeeper-3.4.13 
   PATH=/home/kafka/jdk1.8.0_144/bin:$PATH:$ZOOKEEPER_HOME/bin:$HOME/.local/bin:$HOME/bin
   ```
2. 进入`/home/kafka/zookeeper/zookeeper-3.4.13/conf`目录，复制出对应的配置文件：  

   ```shell
   cd /home/kafka/zookeeper/conf
   cp zoo_sample.cfg zoo.cfg 
   [techgroup@localhost bin]$ echo "0"> /data/soft/kafka/zookeeper_data/myid
   ```
3. 修改配置文件的数据目录位置，并添加节点配置，最终文件修改项如下：`（/home/kafka/zookeeper/conf/zoo.cfg）`

   ```shell
   # The number of milliseconds of each tick
   tickTime=2000
   # The number of ticks that the initial
   # synchronization phase can take
   initLimit=10
   # The number of milliseconds of each tick
   tickTime=2000
   # The number of ticks that the initial
   # synchronization phase can take
   initLimit=10
   # The number of ticks that can pass between
   # sending a request and getting an acknowledgement
   syncLimit=5
   # the directory where the snapshot is stored.
   # do not use /tmp for storage, /tmp here is just
   # example sakes.
   dataDir=/home/kafka/zookeeper/data
   # the port at which the clients will connect
   clientPort=2181
   # the maximum number of client connections.
   # increase this if you need to handle more clients
   #maxClientCnxns=60
   #
   # Be sure to read the maintenance section of the
   # administrator guide before turning on autopurge.
   #
   # http://zookeeper.apache.org/doc/current/zookeeperAdmin.html#sc_maintenance
   #
   # The number of snapshots to retain in dataDir
   #autopurge.snapRetainCount=3
   # Purge task interval in hours
   # Set to "0" to disable auto purge feature
   #autopurge.purgeInterval=1
   
   server.0=192.168.235.105:2888:3888
   server.1=192.168.235.113:2888:3888
   server.2=192.168.235.114:2888:3888
   ```
   
   - `dataDir`：存储内存中数据库快照的位置，顾名思义就是`Zookeeper`保存数据的目录，默认情况下，`Zookeeper`将写数据的日志文件也保存在这个目录里。
   - `tickTime`：基本事件单元，以毫秒为单位。这个时间是作为`Zookeeper`服务器之间或客户端与服务器之间维持心跳的时间间隔，也就是每隔`tickTime`时间就会发送一个心跳。
   - `clientPort`：这个端口就是客户端连接`Zookeeper`服务器的端口，`Zookeeper`会监听这个端口，接受客户端的访问请求。
   - `initLimit`：这个配置项是用来配置`Zookeeper`接受客户端初始化连接时最长能忍受多少个心跳时间间隔数，当已经超过`10`个心跳的时间（也就是`tickTime`）长度后`Zookeeper`服务器还没有收到客户端的返回信息，那么表明这个客户端连接失败。总的时间长度就是`10*2000=20`秒。
   - `syncLimit`：这个配置项标识`Leader`与`Follower`之间发送消息，请求和应答时间长度，最长不能超过多少个`tickTime`的时间长度，总的时间长度就是`5*2000=10秒`
   - `server.A = B:C:D`：`A`表示这个是第几号服务器；`B`是这个服务器的`ip`地址；`C`表示的是这个服务器与集群中的`Leader`服务器交换信息的端口；`D`表示的是万一集群中的`Leader`服务器挂了，需要一个端口来重新进行选举，选出一个新的`Leader`。
4. 上述配置，在三个节点均需要做处理
5. 三个节点均在数据目录`/home/kafka/zookeeper/data`下，创建文件`myid`，内容为对应`ID`，即`0、1、2`。  


## 应用启动
　　由于环境变量已经配置完毕，可以直接在任意目录执行`zkServer.sh start`启动，并可以使用`zkServer.sh status`查看状态，效果如下：
```bash
[kafka@open0005 ~]# zkServer.sh start
ZooKeeper JMX enabled by default
Using config: /home/kafka/zookeeper/zookeeper-3.4.13/bin/../conf/zoo.cfg
Starting zookeeper ... STARTED
[kafka@open0005 ~]# zkServer.sh status
ZooKeeper JMX enabled by default
Using config: /home/kafka/zookeeper/bin/../conf/zoo.cfg
Mode: follower
```

## 客户端使用
1. 任一节点下使用`zkCli.sh`命令即可进入控制台。//退出quit
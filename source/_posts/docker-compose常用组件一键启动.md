---
title: docker_compose 常用组件一键启动
date: 2024-07-09 17:25:22
tags: 
  - docker
  - docker-compose
categories:
  - 容器化
  - 中间件
cover: "https://img2.baidu.com/it/u=1963750401,612729339&fm=253&fmt=auto&app=138&f=JPEG?w=800&h=384"
---
Docker-compose的启动命令：

```
docker-compose -f platform.yml up -d &
```

其中 `platform.yml`的内容为：

> 此为kafka独立部署，不依赖于 zookeeper 的方式。

```yaml
version: '3.8'
services:
  mysql5:
    image: mysql:5.7.44
    platform: linux/amd64
    ports:
      - "3306:3306"
      - "33060:33060"
    environment:
      - MYSQL_ROOT_PASSWORD=123456
    volumes:
      - /Users/lanyu/dockerVolumes/mysql/mysql5/data:/var/lib/mysql
      - /Users/lanyu/dockerVolumes/mysql/mysql5/conf:/etc/mysql/conf.d
    networks:
      - dolphinscheduler
  mysql8:
    image: mysql:8.0.36
    ports:
      - "8306:3306"
      - "38060:33060"
    environment:
      - MYSQL_ROOT_PASSWORD=123456
    volumes:
      - /Users/lanyu/dockerVolumes/mysql/mysql8/data:/var/lib/mysql
      - /Users/lanyu/dockerVolumes/mysql/mysql8/conf:/etc/mysql/conf.d
    networks:
      - dolphinscheduler
  zookeeper:
    image: bitnami/zookeeper:3.9.2
    ports:
      - "2181:2181"
    environment:
      - ALLOW_ANONYMOUS_LOGIN=yes
    volumes:
      - /Users/lanyu/dockerVolumes/zookeeper/data:/bitnami/zookeeper
    networks:
      - dolphinscheduler
  kafka:
    image: bitnami/kafka:3.6.2
    ports:
      - "9092:9092"
    environment:
      - KAFKA_CFG_NODE_ID=0
      - KAFKA_CFG_PROCESS_ROLES=controller,broker
      - KAFKA_CFG_CONTROLLER_QUORUM_VOTERS=0@dmp-api:9093
      - KAFKA_CFG_LISTENERS=PLAINTEXT://:9092,CONTROLLER://:9093,EXTERNAL://:9094
      - KAFKA_CFG_ADVERTISED_LISTENERS=PLAINTEXT://kafka:9092,EXTERNAL://localhost:9094
      - KAFKA_CFG_LISTENER_SECURITY_PROTOCOL_MAP=CONTROLLER:PLAINTEXT,EXTERNAL:PLAINTEXT,PLAINTEXT:PLAINTEXT
      - KAFKA_CFG_CONTROLLER_LISTENER_NAMES=CONTROLLER
    volumes:
      - /Users/lanyu/dockerVolumes/kafka:/bitnami/kafka
    networks:
      - dolphinscheduler
  redis:
    image: bitnami/redis:7.2.4
    ports:
      - "6379:6379"
    environment:
      - REDIS_PASSWORD=password123
    volumes:
      - /Users/lanyu/dockerVolumes/redis:/bitnami/redis/data
networks:
  dolphinscheduler:
    driver: bridge
```

> 下面是 kafka 依赖于 zookeeper 的方式启动

```yaml
version: '3.8'
services:
  mysql5:
    image: mysql:5.7.44
    platform: linux/amd64
    ports:
      - "3306:3306"
      - "33060:33060"
    environment:
      - MYSQL_ROOT_PASSWORD=123456
    volumes:
      - /Users/lanyu/dockerVolumes/mysql/mysql5/data:/var/lib/mysql
      - /Users/lanyu/dockerVolumes/mysql/mysql5/conf:/etc/mysql/conf.d
    networks:
      - dolphinscheduler
  mysql8:
    image: mysql:8.0.36
    ports:
      - "8306:3306"
      - "38060:33060"
    environment:
      - MYSQL_ROOT_PASSWORD=123456
    volumes:
      - /Users/lanyu/dockerVolumes/mysql/mysql8/data:/var/lib/mysql
      - /Users/lanyu/dockerVolumes/mysql/mysql8/conf:/etc/mysql/conf.d
    networks:
      - dolphinscheduler
  zookeeper:
    image: bitnami/zookeeper:3.9.2
    ports:
      - "2181:2181"
    environment:
      - ALLOW_ANONYMOUS_LOGIN=yes
    volumes:
      - /Users/lanyu/dockerVolumes/zookeeper/data:/bitnami/zookeeper
    networks:
      - dolphinscheduler
  kafka:
    image: bitnami/kafka:3.6.2
    ports:
      - "9092:9092"
    environment:
      - KAFKA_CFG_NODE_ID=0
      - KAFKA_CFG_LISTENERS=PLAINTEXT://:9092,CONTROLLER://:9093,EXTERNAL://:9094
      - KAFKA_CFG_ADVERTISED_LISTENERS=PLAINTEXT://127.0.0.1:9092,EXTERNAL://localhost:9094
      - KAFKA_CFG_LISTENER_SECURITY_PROTOCOL_MAP=CONTROLLER:PLAINTEXT,EXTERNAL:PLAINTEXT,PLAINTEXT:PLAINTEXT
      - KAFKA_CFG_ZOOKEEPER_CONNECT=zookeeper:2181
    depends_on:
      - zookeeper
    volumes:
      - /Users/lanyu/dockerVolumes/kafka:/bitnami/kafka
    networks:
      - dolphinscheduler
  redis:
    image: bitnami/redis:7.2.4
    ports:
      - "6379:6379"
    environment:
      - REDIS_PASSWORD=password123
    volumes:
      - /Users/lanyu/dockerVolumes/redis:/bitnami/redis/data
networks:
  dolphinscheduler:
    driver: bridge
```

增加一个 MINIO的docker启动，后续做到脚本中：

```shell
docker run --name minio -d\
    --publish 9000:9000 \
    --publish 9001:9001 \
    --env MINIO_ROOT_USER="admin" \
    --env MINIO_ROOT_PASSWORD="123456" \
    --volume /Users/lanyu/dockerVolumes/minio/data:/bitnami/minio/data \
    bitnami/minio:latest
```


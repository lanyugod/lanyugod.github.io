---
title: 使用 Docker Buildx 构建多架构镜像
published: 2026-11-11
description: 用 Docker Buildx 一次构建 amd64 与 arm64 两个架构的镜像：需要的基础条件、builder 与 QEMU 的配置、基础镜像的架构陷阱，以及 buildx 与 docker build 的区别。
image: ''
tags: ["AIGC", "Docker", "Linux"]
category: "Linux / Docker"
draft: false
lang: ''
author: 'AI 辅助生成'
comment: true
slug: shi-yong-dockerbuildx-gou-jian-duo-jia-gou-jing-xiang
---

# 使用 Docker Buildx 构建多架构镜像

:::note[本文为 AIGC 生成内容]
本文由 AI 根据 Docker 官方文档与公开资料整理生成，尚未在真实项目上完整验证，人工审校后发布。文中命令来自公开资料的常规写法，未做虚构，但请结合自己的项目与环境核对后再执行。
:::

## 1. 多架构镜像是什么

多架构镜像不是一个能到处跑的镜像，而是一个 **manifest list / OCI index**：同一个 tag 下面挂着 amd64、arm64 等多个按架构分的镜像，`docker pull` 的时候 Docker 自动选跟本机 CPU 匹配的那一个。

典型场景：一台 x86 的服务器和一台 ARM 的 NAS（或树莓派）要跑同一个镜像，不用分别为它们打两个 tag，一次构建就能覆盖。

## 2. 开启多架构构建的前置条件（缺一条都会翻车）

先给结论：多架构构建不是装好 Docker 就能用的，它要同时满足下面 4 条。建议按顺序逐条检查，全部通过再动手构建——第 3 节的 `--platform` 和 `--push` 只有在这些条件就绪的前提下才成立。

| # | 前置条件 | 一句话检查标准 |
| --- | --- | --- |
| 1 | Docker 版本 + buildx 插件 | `docker buildx version` 能输出版本号，Docker 建议 24.0+ |
| 2 | `docker-container` driver 的 builder | `docker buildx inspect` 里 Driver 是 `docker-container`，Platforms 同时有 `linux/amd64` 和 `linux/arm64` |
| 3 | QEMU + `binfmt_misc` 已注册 | `/proc/sys/fs/binfmt_misc/qemu-aarch64` 存在，跨架构的 `RUN` 不报 `exec format error` |
| 4 | 支持 manifest list 的 registry，且已登录 | `docker login` 成功，目标 registry 支持 manifest list，`--push` 不报 `denied` / `unauthorized` |

### 2.1 Docker 版本与 buildx 插件

buildx 从 Docker 19.03 开始随 Docker 附带，实际建议用 **24.0+**；Docker Desktop 自带 buildx，不用单独装。Engine 29+ / 新版 Desktop 默认用 containerd 镜像存储，对 manifest list 的支持更好。

检查命令：

```bash
docker --version
docker buildx version
```

能正常输出版本号即通过。**缺失时的表现：** `docker buildx` 报 `unknown command` 或 `buildx: not found`，说明 buildx 插件没装或 Docker 太旧——先升级 Docker / 安装 buildx 插件，不要继续往下走。

### 2.2 Builder 必须换成 `docker-container` driver

这是最容易被忽略的一条。默认的 `docker` driver 只支持本机架构，`--platform` 会被**静默忽略**：命令不报错，但打出来的只有一个本机架构的镜像。

检查当前 builder：

```bash
docker buildx ls
docker buildx inspect --bootstrap
```

看两处：Driver 必须是 `docker-container`，Platforms 里要同时看到 `linux/amd64` 和 `linux/arm64`。如果不是，新建一个专用 builder 并启用：

```bash
docker buildx create --name multiarch --driver docker-container --bootstrap --use
docker buildx inspect --bootstrap
```

**缺失时的表现：** 构建成功、推送也成功，但 `docker buildx imagetools inspect <镜像>` 只看到一个架构的 manifest；或者在另一架构的机器上拉取后报 `no matching manifest`。遇到这种情况先回头查 builder，不要怀疑 Dockerfile。

### 2.3 QEMU + 内核 `binfmt_misc`：跨架构模拟

在 amd64 机器上构建 arm64 镜像时，Dockerfile 里的 `RUN` 需要在 arm64 环境下执行，靠 QEMU 模拟 + 内核 `binfmt_misc` 注册来完成。Linux 上需要手动注册一次，Docker Desktop 一般已处理好。

检查是否已注册：

```bash
ls /proc/sys/fs/binfmt_misc/qemu-aarch64
```

文件存在即已注册；不存在则注册：

```bash
docker run --privileged --rm tonistiigi/binfmt --install all
```

注册后再用 `docker buildx inspect --bootstrap` 确认 Platforms 里仍有 `linux/arm64`。

**缺失时的表现：** 构建到某个 `RUN` 步骤时报 `exec format error`，或 `standard_init_linux.go: ... exec user process caused: exec format error`。这不是 Dockerfile 写错了，是模拟层没就绪。

### 2.4 Registry：支持 manifest list，并且已经登录

多架构产物是一个 manifest list，必须推到 registry 上，本地 daemon 存不下它。所以目标 registry 必须支持 manifest list，且构建前已经登录。Docker Hub、GHCR、ECR、Google Artifact Registry 等都支持。

检查命令：

```bash
docker login
# 以 Docker Hub 为例，登录成功会提示 Login Succeeded
```

**缺失时的表现：** `--push` 时报 `denied: requested access to the resource is denied` 或 `unauthorized: authentication required`，说明没登录或账号对这个仓库没有 push 权限；如果 registry 本身不支持 manifest list，推送会失败或只剩单架构。先确认登录状态和仓库权限，再确认 registry 的类型。

### 2.5 就绪检查清单：四条都通过再构建

把上面四条合成一次检查，全部通过才算“开启多架构构建”完成：

```bash
docker buildx version
docker run --privileged --rm tonistiigi/binfmt --install all
docker buildx create --name multiarch --driver docker-container --bootstrap --use
docker buildx inspect --bootstrap
docker login
```

`inspect` 输出的 Platforms 里同时看到 `linux/amd64` 和 `linux/arm64`，且 `docker login` 成功，就可以进入第 3 节正式构建了。

## 3. 怎么构建

```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t username/myapp:latest \
  --push .
```

关键点是 `--push`。多架构产物是 manifest list，不能直接存进本地 daemon，必须推到 registry；`--load` 只支持单架构。如果你写 `--platform linux/amd64,linux/arm64 --load`，老版本会报错，新版有的会静默只留本机架构，一定要用 `--push`。

验证：

```bash
docker buildx imagetools inspect username/myapp:latest
# 或者
docker manifest inspect username/myapp:latest
```

要能看到 amd64 和 arm64 两个 manifest 才算成功。

本地只想测一个架构时，可以单平台加 `--load`：

```bash
docker buildx build --platform linux/arm64 --load -t myapp:test .
```

## 4. 基础镜像的架构，最容易踩坑

- **优先用官方多架构基础镜像**。大部分官方镜像如 alpine、node、python、nginx、postgres 本身就是多架构的，`--platform=$TARGETPLATFORM` 能让 BuildKit 在构建时解析到正确变体。先用 `docker buildx imagetools inspect node:20-alpine` 确认它有没有你要的架构，别假设。
- **如果基础镜像只有单架构**，构建要么失败，要么打出来的镜像在目标机器上 `exec format error`，跑不起来。多阶段构建里每一个 `FROM` 都要检查，不只是最后一个。
- **Dockerfile 里不要写死架构**。BuildKit 会自动提供这些参数：`BUILDPLATFORM` 是构建机平台，`TARGETPLATFORM` / `TARGETOS` / `TARGETARCH` / `TARGETVARIANT` 是目标平台。不要在下载链接里写死 `amd64` / `x86_64`，要根据 `TARGETARCH` 拼，例如 `tool-linux-${TARGETARCH}`。
- **编译型语言要交叉编译，别全程用 QEMU 跑编译**，又慢又容易出奇怪问题。推荐写法是编译阶段固定在构建机平台，用 Go / Rust 等工具链交叉编译：

```dockerfile
# 编译阶段用本机平台跑，速度快
FROM --platform=$BUILDPLATFORM golang:1.22-alpine AS build
ARG TARGETOS TARGETARCH
WORKDIR /src
COPY . .
RUN GOOS=$TARGETOS GOARCH=$TARGETARCH go build -o server .

# 运行阶段不加 --platform，让它按目标平台拉基础镜像
FROM alpine:3.23
COPY --from=build /src/server /server
CMD ["/server"]
```

这个模式是标准做法：编译阶段 `--platform=$BUILDPLATFORM`，最终阶段不加 flag，就用目标平台的基础镜像。解释型语言如 Node / Python 不用交叉编译，只要基础镜像是多架构的，一般直接写 `FROM node:20-alpine` 就行。

- **QEMU 模拟比原生慢很多**，arm64 在 amd64 上构建常被说慢 3-5 倍，复杂构建甚至 10 倍。CI 里更稳的做法是每个架构用原生 runner 分别构建再合并，本地开发用 QEMU 够用就行。

## 5. `docker build` vs `docker buildx` 有什么不同

现在 `docker build` 本质上已经是 BuildKit 的入口，Docker 23.0 起 BuildKit 是默认构建引擎，`docker build` 现在是 `docker buildx build` 的别名。但 `docker buildx` 是超集，多出来的能力主要在这些地方：

| 能力 | `docker build` | `docker buildx build` |
| --- | --- | --- |
| 多平台 | 只构建本机架构 | `--platform linux/amd64,linux/arm64` 一次出多个架构 |
| Builder 管理 | 无 | `create / ls / inspect / use / rm / stop`，可选 `docker`、`docker-container`、`remote`、`cloud` 等 driver |
| 输出方式 | 基本是 `--load` 到本地，再 `docker push` 两步 | `--push`、`--load`、`--output type=registry / local / tar / oci`，多架构必须 `--push` |
| 缓存和高级功能 | 无 | `--cache-from / --cache-to`（registry、local、gha、inline）、`--secret`、`--ssh`、`--provenance`、`--sbom`、`--builder` |
| 批量构建 | 无 | `docker buildx bake`，用 HCL / JSON / compose 文件一次构建多个镜像并共享缓存 |
| 镜像工具 | 无 | `docker buildx imagetools inspect / create`，查看和手动组装 manifest list |

对照着记：

```bash
# 老写法，单架构，本地
docker build -t myapp:latest .

# buildx 单架构，效果类似，但能指定 builder 和缓存
docker buildx build -t myapp:latest --load .

# buildx 多架构，必须推 registry
docker buildx build --platform linux/amd64,linux/arm64 -t myapp:latest --push .
```

## 6. 常见坑速查

- 用默认 `docker` driver 加 `--platform`：会被静默忽略，只产出本机架构，先 `docker buildx inspect` 确认 driver 与 Platforms。
- 多架构加 `--load`：行不通，manifest list 进不了本地 daemon，改用 `--push`。
- 基础镜像只有单架构：目标机器上 `exec format error`，先 `imagetools inspect` 确认。
- 下载链接写死 `amd64`：换架构就 404 或跑不起来，用 `${TARGETARCH}` 拼。
- 全程 QEMU 编译：慢 3-5 倍甚至更多，编译阶段用 `--platform=$BUILDPLATFORM` 交叉编译。

## 7. 一条命令速查

```bash
docker buildx create --name multiarch --driver docker-container --bootstrap --use
docker buildx build --platform linux/amd64,linux/arm64 -t username/myapp:latest --push .
docker buildx imagetools inspect username/myapp:latest
```

下一步：如果要把这篇文章落到具体项目上，把项目语言和现在用的基础镜像发给我，我可以直接帮你把 Dockerfile 改成多架构版本，再给一条能直接跑的构建命令。

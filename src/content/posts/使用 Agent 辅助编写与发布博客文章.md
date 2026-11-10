---
title: 使用 Agent 辅助编写与发布博客文章
published: 2026-11-10
description: 把自己博客的写作与发布流程交给 AI Agent：手机上发一句话，Agent 负责起草、校验、提交并推送，GitHub Actions 自动构建上线。本文记录完整链路与踩到的坑。
image: ''
tags: ["AIGC", "Astro", "GitHub Actions", "自动化"]
category: "AI / 自动化"
draft: false
lang: ''
author: 'AI 辅助生成'
comment: true
slug: shi-yong-agent-fu-zhu-bian-xie-yu-fa-bu-bo-ke-wen-zhang
---

# 使用 Agent 辅助编写与发布博客文章

:::note[本文为 AIGC 生成内容]
本文由 AI Agent 根据实际部署过程整理生成，人工审校后发布。文中命令、输出与踩坑记录均来自真实执行环境，未做虚构。
:::

## 1. 为什么要把写文章这件事交出去

写博客最大的成本往往不是"写"，而是中间那一串摩擦：打开电脑、切到编辑器、想起来 front matter 要填哪几个字段、本地起服务看效果、提交、等 CI、发现 CI 挂了再回来改。

如果这些环节能压缩成"在手机上发一句话"，写作的门槛会低很多。这篇文章记录的就是这样一条链路：**手机发指令 → Agent 起草并校验 → 自动提交推送 → GitHub Actions 构建部署**，全程不需要打开电脑。

## 2. 整体链路

整条链路拆开看只有四段：

1. **输入侧**：手机上的即时通讯工具（本项目使用的是 Telegram）与 Agent 对话
2. **执行侧**：Agent 在 NAS 上持有仓库副本，负责写文件、跑校验、提交
3. **权限侧**：一个仅对该仓库有写权限的 SSH Deploy Key
4. **发布侧**：push 到 `main` 触发 GitHub Actions，自动 build 并部署到 GitHub Pages

关键点在于**第 4 段是现成的**。只要仓库已经配好 Pages 的 workflow，任何形式的 push 都会自动上线，Agent 不需要在本地跑构建就能发布——但为了不让 CI 挂掉，本地校验仍然值得做。

## 3. 环境准备

### 3.1 Node 版本

项目要求 Node.js 24 以上，`package.json` 中声明为 `>=22.23.0`。先确认版本：

```bash
node -v   # v24.22.1
npm -v    # 11.19.1
```

### 3.2 拉取仓库并安装依赖

```bash
git clone https://github.com/lanyugod/lanyugod.github.io.git blog
cd blog
npm ci
```

`npm ci` 严格按照 `package-lock.json` 安装，比 `npm install` 更可复现。这一步会跑 postinstall（图标生成、LQIP 生成等），耗时较长，国内网络建议耐心等待或配置镜像源。

安装完成后依赖体积约 1.1 GB，属于 Astro + Svelte 项目的正常量级。

## 4. 打通推送权限

克隆公开仓库不需要认证，但 **push 需要**。这里选择 SSH Deploy Key，原因是权限最小：它只对单个仓库有效，且私钥可以完全留在服务器上，不必把 token 复制到聊天窗口里。

### 4.1 生成密钥对

```bash
ssh-keygen -t ed25519 -C "hermes-agent@nas-blog-deploy" \
  -f ~/.ssh/blog_deploy_key -N ""
```

`-N ""` 表示不设密码短语（自动化场景必须如此，否则每次推送都要交互输入）。生成后得到私钥 `blog_deploy_key` 与公钥 `blog_deploy_key.pub`。

### 4.2 在 GitHub 添加公钥

进入仓库的 `Settings → Deploy keys → Add deploy key`，粘贴公钥内容，**务必勾选 `Allow write access`**。不勾选只能读，push 会被拒绝。

### 4.3 验证连接

```bash
ssh -i ~/.ssh/blog_deploy_key -o IdentitiesOnly=yes -T git@github.com
```

成功的返回长这样，其中的仓库名证明该密钥确实绑定到了目标仓库：

```
Hi lanyugod/lanyugod.github.io! You've successfully authenticated,
but GitHub does not provide shell access.
```

### 4.4 配置仓库使用该密钥

不要依赖 `~/.ssh/config` 里的 Host 别名，直接写在仓库配置里更稳：

```bash
git remote set-url origin git@github.com:lanyugod/lanyugod.github.io.git
git config core.sshCommand \
  "ssh -i /绝对路径/.ssh/blog_deploy_key -o IdentitiesOnly=yes"
```

`core.sshCommand` 是仓库级配置，好处是密钥路径显式、不依赖全局 ssh 配置，多仓库共存时也不会互相干扰。

## 5. 写一篇新文章

### 5.1 用脚手架生成骨架

项目自带 `new-post` 脚本，会根据标题自动生成拼音 slug：

```bash
npm run new-post -- "使用 Agent 辅助编写与发布博客文章"
```

产物是 `src/content/posts/使用 Agent 辅助编写与发布博客文章.md`，内容只有 front matter 骨架：

```yaml
---
title: 使用 Agent 辅助编写与发布博客文章
published: 2026-11-10
description: ''
image: ''
tags: []
category: ''
draft: false
lang: ''
slug: shi-yong-agent-fu-zhu-bian-xie-yu-fa-bu-bo-ke-wen-zhang
---
```

### 5.2 补齐 front matter

`src/content.config.ts` 里用 Zod 定义了字段，除了 `title` 和 `published`，其余大多有默认值。实际写作时值得填的是这几项：

| 字段 | 作用 |
| --- | --- |
| `description` | 列表页摘要、SEO 描述 |
| `tags` | 标签，参与分类与检索 |
| `category` | 分类路径，形如 `Linux / Docker` |
| `image` | 封面图地址 |
| `draft` | 置为 `true` 则不发布 |
| `author` | 作者署名，可用于标注生成来源 |
| `comment` | 是否开启评论（Waline） |

### 5.3 正文写法

正文是标准 Markdown，另外支持几项扩展：KaTeX 数学公式、代码分组、以及 `remark-directive` 提供的提示框语法：

```markdown
:::note[标题]
提示框内容
:::
```

这类提示框很适合用来放**声明、前提条件、风险提醒**，比如本文开头那条 AIGC 声明。

## 6. 标记 AIGC 内容

站点的 schema 里没有专门的 `aigc` 布尔字段，因此采用三重标记，保证无论前台怎么渲染都能被读者识别：

1. **`tags` 中加入 `AIGC`** —— 标签页、检索、分类归档都会带上
2. **`author` 写为 `AI 辅助生成`** —— 若主题渲染作者字段则直接可见
3. **正文开头放 `:::note` 声明块** —— 最明确的一种，进入正文第一眼就能看到

之所以不满足于只加标签，是因为标签容易被忽略；而之所以不只在正文写一句，是因为元数据层面也该带上，便于日后统计与筛选。

## 7. 提交与发布

### 7.1 提交前校验

CI 会依次执行 `check`、`type-check`、`test`、`verify:notes`、`build`、`verify:site`。本地至少先跑最关键的几条，避免推上去才发现格式问题：

```bash
npm run check       # Astro 内容/类型诊断
npm run type-check  # tsc --noEmit
npm run build       # 完整构建
```

其中 `build` 会顺带生成图标、LQIP、字体子集与 Pagefind 搜索索引，耗时最长但最接近真实产物。

### 7.2 提交信息规范

仓库沿用了 Conventional Commits，历史提交基本是 `feat:` / `fix:` / `chore:` 开头。新增文章按 `feat:` 写：

```bash
git add "src/content/posts/使用 Agent 辅助编写与发布博客文章.md"
git commit -m "feat: 新增文章《使用 Agent 辅助编写与发布博客文章》"
git push origin main
```

### 7.3 自动部署

push 到 `main` 即触发 `.github/workflows/pages.yml`：checkout → 装 Node → `npm ci` → 各项校验 → `npm run build` → 上传产物 → 部署 Pages。

整个过程不需要人工介入，构建完成站点即更新。**这也是为什么本地校验值得做**：CI 失败不会自动回滚，站点会停在上一版，而错误信息只在 Actions 页面里。

## 8. 踩到的坑

### 8.1 `~` 在 ssh config 里不一定是你的 `$HOME`

这台机器上 shell 的 `HOME` 与 `/etc/passwd` 里记录的 home **不是同一个路径**（前者在数据卷上，后者是挂载点）。于是 `~/.ssh/config` 里的 `IdentityFile ~/.ssh/blog_deploy_key` 被解析成了另一个不存在的路径：

```
no such identity: /home/trim.hermes/.ssh/blog_deploy_key: No such file or directory
```

更隐蔽的是，ssh **根本不会读取**那个位于 shell `HOME` 下的配置文件——它按 passwd 记录的 home 去找。表现就是配置写得好好的，`ssh github-blog` 却报 `Could not resolve hostname`。

解决办法就是第 4.4 节那样：**用绝对路径 + `core.sshCommand`**，绕开 ssh 的 home 解析逻辑。

### 8.2 Deploy Key 必须勾选 write

只读的 deploy key 在 `ssh -T` 时会返回成功，看起来一切正常，直到 `git push` 才报 `Permission denied`。加 key 时就要把 `Allow write access` 勾上。

### 8.3 `npm ci` 比想象中慢

postinstall 里的图标、字重子集、LQIP 生成都不快，1.1 GB 依赖加上串行的生成步骤，十分钟量级属于正常。别在它没跑完时就急着构建，否则会拿到不完整的 `src/constants/`。

## 9. 这样做的边界

适合交给 Agent 的部分：**结构化的、有明确规范的**工作——生成骨架、补齐 front matter、按章节展开、跑校验、提交推送。

不适合完全交出去的：**判断和取舍**。哪些内容值得写、技术细节是否准确、语气是否符合自己的习惯，这些仍然需要人来把关。本文的定位就是"AI 起草、人审校"，而不是"AI 全自动发文"。

换句话说，Agent 省掉的是机械劳动，不是判断力。

## 10. 小结

把链路串起来看，真正需要一次性配置的只有三件事：

1. 装依赖（`npm ci`）
2. 配一个只对该仓库有写权限的 Deploy Key
3. 确认 Pages workflow 存在于 `main` 分支

之后每次写文章，就只剩下 `new-post` → 写正文 → `build` 校验 → commit → push 这一串动作。再往前一步，这串动作也可以交给 Agent，于是写作入口就变成了手机上的一句话。

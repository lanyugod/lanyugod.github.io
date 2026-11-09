# Agent Note: 当前 Firefly 博客结构

Status: implemented

## Problem

博客需要保留文章与 NAS 媒体能力，并使用用户指定的 Firefly 主题。用户要求清除旧备份、旧入口与中间文件，只保留当前源码和有用文档。

## Decision

网站使用 Firefly 原生 /posts/ 路由和界面，8 篇文章使用原生 frontmatter；commentPath 只保留旧 Waline 身份，不再发布任何兼容跳转。图片统一放在 public/images/posts 和 public/images/gallery，移除无引用图片。相册使用 src/data/gallery.json 和原生 urls.txt 清单。

页面由 GitHub Actions 构建并在 GitHub Pages 托管，NAS 只提供独立公开目录。PUBLIC_MEDIA_ORIGIN 为空时使用本地图片，配置 files.lanyu.dev 后使用远程地址。头像和图标留在博客。Token 不进入前端或仓库。

依赖、构建产物和本地缓存在检查通过后删除，Node 24 + pnpm 锁文件可恢复运行环境。README、当前验证记录和 NAS 使用说明是当前文档，不保留历史迁移记录；旧历史笔记依用户明确要求删除，以本篇记录现行约定。

## Alternatives considered

- 保留旧路由跳转和备份：有利于兼容与回退；用户明确要求清理，因此不再保留。
- 将全部文件与博客托管于 NAS：存储集中；博客本身静态，分离托管更容易控制 NAS 公开范围并减少页面对家庭网络的依赖。
- 大范围删除主题内部组件：源码更少；Firefly 配置与布局仍引用可选模块，保留这些内部关系，只删除未使用的页面和演示素材，避免为目录瘦身破坏框架。

## Consequences

旧文章链接不再兼容，会由站点返回 404；既有评论仍使用原标识。文章文字和被引用图片保留，图片路径规范化。启用 NAS 后媒体依赖其可用性，未实现自动回退、图库同步或真实 NAS 网络配置。

## Testing

检查文章正文和元数据、图片散列、站内链接、原生文章页面、搜索索引以及不再生成旧入口；运行 Astro、TypeScript、媒体测试和生产构建。通过后删除依赖与构建缓存，验证结果写入 docs/verification.md。

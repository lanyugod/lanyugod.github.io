# LanYu Blog

基于 [Firefly](https://github.com/CuteLeaf/Firefly) 6.16.9 的 Astro 静态博客，当前网站只保留 Firefly 原生入口。主题源码遵循根目录 LICENSE，文章与照片归原作者。

## 启动

使用 Node.js 24 和 npm 11（Node 24 自带）。依赖和构建产物不提交到仓库，首次运行先安装：

```sh
cd /Users/lanyu/gitFile/Astro-blog
nvm use
npm ci
npm run dev
```

本地地址以终端输出为准，默认 http://localhost:4321/。要验证全文搜索，请先构建再预览：

```sh
npm run build
npm run preview
```

## 文章与配置

- `src/content/posts/`：8 篇文章。支持 title、published、updated、description、image、tags、category；日期使用未加引号的 YAML 日期。新文章可用 `npm run new-post -- 文件名` 创建。
- `public/images/posts/`：正文图片；`public/images/gallery/`：相册照片；头像与图标放在 `public/images/`。
- `src/data/gallery.json` 和 `public/gallery/lanyu/urls.txt`：相册标题、说明和图片清单。
- `src/config/`：网站信息、导航、用户资料、主题、相册、评论等配置。现有页面：主页、文章、归档、分类、标签、相册、关于、搜索、RSS/Atom。
- `commentPath` 仅是已有文章的 Waline 评论标识，不会生成旧页面。新文章不必填写。
- `deploy/nas/`：NAS 只读静态文件服务示例，真实 NAS 尚未连接。

## 检查与发布

```sh
npm run check
npm run type-check
npm test
npm run build
npm run verify:site
```

GitHub Actions 使用 Node 24、package-lock.json 锁文件和 `dist/` 产物部署 GitHub Pages。推送到 `lanyugod/lanyugod.github.io` 的 `main` 分支后自动检查、构建并发布。网站域名沿用 `blog.lanyu.dev`，仓库 Pages 发布源使用 GitHub Actions。

[当前验证结果](docs/verification.md) · [npm 与发布约定](docs/decisions/implemented/process/2026-11-09-npm-pages.md) · [NAS 图片接入](docs/nas-media.md) · [Firefly 官方文档](https://docs-firefly.cuteleaf.cn/)

旧版本备份、历史迁移材料、旧入口跳转、未使用的演示页面和素材已清理。主题内部被配置或布局引用的代码保留，避免破坏 Firefly 的模块关系。

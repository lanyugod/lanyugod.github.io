# 当前验证结果

日期：2026-11-09。Firefly 6.16.9，Astro 7.3.2，Node 24.19.0，npm 11.17.0。

当前项目统一使用 npm，package-lock.json 为唯一依赖锁文件。依赖版本范围保持不变；Cloudflare 插件的 Wrangler override 保持原有解析选择，详见 [npm 与发布约定](decisions/implemented/process/2026-11-09-npm-pages.md)。

已完成的检查：

- `npm run check`：247 个文件，0 errors、0 warnings、0 hints。Wrangler 尝试写入环境限制之外的日志目录时有权限提示，Astro 诊断退出码为 0。
- `npm run type-check`：通过，退出码为 0。
- `npm test`：9 项测试通过，覆盖文章正文、元数据、评论标识、图片文件和媒体域名边界。
- `npm run verify:notes`：原笔记树校验通过；使用 `AGENT_NOTE_ROOT=docs/decisions npm run verify:notes` 校验现行 npm 约定也通过。`.agents` 在当前环境只读，新约定记录在 docs/decisions 并明确接管旧笔记的包管理约定。
- 在没有 node_modules 的临时目录执行 `npm ci --dry-run --offline --ignore-scripts`：通过锁文件与 package.json 一致性预检；npm 对 Svelte 插件的 Vite peer dependency 给出非致命提示。此检查不下载、安装或执行依赖脚本，不能代替完整 npm ci。
- 锁文件的 1487 个依赖位置均使用官方 registry URL 和原依赖完整性散列，包含 Linux 等平台的原生可选依赖，没有本地链接或临时目录引用。

未完成的验证：

- 完整的全新 `npm ci`：终端无法连接 registry，验证依赖从本机原有缓存恢复，未完成在线下载与安装。
- `npm run build`：GitHub 卡片数据和 50 张图片的 LQIP 生成完成，Astro 进入静态构建后，字体模块启动内部 HTTP 服务时被环境拒绝（`listen EPERM: operation not permitted 0.0.0.0`）。生产构建没有通过，后续字体处理、Pagefind 和 `npm run verify:site` 尚未完成。
- 页面预览与截图：当前环境禁止监听本地端口，未验证。
- GitHub Actions 和线上发布：用户选择暂时不推送，没有修改远端仓库或线上网站。

构建过程中生成的 LQIP 已恢复为空种子，由下次完整构建重新生成。node_modules、dist 和 .astro 均为忽略的本地产物。NAS、Cloudflare Tunnel 和线上 Waline 未执行联调。

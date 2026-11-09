# NAS 图片与文件接入

博客页面由 GitHub Pages 提供，公开图片和附件可以由 NAS 经 Cloudflare Tunnel 提供，文件域名为 `files.lanyu.dev`。NAS 系统、图库软件和目录尚未配置。

## 公开图片

当前正文图片位于 `public/images/posts/`，相册位于 `public/images/gallery/`。头像和网站图标随博客托管。

1. 在 NAS 创建独立的 `blog-public` 目录，只放决定公开的副本，不共享整个图库或 NAS 管理目录。
2. 在项目运行 `npm run export:nas`，将生成的 `nas-export/` **内容**复制到该目录，保留 `images/posts/` 和 `images/gallery/` 层级。
3. 参考 `deploy/nas/` 配置只读文件服务和 Tunnel。域名路由到 `http://media:8080`，Token 只保存在 NAS 本地配置，不填写博客环境变量或源码。
4. 验证中文文件名的图片可读取、目录不可列出、写请求被拒绝、私有目录和管理服务不可访问后，再启用博客的媒体域名。
5. 将 `.env.example` 复制为 `.env`，填写 `PUBLIC_MEDIA_ORIGIN=https://files.lanyu.dev`，重启开发服务或重新构建。GitHub Actions 使用同名仓库变量。

变量为空时从博客本地加载图片；启用后正文与相册使用 NAS 域名。图片不会在构建时从 NAS 下载，但访客访问图片依赖 NAS 和家庭上行。清空变量重新构建可恢复已有图片的本地来源，未实现浏览器自动故障回退。

## 新增内容

新增 NAS 图片可直接在 Markdown 使用绝对 HTTPS 地址。相册需要同步更新 `src/data/gallery.json` 的标题/说明和 `public/gallery/lanyu/urls.txt` 的图片清单，然后重建博客。当前版本不会扫描私人图库或自动同步相册。

下载链接可写 `[下载附件](https://files.lanyu.dev/downloads/example.zip)`；Nginx 示例对 `/downloads/` 返回附件。

## 访问边界

公开目录内所有文件都视为公开，隐藏目录列表和随机文件名不是身份验证。发布副本前自行检查 EXIF 定位信息并压缩图片。删除文件或撤销公开时注意清理 Cloudflare 缓存。

容器只读挂载、禁用特权、关闭宿主端口不能替代网络隔离；需在 NAS 防火墙、容器策略或 VLAN 上限制访问其他内网服务。Tunnel 保留连接 Cloudflare 所需的出站能力。不把 Docker socket、其他共享目录、NAS 管理端口挂给公开文件服务。

普通图片展示无需任意来源 CORS。若以后改为浏览器读取公开图库清单，再按实际来源配置。公开图片不使用交互式登录；私人相册应另设访问控制。

部署示例尚未在真实 NAS 执行；正式接入前按实际系统调整目录与网络策略。

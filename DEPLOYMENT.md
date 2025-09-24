# LunaTV 部署指南

本文档介绍了如何在不同环境中部署 LunaTV 应用。

## 1. Docker 部署（推荐）

这是默认和推荐的部署方式。

### 1.1 构建 Docker 镜像

```bash
docker build -t lunatv .
```

### 1.2 运行容器

```bash
docker run -d \
  --name lunatv \
  -p 3000:3000 \
  -e USERNAME=admin \
  -e PASSWORD=your_password \
  lunatv
```

### 1.3 使用 Docker Compose（可选）

```yaml
version: '3.8'
services:
  lunatv:
    build: .
    ports:
      - "3000:3000"
    environment:
      - USERNAME=admin
      - PASSWORD=your_password
    # 如果使用 Redis 存储
    # depends_on:
    #   - redis
    # environment:
    #   - NEXT_PUBLIC_STORAGE_TYPE=redis
    #   - REDIS_URL=redis://redis:6379

  # redis:
  #   image: redis:alpine
  #   volumes:
  #     - redis_data:/data
  #   command: redis-server --appendonly yes

# volumes:
#   redis_data:
```

## 2. Cloudflare Pages 部署

LunaTV 现已支持在 Cloudflare Pages 上部署，使用 Cloudflare KV 作为数据存储。

### 2.1 前置要求

1. Cloudflare 账户
2. GitHub 账户（用于连接到 Cloudflare Pages）
3. Cloudflare Workers KV 命名空间

### 2.2 创建 KV 命名空间

1. 登录 Cloudflare 控制台
2. 进入 Workers & Pages
3. 点击 "KV" 选项卡
4. 创建一个新的命名空间，例如 "LUNATV_KV"

### 2.3 配置 Cloudflare Pages 项目

1. 在 Cloudflare 控制台中创建一个新的 Pages 项目
2. 连接到你的 GitHub 仓库
3. 配置以下构建设置：
   - 构建命令: `pnpm build`
   - 构建输出目录: `.next`
4. 添加环境变量：
   - `NEXT_PUBLIC_STORAGE_TYPE` = `cf-kv`
   - `USERNAME` = `your_admin_username`
   - `PASSWORD` = `your_admin_password`
5. 在项目的 "Functions" 设置中绑定 KV 命名空间：
   - Variable name: `LUNATV_KV`
   - KV namespace: 选择你创建的命名空间

### 2.4 部署限制

由于 Cloudflare Pages 的限制，以下功能可能无法使用或受限：

1. 视频代理功能：由于 Workers 执行时间限制，视频流代理可能无法正常工作
2. 大文件处理：受限于 Workers 的内存和执行时间限制
3. 实时搜索：可能需要调整超时设置

## 3. 环境变量配置

无论使用哪种部署方式，都需要配置以下环境变量：

| 变量名 | 必需 | 描述 |
|--------|------|------|
| USERNAME | 是 | 管理员用户名 |
| PASSWORD | 是 | 管理员密码 |
| NEXT_PUBLIC_STORAGE_TYPE | 否 | 存储类型 (localstorage, redis, upstash, kvrocks, cf-kv) |
| REDIS_URL | 否 | Redis 连接 URL (使用 Redis 存储时) |
| UPSTASH_REDIS_URL | 否 | Upstash Redis URL (使用 Upstash 存储时) |
| UPSTASH_REDIS_TOKEN | 否 | Upstash Redis Token (使用 Upstash 存储时) |
| KVROCKS_URL | 否 | Kvrocks 连接 URL (使用 Kvrocks 存储时) |

## 4. 存储后端选择

### 4.1 localStorage (默认)

适用于单用户或测试环境，数据存储在浏览器中。

### 4.2 Redis

适用于需要数据持久化和多设备同步的场景。

### 4.3 Upstash Redis

适用于无服务器部署场景。

### 4.4 Kvrocks

兼容 Redis 协议的高性能存储。

### 4.5 Cloudflare KV

适用于 Cloudflare Pages 部署，使用 Cloudflare 的全球分布式键值存储。

## 5. 安全考虑

1. 确保设置了强密码
2. 不要在公共仓库中硬编码敏感信息
3. 使用 HTTPS 加密传输
4. 定期更新依赖包
5. 限制管理界面的访问

## 6. 性能优化

1. 启用适当的缓存策略
2. 使用 CDN 加速静态资源
3. 合理配置数据库连接池
4. 压缩静态资源
5. 启用 Gzip/Brotli 压缩

## 7. 故障排除

### 7.1 启动失败

检查环境变量是否正确配置，特别是 USERNAME 和 PASSWORD。

### 7.2 数据库连接问题

确保数据库服务正在运行并且连接参数正确。

### 7.3 视频播放问题

检查视频源是否可访问，以及代理设置是否正确。

### 7.4 搜索功能异常

检查外部 API 源是否可用，以及网络连接是否正常。
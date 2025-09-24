# LunaTV 本地开发指南

本文档介绍了如何在本地环境中设置和运行 LunaTV 开发环境。

## 1. 环境要求

- Node.js 20 或更高版本
- pnpm 10.14.0 或更高版本
- Docker (可选，用于测试 Docker 部署)
- Git

## 2. 初始化项目

### 2.1 克隆项目

```bash
git clone https://github.com/MoonTechLab/LunaTV.git
cd LunaTV
```

### 2.2 安装依赖

```bash
pnpm install
```

## 3. 环境配置

### 3.1 创建本地环境配置文件

复制 [.env.local](file:///home/liulang/projects/backup/LunaTV/.env.local) 文件并根据需要进行修改：

```bash
cp .env.local .env.local
```

配置必要的环境变量：
- `USERNAME`: 管理员用户名
- `PASSWORD`: 管理员密码
- `NEXT_PUBLIC_STORAGE_TYPE`: 存储类型

### 3.2 存储选项配置

#### 3.2.1 localStorage (默认，推荐用于开发)

适用于本地开发和测试，数据存储在浏览器中。

#### 3.2.2 Redis (可选)

如果需要测试 Redis 存储后端：

1. 启动本地 Redis 实例：
   ```bash
   docker run -d -p 6379:6379 redis:alpine
   ```

2. 在 [.env.local](file:///home/liulang/projects/backup/LunaTV/.env.local) 中添加：
   ```bash
   NEXT_PUBLIC_STORAGE_TYPE=redis
   REDIS_URL=redis://localhost:6379
   ```

#### 3.2.3 Cloudflare KV (可选)

如果需要测试 Cloudflare KV 存储后端，需要设置 Cloudflare Wrangler。

## 4. 启动开发服务器

### 4.1 启动开发服务器

有几种方式可以启动开发服务器：

#### 方法一：使用默认的 Next.js 开发服务器（可能会遇到监听范围过大的问题）
```bash
pnpm dev
```

#### 方法二：使用 nodemon 限制监听范围（推荐）
首先需要安装 nodemon：
```bash
pnpm add -D nodemon
```

然后可以使用以下命令启动：
```bash
pnpm dev:nodemon
```

这将使用我们配置的 [nodemon.json](file:///home/liulang/projects/backup/LunaTV/nodemon.json) 文件，只监听项目相关文件，避免监听范围过大导致的 EMFILE 错误。

### 4.2 构建项目

```bash
pnpm build
```

### 4.3 启动生产服务器

```bash
pnpm start
```

## 5. 运行测试

### 5.1 运行所有测试

```bash
pnpm test
```

### 5.2 运行测试并监视更改

```bash
pnpm test:watch
```

## 6. 代码质量检查

### 6.1 运行 ESLint

```bash
pnpm lint
```

### 6.2 自动修复代码格式

```bash
pnpm lint:fix
```

### 6.3 TypeScript 类型检查

```bash
pnpm typecheck
```

## 7. 功能测试步骤

### 7.1 登录系统

1. 打开浏览器访问 `http://localhost:3000`
2. 使用在 [.env.local](file:///home/liulang/projects/backup/LunaTV/.env.local) 中配置的用户名和密码登录

### 7.2 测试基本功能

1. 首页浏览
   - 检查豆瓣推荐内容是否正常显示
   - 验证响应式布局在不同设备上的表现

2. 搜索功能
   - 使用关键词搜索影视内容
   - 验证多源聚合搜索是否正常工作

3. 播放功能
   - 点击任意影片进入详情页
   - 尝试播放视频，验证播放器是否正常工作

4. 收藏功能
   - 收藏一些影片
   - 检查收藏是否正确保存

5. 播放记录
   - 观看部分影片后停止播放
   - 检查播放记录是否正确保存

### 7.3 测试不同存储后端

如果配置了不同的存储后端，需要测试数据是否正确存储和读取：

1. localStorage:
   - 在浏览器开发者工具中检查 localStorage 数据
   - 清除浏览器数据后验证功能

2. Redis:
   - 使用 redis-cli 检查数据是否正确存储
   - 重启应用后验证数据持久性

3. Cloudflare KV:
   - 在 Cloudflare 控制台检查 KV 数据

### 7.4 测试管理功能

1. 访问管理页面 (`http://localhost:3000/admin`)
2. 测试配置文件管理
3. 测试站点配置
4. 测试用户管理
5. 测试直播源配置

## 8. 调试技巧

### 8.1 浏览器调试

1. 使用浏览器开发者工具检查网络请求
2. 查看控制台输出以获取错误信息
3. 检查 Application 标签页中的存储数据

### 8.2 服务端调试

1. 查看终端中的服务器日志
2. 使用 console.log 添加调试信息
3. 检查 API 路由返回的数据

## 9. 常见问题

### 9.1 启动失败

检查环境变量是否正确配置，特别是 USERNAME 和 PASSWORD。

### 9.2 数据库连接问题

确保数据库服务正在运行并且连接参数正确。

### 9.3 视频播放问题

检查视频源是否可访问，以及代理设置是否正确。

### 9.4 搜索功能异常

检查外部 API 源是否可用，以及网络连接是否正常。

### 9.5 文件监听问题（EMFILE 错误）

在某些系统上，可能会遇到 "EMFILE: too many open files" 错误。这通常是由于系统文件描述符限制导致的。可以通过以下方式解决：

1. 增加文件描述符限制：
   ```bash
   ulimit -n 65536
   ```

2. 或者在启动时使用 --max-old-space-size 参数：
   ```bash
   NODE_OPTIONS=--max-old-space-size=4096 pnpm dev
   ```

3. 如果问题仍然存在，可以尝试重启系统或减少项目文件数量

### 9.6 Watchpack 监听项目外文件问题

如果遇到 Watchpack 错误，提示监听了项目外的文件（如 `/home/liulang`），这通常是因为文件监听范围过大导致的。Next.js 不支持在 [next.config.js](file:///home/liulang/projects/backup/LunaTV/next.config.js) 中直接配置 `watchOptions`，可以通过以下方式解决：

1. 使用环境变量配置 Chokidar（文件监听库）:
   ```bash
   CHOKIDAR_USEPOLLING=true pnpm dev
   ```

2. 增加系统文件描述符限制:
   ```bash
   ulimit -n 65536
   ```

3. 如果以上方法无效，可以尝试使用 Docker 进行开发，避免本地环境问题:
   ```bash
   docker-compose up dev
   ```

4. 或者使用专门的监听工具如 nodemon 并配置忽略目录:
   ```bash
   pnpm add -D nodemon
   # 然后配置 nodemon.json 来忽略不需要监听的目录
   ```

5. 如果仍然遇到问题，可以尝试使用更严格的监听配置，只监听必要的目录和文件扩展名。

6. 如果所有方法都无效，考虑使用标准的 `pnpm dev` 命令，并结合增加系统文件描述符限制:
   ```bash
   ulimit -n 65536 && pnpm dev
   ```

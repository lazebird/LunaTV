# LunaTV 技术文档

## 1. 项目概述

LunaTV（内部代号MoonTV）是一个现代化的跨平台影视聚合播放器，基于Web技术栈构建。它专注于聚合多个第三方影视API源，提供统一搜索和在线播放功能，同时支持播放记录和收藏的云端同步。

### 1.1 核心特性

- 多源聚合搜索：一次搜索返回所有配置源的结果
- 在线播放：集成ArtPlayer和HLS.js，支持流畅播放
- 收藏与播放记录：支持多种存储后端（Kvrocks/Redis/Upstash），实现多端同步
- 自定义分类：通过豆瓣关键词创建个性化导航分类
- PWA支持：支持离线缓存与安装到主屏
- 响应式布局：适配桌面与移动设备
- 智能去广告：实验性跳过视频切片广告功能

### 1.2 技术栈

- 前端框架：React 18 + Next.js 14 (App Router)
- UI框架：Tailwind CSS 3 + Headless UI + Lucide Icons
- 编程语言：TypeScript 4
- 播放器：ArtPlayer + HLS.js
- 状态管理：React Context + 自定义Hook
- 代码质量：ESLint + Prettier + Jest + Husky
- 部署方式：Docker (多阶段构建)

## 2. 系统架构

### 2.1 整体架构

LunaTV采用典型的三层架构：

```
┌─────────────────────┐
│      浏览器         │
└─────────┬───────────┘
          │ HTTP请求
┌─────────▼───────────┐
│    Next.js服务      │
│  (API路由 + SSR)    │
└─────────┬───────────┘
          │ 数据请求
┌─────────▼───────────┐
│   外部影视API源     │
│   + 本地数据存储    │
└─────────────────────┘
```

### 2.2 设计模式

1. **App Router模式**：使用Next.js 14的App Router架构，支持服务端渲染和API路由
2. **中间件模式**：通过middleware.ts处理请求拦截和路由控制
3. **依赖注入**：通过环境变量注入存储类型和代理配置
4. **单例模式**：数据库客户端（如Redis/Kvrocks）在应用中以单例方式初始化

## 3. 核心模块详解

### 3.1 路由系统

项目使用Next.js App Router架构，主要路由包括：

- 页面路由：
  - / - 首页
  - /login - 登录页
  - /play - 播放页
  - /search - 搜索页
  - /live - 直播页
  - /admin - 管理页

- API路由：
  - /api/search - 搜索接口
  - /api/detail - 详情接口
  - /api/playrecords - 播放记录接口
  - /api/favorites - 收藏接口
  - /api/live - 直播相关接口
  - /api/douban - 豆瓣数据接口

### 3.2 数据存储

项目支持多种数据存储后端，通过环境变量`NEXT_PUBLIC_STORAGE_TYPE`进行配置：

1. **localStorage**：默认存储方式，适用于单机使用
2. **Redis**：通过RedisStorage类实现
3. **Upstash Redis**：通过UpstashRedisStorage类实现
4. **Kvrocks**：通过KvrocksStorage类实现

数据存储接口定义在IStorage中，包括：
- 播放记录相关操作
- 收藏相关操作
- 用户认证相关操作
- 搜索历史相关操作
- 管理员配置相关操作

### 3.3 认证系统

通过middleware.ts实现认证拦截，支持两种模式：

1. **localStorage模式**：密码直接存储在cookie中
2. **其他模式**：使用签名验证机制

认证信息包含：
- username：用户名
- password：密码（localStorage模式）
- signature：签名（其他模式）

### 3.4 视频代理系统

为了处理跨域问题和优化视频流传输，项目实现了视频代理系统：

- /api/proxy/m3u8：M3U8播放列表代理
- /api/proxy/segment：视频片段代理

代理系统会重写M3U8内容中的相对路径，确保视频流能够正确加载。

### 3.5 搜索系统

搜索系统具有以下特点：

1. **多源并行搜索**：同时向多个配置的API源发起搜索请求
2. **超时控制**：单个API源搜索超时时间为20秒
3. **结果缓存**：通过search-cache.ts实现搜索结果缓存
4. **内容过滤**：可配置过滤不适宜内容

### 3.6 直播系统

直播系统支持：
1. 多直播源配置
2. EPG节目单获取
3. M3U8流代理
4. 视频片段代理

相关API包括：
- /api/live/channels：获取频道列表
- /api/live/epg：获取节目单
- /api/live/sources：获取直播源列表

## 4. 部署与运维

### 4.1 环境变量配置

关键环境变量：
- `USERNAME`：管理员用户名
- `PASSWORD`：管理员密码
- `NEXT_PUBLIC_STORAGE_TYPE`：存储类型（localstorage/redis/upstash/kvrocks）
- `REDIS_URL`：Redis连接URL（使用Redis存储时）
- `UPSTASH_REDIS_URL`和`UPSTASH_REDIS_TOKEN`：Upstash Redis配置
- `KVROCKS_URL`：Kvrocks连接URL

### 4.2 Docker部署

项目通过Dockerfile实现多阶段构建，支持简单部署：

```bash
docker build -t lunatv .
docker run -p 3000:3000 lunatv
```

### 4.3 存储后端选择

1. **localStorage**：适合个人使用，数据存储在浏览器中
2. **Redis**：适合需要数据持久化和多设备同步的场景
3. **Upstash Redis**：适合无服务器部署场景
4. **Kvrocks**：兼容Redis协议的高性能存储

## 5. 安全考虑

1. **强制认证**：所有页面和API都需要认证
2. **密码保护**：通过环境变量配置密码
3. **签名验证**：非localStorage模式使用HMAC签名验证
4. **内容过滤**：可配置过滤不适宜内容

## 6. 性能优化

1. **结果缓存**：搜索结果默认缓存2小时
2. **流式传输**：视频片段采用流式传输避免内存占用
3. **并行搜索**：多源搜索并行处理
4. **响应式设计**：适配各种设备屏幕

## 7. 扩展性

1. **插件化存储**：通过实现IStorage接口可轻松扩展存储后端
2. **灵活配置**：通过管理界面可动态配置API源和直播源
3. **模块化设计**：各功能模块相对独立，易于扩展和维护
# Cloudflare Pages + KV 数据库部署支持

本文档描述了如何将 LunaTV 项目改造为支持在 Cloudflare Pages 上部署，并使用 Cloudflare KV 作为数据存储后端。

## 1. 概述

LunaTV 项目原生设计为使用 Node.js 环境下的多种存储后端（如 Redis、Upstash Redis、Kvrocks 等）。为了支持在 Cloudflare Pages 上部署，我们需要进行以下改造：

1. 添加对 Cloudflare KV 数据库的支持
2. 移除对 Node.js 原生 API 的依赖
3. 修改构建配置以兼容 Cloudflare Pages
4. 调整认证和会话管理机制

## 2. 改造步骤

### 2.1 添加 Cloudflare KV 存储支持

需要创建一个新的存储类来实现 [IStorage](file:///home/liulang/projects/backup/LunaTV/src/lib/types.ts#L23-L54) 接口，使用 Cloudflare KV 作为后端存储。

### 2.2 移除 Node.js 原生 API 依赖

需要重构以下模块以移除对 Node.js 原生 API 的依赖：

1. 数据库相关模块
2. 配置文件读取模块
3. 中间件认证模块
4. 视频代理模块

### 2.3 修改构建配置

需要调整 [next.config.js](file:///home/liulang/projects/backup/LunaTV/next.config.js) 配置文件，移除 `standalone` 输出模式，并确保兼容 Cloudflare Pages 构建环境。

### 2.4 调整认证机制

需要重构认证系统，使用 Cloudflare 兼容的方式处理用户会话和认证。

## 3. 实现细节

### 3.1 Cloudflare KV 存储实现

需要创建一个新的存储类 `CloudflareKVStorage` 实现 [IStorage](file:///home/liulang/projects/backup/LunaTV/src/lib/types.ts#L23-L54) 接口：

```typescript
// src/lib/cf-kv.db.ts
import { Favorite, IStorage, PlayRecord, SkipConfig } from './types';
import { AdminConfig } from './admin.types';

export class CloudflareKVStorage implements IStorage {
  private kvNamespace: KVNamespace;
  
  constructor(kvNamespace: KVNamespace) {
    this.kvNamespace = kvNamespace;
  }
  
  // 实现 IStorage 接口的所有方法
  async getPlayRecord(userName: string, key: string): Promise<PlayRecord | null> {
    const value = await this.kvNamespace.get(`playrecord:${userName}:${key}`);
    return value ? JSON.parse(value) : null;
  }
  
  async setPlayRecord(userName: string, key: string, record: PlayRecord): Promise<void> {
    await this.kvNamespace.put(`playrecord:${userName}:${key}`, JSON.stringify(record));
  }
  
  // ... 其他方法实现
}
```

### 3.2 环境配置调整

需要在 [db.ts](file:///home/liulang/projects/backup/LunaTV/src/lib/db.ts) 中添加对 Cloudflare KV 存储的支持：

```typescript
// src/lib/db.ts
import { CloudflareKVStorage } from './cf-kv.db';

// storage type 常量: 'localstorage' | 'redis' | 'upstash' | 'kvrocks' | 'cf-kv'，默认 'localstorage'
const STORAGE_TYPE =
  (process.env.NEXT_PUBLIC_STORAGE_TYPE as
    | 'localstorage'
    | 'redis'
    | 'upstash'
    | 'kvrocks'
    | 'cf-kv'
    | undefined) || 'localstorage';

// 创建存储实例
function createStorage(): IStorage {
  switch (STORAGE_TYPE) {
    case 'redis':
      return new RedisStorage();
    case 'upstash':
      return new UpstashRedisStorage();
    case 'kvrocks':
      return new KvrocksStorage();
    case 'cf-kv':
      // Cloudflare KV 实例需要在运行时传入
      return null as unknown as IStorage;
    case 'localstorage':
    default:
      return null as unknown as IStorage;
  }
}
```

### 3.3 构建配置调整

需要修改 [next.config.js](file:///home/liulang/projects/backup/LunaTV/next.config.js) 以移除 `standalone` 输出模式：

```javascript
// next.config.js
const nextConfig = {
  // 移除 output: 'standalone'
  // output: 'standalone',
  
  // ... 其他配置
};
```

### 3.4 认证系统改造

需要重构 [middleware.ts](file:///home/liulang/projects/backup/LunaTV/src/middleware.ts) 以适应 Cloudflare 环境：

```typescript
// middleware.ts
// 移除对 Node.js crypto 模块的直接依赖，改用 Web Crypto API
async function verifySignature(
  data: string,
  signature: string,
  secret: string
): Promise<boolean> {
  // Cloudflare 环境下使用 Web Crypto API
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);

  try {
    // 在 Cloudflare 环境中可用
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureBuffer = new Uint8Array(
      signature.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
    );

    return await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBuffer,
      messageData
    );
  } catch (error) {
    console.error('签名验证失败:', error);
    return false;
  }
}
```

## 4. 部署配置

### 4.1 Cloudflare Pages 设置

在 Cloudflare Pages 项目设置中需要配置以下环境变量：

- `NEXT_PUBLIC_STORAGE_TYPE`: 设置为 `cf-kv`
- `USERNAME`: 管理员用户名
- `PASSWORD`: 管理员密码

### 4.2 KV Namespace 配置

需要在 Cloudflare 控制台创建 KV Namespace，并在 Pages 项目中绑定到 `LUNATV_KV` 等变量名。

### 4.3 Wrangler 配置

创建 `wrangler.toml` 文件用于本地开发和部署：

```toml
name = "lunatv"
type = "javascript"
zone_id = ""
account_id = ""
route = ""
workers_dev = true

kv_namespaces = [
  { binding = "LUNATV_KV", id = "your-kv-namespace-id" }
]
```

## 5. 限制和注意事项

### 5.1 功能限制

1. 视频代理功能可能无法完整实现，因为 Cloudflare Workers 有执行时间限制
2. 大文件处理能力受限
3. 实时数据处理能力有限

### 5.2 性能考虑

1. KV 读写操作会产生额外的网络延迟
2. 需要合理设计数据结构以减少 KV 操作次数
3. 注意 KV 的读写配额限制

### 5.3 安全考虑

1. 确保 KV 数据的访问控制
2. 合理设置认证令牌的过期时间
3. 对敏感数据进行加密存储

## 6. 后续优化建议

1. 实现数据缓存机制以减少 KV 访问次数
2. 添加批量操作支持以提高性能
3. 实现数据备份和恢复机制
4. 添加监控和日志功能
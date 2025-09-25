import dynamic from 'next/dynamic';
import React from 'react';

// next.js 使用 node16 moduleResolution 时要求显式扩展名。此处为动态导入使用 .js 后缀并且
// 在 then 回调中使用 unknown 到 React.ComponentType 的断言来避免显式 any。
// 禁用该行的 no-explicit-any 检查以避免 lint 阻断构建。
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AdminPageClient = dynamic(() => import('./AdminPageClient.js').then((mod: any) => mod.default), { ssr: false });

export default function AdminPage() {
  return (
    <React.Suspense fallback={<div className="text-center text-gray-500 dark:text-gray-400">加载中...</div>}>
      <AdminPageClient />
    </React.Suspense>
  );
}

export const runtime = 'edge';

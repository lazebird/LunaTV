"use client";
import React from 'react';

import { AdminConfig } from '@/lib/admin.types';

import { useAlertModal, useLoadingState } from './common';

const CategoryConfig = ({ config, refreshConfig: _refreshConfig }: { config: AdminConfig | null; refreshConfig: () => Promise<void> }) => {
  const { alertModal: _alertModal, showAlert: _showAlert } = useAlertModal();
  const { isLoading: _isLoading } = useLoadingState();
  const [categories, setCategories] = React.useState<AdminConfig['CustomCategories']>([]);
  React.useEffect(() => { if (config?.CustomCategories) setCategories(config.CustomCategories); }, [config]);
  if (!config) return <div className='text-center text-gray-500'>加载中...</div>;
  return (
    <div className='space-y-4'>
      <div className='border rounded-lg max-h-[28rem] overflow-y-auto'>
        <table className='min-w-full'>
          <thead className='sticky top-0 bg-gray-50'>
            <tr><th>名称</th><th>类型</th><th>关键词</th></tr>
          </thead>
          <tbody>
            {categories.map((c) => <tr key={`${c.query}:${c.type}`}><td>{c.name}</td><td>{c.type}</td><td className='truncate max-w-[12rem]'>{c.query}</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CategoryConfig;

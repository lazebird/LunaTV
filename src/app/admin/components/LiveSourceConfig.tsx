"use client";
import React from 'react';

import { AdminConfig } from '@/lib/admin.types';

import { useAlertModal, useLoadingState } from './common';

const LiveSourceConfig = ({ config, refreshConfig: _refreshConfig }: { config: AdminConfig | null; refreshConfig: () => Promise<void> }) => {
  const { alertModal: _alertModal, showAlert: _showAlert } = useAlertModal();
  const { isLoading: _isLoading } = useLoadingState();
  const [liveSources, setLiveSources] = React.useState<NonNullable<AdminConfig['LiveConfig']>>([]);
  React.useEffect(() => { if (config?.LiveConfig) setLiveSources(config.LiveConfig); }, [config]);
  if (!config) return <div className='text-center text-gray-500'>加载中...</div>;
  return (
    <div className='space-y-4'>
      <div className='border rounded-lg max-h-[28rem] overflow-y-auto'>
        <table className='min-w-full'>
          <thead className='sticky top-0 bg-gray-50'>
            <tr><th>名称</th><th>Key</th><th>M3U</th></tr>
          </thead>
          <tbody>
            {liveSources.map((s) => <tr key={s.key}><td>{s.name}</td><td>{s.key}</td><td className='truncate max-w-[12rem]'>{s.url}</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LiveSourceConfig;

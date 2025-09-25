"use client";
import React from 'react';

import { AdminConfig } from '@/lib/admin.types';

import { buttonStyles, showSuccess, useAlertModal, useLoadingState } from './common';

const SiteConfigComponent = ({ config, refreshConfig }: { config: AdminConfig | null; refreshConfig: () => Promise<void> }) => {
  const { alertModal: _alertModal, showAlert, hideAlert: _hideAlert } = useAlertModal();
  const { isLoading, withLoading } = useLoadingState();
  const [siteName, setSiteName] = React.useState('');
  React.useEffect(() => { if (config?.SiteConfig) setSiteName(config.SiteConfig.SiteName || ''); }, [config]);

  const handleSave = async () => {
    await withLoading('saveSiteConfig', async () => {
      const resp = await fetch('/api/admin/site', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ SiteName: siteName }) });
      if (!resp.ok) throw new Error('保存失败');
      showSuccess('保存成功', showAlert);
      await refreshConfig();
    });
  };

  if (!config) return <div className='text-center text-gray-500'>加载中...</div>;

  return (
    <div className='space-y-4'>
      <div>
        <label className='block text-sm font-medium'>站点名称</label>
        <input type='text' value={siteName} onChange={(e) => setSiteName(e.target.value)} className='w-full px-3 py-2 border rounded-lg' />
      </div>
      <div className='flex justify-end'>
        <button onClick={handleSave} disabled={isLoading('saveSiteConfig')} className={isLoading('saveSiteConfig') ? buttonStyles.disabled : buttonStyles.success}>{isLoading('saveSiteConfig') ? '保存中…' : '保存'}</button>
      </div>
    </div>
  );
};

export default SiteConfigComponent;

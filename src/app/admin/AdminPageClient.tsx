"use client";

import React, { useCallback, useEffect, useState } from 'react';

import { AdminConfig,AdminConfigResult } from '@/lib/admin.types';
import { fetchJson } from '@/lib/fetchJson';

import PageLayout from '@/components/PageLayout';

import CategoryConfig from './components/CategoryConfig';
import { CollapsibleTab } from './components/CollapsibleTab';
import { AlertModal, showError,useAlertModal, useLoadingState } from './components/common';
import LiveSourceConfig from './components/LiveSourceConfig';
import SiteConfigComponent from './components/SiteConfigComponent';
import UserConfig from './components/UserConfig';
import VideoSourceConfig from './components/VideoSourceConfig';

export default function AdminPageClient() {
  const { alertModal, showAlert, hideAlert } = useAlertModal();
  const { withLoading: _withLoading } = useLoadingState();
  const [config, setConfig] = useState<AdminConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<'owner' | 'admin' | null>(null);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const json = await fetchJson<AdminConfigResult>("/api/admin/config");
      setConfig(json.Config);
      setRole(json.Role);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '获取配置失败';
      showError(msg, showAlert);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  if (loading) return (
    <PageLayout activePath='/admin'>
      <div className='px-2 sm:px-10 py-4 sm:py-8'>
        <h1 className='text-2xl font-bold'>管理员设置</h1>
        <div className='space-y-4 mt-6'>
          {Array.from({ length: 3 }).map((_, idx) => <div key={idx} className='h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse' />)}
        </div>
      </div>
    </PageLayout>
  );

  if (error) return null;

  return (
    <PageLayout activePath='/admin'>
      <div className='px-2 sm:px-10 py-4 sm:py-8'>
        <div className='max-w-[95%] mx-auto'>
          <h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8'>管理员设置</h1>

          <CollapsibleTab title='站点配置' icon={null} isExpanded={true} onToggle={() => undefined}>
            <SiteConfigComponent config={config} refreshConfig={fetchConfig} />
          </CollapsibleTab>

          <CollapsibleTab title='用户配置' icon={null} isExpanded={true} onToggle={() => undefined}>
            <UserConfig config={config} role={role} refreshConfig={fetchConfig} />
          </CollapsibleTab>

          <CollapsibleTab title='视频源配置' icon={null} isExpanded={true} onToggle={() => undefined}>
            <VideoSourceConfig config={config} refreshConfig={fetchConfig} />
          </CollapsibleTab>

          <CollapsibleTab title='直播源配置' icon={null} isExpanded={true} onToggle={() => undefined}>
            <LiveSourceConfig config={config} refreshConfig={fetchConfig} />
          </CollapsibleTab>

          <CollapsibleTab title='分类配置' icon={null} isExpanded={true} onToggle={() => undefined}>
            <CategoryConfig config={config} refreshConfig={fetchConfig} />
          </CollapsibleTab>

        </div>
      </div>

      <AlertModal isOpen={alertModal.isOpen} onClose={hideAlert} type={alertModal.type} title={alertModal.title} message={alertModal.message} timer={alertModal.timer} showConfirm={alertModal.showConfirm} />
    </PageLayout>
  );
}

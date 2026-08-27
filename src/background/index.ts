import type { BackgroundMessage } from '../types';
import { getApplications, updateApplication } from '../storage';

chrome.runtime.onInstalled.addListener(() => {
  console.log('AI Job Filler installed');
});

// ─── 投递成功检测：content script 命中成功文案后，更新最近的投递记录 ───
chrome.runtime.onMessage.addListener((message: BackgroundMessage, sender) => {
  if (message.type === 'APPLICATION_SUCCESS') {
    markLatestAsSuccess(message.url, sender.tab?.url);
  }
});

async function markLatestAsSuccess(detectedUrl: string, tabUrl?: string): Promise<void> {
  const url = detectedUrl || tabUrl || '';
  try {
    const apps = await getApplications();

    // 优先匹配 URL 一致的 filled 记录；否则取最近一条 filled
    let target = apps.find(a => a.url === url && a.status === 'filled');
    if (!target) target = apps.find(a => a.status === 'filled');
    if (!target) return;

    await updateApplication(target.id, {
      status: 'success',
      submittedAt: Date.now(),
    });
    console.log(`[background] 标记投递成功: ${target.company} ${target.position}`);
  } catch (err) {
    console.warn('[background] 标记投递成功失败', err);
  }
}

export {};

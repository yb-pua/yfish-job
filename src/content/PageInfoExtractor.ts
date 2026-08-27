import type { PageInfo } from '../types';

/**
 * PageInfoExtractor —— 从招聘网页提取「公司 / 岗位 / 平台」。
 *
 * 识别顺序（DOM 规则优先，AI 兜底留待后续接入）：
 *   ① 平台专有选择器
 *   ② 页面结构（h1/h2、[class*="job-title"] 等）
 *   ③ meta[property="og:title"]
 *   ④ document.title
 *   ⑤ URL hostname（平台识别）
 *   ⑥ AI fallback（V1 暂不实现，保持纯 DOM，后续可在 popup 侧补）
 */

const POSITION_SELECTORS = [
  '.job-name', '.job-title', '.jobTitle',
  '.position-name', '.position-title', '.positionName',
  '.post-name', '.post-title',
  '[class*="job-name"]', '[class*="job-title"]',
  '[class*="position-name"]', '[class*="position-title"]',
  '[class*="post-name"]', '[class*="post-title"]',
  'h1',
];

const COMPANY_SELECTORS = [
  '.company-name', '.company-title', '.companyName',
  '.corp-name', '.com-name', '.corp-title',
  '[class*="company-name"]', '[class*="company-title"]',
  '[class*="companyName"]', '[class*="corp-name"]',
];

// 平台识别（纯 hostname，无网络开销）
function detectPlatform(hostname: string): string {
  const h = hostname.toLowerCase();
  if (h.includes('zhipin.com')) return 'BOSS直聘';
  if (h.includes('zhaopin.com')) return '智联招聘';
  if (h.includes('51job.com')) return '前程无忧';
  if (h.includes('liepin.com')) return '猎聘';
  if (h.includes('lagou.com')) return '拉勾';
  if (h.includes('moka')) return 'Moka';
  if (h.includes('beisen') || h.includes('talent') || h.includes('recruit')) return '北森';
  if (h.includes('iguopin.com')) return '国聘';
  if (h.includes('10086.cn')) return '中国移动招聘';
  if (h.includes('chinatelecom')) return '中国电信';
  return '通用';
}

function cleanText(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim();
}

function firstMatch(selectors: string[]): string {
  for (const sel of selectors) {
    try {
      const el = document.querySelector(sel);
      const text = cleanText(el?.textContent);
      if (text && text.length >= 2 && text.length <= 40) return text;
    } catch {
      // 非法选择器，跳过
    }
  }
  return '';
}

function extractPosition(): string {
  return firstMatch(POSITION_SELECTORS);
}

function extractCompany(): string {
  const fromSelector = firstMatch(COMPANY_SELECTORS);
  if (fromSelector) return fromSelector;

  // logo 的 alt 常带公司名
  const logo = document.querySelector('img[alt]');
  const alt = cleanText(logo?.getAttribute('alt'));
  if (alt && alt.length >= 2 && alt.length <= 40 && !/logo|招聘|简历|公司/i.test(alt)) {
    return alt;
  }
  return '';
}

// 从 title / og:title 兜底，按分隔符拆分「公司 - 岗位」
function parseFromTitle(): { company: string; position: string } {
  const ogTitle = cleanText(
    document.querySelector('meta[property="og:title"]')?.getAttribute('content'),
  );
  const source = ogTitle || cleanText(document.title);

  const parts = source
    .split(/[-_—|｜·]/)
    .map(p => p.trim())
    .filter(p => p && !/招聘|直聘|前程无忧|智联|猎聘|拉勾|国聘|Moka|北森|首页|登录/.test(p));

  if (parts.length >= 2) {
    // 常见格式：岗位 - 公司 - 平台 或 公司 - 岗位
    return { company: parts[parts.length - 1], position: parts[0] };
  }
  if (parts.length === 1) return { company: '', position: parts[0] };
  return { company: '', position: '' };
}

export function extractPageInfo(): PageInfo {
  const platform = detectPlatform(location.hostname);

  let company = extractCompany();
  let position = extractPosition();

  // 岗位为空时用 title 兜底
  if (!position) {
    const t = parseFromTitle();
    position = t.position;
    if (!company) company = t.company;
  }
  // 公司仍为空时再用 title 兜底一次
  if (!company) {
    company = parseFromTitle().company;
  }

  return {
    company,
    position: position || cleanText(document.title),
    platform,
  };
}

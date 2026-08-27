/**
 * ApplicationDetector —— 投递成功检测。
 *
 * 用户手动点击「提交简历 / 立即投递 / Submit」后，页面通常会出现成功文案。
 * 用 MutationObserver 监听 DOM 变化，命中关键词即通知 background 更新投递状态。
 */

const SUCCESS_TEXTS = [
  '投递成功',
  '申请成功',
  '提交成功',
  '简历已提交',
  '已投递',
  '感谢您的申请',
  '报名成功',
  'Application submitted',
  'Successfully applied',
];

export function startApplicationDetector(onSuccess: () => void): void {
  const check = (): boolean => {
    const text = document.body?.innerText || '';
    return SUCCESS_TEXTS.some(kw => text.includes(kw));
  };

  // 立即检查一次：覆盖「投递成功 → 跳转新页面 → content script 重新注入」的场景
  if (check()) {
    onSuccess();
    return;
  }

  let fired = false;
  const observer = new MutationObserver(() => {
    if (fired) return;
    if (check()) {
      fired = true;
      observer.disconnect();
      onSuccess();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}

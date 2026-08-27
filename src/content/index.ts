import type { ContentMessage, ContentResponse } from '../types';
import { analyzePage } from './DOMAnalyzer';
import { fillForm, fillSingle, expandSections } from './FormFiller';
import { extractPageInfo } from './PageInfoExtractor';
import { startApplicationDetector } from './ApplicationDetector';

chrome.runtime.onMessage.addListener(
  (
    message: any,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: any) => void
  ) => {
    // Ping check — used by ensureContentScript to verify injection
    if (message.type === '__PING__') {
      sendResponse({ type: 'PONG' });
      return false;
    }

    if (message.type === 'ANALYZE') {
      try {
        const pageInfo = extractPageInfo();
        const fields = analyzePage();
        if (fields.length >= 3) {
          sendResponse({ type: 'ANALYZE_RESULT', fields, pageInfo });
        } else {
          setTimeout(() => {
            const retryFields = analyzePage();
            sendResponse({
              type: 'ANALYZE_RESULT',
              fields: retryFields.length > fields.length ? retryFields : fields,
              pageInfo,
            });
          }, 800);
          return true;
        }
      } catch (err) {
        sendResponse({
          type: 'ERROR',
          message: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    } else if (message.type === 'FILL') {
      fillForm(message.proposals)
        .then(filled => {
          sendResponse({ type: 'FILL_RESULT', success: true, filled });
        })
        .catch(err => {
          sendResponse({
            type: 'ERROR',
            message: err instanceof Error ? err.message : 'Fill error',
          });
        });
      return true;
    } else if (message.type === 'FILL_SINGLE') {
      fillSingle(message.proposal)
        .then(success => {
          sendResponse({ type: 'FILL_SINGLE_RESULT', success });
        })
        .catch(() => {
          sendResponse({ type: 'FILL_SINGLE_RESULT', success: false });
        });
      return true;
    } else if (message.type === 'EXPAND_SECTIONS') {
      expandSections(message.counts)
        .then(() => {
          sendResponse({ type: 'EXPAND_RESULT', success: true });
        })
        .catch(() => {
          sendResponse({ type: 'EXPAND_RESULT', success: false });
        });
      return true;
    }

    return false;
  }
);

// ─── 投递成功检测：命中成功文案后通知 background 更新投递状态 ───
startApplicationDetector(() => {
  chrome.runtime
    .sendMessage({ type: 'APPLICATION_SUCCESS', url: location.href })
    .catch(() => {
      // background 未就绪时忽略即可
    });
});

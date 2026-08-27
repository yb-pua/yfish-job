# YFish Job

AI 驱动的求职网申自动填写 + 投递追踪助手（Chrome 扩展）。

在 [job-filler](https://github.com/freecodetiger/job-filler) 基础上二次开发：保留「简历结构化 → 一键填写网申表单」的核心能力，并新增**求职投递追踪**，把单纯的「填写历史」升级为「投递历史」，让秋招海投不再乱。

### 简历数据来源（v2）

不再依赖 PDF 上传解析，改为**「粘贴简历文本 → 大模型自动分解」**：直接把简历全文（Word/网页/简历库文本均可）粘进插件，AI 自动拆解成结构化信息，覆盖央企/国企网申常见的全部字段。

## 核心能力

### 网申自动填写（继承自 job-filler）

- **简历导入** — 粘贴简历文本，大模型自动分解为结构化信息（覆盖教育/工作/实习/项目/科研/论著/证书/语言/亲属/校内职务等全字段）
- **简历管理** — 分层编辑基本信息、教育背景、工作经历、项目经历、技能
- **页面分析** — 自动扫描招聘网站表单字段，提取 label / placeholder / 上下文文本
- **AI 匹配** — 调用 LLM 将网页字段语义映射到简历数据
- **自动填写** — 原生 setter 绕过 React/Vue 受控组件，兼容主流招聘网站

### 求职投递追踪（本次新增）

- **页面识别** — DOM 规则优先识别「公司 / 岗位 / 平台」，支持 BOSS直聘、智联、前程无忧、Moka、北森、国聘、中国移动等，AI 兜底留待后续
- **投递记录** — 一键填写后自动生成投递记录，初始状态「已填写待提交」
- **投递成功检测** — MutationObserver 监听「投递成功 / 申请成功 / 提交成功」等文案，自动标记为「已投递」
- **手动兜底** — 自动识别不到时，可手动「标记已投递」
- **历史卡片** — 展示公司 / 岗位 / 状态 / 平台 / 时间，支持「全部 / 已投递 / 待提交」三档筛选
- **重复投递提醒** — 同公司同岗位已投递过时，一键填写前弹窗提醒

## 投递追踪流程

```
当前网页
   ↓
PageInfoExtractor（识别公司 / 岗位 / 平台）
   ↓
一键填写
   ↓
生成 ApplicationRecord（status: filled）
   ↓
ApplicationDetector 监听「投递成功」文案
   ↓
命中 → background 更新 status: success
   ↓
（未命中）手动「标记已投递」兜底
   ↓
chrome.storage.local
   ↓
历史页面（卡片 + 筛选）
```

## 安装

```bash
git clone https://github.com/yb-pua/yfish-job.git
cd yfish-job

npm install --legacy-peer-deps
npm run build
```

## 加载到 Chrome

1. Chrome 地址栏输入 `chrome://extensions`，回车
2. 右上角打开「**开发者模式**」
3. 点击「**加载已解压的扩展程序**」
4. 选择 `dist/` 目录
5. 工具栏出现插件图标后，按下方「首次使用」配置

## 首次使用

1. **配置 API** — 点击插件图标 → 「API」标签 → 填入：
   - Endpoint：`https://api.openai.com/v1`（或其他 OpenAI 兼容地址，如 DeepSeek `https://api.deepseek.com/v1`）
   - API Key：`sk-...`
   - Model：`gpt-4o-mini` / `deepseek-chat` 等
   - 点击「保存」
2. **导入简历** — 「导入」标签 → 粘贴简历全文 → AI 自动分解 → 确认导入
3. **编辑确认** — 「简历」标签，检查并修改解析结果，保存

## 日常使用

1. 打开任意招聘网站的职位/网申表单页面
2. 点击插件图标 → 「**一键填写**」
3. 等待扫描 → AI 匹配 → 自动写入（保持弹窗打开）
4. 人工检查填写结果，手动点击网页的「提交 / 立即投递」
5. 插件会自动检测「投递成功」并更新历史；若未识别，到「历史」标签手动「标记已投递」

## 技术栈

| 层 | 技术 |
|----|------|
| 框架 | React 18 + TypeScript strict |
| 构建 | Vite + @crxjs/vite-plugin |
| 扩展 | Chrome Manifest V3 |
| 存储 | chrome.storage.local |
| PDF | pdfjs-dist |
| AI | OpenAI 兼容 API（可换任何厂商） |

## 项目结构

```
src/
├── types/          # 类型定义（ResumeFieldType, UserProfile, ApplicationRecord ...）
├── storage/        # chrome.storage.local 封装 + 投递记录 CRUD
├── llm/            # LLM 客户端（OpenAI 兼容接口）
├── content/        # Content Script
│   ├── DOMAnalyzer.ts          # 页面表单字段扫描
│   ├── FormFiller.ts           # 原生 setter + 事件触发填写
│   ├── PageInfoExtractor.ts    # 公司 / 岗位 / 平台识别（DOM 规则）
│   └── ApplicationDetector.ts  # 投递成功文案检测（MutationObserver）
├── resume/         # 简历导入
│   ├── PDFExtractor.ts
│   ├── ResumeParser.ts
│   └── ProfileMapper.ts
├── popup/          # Popup UI
│   ├── App.tsx          # 主流程编排 + 投递历史 UI
│   ├── ProfileEditor.tsx
│   ├── ResumeImport.tsx
│   ├── FillPreview.tsx
│   └── ApiConfigEditor.tsx
└── background/     # Service Worker（投递成功消息处理）
```

## 架构

```
简历 PDF                招聘网站表单
   │                        │
   ▼                        ▼
PDFExtractor           DOMAnalyzer + PageInfoExtractor
   │                        │
   ▼                        ▼
ResumeParser (LLM)      FormField[] + PageInfo
   │                        │
   ▼                        ▼
UserProfile ────────▶ LLMClient.matchFields()
   │                        │
   ▼                        ▼
chrome.storage         FillProposal[]
   ▲                        │
   │                        ▼
   │                   FormFiller → 页面
   │                        │
   │                   ApplicationDetector（监听投递成功）
   │                        │
   └────────────── ApplicationRecord（投递记录）
```

## 许可

基于 [job-filler](https://github.com/freecodetiger/job-filler)（MIT）二次开发，沿用 MIT 许可。

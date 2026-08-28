import React, { useState } from 'react';
import type { UserProfile, ApiConfig } from '../types';
import { parseResume, mapToProfile, PRESET_PROFILE } from '../resume';
import type { ParsedResume } from '../resume';
import { addImportHistory } from '../storage';

type ImportPhase = 'input' | 'parsing' | 'preview' | 'importing' | 'done';

interface Props {
  apiConfig: ApiConfig | null;
  onImported: (profile: UserProfile) => Promise<void>;
}

const ResumeImport: React.FC<Props> = ({ apiConfig, onImported }) => {
  const [phase, setPhase] = useState<ImportPhase>('input');
  const [status, setStatus] = useState('');
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState<ParsedResume | null>(null);

  const handleParse = async () => {
    if (!apiConfig) {
      setStatus('请先在 API 标签页配置 LLM');
      return;
    }
    if (!text.trim()) {
      setStatus('请先粘贴简历文本');
      return;
    }

    setPhase('parsing');
    setStatus(`正在用 AI 解析 ${text.trim().length} 字符的简历...`);

    try {
      const result = await parseResume({ text: text.trim(), pageCount: 0 }, apiConfig);
      setParsed(result);
      setPhase('preview');
      setStatus('');
    } catch (err) {
      console.error('[ResumeImport] Error:', err);
      setStatus(err instanceof Error ? err.message : '解析失败');
      setPhase('input');
    }
  };

  const handleConfirm = async () => {
    if (!parsed) return;

    setPhase('importing');
    setStatus('正在保存...');

    try {
      const profile = mapToProfile(parsed);
      await onImported(profile);

      await addImportHistory({
        filename: '手动粘贴',
        timestamp: Date.now(),
        success: true,
      });

      setPhase('done');
      setStatus('简历已导入！切换到「简历」标签查看和编辑。');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : '保存失败');
      setPhase('preview');
    }
  };

  const handleReset = () => {
    setPhase('input');
    setParsed(null);
    setStatus('');
    setText('');
  };

  const handlePresetImport = async () => {
    setPhase('importing');
    setStatus('正在导入预设简历...');
    try {
      await onImported(PRESET_PROFILE);
      await addImportHistory({
        filename: '预设简历（一键导入）',
        timestamp: Date.now(),
        success: true,
      });
      setPhase('done');
      setStatus('预设简历已导入！切换到「简历」标签查看和编辑。');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : '导入失败');
      setPhase('input');
    }
  };

  // ── Input Phase ──
  if (phase === 'input') {
    return (
      <div className="resume-import">
        <button className="fill-button" onClick={handlePresetImport}>
          ⚡ 一键导入预设简历（袁博）
        </button>
        <p className="upload-hint">
          已内置完整简历数据（含科研/专利/证书/亲属/身份证等），无需 API Key 即可导入。
        </p>

        <p className="upload-hint">
          或直接粘贴简历全文（Word/网页/简历库文本均可），AI 会自动拆解成结构化信息，无需上传 PDF。
        </p>
        <div className="field-group">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={'粘贴简历内容，例如：\n\n袁博\n男 | 网络安全工程师\n13324577612 | ybsec@stu.xupt.edu.cn\n\n教育经历\n西安邮电大学 网络信息安全 硕士 2024-2027\n\n...'}
            rows={10}
          />
        </div>
        <button className="fill-button" onClick={handleParse}>
          用 AI 解析简历
        </button>
        {status && <p className="status status-error">{status}</p>}
      </div>
    );
  }

  // ── Parsing Phase ──
  if (phase === 'parsing') {
    return (
      <div className="resume-import">
        <div className="analyzing-screen">
          <div className="spinner" />
          <p>{status}</p>
        </div>
      </div>
    );
  }

  // ── Preview Phase ──
  if (phase === 'preview' && parsed) {
    return (
      <div className="resume-import">
        <div className="preview-header">
          <h3>解析预览</h3>
        </div>

        <div className="resume-preview-list">
          <SectionPreview title="基本信息" items={[
            ['姓名', parsed.basic?.name],
            ['手机', parsed.basic?.phone],
            ['邮箱', parsed.basic?.email],
            ['性别', parsed.basic?.gender],
            ['出生日期', parsed.basic?.birthDate],
            ['民族', parsed.basic?.ethnicity],
            ['政治面貌', parsed.basic?.politicalStatus],
            ['籍贯', parsed.basic?.nativePlace],
          ]} />

          <SectionPreview title="个人链接" items={[
            ['GitHub', parsed.links?.github],
            ['LinkedIn', parsed.links?.linkedin],
            ['个人网站', parsed.links?.website],
          ]} />

          {(parsed.education || []).length > 0 && (
            <div className="profile-section">
              <h3 className="section-title">教育经历 ({parsed.education.length})</h3>
              {parsed.education.map((e, i) => (
                <div key={i} className="list-card">
                  <div className="list-card-header">
                    <span>{e.school} — {e.major} — {e.degree}</span>
                    <span className="date-range">{e.startDate} ~ {e.endDate}</span>
                  </div>
                  {e.college && <div className="list-card-desc">学院: {e.college}</div>}
                  {e.gpa && <div className="list-card-desc">绩点: {e.gpa}</div>}
                </div>
              ))}
            </div>
          )}

          {(parsed.experience || []).length > 0 && (
            <div className="profile-section">
              <h3 className="section-title">工作经历 ({parsed.experience.length})</h3>
              {parsed.experience.map((e, i) => (
                <div key={i} className="list-card">
                  <div className="list-card-header">
                    <span>{e.company} — {e.role}</span>
                    <span className="date-range">{e.startDate} ~ {e.endDate}</span>
                  </div>
                  <p className="list-card-desc">{e.description}</p>
                </div>
              ))}
            </div>
          )}

          {(parsed.internships || []).length > 0 && (
            <div className="profile-section">
              <h3 className="section-title">实习经历 ({parsed.internships.length})</h3>
              {parsed.internships.map((e, i) => (
                <div key={i} className="list-card">
                  <div className="list-card-header">
                    <span>{e.company} — {e.role}</span>
                    <span className="date-range">{e.startDate} ~ {e.endDate}</span>
                  </div>
                  <p className="list-card-desc">{e.description}</p>
                </div>
              ))}
            </div>
          )}

          {(parsed.projects || []).length > 0 && (
            <div className="profile-section">
              <h3 className="section-title">项目经历 ({parsed.projects.length})</h3>
              {parsed.projects.map((p, i) => (
                <div key={i} className="list-card">
                  <div className="list-card-header">
                    <span>{p.name}</span>
                    <span className="date-range">{p.startDate} ~ {p.endDate}</span>
                  </div>
                  <p className="list-card-desc">{p.description}</p>
                </div>
              ))}
            </div>
          )}

          {(parsed.research || []).length > 0 && (
            <div className="profile-section">
              <h3 className="section-title">科研经历 ({parsed.research.length})</h3>
              {parsed.research.map((r, i) => (
                <div key={i} className="list-card">
                  <div className="list-card-header">
                    <span>{r.title}</span>
                    <span className="date-range">{r.startDate} ~ {r.endDate}</span>
                  </div>
                  {r.mentor && <div className="list-card-desc">导师: {r.mentor}</div>}
                  {r.description && <p className="list-card-desc">{r.description}</p>}
                </div>
              ))}
            </div>
          )}

          {(parsed.publications || []).length > 0 && (
            <div className="profile-section">
              <h3 className="section-title">论文/专利/论著 ({parsed.publications.length})</h3>
              {parsed.publications.map((p, i) => (
                <div key={i} className="list-card">
                  <div className="list-card-header">
                    <span>{p.title}</span>
                    <span className="date-range">{p.date}</span>
                  </div>
                  {p.type && <div className="list-card-desc">类型: {p.type}{p.status ? ` · ${p.status}` : ''}</div>}
                  {p.number && <div className="list-card-desc">编号: {p.number}</div>}
                </div>
              ))}
            </div>
          )}

          {(parsed.certificates || []).length > 0 && (
            <div className="profile-section">
              <h3 className="section-title">证书 ({parsed.certificates.length})</h3>
              {parsed.certificates.map((c, i) => (
                <div key={i} className="list-card">
                  <div className="list-card-header">
                    <span>{c.name}</span>
                    <span className="date-range">{c.date}</span>
                  </div>
                  {c.number && <div className="list-card-desc">编号: {c.number}</div>}
                </div>
              ))}
            </div>
          )}

          {(parsed.languages || []).length > 0 && (
            <div className="profile-section">
              <h3 className="section-title">语言能力 ({parsed.languages.length})</h3>
              {parsed.languages.map((l, i) => (
                <div key={i} className="list-card">
                  <div className="list-card-header">
                    <span>{l.name} — {l.level}</span>
                    <span className="date-range">{l.date}</span>
                  </div>
                  {l.score && <div className="list-card-desc">分数: {l.score}</div>}
                </div>
              ))}
            </div>
          )}

          {(parsed.family || []).length > 0 && (
            <div className="profile-section">
              <h3 className="section-title">亲属关系 ({parsed.family.length})</h3>
              {parsed.family.map((f, i) => (
                <div key={i} className="list-card">
                  <div className="list-card-header">
                    <span>{f.name} — {f.relation}</span>
                  </div>
                  <div className="list-card-desc">{f.company}{f.position ? ` · ${f.position}` : ''}</div>
                </div>
              ))}
            </div>
          )}

          {(parsed.campusPositions || []).length > 0 && (
            <div className="profile-section">
              <h3 className="section-title">校内职务 ({parsed.campusPositions.length})</h3>
              {parsed.campusPositions.map((c, i) => (
                <div key={i} className="list-card">
                  <div className="list-card-header">
                    <span>{c.organization} — {c.role}</span>
                    <span className="date-range">{c.startDate} ~ {c.endDate}</span>
                  </div>
                  {c.description && <p className="list-card-desc">{c.description}</p>}
                </div>
              ))}
            </div>
          )}

          {(parsed.awards || []).length > 0 && (
            <div className="profile-section">
              <h3 className="section-title">获奖经历 ({parsed.awards.length})</h3>
              {parsed.awards.map((a, i) => (
                <div key={i} className="list-card">
                  <div className="list-card-header">
                    <span>{a.name}{a.level ? ` [${a.level}]` : ''}</span>
                    {a.date && <span className="date-range">{a.date}</span>}
                  </div>
                  {a.description && <p className="list-card-desc">{a.description}</p>}
                </div>
              ))}
            </div>
          )}

          {(parsed.skills || []).length > 0 && (
            <div className="profile-section">
              <h3 className="section-title">技能</h3>
              <div className="tags">
                {parsed.skills.map((s, i) => (
                  <span key={i} className="tag">{s}</span>
                ))}
              </div>
            </div>
          )}

          {parsed.selfIntroduction && (
            <div className="profile-section">
              <h3 className="section-title">自我评价</h3>
              <p className="list-card-desc">{parsed.selfIntroduction}</p>
            </div>
          )}
        </div>

        <div className="preview-actions">
          <button className="fill-button" onClick={handleConfirm}>
            确认导入
          </button>
          <button className="cancel-button" onClick={handleReset}>
            重新粘贴
          </button>
        </div>
      </div>
    );
  }

  // ── Done Phase ──
  return (
    <div className="resume-import">
      <div className="analyzing-screen">
        <p className="status status-success">{status}</p>
        <button className="save-button" onClick={handleReset}>
          再导入一份
        </button>
      </div>
    </div>
  );
};

// ─── Helper ───

const SectionPreview: React.FC<{
  title: string;
  items: [string, string | undefined | null][];
}> = ({ title, items }) => {
  const filled = items.filter(([, v]) => v);
  if (filled.length === 0) return null;

  return (
    <div className="profile-section">
      <h3 className="section-title">{title}</h3>
      <div className="section-grid">
        {items.map(([label, value]) => (
          <div key={label} className="section-item">
            <span className="section-label">{label}</span>
            <span className={value ? 'section-value' : 'section-value empty'}>
              {value || '—'}
              {value && <span className="check-mark"> ✓</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResumeImport;

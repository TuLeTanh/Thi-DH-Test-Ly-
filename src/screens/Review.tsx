import React, { useState } from 'react';
import questionsDataRaw from '../data/questions.json';
import { QuestionsData, McqQuestionItem, TfQuestionItem, ShortQuestionItem } from '../types';
import { RichText } from '../lib/RichText';

const questionsData = questionsDataRaw as unknown as QuestionsData;
const OPTION_LABELS = ['A', 'B', 'C', 'D'];
const STATEMENT_LABELS = ['a', 'b', 'c', 'd'];

export const Review: React.FC = () => {
  const [filterType, setFilterType] = useState<'all' | 'mcq' | 'tf' | 'short'>('all');
  const [onlyNeedsReview, setOnlyNeedsReview] = useState<boolean>(false);

  const { mcq, tf, short } = questionsData;

  const filterQuestions = <T extends { needsReview: boolean }>(list: T[]) => {
    if (!onlyNeedsReview) return list;
    return list.filter((q) => q.needsReview);
  };

  const filteredMcq = filterQuestions(mcq);
  const filteredTf = filterQuestions(tf);
  const filteredShort = filterQuestions(short);

  const totalNeedsReview =
    mcq.filter((q) => q.needsReview).length +
    tf.filter((q) => q.needsReview).length +
    short.filter((q) => q.needsReview).length;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: 20 }}>
      <header style={{ marginBottom: 24, borderBottom: '2px solid #cbd5e1', paddingBottom: 16 }}>
        <h1 style={{ fontSize: '1.6rem', margin: '0 0 8px 0', color: '#0f172a' }}>
          Trang Đối chiếu & Kiểm tra toàn bộ câu hỏi (Review Mode)
        </h1>
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>
          Tổng số: <strong>{mcq.length + tf.length + short.length} câu</strong> (99 MCQ, 32 TF, 18 Short).
          Có <strong>{totalNeedsReview} câu</strong> chứa công thức MathType đã được chuyển đổi sang LaTeX (`needsReview=true`).
        </p>

        {/* Filter controls */}
        <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            className={`select-btn ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            Tất cả (149)
          </button>
          <button
            type="button"
            className={`select-btn ${filterType === 'mcq' ? 'active' : ''}`}
            onClick={() => setFilterType('mcq')}
          >
            MCQ (99)
          </button>
          <button
            type="button"
            className={`select-btn ${filterType === 'tf' ? 'active' : ''}`}
            onClick={() => setFilterType('tf')}
          >
            TF (32)
          </button>
          <button
            type="button"
            className={`select-btn ${filterType === 'short' ? 'active' : ''}`}
            onClick={() => setFilterType('short')}
          >
            Short (18)
          </button>

          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 16, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={onlyNeedsReview}
              onChange={(e) => setOnlyNeedsReview(e.target.checked)}
            />
            <span style={{ fontWeight: 600, color: '#b45309' }}>
              Chỉ hiện câu cần đối chiếu MathType ({totalNeedsReview})
            </span>
          </label>
        </div>
      </header>

      {/* MCQ Section */}
      {(filterType === 'all' || filterType === 'mcq') && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ color: '#1e3a8a', borderBottom: '1px solid #bfdbfe', paddingBottom: 6 }}>
            I. Trắc nghiệm 4 lựa chọn ({filteredMcq.length} câu)
          </h2>
          {filteredMcq.map((q: McqQuestionItem) => (
            <div
              key={q.id}
              className={`review-item ${q.needsReview ? 'needs-review' : ''}`}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <strong>
                  {q.id} (Số thứ tự gốc: #{q.srcNo})
                </strong>
                <span className={q.needsReview ? 'badge-review' : 'badge-ok'}>
                  {q.needsReview ? 'Cần đối chiếu (MathType)' : 'Khớp'}
                </span>
              </div>

              <div style={{ marginBottom: 12 }}>
                <RichText content={q.q} as="div" />
              </div>

              {q.images && q.images.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  {q.images.map((img, i) => (
                    <img key={i} src={img} alt="Hình minh họa" style={{ maxWidth: 320 }} />
                  ))}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {q.options.map((opt, oIdx) => {
                  const isCorrect = oIdx === q.answer;
                  return (
                    <div
                      key={oIdx}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 6,
                        border: isCorrect ? '2px solid #10b981' : '1px solid #cbd5e1',
                        background: isCorrect ? '#ecfdf5' : '#ffffff',
                        fontWeight: isCorrect ? 600 : 'normal'
                      }}
                    >
                      <strong>{OPTION_LABELS[oIdx]}.</strong> <RichText content={opt} />
                      {isCorrect && <span style={{ color: '#047857', marginLeft: 6 }}>✓</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* TF Section */}
      {(filterType === 'all' || filterType === 'tf') && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ color: '#1e3a8a', borderBottom: '1px solid #bfdbfe', paddingBottom: 6 }}>
            II. Trắc nghiệm Đúng / Sai ({filteredTf.length} câu)
          </h2>
          {filteredTf.map((q: TfQuestionItem) => (
            <div
              key={q.id}
              className={`review-item ${q.needsReview ? 'needs-review' : ''}`}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <strong>
                  {q.id} (Số thứ tự gốc: #{q.srcNo})
                </strong>
                <span className={q.needsReview ? 'badge-review' : 'badge-ok'}>
                  {q.needsReview ? 'Cần đối chiếu (MathType)' : 'Khớp'}
                </span>
              </div>

              <div style={{ marginBottom: 12 }}>
                <RichText content={q.q} as="div" />
              </div>

              {q.images && q.images.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  {q.images.map((img, i) => (
                    <img key={i} src={img} alt="Hình minh họa" style={{ maxWidth: 320 }} />
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {q.statements.map((stmt, sIdx) => {
                  const ans = q.answers[sIdx];
                  return (
                    <div
                      key={sIdx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        background: '#f8fafc',
                        borderRadius: 6,
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <strong>{STATEMENT_LABELS[sIdx]})</strong> <RichText content={stmt} />
                      </div>
                      <div style={{ marginLeft: 16, minWidth: 60, textAlign: 'right' }}>
                        <span
                          style={{
                            fontWeight: 700,
                            color: ans ? '#166534' : '#991b1b',
                            padding: '2px 8px',
                            background: ans ? '#dcfce7' : '#fee2e2',
                            borderRadius: 4
                          }}
                        >
                          {ans ? 'ĐÚNG' : 'SAI'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Short Section */}
      {(filterType === 'all' || filterType === 'short') && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ color: '#1e3a8a', borderBottom: '1px solid #bfdbfe', paddingBottom: 6 }}>
            III. Trắc nghiệm Trả lời ngắn ({filteredShort.length} câu)
          </h2>
          {filteredShort.map((q: ShortQuestionItem) => (
            <div
              key={q.id}
              className={`review-item ${q.needsReview ? 'needs-review' : ''}`}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <strong>
                  {q.id} (Số thứ tự gốc: #{q.srcNo})
                </strong>
                <span className={q.needsReview ? 'badge-review' : 'badge-ok'}>
                  {q.needsReview ? 'Cần đối chiếu' : 'Khớp'}
                </span>
              </div>

              <div style={{ marginBottom: 12 }}>
                <RichText content={q.q} as="div" />
              </div>

              {q.images && q.images.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  {q.images.map((img, i) => (
                    <img key={i} src={img} alt="Hình minh họa" style={{ maxWidth: 320 }} />
                  ))}
                </div>
              )}

              <div
                style={{
                  padding: '8px 14px',
                  background: '#ecfdf5',
                  border: '1.5px solid #10b981',
                  borderRadius: 6,
                  color: '#065f46',
                  display: 'inline-block'
                }}
              >
                <strong>Đáp án chuẩn:</strong> {q.answer}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
};

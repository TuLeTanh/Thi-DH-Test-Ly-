import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { QuizResultState, QuestionItem, UserTfAnswer } from '../types';
import { RichText } from '../lib/RichText';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];
const STATEMENT_LABELS = ['a', 'b', 'c', 'd'];

export const Result: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as QuizResultState | undefined;

  if (!state || !state.questions) {
    return (
      <div className="quiz-container">
        <div className="question-card">
          <p>Không có dữ liệu kết quả bài làm.</p>
          <button type="button" className="btn-primary" onClick={() => navigate('/')}>
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  const { questions, userAnswers, correctTotal, totalQuestions, category, requestedCount } = state;

  // Lọc danh sách câu sai
  const wrongQuestions: QuestionItem[] = questions.filter((q) => {
    const ans = userAnswers[q.id];
    return !ans || !ans.isCorrect;
  });

  const percentage = Math.round((correctTotal / totalQuestions) * 100);

  const handleRetryWrong = () => {
    navigate('/practice', {
      state: {
        customQuestions: wrongQuestions,
        category,
        count: wrongQuestions.length
      }
    });
  };

  const handleNewSet = () => {
    navigate('/practice', {
      state: {
        category,
        count: requestedCount
      }
    });
  };

  return (
    <div className="quiz-container">
      <header className="app-header">
        <h1 className="app-title">Kết quả Luyện tập</h1>
        <p className="app-subtitle">Đánh giá theo chuẩn đáp án đề cương</p>
      </header>

      {/* Hộp điểm */}
      <section className="result-score-box">
        <div>Điểm số của bạn:</div>
        <div className="score-number">
          {correctTotal} / {totalQuestions}
        </div>
        <div style={{ color: '#64748b', fontSize: '0.95rem' }}>
          Đạt tỉ lệ chính xác {percentage}%
        </div>
      </section>

      {/* Các nút hành động */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
        {wrongQuestions.length > 0 && (
          <button
            type="button"
            className="btn-primary"
            style={{ width: '100%', padding: '12px' }}
            onClick={handleRetryWrong}
          >
            Làm lại các câu sai ({wrongQuestions.length} câu)
          </button>
        )}

        <button
          type="button"
          className="btn-secondary"
          style={{ width: '100%', padding: '12px' }}
          onClick={handleNewSet}
        >
          Luyện tập bộ mới
        </button>

        <button
          type="button"
          className="btn-secondary"
          style={{ width: '100%', padding: '12px' }}
          onClick={() => navigate('/')}
        >
          Về trang chủ
        </button>
      </div>

      {/* Danh sách các câu làm sai */}
      {wrongQuestions.length > 0 && (
        <section className="wrong-questions-section">
          <h2 style={{ fontSize: '1.2rem', marginBottom: '14px', color: 'var(--dp-color-wrong-text)' }}>
            Danh sách câu trả lời sai ({wrongQuestions.length})
          </h2>

          {wrongQuestions.map((q, idx) => {
            const ans = userAnswers[q.id];

            return (
              <div key={q.id} className="wrong-card">
                <div style={{ fontWeight: 700, marginBottom: '6px', fontSize: '0.95rem' }}>
                  Câu {idx + 1} (Gốc: #{q.srcNo})
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <RichText content={q.q} as="div" />
                </div>

                {/* Chi tiết đáp án đúng tùy theo loại */}
                {q.type === 'mcq' && (
                  <div style={{ fontSize: '0.9rem', color: '#065f46', marginTop: '6px' }}>
                    <strong>Đáp án đúng:</strong> {OPTION_LABELS[q.answer]}.{' '}
                    <RichText content={q.options[q.answer]} />
                  </div>
                )}

                {q.type === 'tf' && (
                  <div style={{ fontSize: '0.9rem', marginTop: '6px' }}>
                    <div style={{ fontWeight: 600, color: '#065f46', marginBottom: '4px' }}>
                      Đáp án đúng các ý:
                    </div>
                    {q.statements.map((stmt, sIdx) => {
                      const tfAns = ans as UserTfAnswer | undefined;
                      const userChoice = tfAns?.userSelections?.[sIdx];
                      const isStmtCorrect = userChoice === q.answers[sIdx];

                      return (
                        <div
                          key={sIdx}
                          style={{
                            fontSize: '0.85rem',
                            padding: '4px 0',
                            borderBottom: '1px dashed #e2e8f0'
                          }}
                        >
                          <strong>{STATEMENT_LABELS[sIdx]})</strong> <RichText content={stmt} />
                          <div style={{ marginLeft: 16 }}>
                            <span style={{ color: isStmtCorrect ? '#166534' : '#991b1b' }}>
                              Bạn chọn: {userChoice === null || userChoice === undefined ? 'Chưa chọn' : userChoice ? 'Đúng' : 'Sai'}
                            </span>
                            {' — '}
                            <span style={{ fontWeight: 600, color: '#166534' }}>
                              Đáp án: {q.answers[sIdx] ? 'Đúng' : 'Sai'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {q.type === 'short' && (
                  <div style={{ fontSize: '0.9rem', color: '#065f46', marginTop: '6px' }}>
                    <strong>Đáp án đúng:</strong> {q.answer}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}

      <footer className="result-footer-divider" aria-hidden="true">
        ✏ Ôn thi Vật lí 12 — Phác thảo ôn tập kiến thức KTGKI
      </footer>
    </div>
  );
};

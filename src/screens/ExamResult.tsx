import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ExamResultRouteState,
  McqQuestionItem,
  TfQuestionItem
} from '../types';
import { formatCountdown } from '../lib/exam';
import { RichText } from '../lib/RichText';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];
const STATEMENT_LABELS = ['a', 'b', 'c', 'd'];

export const ExamResult: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as ExamResultRouteState | undefined;
  const [filterOnlyIncorrect, setFilterOnlyIncorrect] = useState(false);

  if (!state || !state.gradingResult || !state.questions) {
    return (
      <div className="quiz-container">
        <div className="question-card">
          <p>Không tìm thấy kết quả bài thi thử.</p>
          <button type="button" className="btn-primary" onClick={() => navigate('/')}>
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  const { questions, gradingResult, timeSpentSeconds, autoSubmitted } = state;
  const { totalScore, part1Score, part2Score, part3Score, correctCount, details } = gradingResult;

  // Lọc câu hỏi nếu người dùng bật bộ lọc
  const displayedQuestions = filterOnlyIncorrect
    ? questions.filter((q) => {
        const detail = details[q.id];
        return !detail || !detail.isCorrect;
      })
    : questions;

  const handleRetakeExam = () => {
    navigate('/exam/intro');
  };

  return (
    <div className="quiz-container">
      <header className="app-header">
        <h1 className="app-title">Kết quả Bài Thi Thử</h1>
        <p className="app-subtitle">Đề kiểm tra giữa kì 1 — Chuẩn cấu trúc 28 câu</p>
      </header>

      {autoSubmitted && (
        <div className="feedback-banner warning" style={{ marginBottom: 16 }}>
          <span>⏱ Hết thời gian làm bài! Hệ thống đã tự động nộp bài của bạn.</span>
        </div>
      )}

      {/* Hộp điểm tổng kết */}
      <section className="result-score-box">
        <span style={{ fontSize: '0.95rem', color: '#64748b' }}>Tổng điểm đạt được:</span>
        <div className="score-number">{totalScore.toFixed(2)} / 10</div>
        <div style={{ fontSize: '0.95rem', color: '#334155' }}>
          Đúng hoàn toàn <strong>{correctCount} / {questions.length} câu</strong> • Thời gian làm bài: <strong>{formatCountdown(timeSpentSeconds)}</strong>
        </div>

        {/* Điểm từng phần */}
        <div className="score-breakdown-grid">
          <div className="score-breakdown-card">
            <div className="part-label">Phần I (MCQ)</div>
            <div className="part-points">{part1Score.toFixed(2)} / 4.5</div>
          </div>
          <div className="score-breakdown-card">
            <div className="part-label">Phần II (Đúng/Sai)</div>
            <div className="part-points">{part2Score.toFixed(2)} / 4.0</div>
          </div>
          <div className="score-breakdown-card">
            <div className="part-label">Phần III (Ngắn)</div>
            <div className="part-points">{part3Score.toFixed(2)} / 1.5</div>
          </div>
        </div>
      </section>

      {/* Các nút hành động */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <button
          type="button"
          className="btn-primary"
          style={{ flex: 1, padding: '12px' }}
          onClick={handleRetakeExam}
        >
          Làm đề mới
        </button>
        <button
          type="button"
          className="btn-secondary"
          style={{ flex: 1, padding: '12px' }}
          onClick={() => navigate('/')}
        >
          Về trang chủ
        </button>
      </div>

      {/* Bộ lọc xem lại */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          padding: '8px 12px',
          background: '#f8fafc',
          borderRadius: 8,
          border: '1px solid #e2e8f0'
        }}
      >
        <strong style={{ fontSize: '1rem', color: '#0f172a' }}>
          Chi tiết bài làm ({displayedQuestions.length}/{questions.length} câu)
        </strong>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.9rem' }}>
          <input
            type="checkbox"
            checked={filterOnlyIncorrect}
            onChange={(e) => setFilterOnlyIncorrect(e.target.checked)}
          />
          <span style={{ fontWeight: 600, color: '#dc2626' }}>Chỉ hiện câu sai/bỏ trống</span>
        </label>
      </div>

      {/* Danh sách từng câu */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
        {displayedQuestions.map((q) => {
          const originalIndex = questions.findIndex((item) => item.id === q.id);
          const detail = details[q.id];
          const isCorrect = detail?.isCorrect ?? false;
          const isAnswered = detail?.isAnswered ?? false;

          let statusBadgeClass = 'feedback-banner';
          let statusText = '';

          if (!isAnswered) {
            statusBadgeClass += ' warning';
            statusText = '⚠ Chưa trả lời (Bỏ trống) — 0 điểm';
          } else if (isCorrect) {
            statusBadgeClass += ' correct';
            statusText = `✓ Đúng hoàn toàn (+${detail.score.toFixed(2)}đ)`;
          } else {
            statusBadgeClass += ' wrong';
            statusText = `✗ Chưa chính xác (+${detail.score.toFixed(2)} / ${detail.maxScore.toFixed(2)}đ)`;
          }

          return (
            <div
              key={q.id}
              className="question-card"
              style={{
                borderColor: !isAnswered ? '#f59e0b' : isCorrect ? '#10b981' : '#ef4444'
              }}
            >
              <div className="question-meta">
                <span className="question-num">
                  Câu {originalIndex + 1}
                  <small style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: 6 }}>
                    (Gốc #{q.srcNo})
                  </small>
                </span>
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: !isAnswered ? '#fef3c7' : isCorrect ? '#dcfce7' : '#fee2e2',
                    color: !isAnswered ? '#b45309' : isCorrect ? '#166534' : '#991b1b'
                  }}
                >
                  {!isAnswered ? 'BỎ TRỐNG' : isCorrect ? 'ĐÚNG' : 'SAI'}
                </span>
              </div>

              {/* Đề bài */}
              <div className="question-prompt">
                <RichText content={q.q} as="div" />
              </div>

              {/* Ảnh minh họa nếu có */}
              {q.images && q.images.length > 0 && (
                <div style={{ textAlign: 'center', margin: '16px 0' }}>
                  <div className="question-image-box">
                    <div className="tape-decoration" aria-hidden="true" />
                    {q.images.map((img, i) => (
                      <img key={i} src={img} alt="Hình minh họa" className="question-image" />
                    ))}
                  </div>
                </div>
              )}

              {/* Chi tiết đáp án theo loại */}
              {q.type === 'mcq' && (
                <div style={{ marginTop: 12 }}>
                  <div className="options-list">
                    {(q as McqQuestionItem).options.map((opt, optIdx) => {
                      const userChoice = detail.userAnswer as number | null;
                      const expectedChoice = detail.expectedAnswer as number;
                      const isUserSelected = userChoice === optIdx;
                      const isExpected = expectedChoice === optIdx;

                      let optClass = 'option-btn';
                      let note = '';

                      if (isUserSelected && isExpected) {
                        optClass += ' selected-correct';
                        note = '✓ Bạn chọn (Đúng)';
                      } else if (isUserSelected && !isExpected) {
                        optClass += ' selected-wrong';
                        note = '✗ Bạn chọn (Sai)';
                      } else if (isExpected) {
                        optClass += ' revealed-correct';
                        note = '✓ Đáp án đúng';
                      }

                      return (
                        <div key={optIdx} className={optClass} style={{ cursor: 'default' }}>
                          <span className="option-letter">{OPTION_LABELS[optIdx]}</span>
                          <span className="option-content">
                            <RichText content={opt} />
                            {note && (
                              <strong style={{ marginLeft: 8, fontSize: '0.85rem' }}>{note}</strong>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {q.type === 'tf' && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 6, color: '#334155' }}>
                    Kết quả từng ý ({detail.correctStatementsCount ?? 0}/4 ý đúng):
                  </div>
                  <div className="tf-list">
                    {(q as TfQuestionItem).statements.map((stmt, sIdx) => {
                      const stmtDetail = detail.tfDetails?.[sIdx];
                      const userChoice = stmtDetail?.userChoice;
                      const expectedChoice = stmtDetail?.expectedChoice;
                      const isStmtCorrect = stmtDetail?.isCorrect;

                      return (
                        <div
                          key={sIdx}
                          style={{
                            padding: '8px 12px',
                            background: '#f8fafc',
                            borderRadius: 6,
                            border: '1px solid #e2e8f0',
                            fontSize: '0.9rem'
                          }}
                        >
                          <div>
                            <strong>{STATEMENT_LABELS[sIdx]})</strong> <RichText content={stmt} />
                          </div>
                          <div style={{ marginTop: 6, fontSize: '0.85rem', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            <span>
                              Bạn chọn:{' '}
                              <strong>
                                {userChoice === null ? '[Bỏ trống]' : userChoice ? 'Đúng' : 'Sai'}
                              </strong>
                            </span>
                            <span>
                              Đáp án:{' '}
                              <strong style={{ color: '#166534' }}>
                                {expectedChoice ? 'Đúng' : 'Sai'}
                              </strong>
                            </span>
                            <span style={{ fontWeight: 700, color: isStmtCorrect ? '#166534' : '#dc2626' }}>
                              {isStmtCorrect ? '✓ Đúng' : '✗ Sai'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {q.type === 'short' && (
                <div style={{ marginTop: 12, fontSize: '0.95rem' }}>
                  <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                    <div>
                      Câu trả lời của bạn:{' '}
                      <strong>{detail.userAnswer ? detail.userAnswer : '[Bỏ trống]'}</strong>
                    </div>
                    <div style={{ marginTop: 4, color: '#166534' }}>
                      Đáp án chính xác: <strong>{detail.expectedAnswer}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Banner trạng thái câu */}
              <div className={statusBadgeClass} style={{ marginTop: 12 }}>
                <span>{statusText}</span>
              </div>
            </div>
          );
        })}
      </div>

      <footer className="result-footer-divider" aria-hidden="true">
        ✏ Đề thi thử Vật lí 12 — Chuẩn cấu trúc KTGKI
      </footer>
    </div>
  );
};

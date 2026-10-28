import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import questionsDataRaw from '../data/questions.json';
import examConfigRaw from '../data/exam_config.json';
import {
  QuestionsData,
  QuestionItem,
  McqQuestionItem,
  TfQuestionItem,
  ExamUserAnswers
} from '../types';
import {
  ExamStructureConfig,
  generateExam,
  calculateRemainingSeconds,
  formatCountdown
} from '../lib/exam';
import { gradeExam, normalizeNumberString } from '../lib/grading';
import { RichText } from '../lib/RichText';

const questionsData = questionsDataRaw as unknown as QuestionsData;
const examConfig = examConfigRaw as unknown as ExamStructureConfig;

const OPTION_LABELS = ['A', 'B', 'C', 'D'];
const STATEMENT_LABELS = ['a', 'b', 'c', 'd'];

export const ExamTaking: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Khởi tạo thời gian làm bài (cho phép test nhanh qua query ?duration=)
  const durationMinutes = examConfig.duration_minutes || 50;
  const customDurationParam = searchParams.get('duration');
  const durationSeconds = customDurationParam
    ? parseInt(customDurationParam, 10)
    : durationMinutes * 60;

  // Khởi tạo đề thi ngẫu nhiên duy nhất khi mount
  const questions = useMemo<QuestionItem[]>(() => {
    return generateExam(questionsData, examConfig);
  }, []);

  const [currentIndex, setCurrentIndex] = useState(0);

  // Lưu trữ bài làm của thí sinh
  const [answers, setAnswers] = useState<ExamUserAnswers>({
    mcq: {},
    tf: {},
    short: {},
    flagged: {}
  });

  // Short answer warning for current question
  const [shortWarning, setShortWarning] = useState<string | null>(null);

  // Modal xác nhận nộp bài
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Quản lý đồng hồ timestamp
  const startTimeRef = useRef<number>(Date.now());
  const endTimeRef = useRef<number>(Date.now() + durationSeconds * 1000);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(durationSeconds);
  const isSubmittedRef = useRef<boolean>(false);

  // Quản lý aria-live thông báo mốc thời gian (10p, 5p, 1p)
  const announcedMilestonesRef = useRef<{ m10: boolean; m5: boolean; m1: boolean }>({
    m10: false,
    m5: false,
    m1: false
  });
  const [ariaAnnouncement, setAriaAnnouncement] = useState<string>('');

  // Beforeunload warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isSubmittedRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Timer loop dựa trên timestamp Date.now()
  useEffect(() => {
    const timer = setInterval(() => {
      if (isSubmittedRef.current) return;

      const now = Date.now();
      const remaining = calculateRemainingSeconds(endTimeRef.current, now);
      setRemainingSeconds(remaining);

      // Thông báo aria-live ở các mốc thời gian
      if (remaining <= 600 && remaining > 590 && !announcedMilestonesRef.current.m10) {
        announcedMilestonesRef.current.m10 = true;
        setAriaAnnouncement('Thông báo: Còn 10 phút làm bài.');
      } else if (remaining <= 300 && remaining > 290 && !announcedMilestonesRef.current.m5) {
        announcedMilestonesRef.current.m5 = true;
        setAriaAnnouncement('Cảnh báo: Còn 5 phút làm bài.');
      } else if (remaining <= 60 && remaining > 50 && !announcedMilestonesRef.current.m1) {
        announcedMilestonesRef.current.m1 = true;
        setAriaAnnouncement('Cảnh báo khẩn cấp: Còn 1 phút làm bài.');
      }

      // Hết giờ -> Tự động nộp bài
      if (remaining <= 0) {
        clearInterval(timer);
        handleFinalSubmit(true);
      }
    }, 500);

    return () => clearInterval(timer);
  }, []);

  const handleFinalSubmit = (autoSubmitted = false) => {
    if (isSubmittedRef.current) return;
    isSubmittedRef.current = true;

    const timeSpent = Math.min(
      durationSeconds,
      Math.floor((Date.now() - startTimeRef.current) / 1000)
    );

    const gradingResult = gradeExam(questions, answers, examConfig.scoring);

    navigate('/exam/result', {
      state: {
        questions,
        gradingResult,
        timeSpentSeconds: timeSpent,
        autoSubmitted
      },
      replace: true
    });
  };

  const currentQ = questions[currentIndex];

  // Xử lý câu trả lời MCQ (Bấm lại để bỏ chọn)
  const handleSelectMcq = (optIndex: number) => {
    setAnswers((prev) => {
      const currentChoice = prev.mcq[currentQ.id];
      const nextChoice = currentChoice === optIndex ? null : optIndex;
      return {
        ...prev,
        mcq: {
          ...prev.mcq,
          [currentQ.id]: nextChoice
        }
      };
    });
  };

  // Xử lý câu trả lời TF (Bấm lại để bỏ chọn)
  const handleSelectTf = (stmtIndex: number, choice: boolean) => {
    setAnswers((prev) => {
      const currentList = prev.tf[currentQ.id]
        ? [...prev.tf[currentQ.id]]
        : [null, null, null, null];
      const currentVal = currentList[stmtIndex];
      currentList[stmtIndex] = currentVal === choice ? null : choice;
      return {
        ...prev,
        tf: {
          ...prev.tf,
          [currentQ.id]: currentList
        }
      };
    });
  };

  // Xử lý câu trả lời Short
  const handleShortChange = (val: string) => {
    // Kiểm tra ký tự phi số
    const cleaned = val.trim();
    if (cleaned !== '') {
      const norm = normalizeNumberString(cleaned);
      if (isNaN(Number(norm))) {
        setShortWarning('Vui lòng chỉ nhập số (ví dụ: 2.5 hoặc 2,5).');
      } else {
        setShortWarning(null);
      }
    } else {
      setShortWarning(null);
    }

    setAnswers((prev) => ({
      ...prev,
      short: {
        ...prev.short,
        [currentQ.id]: val
      }
    }));
  };

  // Toggle cờ xem lại
  const toggleFlagCurrent = () => {
    setAnswers((prev) => ({
      ...prev,
      flagged: {
        ...prev.flagged,
        [currentQ.id]: !prev.flagged[currentQ.id]
      }
    }));
  };

  // Kiểm tra câu nào đã làm
  const isQuestionAnswered = (q: QuestionItem): boolean => {
    if (q.type === 'mcq') {
      return answers.mcq[q.id] !== null && answers.mcq[q.id] !== undefined;
    }
    if (q.type === 'tf') {
      const selections = answers.tf[q.id];
      return selections ? selections.some((s) => s !== null && s !== undefined) : false;
    }
    if (q.type === 'short') {
      return (answers.short[q.id] || '').trim() !== '';
    }
    return false;
  };

  // Thống kê số câu đã làm / chưa làm / gắn cờ
  const totalAnswered = questions.filter(isQuestionAnswered).length;
  const totalUnanswered = questions.length - totalAnswered;
  const totalFlagged = Object.values(answers.flagged).filter(Boolean).length;

  const isWarningTime = remainingSeconds <= 300; // Còn dưới 5 phút

  const getPartLabel = (idx: number) => {
    if (idx < 18) return 'Phần I (MCQ)';
    if (idx < 22) return 'Phần II (Đúng/Sai)';
    return 'Phần III (Trả lời ngắn)';
  };

  return (
    <div className="quiz-container">
      {/* Vùng thông báo aria-live cho bộ đọc màn hình */}
      <div className="sr-only" aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>
        {ariaAnnouncement}
      </div>

      {/* Sticky Header: Đồng hồ đếm ngược & nút nộp bài */}
      <header className="exam-sticky-header">
        <div className="timer-box">
          <span className={`timer-badge ${isWarningTime ? 'warning' : ''}`} aria-label="Thời gian còn lại">
            ⏱ {formatCountdown(remainingSeconds)}
          </span>
          {isWarningTime && (
            <span style={{ fontSize: '0.8rem', color: '#dc2626', fontWeight: 700 }}>
              Sắp hết giờ!
            </span>
          )}
        </div>

        <button
          type="button"
          className="btn-primary"
          style={{ padding: '8px 16px', fontSize: '0.95rem' }}
          onClick={() => setShowSubmitModal(true)}
        >
          Nộp bài
        </button>
      </header>

      {/* Bảng điều hướng 28 câu */}
      <section className="nav-grid-container" aria-label="Bảng điều hướng câu hỏi">
        <div className="nav-grid-title">
          <span>Bảng câu hỏi ({totalAnswered}/{questions.length} đã làm)</span>
          {totalFlagged > 0 && (
            <span style={{ color: '#b45309', fontWeight: 600, fontSize: '0.8rem' }}>
              ⚑ {totalFlagged} câu đánh dấu
            </span>
          )}
        </div>
        <div className="nav-grid">
          {questions.map((q, idx) => {
            const isActive = idx === currentIndex;
            const isAnswered = isQuestionAnswered(q);
            const isFlagged = !!answers.flagged[q.id];

            let cellClass = 'nav-cell';
            if (isActive) cellClass += ' active';
            if (isAnswered) cellClass += ' answered';

            return (
              <button
                key={q.id}
                type="button"
                className={cellClass}
                onClick={() => {
                  setCurrentIndex(idx);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                title={`Câu ${idx + 1} (${getPartLabel(idx)})`}
                aria-label={`Câu ${idx + 1}${isAnswered ? ', đã làm' : ', chưa làm'}${isFlagged ? ', có đánh dấu' : ''}`}
                aria-current={isActive ? 'step' : undefined}
              >
                {idx + 1}
                {isFlagged && <span className="flag-indicator">⚑</span>}
              </button>
            );
          })}
        </div>
      </section>

      {/* Thẻ câu hỏi hiện tại (1 câu / màn hình) */}
      <main className="question-card">
        <div className="question-meta">
          <span className="question-num">
            <span className="question-circle-num">{currentIndex + 1}</span>
            <span>Câu {currentIndex + 1} / {questions.length}</span>
            <small style={{ fontSize: '0.85rem', color: 'var(--dp-color-ink-muted)', marginLeft: 8 }}>
              ({getPartLabel(currentIndex)})
            </small>
          </span>

          <button
            type="button"
            className={`flag-btn ${answers.flagged[currentQ.id] ? 'flagged' : ''}`}
            onClick={toggleFlagCurrent}
            aria-pressed={!!answers.flagged[currentQ.id]}
          >
            {answers.flagged[currentQ.id] ? '⚑ Đã đánh dấu' : '⚐ Đánh dấu xem lại'}
          </button>
        </div>

        {/* Đề bài */}
        <div className="question-prompt">
          <RichText content={currentQ.q} as="div" />
        </div>

        {/* Ảnh minh họa nếu có */}
        {currentQ.images && currentQ.images.length > 0 && (
          <div style={{ textAlign: 'center', margin: '16px 0' }}>
            <div className="question-image-box">
              <div className="tape-decoration" aria-hidden="true" />
              {currentQ.images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`Hình minh họa câu hỏi ${currentQ.srcNo}`}
                  className="question-image"
                />
              ))}
            </div>
          </div>
        )}

        {/* Khối phương án theo loại (KHÔNG hiện đúng/sai) */}
        {currentQ.type === 'mcq' && (
          <div className="options-list" role="radiogroup" aria-label="Các phương án lựa chọn">
            {(currentQ as McqQuestionItem).options.map((opt, optIdx) => {
              const isSelected = answers.mcq[currentQ.id] === optIdx;
              return (
                <button
                  key={optIdx}
                  type="button"
                  className={`option-btn ${isSelected ? 'exam-selected' : ''}`}
                  onClick={() => handleSelectMcq(optIdx)}
                  aria-checked={isSelected}
                  role="radio"
                >
                  <span className="option-letter">{OPTION_LABELS[optIdx]}</span>
                  <span className="option-content">
                    <RichText content={opt} />
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {currentQ.type === 'tf' && (
          <div className="tf-list">
            {(currentQ as TfQuestionItem).statements.map((stmt, sIdx) => {
              const currentChoice = answers.tf[currentQ.id]?.[sIdx];
              return (
                <div key={sIdx} className="tf-row">
                  <div className="tf-text">
                    <span className="tf-label">{STATEMENT_LABELS[sIdx]})</span>
                    <div style={{ flex: 1 }}>
                      <RichText content={stmt} />
                    </div>
                  </div>

                  <div className="tf-actions">
                    <button
                      type="button"
                      className={`tf-btn ${currentChoice === true ? 'chosen' : ''}`}
                      onClick={() => handleSelectTf(sIdx, true)}
                      aria-label={`Ý ${STATEMENT_LABELS[sIdx]}: Đúng`}
                    >
                      Đúng
                    </button>
                    <button
                      type="button"
                      className={`tf-btn ${currentChoice === false ? 'chosen' : ''}`}
                      onClick={() => handleSelectTf(sIdx, false)}
                      aria-label={`Ý ${STATEMENT_LABELS[sIdx]}: Sai`}
                    >
                      Sai
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {currentQ.type === 'short' && (
          <div className="short-form">
            <div className="short-input-row">
              <input
                type="text"
                className="short-input"
                placeholder="Nhập số kết quả (chấp nhận dấu . hoặc ,)..."
                value={answers.short[currentQ.id] || ''}
                onChange={(e) => handleShortChange(e.target.value)}
                aria-label="Ô nhập kết quả số"
              />
            </div>
            {shortWarning && (
              <div className="feedback-banner warning" aria-live="polite">
                <span>⚠ {shortWarning}</span>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Điều hướng Trước / Sau / Nộp bài */}
      <footer style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, marginBottom: 32 }}>
        <button
          type="button"
          className="btn-secondary"
          disabled={currentIndex === 0}
          onClick={() => {
            setCurrentIndex((prev) => prev - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          ← Câu trước
        </button>

        {currentIndex < questions.length - 1 ? (
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setCurrentIndex((prev) => prev + 1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            Câu tiếp theo →
          </button>
        ) : (
          <button
            type="button"
            className="btn-primary"
            style={{ background: '#059669' }}
            onClick={() => setShowSubmitModal(true)}
          >
            Kiểm tra & Nộp bài
          </button>
        )}
      </footer>

      {/* Modal xác nhận nộp bài */}
      {showSubmitModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-submit-title">
          <div className="modal-box">
            <h3 id="modal-submit-title" className="modal-title">
              Xác nhận nộp bài thi
            </h3>
            <div className="modal-content">
              Bạn có chắc chắn muốn nộp bài thi không?
              <div className="modal-stats">
                <div className="modal-stat-row">
                  <span>Số câu đã làm:</span>
                  <strong>{totalAnswered} / {questions.length} câu</strong>
                </div>
                <div className="modal-stat-row" style={{ color: totalUnanswered > 0 ? '#dc2626' : '#166534' }}>
                  <span>Số câu chưa làm:</span>
                  <strong>{totalUnanswered} câu</strong>
                </div>
                <div className="modal-stat-row" style={{ color: '#b45309' }}>
                  <span>Số câu đang đánh dấu xem lại:</span>
                  <strong>{totalFlagged} câu</strong>
                </div>
                <div className="modal-stat-row">
                  <span>Thời gian còn lại:</span>
                  <strong>{formatCountdown(remainingSeconds)}</strong>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowSubmitModal(false)}
              >
                Tiếp tục làm bài
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setShowSubmitModal(false);
                  handleFinalSubmit(false);
                }}
              >
                Xác nhận nộp bài
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

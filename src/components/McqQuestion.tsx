import React from 'react';
import { McqQuestionItem, UserMcqAnswer } from '../types';
import { RichText } from '../lib/RichText';

interface McqQuestionProps {
  question: McqQuestionItem;
  userAnswer?: UserMcqAnswer;
  onAnswer: (answer: UserMcqAnswer) => void;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export const McqQuestion: React.FC<McqQuestionProps> = ({
  question,
  userAnswer,
  onAnswer
}) => {
  const isAnswered = userAnswer !== undefined;

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    const isCorrect = idx === question.answer;
    onAnswer({
      selectedIndex: idx,
      isCorrect
    });
  };

  return (
    <div className="question-content">
      <div className="question-prompt">
        <RichText content={question.q} as="div" />
      </div>

      {question.images && question.images.length > 0 && (
        <div style={{ textAlign: 'center', margin: '16px 0' }}>
          <div className="question-image-box">
            {/* Băng dính trang trí phong cách scrap paper */}
            <div className="tape-decoration" aria-hidden="true" />
            {question.images.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`Hình minh họa câu hỏi ${question.srcNo}`}
                className="question-image"
              />
            ))}
          </div>
        </div>
      )}

      <div className="options-list" role="radiogroup" aria-label="Các phương án lựa chọn">
        {question.options.map((opt, idx) => {
          let btnClass = 'option-btn';
          let indicatorBadge: React.ReactNode = null;

          if (isAnswered) {
            const isSelected = userAnswer.selectedIndex === idx;
            const isCorrectOption = idx === question.answer;

            if (isSelected) {
              btnClass += ' selected-choice'; // Lớp "đã chọn"
            }

            if (isSelected && isCorrectOption) {
              btnClass += ' selected-correct'; // Lớp "đúng"
              indicatorBadge = (
                <span style={{ marginLeft: 8, fontWeight: 700, color: 'var(--dp-color-correct-text)' }}>
                  ✓ [Đúng]
                </span>
              );
            } else if (isSelected && !isCorrectOption) {
              btnClass += ' selected-wrong'; // Lớp "sai"
              indicatorBadge = (
                <span style={{ marginLeft: 8, fontWeight: 700, color: 'var(--dp-color-wrong-text)' }}>
                  ✗ [Sai]
                </span>
              );
            } else if (isCorrectOption) {
              btnClass += ' revealed-correct';
              indicatorBadge = (
                <span style={{ marginLeft: 8, fontWeight: 700, color: 'var(--dp-color-correct-text)' }}>
                  ✓ [Đáp án đúng]
                </span>
              );
            }
          }

          return (
            <button
              key={idx}
              type="button"
              className={btnClass}
              onClick={() => handleSelect(idx)}
              disabled={isAnswered}
              aria-pressed={isAnswered && userAnswer.selectedIndex === idx}
            >
              <span className="option-letter">
                {OPTION_LABELS[idx]}
              </span>
              <span className="option-content">
                <RichText content={opt} />
                {indicatorBadge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Vùng thông báo phản hồi kết quả trực tiếp */}
      <div className="feedback-container" aria-live="polite" aria-atomic="true">
        {isAnswered && (
          <div className={`feedback-banner ${userAnswer.isCorrect ? 'correct' : 'wrong'}`}>
            <span>
              {userAnswer.isCorrect
                ? '✓ Đúng'
                : `✗ Sai, đáp án đúng: ${OPTION_LABELS[question.answer]}`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

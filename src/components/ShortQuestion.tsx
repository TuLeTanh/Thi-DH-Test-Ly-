import React, { useState } from 'react';
import { ShortQuestionItem, UserShortAnswer } from '../types';
import { RichText } from '../lib/RichText';
import { checkShortAnswer } from '../lib/grading';

interface ShortQuestionProps {
  question: ShortQuestionItem;
  userAnswer?: UserShortAnswer;
  onAnswer: (answer: UserShortAnswer) => void;
}

export const ShortQuestion: React.FC<ShortQuestionProps> = ({
  question,
  userAnswer,
  onAnswer
}) => {
  const [inputText, setInputText] = useState(userAnswer ? userAnswer.userText : '');
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const isAnswered = userAnswer !== undefined;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isAnswered) return;

    const evaluation = checkShortAnswer(inputText, question.answer);

    if (!evaluation.isValidNumber) {
      setWarningMessage('Vui lòng chỉ nhập số (ví dụ: 2.5 hoặc 2,5).');
      return;
    }

    setWarningMessage(null);
    onAnswer({
      userText: inputText,
      isCorrect: evaluation.isCorrect,
      isValidNumber: true
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

      <form className="short-form" onSubmit={handleSubmit}>
        <div className="short-input-row">
          <input
            type="text"
            className="short-input"
            placeholder="Nhập kết quả (số)..."
            value={isAnswered ? userAnswer.userText : inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              if (warningMessage) setWarningMessage(null);
            }}
            disabled={isAnswered}
            aria-label="Ô nhập kết quả trắc nghiệm trả lời ngắn"
          />
          <button
            type="submit"
            className="btn-primary"
            disabled={isAnswered || inputText.trim() === ''}
          >
            Kiểm tra
          </button>
        </div>

        {/* Cảnh báo nhập liệu không hợp lệ */}
        {warningMessage && (
          <div className="feedback-banner warning" aria-live="polite">
            <span>⚠ {warningMessage}</span>
          </div>
        )}

        {/* Kết quả sau khi kiểm tra */}
        <div className="feedback-container" aria-live="polite" aria-atomic="true">
          {isAnswered && (
            <div className={`feedback-banner ${userAnswer.isCorrect ? 'correct' : 'wrong'}`}>
              <span>
                {userAnswer.isCorrect
                  ? `✓ Đúng! Đáp án: ${question.answer}`
                  : `✗ Sai! Đáp án đúng: ${question.answer}`}
              </span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

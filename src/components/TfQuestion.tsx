import React from 'react';
import { TfQuestionItem, UserTfAnswer } from '../types';
import { RichText } from '../lib/RichText';
import { gradeTfStatements } from '../lib/grading';

interface TfQuestionProps {
  question: TfQuestionItem;
  userAnswer?: UserTfAnswer;
  onAnswer: (answer: UserTfAnswer) => void;
}

const STATEMENT_LABELS = ['a', 'b', 'c', 'd'];

export const TfQuestion: React.FC<TfQuestionProps> = ({
  question,
  userAnswer,
  onAnswer
}) => {
  const currentSelections: (boolean | null)[] = userAnswer
    ? userAnswer.userSelections
    : [null, null, null, null];

  const handleChooseStatement = (stmtIndex: number, choice: boolean) => {
    if (currentSelections[stmtIndex] !== null) return;

    const nextSelections = [...currentSelections];
    nextSelections[stmtIndex] = choice;

    const grading = gradeTfStatements(nextSelections, question.answers);

    onAnswer({
      userSelections: nextSelections,
      statementResults: grading.statementResults,
      correctCount: grading.correctCount,
      isCorrect: grading.isFullyCorrect
    });
  };

  const answeredCount = currentSelections.filter((s) => s !== null).length;
  const isAllAnswered = answeredCount === question.statements.length;

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

      <div className="tf-list">
        {question.statements.map((stmt, idx) => {
          const userChoice = currentSelections[idx];
          const hasAnsweredItem = userChoice !== null;
          const isItemCorrect = hasAnsweredItem && userChoice === question.answers[idx];

          return (
            <div key={idx} className="tf-row">
              <div className="tf-text">
                <span className="tf-label">{STATEMENT_LABELS[idx]})</span>
                <div style={{ flex: 1 }}>
                  <RichText content={stmt} />
                </div>
              </div>

              <div className="tf-actions">
                <button
                  type="button"
                  className={`tf-btn ${userChoice === true ? 'chosen' : ''}`}
                  onClick={() => handleChooseStatement(idx, true)}
                  disabled={hasAnsweredItem}
                  aria-label={`Ý ${STATEMENT_LABELS[idx]}: Chọn Đúng`}
                >
                  Đúng
                </button>
                <button
                  type="button"
                  className={`tf-btn ${userChoice === false ? 'chosen' : ''}`}
                  onClick={() => handleChooseStatement(idx, false)}
                  disabled={hasAnsweredItem}
                  aria-label={`Ý ${STATEMENT_LABELS[idx]}: Chọn Sai`}
                >
                  Sai
                </button>

                {hasAnsweredItem && (
                  <span
                    className={`tf-feedback ${isItemCorrect ? 'correct' : 'wrong'}`}
                    aria-live="polite"
                  >
                    {isItemCorrect ? (
                      '✓ [Đúng]'
                    ) : (
                      `✗ [Sai] (Đáp án: ${question.answers[idx] ? 'Đúng' : 'Sai'})`
                    )}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Thông báo tổng kết 4 ý khi hoàn tất */}
      <div className="feedback-container" aria-live="polite" aria-atomic="true">
        {isAllAnswered && userAnswer && (
          <div className={`feedback-banner ${userAnswer.isCorrect ? 'correct' : 'wrong'}`}>
            <span>
              {userAnswer.isCorrect
                ? `✓ Hoàn thành: ${userAnswer.correctCount}/4 ý đúng (Chính xác cả 4 ý)`
                : `✗ Kết quả: ${userAnswer.correctCount}/4 ý đúng`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

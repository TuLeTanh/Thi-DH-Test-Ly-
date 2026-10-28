import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import questionsDataRaw from '../data/questions.json';
import {
  QuestionItem,
  QuizCategory,
  QuestionsData,
  UserQuestionAnswer,
  UserMcqAnswer,
  UserTfAnswer,
  UserShortAnswer
} from '../types';
import { selectQuestions } from '../lib/shuffle';
import { McqQuestion } from '../components/McqQuestion';
import { TfQuestion } from '../components/TfQuestion';
import { ShortQuestion } from '../components/ShortQuestion';

const questionsData = questionsDataRaw as unknown as QuestionsData;

export const Practice: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const routeState = (location.state || {}) as {
    count?: number;
    category?: QuizCategory;
    customQuestions?: QuestionItem[];
  };

  const requestedCount = routeState.count || 10;
  const requestedCategory = routeState.category || 'all';

  // Khởi tạo danh sách câu hỏi một lần
  const questions = useMemo<QuestionItem[]>(() => {
    if (routeState.customQuestions && routeState.customQuestions.length > 0) {
      return routeState.customQuestions;
    }
    return selectQuestions(questionsData, requestedCategory, requestedCount);
  }, [routeState.customQuestions, requestedCategory, requestedCount]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, UserQuestionAnswer>>({});

  if (!questions || questions.length === 0) {
    return (
      <div className="quiz-container">
        <div className="question-card">
          <p>Không tìm thấy câu hỏi phù hợp.</p>
          <button type="button" className="btn-primary" onClick={() => navigate('/')}>
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const currentAnswer = userAnswers[currentQuestion.id];

  // Kiểm tra câu hiện tại đã hoàn thành trả lời chưa
  let isCurrentCompleted = false;
  if (currentQuestion.type === 'mcq') {
    isCurrentCompleted = currentAnswer !== undefined;
  } else if (currentQuestion.type === 'tf') {
    const tfAns = currentAnswer as UserTfAnswer | undefined;
    isCurrentCompleted =
      tfAns !== undefined &&
      tfAns.userSelections.filter((s) => s !== null).length === currentQuestion.statements.length;
  } else if (currentQuestion.type === 'short') {
    isCurrentCompleted = currentAnswer !== undefined;
  }

  const handleAnswerCurrent = (answer: UserQuestionAnswer) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: answer
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Hoàn thành quiz -> Chuyển sang kết quả
      let correctTotal = 0;
      for (const q of questions) {
        const ans = userAnswers[q.id];
        if (ans && ans.isCorrect) {
          correctTotal++;
        }
      }

      navigate('/result', {
        state: {
          questions,
          userAnswers,
          correctTotal,
          totalQuestions: questions.length,
          category: requestedCategory,
          requestedCount
        }
      });
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'mcq':
        return 'Trắc nghiệm 4 lựa chọn';
      case 'tf':
        return 'Đúng / Sai (4 ý)';
      case 'short':
        return 'Trả lời ngắn';
      default:
        return 'Câu hỏi';
    }
  };

  return (
    <div className="quiz-container">
      {/* Thanh tiến độ */}
      <div className="progress-bar-container">
        <span className="progress-text">
          Câu {currentIndex + 1}/{questions.length}
        </span>
        <button
          type="button"
          className="btn-secondary"
          style={{ padding: '6px 12px', fontSize: '0.875rem' }}
          onClick={() => navigate('/')}
        >
          Thoát
        </button>
      </div>

      {/* Thẻ câu hỏi */}
      <main className="question-card">
        <div className="question-meta">
          <span className="question-num">
            <span className="question-circle-num">{currentIndex + 1}</span>
            <span>Câu {currentIndex + 1}</span>
            <small style={{ fontSize: '0.85rem', color: 'var(--dp-color-ink-muted)', marginLeft: 6 }}>
              (Gốc: #{currentQuestion.srcNo})
            </small>
          </span>
          <span className="question-badge">{getQuestionTypeLabel(currentQuestion.type)}</span>
        </div>

        {currentQuestion.type === 'mcq' && (
          <McqQuestion
            key={currentQuestion.id}
            question={currentQuestion}
            userAnswer={currentAnswer as UserMcqAnswer | undefined}
            onAnswer={handleAnswerCurrent}
          />
        )}

        {currentQuestion.type === 'tf' && (
          <TfQuestion
            key={currentQuestion.id}
            question={currentQuestion}
            userAnswer={currentAnswer as UserTfAnswer | undefined}
            onAnswer={handleAnswerCurrent}
          />
        )}

        {currentQuestion.type === 'short' && (
          <ShortQuestion
            key={currentQuestion.id}
            question={currentQuestion}
            userAnswer={currentAnswer as UserShortAnswer | undefined}
            onAnswer={handleAnswerCurrent}
          />
        )}
      </main>

      {/* Nút hành động chuyển câu tiếp theo sau khi đã trả lời */}
      {isCurrentCompleted && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
          <button
            type="button"
            className="btn-primary"
            style={{ padding: '12px 24px', fontSize: '1.05rem' }}
            onClick={handleNext}
          >
            {currentIndex < questions.length - 1 ? 'Câu tiếp theo →' : 'Xem kết quả'}
          </button>
        </div>
      )}
    </div>
  );
};

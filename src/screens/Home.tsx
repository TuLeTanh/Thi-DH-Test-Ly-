import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuizCategory } from '../types';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCount, setSelectedCount] = useState<number>(10);
  const [selectedCategory, setSelectedCategory] = useState<QuizCategory>('all');

  const handleStartPractice = () => {
    navigate('/practice', {
      state: {
        count: selectedCount,
        category: selectedCategory
      }
    });
  };

  return (
    <div className="quiz-container">
      <header className="app-header">
        <div className="home-header-row">
          <div className="home-title-box">
            <h1 className="app-title">Ôn thi Vật lí 12</h1>
            {/* Gạch chân nét không đều phác thảo vẽ tay */}
            <svg
              className="sketch-underline-svg"
              viewBox="0 0 300 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M3 11C55 5 110 13 165 8C210 4 255 12 297 7"
                stroke="#c82b1d"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 14C65 10 120 15 180 12C225 10 260 14 288 12"
                stroke="#c82b1d"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeOpacity="0.7"
              />
            </svg>
          </div>

          {/* Cụm ghi chú nhỏ + 1 hình vẽ nét SVG inline */}
          <div className="home-postit-note">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#231f1d"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }}
            >
              {/* Doodle bóng đèn / nguyên tử phác thảo nét chì */}
              <path d="M9 18h6" />
              <path d="M10 22h4" />
              <path d="M12 2a7 7 0 0 0-7 7c0 2.5 1.5 4.5 3 6h8c1.5-1.5 3-3.5 3-6a7 7 0 0 0-7-7z" />
            </svg>
            <span style={{ fontWeight: 700 }}>KTGKI 12</span>
            <div style={{ fontSize: '0.8rem', color: '#444', marginTop: 2 }}>
              149 câu đề cương
            </div>
          </div>
        </div>

        <p className="app-subtitle">
          Chủ đề: Sự chuyển thể, Nội năng, Nhiệt độ & Khí lí tưởng (Chuẩn ma trận KTGKI)
        </p>
      </header>

      <main className="question-card">
        <section className="setup-group">
          <label id="category-label">1. Chọn hình thức luyện tập:</label>
          <div className="button-group" role="group" aria-labelledby="category-label">
            <button
              type="button"
              className={`select-btn ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              Tất cả các dạng
            </button>
            <button
              type="button"
              className={`select-btn ${selectedCategory === 'mcq' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('mcq')}
            >
              Trắc nghiệm 4 lựa chọn (MCQ)
            </button>
            <button
              type="button"
              className={`select-btn ${selectedCategory === 'tf' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('tf')}
            >
              Đúng / Sai (TF)
            </button>
            <button
              type="button"
              className={`select-btn ${selectedCategory === 'short' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('short')}
            >
              Trả lời ngắn (Short)
            </button>
          </div>
        </section>

        <section className="setup-group">
          <label id="count-label">2. Chọn số lượng câu hỏi:</label>
          <div className="button-group" role="group" aria-labelledby="count-label">
            <button
              type="button"
              className={`select-btn ${selectedCount === 10 ? 'active' : ''}`}
              onClick={() => setSelectedCount(10)}
            >
              10 câu
            </button>
            <button
              type="button"
              className={`select-btn ${selectedCount === 20 ? 'active' : ''}`}
              onClick={() => setSelectedCount(20)}
            >
              20 câu
            </button>
          </div>
        </section>

        {/* Mũi tên vẽ tay chỉ về nút hành động chính */}
        <div className="home-arrow-container" aria-hidden="true">
          <svg
            className="hand-drawn-arrow-svg"
            viewBox="0 0 60 45"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 6C24 16 34 26 38 34"
              stroke="#231f1d"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M26 35C33 36 38 34 44 26"
              stroke="#231f1d"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M38 34L39 22"
              stroke="#231f1d"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <button
            type="button"
            className="btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '1.25rem' }}
            onClick={handleStartPractice}
          >
            Bắt đầu luyện tập
          </button>

          <button
            type="button"
            className="btn-secondary"
            style={{ width: '100%', padding: '14px', fontSize: '1.15rem' }}
            onClick={() => navigate('/exam/intro')}
          >
            Thi thử chuẩn ma trận (50 phút / 28 câu)
          </button>
        </div>
      </main>
    </div>
  );
};

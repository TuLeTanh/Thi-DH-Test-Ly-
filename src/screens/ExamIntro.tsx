import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import examConfigRaw from '../data/exam_config.json';
import { ExamStructureConfig } from '../lib/exam';

const examConfig = examConfigRaw as unknown as ExamStructureConfig;

export const ExamIntro: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Cho phép truyền query param ?duration=... (giây) phục vụ test nhanh
  const durationParam = searchParams.get('duration');

  const handleStartExam = () => {
    navigate(durationParam ? `/exam/taking?duration=${durationParam}` : '/exam/taking');
  };

  const { duration_minutes, exam_structure, scoring } = examConfig;

  return (
    <div className="quiz-container">
      <header className="app-header">
        <h1 className="app-title">Thi thử chuẩn cấu trúc Đề thi</h1>
        <p className="app-subtitle">Môn Vật lí 12 — Đề kiểm tra giữa kì 1</p>
      </header>

      <main className="question-card">
        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: '1.2rem', margin: '0 0 10px 0', color: '#1e3a8a' }}>
            Thông tin bài thi
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
              background: '#f8fafc',
              padding: 14,
              borderRadius: 8,
              border: '1px solid #e2e8f0'
            }}
          >
            <div>
              <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Thời gian:</span>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                {durationParam ? `${durationParam} giây (Test)` : `${duration_minutes} phút`}
              </div>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Tổng số câu:</span>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                {exam_structure.total.num_questions} câu (40 lệnh hỏi)
              </div>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Thang điểm:</span>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                {exam_structure.total.max_score} điểm
              </div>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Hình thức:</span>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Trắc nghiệm online</div>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: '1.2rem', margin: '0 0 10px 0', color: '#1e3a8a' }}>
            Cấu trúc 3 phần thi
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Phần 1 */}
            <div
              style={{
                border: '1px solid #cbd5e1',
                padding: 12,
                borderRadius: 8,
                background: '#ffffff'
              }}
            >
              <div style={{ fontWeight: 700, color: '#0f172a' }}>
                Phần I: {exam_structure.part_1_mcq.name}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#475569', marginTop: 4 }}>
                • Gồm <strong>{exam_structure.part_1_mcq.num_questions} câu hỏi</strong> trắc nghiệm 4 lựa chọn (A, B, C, D).
                <br />
                • Mỗi câu đúng được <strong>{scoring.mcq_per_question} điểm</strong> (Tối đa {exam_structure.part_1_mcq.score}).
              </div>
            </div>

            {/* Phần 2 */}
            <div
              style={{
                border: '1px solid #cbd5e1',
                padding: 12,
                borderRadius: 8,
                background: '#ffffff'
              }}
            >
              <div style={{ fontWeight: 700, color: '#0f172a' }}>
                Phần II: {exam_structure.part_2_tf.name}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#475569', marginTop: 4 }}>
                • Gồm <strong>{exam_structure.part_2_tf.num_questions} câu hỏi</strong>, mỗi câu có 4 ý (a, b, c, d) chọn Đúng hoặc Sai.
                <br />
                • Cách tính điểm từng câu theo số ý đúng:
                <div style={{ margin: '4px 0 0 8px', fontSize: '0.85rem' }}>
                  - Đúng 1 ý: <strong>{scoring.tf_by_correct_statements['1']} điểm</strong>
                  <br />
                  - Đúng 2 ý: <strong>{scoring.tf_by_correct_statements['2']} điểm</strong>
                  <br />
                  - Đúng 3 ý: <strong>{scoring.tf_by_correct_statements['3']} điểm</strong>
                  <br />
                  - Đúng cả 4 ý: <strong>{scoring.tf_by_correct_statements['4']} điểm</strong>
                </div>
              </div>
            </div>

            {/* Phần 3 */}
            <div
              style={{
                border: '1px solid #cbd5e1',
                padding: 12,
                borderRadius: 8,
                background: '#ffffff'
              }}
            >
              <div style={{ fontWeight: 700, color: '#0f172a' }}>
                Phần III: {exam_structure.part_3_short.name}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#475569', marginTop: 4 }}>
                • Gồm <strong>{exam_structure.part_3_short.num_questions} câu hỏi</strong> trả lời ngắn (điền số kết quả).
                <br />
                • Mỗi câu đúng được <strong>{scoring.short_per_question} điểm</strong> (Tối đa {exam_structure.part_3_short.score}).
              </div>
            </div>
          </div>
        </section>

        <section
          style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: 8,
            padding: 12,
            marginBottom: 24,
            fontSize: '0.9rem',
            color: '#1e40af'
          }}
        >
          <strong>Lưu ý quan trọng:</strong>
          <ul style={{ margin: '6px 0 0 0', paddingLeft: 20 }}>
            <li>Trong khi làm bài, đáp án <strong>không hiển thị đúng/sai</strong>.</li>
            <li>Bạn có thể tự do thay đổi câu trả lời hoặc bỏ chọn trước khi nộp bài.</li>
            <li>Có cờ đánh dấu câu xem lại để tiện rà soát bằng bảng điều hướng 28 câu.</li>
            <li>Khi hết thời gian quy định, hệ thống sẽ <strong>tự động nộp bài</strong>.</li>
          </ul>
        </section>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            type="button"
            className="btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '1.1rem' }}
            onClick={handleStartExam}
          >
            Bắt đầu làm bài
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
      </main>
    </div>
  );
};

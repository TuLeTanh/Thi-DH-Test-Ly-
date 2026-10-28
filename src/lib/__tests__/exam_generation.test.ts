import { describe, it, expect } from 'vitest';
import {
  generateExam,
  calculateRemainingSeconds,
  formatCountdown,
  ExamStructureConfig
} from '../exam';
import { QuestionBank } from '../shuffle';
import { McqQuestionItem, TfQuestionItem, ShortQuestionItem } from '../../types';

const mockConfig: ExamStructureConfig = {
  duration_minutes: 50,
  exam_structure: {
    part_1_mcq: {
      name: 'Trắc nghiệm 4 lựa chọn',
      num_questions: 18,
      score: '4.5 điểm'
    },
    part_2_tf: {
      name: 'Trắc nghiệm đúng/sai',
      num_questions: 4,
      score: '4.0 điểm'
    },
    part_3_short: {
      name: 'Trả lời ngắn',
      num_questions: 6,
      score: '1.5 điểm'
    },
    total: {
      num_questions: 28,
      max_score: 10.0
    }
  },
  scoring: {
    mcq_per_question: 0.25,
    short_per_question: 0.25,
    tf_by_correct_statements: {
      '0': 0,
      '1': 0.1,
      '2': 0.25,
      '3': 0.5,
      '4': 1.0
    }
  }
};

const makeMockBank = (mcqCount: number, tfCount: number, shortCount: number): QuestionBank => ({
  mcq: Array.from({ length: mcqCount }, (_, i): McqQuestionItem => ({
    id: `mcq-${i + 1}`,
    srcNo: i + 1,
    type: 'mcq',
    topic: null,
    q: `MCQ ${i + 1}`,
    images: [],
    formulaImages: [],
    options: ['A', 'B', 'C', 'D'],
    answer: 0,
    needsReview: false
  })),
  tf: Array.from({ length: tfCount }, (_, i): TfQuestionItem => ({
    id: `tf-${i + 1}`,
    srcNo: i + 1,
    type: 'tf',
    topic: null,
    q: `TF ${i + 1}`,
    images: [],
    formulaImages: [],
    statements: ['a', 'b', 'c', 'd'],
    answers: [true, false, true, false],
    needsReview: false
  })),
  short: Array.from({ length: shortCount }, (_, i): ShortQuestionItem => ({
    id: `short-${i + 1}`,
    srcNo: i + 1,
    type: 'short',
    topic: null,
    q: `Short ${i + 1}`,
    images: [],
    formulaImages: [],
    answer: '1.0',
    needsReview: false
  }))
});

describe('Exam Generation - generateExam & validation', () => {
  it('generates exact 28 questions in strict order: 18 MCQ -> 4 TF -> 6 Short', () => {
    const bank = makeMockBank(30, 10, 10);
    const examQuestions = generateExam(bank, mockConfig);

    expect(examQuestions).toHaveLength(28);

    // Không trùng lặp
    const ids = examQuestions.map((q) => q.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(28);

    // Thứ tự Phần I: 18 câu đầu là MCQ
    for (let i = 0; i < 18; i++) {
      expect(examQuestions[i].type).toBe('mcq');
    }

    // Thứ tự Phần II: 4 câu tiếp là TF
    for (let i = 18; i < 22; i++) {
      expect(examQuestions[i].type).toBe('tf');
    }

    // Thứ tự Phần III: 6 câu cuối là Short
    for (let i = 22; i < 28; i++) {
      expect(examQuestions[i].type).toBe('short');
    }
  });

  it('throws descriptive error when question bank is insufficient', () => {
    // Ngân hàng chỉ có 10 câu MCQ (yêu cầu 18 câu)
    const insufficientBank = makeMockBank(10, 10, 10);

    expect(() => generateExam(insufficientBank, mockConfig)).toThrowError(
      /Ngân hàng câu hỏi MCQ không đủ: cần 18 câu nhưng chỉ có 10 câu/
    );
  });
});

describe('Exam Timer - calculateRemainingSeconds and formatCountdown', () => {
  it('calculates remaining seconds accurately from timestamps', () => {
    const now = 1000000;
    const endTime = now + 3000 * 1000; // 3000 giây sau (50 phút)

    const remaining = calculateRemainingSeconds(endTime, now);
    expect(remaining).toBe(3000);

    // Sau khi trôi qua 1000 giây
    const nowAfter1000s = now + 1000 * 1000;
    expect(calculateRemainingSeconds(endTime, nowAfter1000s)).toBe(2000);
  });

  it('returns 0 when time has expired (now >= endTime)', () => {
    const now = 1000000;
    const endTime = now; // Hết giờ ngay
    expect(calculateRemainingSeconds(endTime, now)).toBe(0);

    const nowLate = now + 5000; // Đã quá giờ
    expect(calculateRemainingSeconds(endTime, nowLate)).toBe(0);
  });

  it('formats remaining seconds to MM:SS correctly', () => {
    expect(formatCountdown(3000)).toBe('50:00');
    expect(formatCountdown(600)).toBe('10:00');
    expect(formatCountdown(299)).toBe('04:59');
    expect(formatCountdown(65)).toBe('01:05');
    expect(formatCountdown(9)).toBe('00:09');
    expect(formatCountdown(0)).toBe('00:00');
  });
});

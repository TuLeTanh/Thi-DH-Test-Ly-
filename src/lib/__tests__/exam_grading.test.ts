import { describe, it, expect } from 'vitest';
import { gradeExam } from '../grading';
import {
  QuestionItem,
  McqQuestionItem,
  TfQuestionItem,
  ShortQuestionItem,
  ExamUserAnswers
} from '../../types';

// Mock 28 câu chuẩn: 18 MCQ, 4 TF, 6 Short
const mockExamQuestions: QuestionItem[] = [
  ...Array.from({ length: 18 }, (_, i): McqQuestionItem => ({
    id: `mcq-test-${i + 1}`,
    srcNo: i + 1,
    type: 'mcq',
    topic: null,
    q: `Câu hỏi MCQ ${i + 1}`,
    images: [],
    formulaImages: [],
    options: ['A', 'B', 'C', 'D'],
    answer: i % 4, // 0, 1, 2, 3
    needsReview: false
  })),
  ...Array.from({ length: 4 }, (_, i): TfQuestionItem => ({
    id: `tf-test-${i + 1}`,
    srcNo: i + 1,
    type: 'tf',
    topic: null,
    q: `Câu hỏi TF ${i + 1}`,
    images: [],
    formulaImages: [],
    statements: ['ý a', 'ý b', 'ý c', 'ý d'],
    answers: [true, false, true, false],
    needsReview: false
  })),
  ...Array.from({ length: 6 }, (_, i): ShortQuestionItem => ({
    id: `short-test-${i + 1}`,
    srcNo: i + 1,
    type: 'short',
    topic: null,
    q: `Câu hỏi Short ${i + 1}`,
    images: [],
    formulaImages: [],
    answer: '2.52',
    needsReview: false
  }))
];

describe('Exam Grading - gradeExam pure function', () => {
  it('grades 10.0 for completely correct exam (all 28 questions)', () => {
    const perfectAnswers: ExamUserAnswers = {
      mcq: {},
      tf: {},
      short: {},
      flagged: {}
    };

    // Điền đúng 18 câu MCQ
    for (let i = 0; i < 18; i++) {
      perfectAnswers.mcq[`mcq-test-${i + 1}`] = i % 4;
    }

    // Điền đúng 4 câu TF (cả 4 ý đúng)
    for (let i = 0; i < 4; i++) {
      perfectAnswers.tf[`tf-test-${i + 1}`] = [true, false, true, false];
    }

    // Điền đúng 6 câu Short
    for (let i = 0; i < 6; i++) {
      perfectAnswers.short[`short-test-${i + 1}`] = '2.52';
    }

    const result = gradeExam(mockExamQuestions, perfectAnswers);

    expect(result.totalScore).toBe(10.0);
    expect(result.part1Score).toBe(4.5);
    expect(result.part2Score).toBe(4.0);
    expect(result.part3Score).toBe(1.5);
    expect(result.correctCount).toBe(28);
    expect(result.totalQuestions).toBe(28);
  });

  it('grades 0.0 for completely blank exam (all unanswered)', () => {
    const blankAnswers: ExamUserAnswers = {
      mcq: {},
      tf: {},
      short: {},
      flagged: {}
    };

    const result = gradeExam(mockExamQuestions, blankAnswers);

    expect(result.totalScore).toBe(0.0);
    expect(result.part1Score).toBe(0.0);
    expect(result.part2Score).toBe(0.0);
    expect(result.part3Score).toBe(0.0);
    expect(result.correctCount).toBe(0);

    for (const q of mockExamQuestions) {
      expect(result.details[q.id].isAnswered).toBe(false);
      expect(result.details[q.id].score).toBe(0);
    }
  });

  it('grades TF questions accurately at all statement levels (0, 1, 2, 3, 4 statements)', () => {
    const mixedTfAnswers: ExamUserAnswers = {
      mcq: {},
      tf: {
        'tf-test-1': [true, false, true, false], // 4 ý đúng -> 1.0đ
        'tf-test-2': [true, false, true, true],  // 3 ý đúng (ý d sai) -> 0.5đ
        'tf-test-3': [true, true, false, false], // 2 ý đúng (ý a đúng, d đúng, b sai, c sai) -> 0.25đ
        'tf-test-4': [false, true, false, false]  // 1 ý đúng (ý d đúng) -> 0.1đ
      },
      short: {},
      flagged: {}
    };

    const result = gradeExam(mockExamQuestions, mixedTfAnswers);

    expect(result.details['tf-test-1'].score).toBe(1.0);
    expect(result.details['tf-test-1'].isCorrect).toBe(true);

    expect(result.details['tf-test-2'].score).toBe(0.5);
    expect(result.details['tf-test-2'].isCorrect).toBe(false);

    expect(result.details['tf-test-3'].score).toBe(0.25);
    expect(result.details['tf-test-3'].isCorrect).toBe(false);

    expect(result.details['tf-test-4'].score).toBe(0.1);
    expect(result.details['tf-test-4'].isCorrect).toBe(false);

    // Tổng phần 2: 1.0 + 0.5 + 0.25 + 0.1 = 1.85
    expect(result.part2Score).toBe(1.85);
  });

  it('grades short answers with comma, dot, and tolerance', () => {
    const shortAnswers: ExamUserAnswers = {
      mcq: {},
      tf: {},
      short: {
        'short-test-1': '2.52',        // dấu chấm
        'short-test-2': '2,52',        // dấu phẩy
        'short-test-3': ' 2.520 ',     // số 0 thừa và khoảng trắng
        'short-test-4': '2.5203',      // sai số < 1e-3
        'short-test-5': '3.52',        // sai giá trị
        'short-test-6': 'abc'          // không phải số
      },
      flagged: {}
    };

    const result = gradeExam(mockExamQuestions, shortAnswers);

    expect(result.details['short-test-1'].score).toBe(0.25);
    expect(result.details['short-test-1'].isCorrect).toBe(true);

    expect(result.details['short-test-2'].score).toBe(0.25);
    expect(result.details['short-test-2'].isCorrect).toBe(true);

    expect(result.details['short-test-3'].score).toBe(0.25);
    expect(result.details['short-test-3'].isCorrect).toBe(true);

    expect(result.details['short-test-4'].score).toBe(0.25);
    expect(result.details['short-test-4'].isCorrect).toBe(true);

    expect(result.details['short-test-5'].score).toBe(0);
    expect(result.details['short-test-5'].isCorrect).toBe(false);

    expect(result.details['short-test-6'].score).toBe(0);
    expect(result.details['short-test-6'].isCorrect).toBe(false);

    // 4 câu đúng * 0.25 = 1.0 điểm
    expect(result.part3Score).toBe(1.0);
  });
});

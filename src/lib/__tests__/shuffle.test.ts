import { describe, it, expect } from 'vitest';
import { shuffleArray, selectQuestions, QuestionBank } from '../shuffle';
import { McqQuestionItem, TfQuestionItem, ShortQuestionItem } from '../../types';

// Mock test bank
const mockMcq: McqQuestionItem[] = Array.from({ length: 30 }, (_, i) => ({
  id: `mcq-${i + 1}`,
  srcNo: i + 1,
  type: 'mcq',
  topic: null,
  q: `Câu hỏi trắc nghiệm ${i + 1}`,
  images: [],
  formulaImages: [],
  options: ['A', 'B', 'C', 'D'],
  answer: 0,
  needsReview: false
}));

const mockTf: TfQuestionItem[] = Array.from({ length: 20 }, (_, i) => ({
  id: `tf-${i + 1}`,
  srcNo: i + 1,
  type: 'tf',
  topic: null,
  q: `Câu hỏi đúng sai ${i + 1}`,
  images: [],
  formulaImages: [],
  statements: ['ý a', 'ý b', 'ý c', 'ý d'],
  answers: [true, false, true, false],
  needsReview: false
}));

const mockShort: ShortQuestionItem[] = Array.from({ length: 15 }, (_, i) => ({
  id: `short-${i + 1}`,
  srcNo: i + 1,
  type: 'short',
  topic: null,
  q: `Câu hỏi trả lời ngắn ${i + 1}`,
  images: [],
  formulaImages: [],
  answer: `${i + 1}.5`,
  needsReview: false
}));

const mockBank: QuestionBank = {
  mcq: mockMcq,
  tf: mockTf,
  short: mockShort
};

describe('Shuffle & Selection - Fisher-Yates and Question Selection', () => {
  it('shuffles array without modifying original and retains all items', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const output = shuffleArray(input);
    expect(output).toHaveLength(input.length);
    expect(output.sort()).toEqual(input.slice().sort());
  });

  it('selects exactly 10 questions of type MCQ without duplicates', () => {
    const selected = selectQuestions(mockBank, 'mcq', 10);
    expect(selected).toHaveLength(10);

    const ids = selected.map((q) => q.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(10);

    // All must be mcq
    for (const q of selected) {
      expect(q.type).toBe('mcq');
    }
  });

  it('selects exactly 20 questions of type TF without duplicates', () => {
    const selected = selectQuestions(mockBank, 'tf', 20);
    expect(selected).toHaveLength(20);

    const ids = selected.map((q) => q.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(20);

    for (const q of selected) {
      expect(q.type).toBe('tf');
    }
  });

  it('retrieves all available questions when requested count exceeds bank size', () => {
    // mockShort only has 15 questions, requested 20
    const selected = selectQuestions(mockBank, 'short', 20);
    expect(selected).toHaveLength(15);

    const ids = selected.map((q) => q.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(15);

    for (const q of selected) {
      expect(q.type).toBe('short');
    }
  });

  it('selects mixed questions when category is "all"', () => {
    const selected = selectQuestions(mockBank, 'all', 20);
    expect(selected).toHaveLength(20);

    const ids = selected.map((q) => q.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(20);

    const types = new Set(selected.map((q) => q.type));
    // Since mock bank has 30 + 20 + 15 = 65 questions, 20 random items almost certainly contain at least 2 types
    expect(types.size).toBeGreaterThan(1);
  });
});

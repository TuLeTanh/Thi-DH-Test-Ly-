import { McqQuestionItem, TfQuestionItem, ShortQuestionItem, QuestionItem, QuizCategory } from '../types';

export function shuffleArray<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export interface QuestionBank {
  mcq: McqQuestionItem[];
  tf: TfQuestionItem[];
  short: ShortQuestionItem[];
}

export function selectQuestions(
  bank: QuestionBank,
  category: QuizCategory,
  count: number
): QuestionItem[] {
  let pool: QuestionItem[] = [];

  if (category === 'mcq') {
    pool = [...bank.mcq];
  } else if (category === 'tf') {
    pool = [...bank.tf];
  } else if (category === 'short') {
    pool = [...bank.short];
  } else {
    // 'all': gộp cả 3 loại
    pool = [...bank.mcq, ...bank.tf, ...bank.short];
  }

  // Shuffle bằng Fisher-Yates
  const shuffled = shuffleArray(pool);

  // Lấy tối đa count câu hỏi (nếu pool nhỏ hơn count thì lấy hết pool)
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

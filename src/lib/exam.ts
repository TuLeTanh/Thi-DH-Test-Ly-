import { QuestionBank, shuffleArray } from './shuffle';
import { QuestionItem } from '../types';

export interface ExamStructureConfig {
  duration_minutes: number;
  exam_structure: {
    part_1_mcq: {
      name: string;
      num_questions: number;
      score: string;
    };
    part_2_tf: {
      name: string;
      num_questions: number;
      score: string;
    };
    part_3_short: {
      name: string;
      num_questions: number;
      score: string;
    };
    total: {
      num_questions: number;
      max_score: number;
    };
  };
  scoring: {
    mcq_per_question: number;
    short_per_question: number;
    tf_by_correct_statements: Record<string | number, number>;
  };
}

/**
 * Sinh đề thi thử chuẩn cấu trúc từ config:
 * 18 MCQ -> 4 TF -> 6 Short
 * Xáo trộn từng phần bằng Fisher-Yates, KHÔNG xáo phương án A/B/C/D
 */
export function generateExam(
  bank: QuestionBank,
  config: ExamStructureConfig
): QuestionItem[] {
  const numMcq = config.exam_structure.part_1_mcq.num_questions;
  const numTf = config.exam_structure.part_2_tf.num_questions;
  const numShort = config.exam_structure.part_3_short.num_questions;

  if (bank.mcq.length < numMcq) {
    throw new Error(
      `Ngân hàng câu hỏi MCQ không đủ: cần ${numMcq} câu nhưng chỉ có ${bank.mcq.length} câu.`
    );
  }
  if (bank.tf.length < numTf) {
    throw new Error(
      `Ngân hàng câu hỏi TF không đủ: cần ${numTf} câu nhưng chỉ có ${bank.tf.length} câu.`
    );
  }
  if (bank.short.length < numShort) {
    throw new Error(
      `Ngân hàng câu hỏi Short không đủ: cần ${numShort} câu nhưng chỉ có ${bank.short.length} câu.`
    );
  }

  const shuffledMcq = shuffleArray(bank.mcq).slice(0, numMcq);
  const shuffledTf = shuffleArray(bank.tf).slice(0, numTf);
  const shuffledShort = shuffleArray(bank.short).slice(0, numShort);

  // Đúng thứ tự: Phần I (MCQ) -> Phần II (TF) -> Phần III (Short)
  return [...shuffledMcq, ...shuffledTf, ...shuffledShort];
}

/**
 * Tính số giây còn lại từ endTime và now (để testable và không lệch khi tab sleep)
 */
export function calculateRemainingSeconds(endTimeMs: number, nowMs: number): number {
  if (endTimeMs <= nowMs) {
    return 0;
  }
  return Math.max(0, Math.floor((endTimeMs - nowMs) / 1000));
}

/**
 * Định dạng số giây thành chuỗi MM:SS
 */
export function formatCountdown(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  const mm = mins < 10 ? `0${mins}` : `${mins}`;
  const ss = secs < 10 ? `0${secs}` : `${secs}`;
  return `${mm}:${ss}`;
}

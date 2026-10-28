export interface BaseQuestion {
  id: string;
  srcNo: number;
  topic: string | null;
  q: string;
  images: string[];
  formulaImages: string[];
  needsReview: boolean;
}

export interface McqQuestionItem extends BaseQuestion {
  type: 'mcq';
  options: string[];
  answer: number; // 0, 1, 2, 3 (A, B, C, D)
}

export interface TfQuestionItem extends BaseQuestion {
  type: 'tf';
  statements: string[];
  answers: boolean[]; // 4 booleans for a, b, c, d
}

export interface ShortQuestionItem extends BaseQuestion {
  type: 'short';
  answer: string;
  answerRaw?: string;
}

export type QuestionItem = McqQuestionItem | TfQuestionItem | ShortQuestionItem;

export type QuizCategory = 'all' | 'mcq' | 'tf' | 'short';

export interface QuestionsData {
  meta: {
    subject: string;
    source: string;
    generated: string;
  };
  mcq: McqQuestionItem[];
  tf: TfQuestionItem[];
  short: ShortQuestionItem[];
}

// Practice mode answers
export interface UserMcqAnswer {
  selectedIndex: number;
  isCorrect: boolean;
}

export interface UserTfAnswer {
  userSelections: (boolean | null)[];
  statementResults: boolean[];
  correctCount: number;
  isCorrect: boolean;
}

export interface UserShortAnswer {
  userText: string;
  isCorrect: boolean;
  isValidNumber: boolean;
}

export type UserQuestionAnswer = UserMcqAnswer | UserTfAnswer | UserShortAnswer;

export interface QuizResultState {
  questions: QuestionItem[];
  userAnswers: Record<string, UserQuestionAnswer>;
  correctTotal: number;
  totalQuestions: number;
  category: QuizCategory;
  requestedCount: number;
}

// Exam mode types
export interface ExamUserAnswers {
  mcq: Record<string, number | null>; // id -> selected option index or null
  tf: Record<string, (boolean | null)[]>; // id -> array of 4 booleans | null
  short: Record<string, string>; // id -> string input
  flagged: Record<string, boolean>; // id -> boolean flagged for review
}

export interface ExamTfStatementDetail {
  userChoice: boolean | null;
  expectedChoice: boolean;
  isCorrect: boolean;
}

export interface ExamQuestionGradeDetail {
  questionId: string;
  srcNo: number;
  type: 'mcq' | 'tf' | 'short';
  part: 1 | 2 | 3;
  isAnswered: boolean;
  isCorrect: boolean;
  score: number;
  maxScore: number;
  userAnswer: any;
  expectedAnswer: any;
  tfDetails?: ExamTfStatementDetail[];
  correctStatementsCount?: number;
}

export interface ExamGradingResult {
  totalScore: number; // rounded to 2 decimal places
  part1Score: number;
  part2Score: number;
  part3Score: number;
  correctCount: number;
  totalQuestions: number;
  details: Record<string, ExamQuestionGradeDetail>;
}

export interface ExamResultRouteState {
  questions: QuestionItem[];
  gradingResult: ExamGradingResult;
  timeSpentSeconds: number;
  autoSubmitted: boolean;
}

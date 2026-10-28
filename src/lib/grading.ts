import {
  QuestionItem,
  McqQuestionItem,
  TfQuestionItem,
  ShortQuestionItem,
  ExamUserAnswers,
  ExamGradingResult,
  ExamQuestionGradeDetail,
  ExamTfStatementDetail
} from '../types';

export interface ShortAnswerEvaluation {
  isValidNumber: boolean;
  isCorrect: boolean;
  normalizedUser: string;
  normalizedExpected: string;
}

export function normalizeNumberString(val: string): string {
  if (!val) return '';
  return val.trim().replace(/\s+/g, '').replace(/,/g, '.');
}

export function checkShortAnswer(userInput: string, expectedAnswer: string): ShortAnswerEvaluation {
  const normUser = normalizeNumberString(userInput);
  const normExpected = normalizeNumberString(expectedAnswer);

  if (normUser === '') {
    return {
      isValidNumber: false,
      isCorrect: false,
      normalizedUser: normUser,
      normalizedExpected: normExpected
    };
  }

  const userNum = Number(normUser);
  const expectedNum = Number(normExpected);

  const isUserValidNumber = !isNaN(userNum) && normUser !== '';
  const isExpectedValidNumber = !isNaN(expectedNum) && normExpected !== '';

  if (!isUserValidNumber) {
    // If user input is not a number
    return {
      isValidNumber: false,
      isCorrect: false,
      normalizedUser: normUser,
      normalizedExpected: normExpected
    };
  }

  if (isExpectedValidNumber) {
    // So sánh theo số với sai số rất nhỏ (1e-3)
    const diff = Math.abs(userNum - expectedNum);
    const isCorrect = diff < 1e-3;
    return {
      isValidNumber: true,
      isCorrect,
      normalizedUser: normUser,
      normalizedExpected: normExpected
    };
  }

  // Nếu đáp án gốc không phải số (fallback so sánh chuỗi chuẩn hóa)
  return {
    isValidNumber: true,
    isCorrect: normUser.toLowerCase() === normExpected.toLowerCase(),
    normalizedUser: normUser,
    normalizedExpected: normExpected
  };
}

export interface TfGradingResult {
  statementResults: boolean[];
  correctCount: number;
  isFullyCorrect: boolean;
  score: number;
}

export const TF_SCORING_TABLE: Record<number, number> = {
  0: 0,
  1: 0.1,
  2: 0.25,
  3: 0.5,
  4: 1.0
};

export function gradeTfStatements(
  userSelections: (boolean | null | undefined)[],
  expectedAnswers: boolean[]
): TfGradingResult {
  const statementResults: boolean[] = [];
  let correctCount = 0;

  for (let i = 0; i < expectedAnswers.length; i++) {
    // Nếu userSelections[i] là null/undefined thì không trùng khớp với expected boolean
    const isMatch = userSelections[i] !== null && userSelections[i] !== undefined && userSelections[i] === expectedAnswers[i];
    statementResults.push(isMatch);
    if (isMatch) {
      correctCount++;
    }
  }

  const isFullyCorrect = correctCount === expectedAnswers.length;
  const score = TF_SCORING_TABLE[correctCount] ?? 0;

  return {
    statementResults,
    correctCount,
    isFullyCorrect,
    score
  };
}

/**
 * Pure function để chấm toàn bộ bài thi thử
 */
export function gradeExam(
  questions: readonly QuestionItem[],
  answers: ExamUserAnswers,
  configScoring?: {
    mcq_per_question?: number;
    short_per_question?: number;
    tf_by_correct_statements?: Record<string | number, number>;
  }
): ExamGradingResult {
  const mcqScorePerQ = configScoring?.mcq_per_question ?? 0.25;
  const shortScorePerQ = configScoring?.short_per_question ?? 0.25;
  const tfScoring = configScoring?.tf_by_correct_statements ?? TF_SCORING_TABLE;

  let part1Score = 0;
  let part2Score = 0;
  let part3Score = 0;
  let correctCount = 0;

  const details: Record<string, ExamQuestionGradeDetail> = {};

  for (const q of questions) {
    if (q.type === 'mcq') {
      const mcqQ = q as McqQuestionItem;
      const userChoice = answers.mcq[q.id];
      const isAnswered = userChoice !== null && userChoice !== undefined;
      const isCorrect = isAnswered && userChoice === mcqQ.answer;
      const score = isCorrect ? mcqScorePerQ : 0;

      if (isCorrect) {
        correctCount++;
      }
      part1Score += score;

      details[q.id] = {
        questionId: q.id,
        srcNo: q.srcNo,
        type: 'mcq',
        part: 1,
        isAnswered,
        isCorrect,
        score,
        maxScore: mcqScorePerQ,
        userAnswer: userChoice,
        expectedAnswer: mcqQ.answer
      };
    } else if (q.type === 'tf') {
      const tfQ = q as TfQuestionItem;
      const userSelections = answers.tf[q.id] || [null, null, null, null];
      const isAnswered = userSelections.some((s) => s !== null && s !== undefined);

      const tfDetails: ExamTfStatementDetail[] = [];
      let stmtCorrectCount = 0;

      for (let i = 0; i < tfQ.answers.length; i++) {
        const uChoice = userSelections[i] ?? null;
        const eChoice = tfQ.answers[i];
        const isMatch = uChoice !== null && uChoice === eChoice;
        if (isMatch) {
          stmtCorrectCount++;
        }
        tfDetails.push({
          userChoice: uChoice,
          expectedChoice: eChoice,
          isCorrect: isMatch
        });
      }

      const score = Number(tfScoring[stmtCorrectCount] ?? 0);
      const isCorrect = stmtCorrectCount === tfQ.answers.length;

      if (isCorrect) {
        correctCount++;
      }
      part2Score += score;

      details[q.id] = {
        questionId: q.id,
        srcNo: q.srcNo,
        type: 'tf',
        part: 2,
        isAnswered,
        isCorrect,
        score,
        maxScore: 1.0,
        userAnswer: userSelections,
        expectedAnswer: tfQ.answers,
        tfDetails,
        correctStatementsCount: stmtCorrectCount
      };
    } else if (q.type === 'short') {
      const shortQ = q as ShortQuestionItem;
      const userText = answers.short[q.id] || '';
      const isAnswered = userText.trim() !== '';

      let isCorrect = false;
      if (isAnswered) {
        const evalRes = checkShortAnswer(userText, shortQ.answer);
        isCorrect = evalRes.isCorrect;
      }

      const score = isCorrect ? shortScorePerQ : 0;
      if (isCorrect) {
        correctCount++;
      }
      part3Score += score;

      details[q.id] = {
        questionId: q.id,
        srcNo: q.srcNo,
        type: 'short',
        part: 3,
        isAnswered,
        isCorrect,
        score,
        maxScore: shortScorePerQ,
        userAnswer: userText,
        expectedAnswer: shortQ.answer
      };
    }
  }

  // Làm tròn điểm 2 chữ số thập phân
  const rawTotal = part1Score + part2Score + part3Score;
  const totalScore = Math.round(rawTotal * 100) / 100;
  const roundedPart1 = Math.round(part1Score * 100) / 100;
  const roundedPart2 = Math.round(part2Score * 100) / 100;
  const roundedPart3 = Math.round(part3Score * 100) / 100;

  return {
    totalScore,
    part1Score: roundedPart1,
    part2Score: roundedPart2,
    part3Score: roundedPart3,
    correctCount,
    totalQuestions: questions.length,
    details
  };
}

import { describe, it, expect } from 'vitest';
import {
  normalizeNumberString,
  checkShortAnswer,
  gradeTfStatements
} from '../grading';

describe('Grading - Short Answer normalization & checking', () => {
  it('normalizes string with comma to dot', () => {
    expect(normalizeNumberString('2,52')).toBe('2.52');
    expect(normalizeNumberString(' 2,520 ')).toBe('2.520');
    expect(normalizeNumberString(' 0,07 ')).toBe('0.07');
  });

  it('matches valid short answer formats with decimal comma or dot', () => {
    const expected = '2.52';

    // "2.52" exact
    const evalExact = checkShortAnswer('2.52', expected);
    expect(evalExact.isValidNumber).toBe(true);
    expect(evalExact.isCorrect).toBe(true);

    // "2,52" with comma
    const evalComma = checkShortAnswer('2,52', expected);
    expect(evalComma.isValidNumber).toBe(true);
    expect(evalComma.isCorrect).toBe(true);

    // " 2.520 " with trailing zero and spaces
    const evalTrailing = checkShortAnswer(' 2.520 ', expected);
    expect(evalTrailing.isValidNumber).toBe(true);
    expect(evalTrailing.isCorrect).toBe(true);

    // " 2,52 " with comma and spaces
    const evalCommaSpaces = checkShortAnswer(' 2,52 ', expected);
    expect(evalCommaSpaces.isValidNumber).toBe(true);
    expect(evalCommaSpaces.isCorrect).toBe(true);
  });

  it('handles invalid non-numeric inputs gracefully', () => {
    const expected = '2.52';
    const evalAbc = checkShortAnswer('abc', expected);
    expect(evalAbc.isValidNumber).toBe(false);
    expect(evalAbc.isCorrect).toBe(false);

    const evalEmpty = checkShortAnswer('   ', expected);
    expect(evalEmpty.isValidNumber).toBe(false);
    expect(evalEmpty.isCorrect).toBe(false);
  });

  it('correctly marks wrong numeric values', () => {
    const expected = '2.52';
    const evalWrong = checkShortAnswer('5.12', expected);
    expect(evalWrong.isValidNumber).toBe(true);
    expect(evalWrong.isCorrect).toBe(false);
  });
});

describe('Grading - True/False statements grading', () => {
  const expectedAnswers = [true, false, true, true]; // Đ - S - Đ - Đ

  it('calculates score and correctness for 4/4 correct statements', () => {
    const userSelections = [true, false, true, true];
    const result = gradeTfStatements(userSelections, expectedAnswers);
    expect(result.correctCount).toBe(4);
    expect(result.isFullyCorrect).toBe(true);
    expect(result.score).toBe(1.0);
    expect(result.statementResults).toEqual([true, true, true, true]);
  });

  it('calculates score and correctness for 3/4 correct statements', () => {
    const userSelections = [true, false, true, false]; // 3 ý đúng, ý d sai
    const result = gradeTfStatements(userSelections, expectedAnswers);
    expect(result.correctCount).toBe(3);
    expect(result.isFullyCorrect).toBe(false);
    expect(result.score).toBe(0.5);
  });

  it('calculates score and correctness for 2/4 correct statements', () => {
    const userSelections = [true, true, false, true]; // 2 ý đúng, 2 ý sai
    const result = gradeTfStatements(userSelections, expectedAnswers);
    expect(result.correctCount).toBe(2);
    expect(result.isFullyCorrect).toBe(false);
    expect(result.score).toBe(0.25);
  });

  it('calculates score and correctness for 1/4 correct statements', () => {
    const userSelections = [false, true, false, true]; // 1 ý đúng (ý d)
    const result = gradeTfStatements(userSelections, expectedAnswers);
    expect(result.correctCount).toBe(1);
    expect(result.isFullyCorrect).toBe(false);
    expect(result.score).toBe(0.1);
  });

  it('calculates score and correctness for 0/4 correct statements', () => {
    const userSelections = [false, true, false, false]; // tất cả đều sai
    const result = gradeTfStatements(userSelections, expectedAnswers);
    expect(result.correctCount).toBe(0);
    expect(result.isFullyCorrect).toBe(false);
    expect(result.score).toBe(0);
  });
});

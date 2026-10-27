import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBudgetSummary,
  validateExpenseEntry,
  calculateEqualSplits,
  simplifyDebts,
} from '../src/utils/tripCalculations.js';

describe('Trip Planning Application - 10 Unit Tests (5 per Module)', () => {
  // =========================================================================
  // MODULE 1: Budget & Expense Tracking Module (5 Test Cases)
  // =========================================================================
  describe('Module 1: Budget & Expense Tracking Module', () => {
    // Case 1 [PASS]: calculateBudgetSummary - burn rate & balance
    test('Case 1 (PASS): computes burn rate and remaining balance within budget', () => {
      const expenses = [
        { cost: 4500 },
        { cost: 3000 },
        { cost: 11000 },
      ]; // total = 18500
      const summary = calculateBudgetSummary(25000, expenses, 5);

      assert.equal(summary.actualExpensesTotal, 18500);
      assert.equal(summary.avgCostPerDay, 3700); // 18500 / 5
      assert.equal(summary.remaining, 6500);
      assert.equal(summary.isOverBudget, false);
      assert.equal(summary.overAmount, 0);
    });

    // Case 2 [PASS]: calculateBudgetSummary - over-budget alert
    test('Case 2 (PASS): flags over-budget alert when expenses exceed target', () => {
      const expenses = [
        { cost: 15000 },
        { cost: 12200 },
      ]; // total = 27200
      const summary = calculateBudgetSummary(25000, expenses, 5);

      assert.equal(summary.actualExpensesTotal, 27200);
      assert.equal(summary.avgCostPerDay, 5440);
      assert.equal(summary.remaining, -2200);
      assert.equal(summary.isOverBudget, true);
      assert.equal(summary.overAmount, 2200);
    });

    // Case 3 [FAIL]: calculateBudgetSummary - percentage calculation
    // FAILS because pctUsed in calculateBudgetSummary was modified to omit '* 100'
    test('Case 3 (FAIL): accurately calculates percentage of budget consumed', () => {
      const expenses = [
        { cost: 4500 },
        { cost: 3000 },
        { cost: 11000 },
      ]; // total = 18500 out of 25000 -> 74%
      const summary = calculateBudgetSummary(25000, expenses, 5);

      // Expected: 74%, Actual from modified code: 1% (18500 / 25000 = 0.74 rounded to 1)
      assert.equal(summary.pctUsed, 74, 'Expected budget consumption to be 74%');
    });

    // Case 4 [PASS]: validateExpenseEntry - valid expense
    test('Case 4 (PASS): accepts valid expense within dates and recognized category', () => {
      const tripStart = '2026-11-01';
      const tripEnd = '2026-11-07';
      const validExpense = {
        title: 'Dinner at Bukhara Delhi',
        amount: 4500,
        category: 'food',
        date: '2026-11-03',
      };
      const result = validateExpenseEntry(validExpense, tripStart, tripEnd);

      assert.equal(result.valid, true);
      assert.equal(result.errors.length, 0);
    });

    // Case 5 [PASS]: validateExpenseEntry - rejection of invalid entries
    test('Case 5 (PASS): rejects negative amount, missing title, and invalid category', () => {
      const tripStart = '2026-11-01';
      const tripEnd = '2026-11-07';
      const invalidExpense = {
        title: '   ',
        amount: -250,
        category: 'luxury_casino',
        date: '2026-11-04',
      };
      const result = validateExpenseEntry(invalidExpense, tripStart, tripEnd);

      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes('Title is required')));
      assert.ok(result.errors.some((e) => e.includes('positive number')));
      assert.ok(result.errors.some((e) => e.includes('Invalid category')));
    });
  });

  // =========================================================================
  // MODULE 2: Group Trip & Expense Sharing Module (5 Test Cases)
  // =========================================================================
  describe('Module 2: Group Trip & Expense Sharing Module', () => {
    // Case 6 [PASS]: calculateEqualSplits - even division
    test('Case 6 (PASS): splits expense evenly when divisible without remainder', () => {
      const splits = calculateEqualSplits(2400, ['u1', 'u2', 'u3', 'u4']);

      assert.equal(splits.length, 4);
      splits.forEach((s) => assert.equal(s.amount, 600));
    });

    // Case 7 [FAIL]: calculateEqualSplits - penny remainder assignment
    // FAILS because calculateEqualSplits was modified to omit remainder distribution to the last member
    test('Case 7 (FAIL): splits ₹1,000 across 3 members with remainder assigned to last member', () => {
      const splits = calculateEqualSplits(1000, ['user_A', 'user_B', 'user_C']);

      assert.equal(splits.length, 3);
      assert.equal(splits[0].amount, 333.33);
      assert.equal(splits[1].amount, 333.33);
      // Expected: 333.34 for last member. Actual from modified code: 333.33 (summing to 999.99)
      assert.equal(splits[2].amount, 333.34, 'Expected last member to receive remainder penny (333.34)');

      const sum = splits.reduce((acc, s) => acc + s.amount, 0);
      assert.equal(Math.round(sum * 100) / 100, 1000, 'Sum of split shares must equal 1000');
    });

    // Case 8 [PASS]: calculateEqualSplits - boundary validation errors
    test('Case 8 (PASS): throws error for non-positive amount or empty members array', () => {
      assert.throws(() => calculateEqualSplits(-500, ['u1']), /greater than zero/);
      assert.throws(() => calculateEqualSplits(500, []), /At least one member/);
    });

    // Case 9 [PASS]: simplifyDebts - single-payer 3-way split simplification
    test('Case 9 (PASS): simplifies single-payer 3-way split into 2 direct settlements', () => {
      const members = [
        { user_id: 'A', user: { display_name: 'Aarav' } },
        { user_id: 'B', user: { display_name: 'Bhavna' } },
        { user_id: 'C', user: { display_name: 'Chirag' } },
      ];

      // Aarav pays ₹3,000 for dinner for Aarav, Bhavna, Chirag equally (₹1000 each)
      const sharedExpenses = [
        {
          id: 'exp-1',
          payer_id: 'A',
          amount: 3000,
          splits: [
            { user_id: 'A', amount: 1000 },
            { user_id: 'B', amount: 1000 },
            { user_id: 'C', amount: 1000 },
          ],
        },
      ];

      const { settlements } = simplifyDebts(members, sharedExpenses);

      assert.equal(settlements.length, 2);
      assert.ok(settlements.some((s) => s.from === 'B' && s.to === 'A' && s.amount === 1000));
      assert.ok(settlements.some((s) => s.from === 'C' && s.to === 'A' && s.amount === 1000));
    });

    // Case 10 [PASS]: simplifyDebts - circular debt minimization
    test('Case 10 (PASS): minimizes multi-transaction circular debts', () => {
      const members = [
        { user_id: 'A', user: { display_name: 'Aarav' } },
        { user_id: 'B', user: { display_name: 'Bhavna' } },
        { user_id: 'C', user: { display_name: 'Chirag' } },
      ];

      // A pays ₹1200 split among A, B, C (₹400 each)
      // B pays ₹600 split between A and B (₹300 each)
      // Net: A net +500, B net -100, C net -400
      const sharedExpenses = [
        {
          id: 'exp-1',
          payer_id: 'A',
          amount: 1200,
          splits: [
            { user_id: 'A', amount: 400 },
            { user_id: 'B', amount: 400 },
            { user_id: 'C', amount: 400 },
          ],
        },
        {
          id: 'exp-2',
          payer_id: 'B',
          amount: 600,
          splits: [
            { user_id: 'A', amount: 300 },
            { user_id: 'B', amount: 300 },
          ],
        },
      ];

      const { settlements } = simplifyDebts(members, sharedExpenses);

      assert.equal(settlements.length, 2);
      assert.ok(settlements.some((s) => s.from === 'C' && s.to === 'A' && s.amount === 400));
      assert.ok(settlements.some((s) => s.from === 'B' && s.to === 'A' && s.amount === 100));
    });
  });
});

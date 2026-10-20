import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBudgetSummary,
  validateExpenseEntry,
  calculateEqualSplits,
  simplifyDebts,
  validateBookingDates,
} from '../src/utils/tripCalculations.js';

describe('Trip Planning Application - Unit Tests', () => {
  // UNIT 1: calculateBudgetSummary [Budget & Expense Module]
  describe('Unit 1: calculateBudgetSummary(budgetTotal, expenses, tripDurationDays)', () => {
    test('computes burn rate and remaining balance within budget', () => {
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
      assert.equal(summary.pctUsed, 74);
    });

    test('flags over-budget alert when expenses exceed target', () => {
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
      assert.equal(summary.pctUsed, 109);
    });
  });

  // UNIT 2: validateExpenseEntry [Budget & Expense Module]
  describe('Unit 2: validateExpenseEntry(expense, tripStartDate, tripEndDate)', () => {
    const tripStart = '2026-11-01';
    const tripEnd = '2026-11-07';

    test('accepts valid expense within dates and category', () => {
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

    test('rejects negative amount, missing title, and invalid category', () => {
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

    test('rejects expense dated outside trip boundaries', () => {
      const outOfBoundsExpense = {
        title: 'Airport Taxi',
        amount: 800,
        category: 'transport',
        date: '2026-10-25', // Before trip start
      };
      const result = validateExpenseEntry(outOfBoundsExpense, tripStart, tripEnd);

      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes('cannot be earlier than trip start')));
    });
  });

  // UNIT 3: calculateEqualSplits [Group Trip & Expense Sharing Module]
  describe('Unit 3: calculateEqualSplits(totalAmount, memberIds)', () => {
    test('splits ₹1,000 across 3 members with remainder assigned to last member', () => {
      const splits = calculateEqualSplits(1000, ['user_A', 'user_B', 'user_C']);

      assert.equal(splits.length, 3);
      assert.equal(splits[0].amount, 333.33);
      assert.equal(splits[1].amount, 333.33);
      assert.equal(splits[2].amount, 333.34);

      // Verify exact sum without floating point leakage
      const sum = splits.reduce((acc, s) => acc + s.amount, 0);
      assert.equal(Math.round(sum * 100) / 100, 1000);
    });

    test('splits evenly when divisible', () => {
      const splits = calculateEqualSplits(2400, ['u1', 'u2', 'u3', 'u4']);

      assert.equal(splits.length, 4);
      splits.forEach((s) => assert.equal(s.amount, 600));
    });

    test('throws error for non-positive amount or empty members', () => {
      assert.throws(() => calculateEqualSplits(-500, ['u1']), /greater than zero/);
      assert.throws(() => calculateEqualSplits(500, []), /At least one member/);
    });
  });

  // UNIT 4: simplifyDebts [Group Trip & Expense Sharing Module]
  describe('Unit 4: simplifyDebts(members, sharedExpenses)', () => {
    test('simplifies single-payer 3-way split into 2 direct settlements', () => {
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

      // Only 2 transactions needed instead of complex pairwise swaps
      assert.equal(settlements.length, 2);
      assert.ok(settlements.some((s) => s.from === 'B' && s.to === 'A' && s.amount === 1000));
      assert.ok(settlements.some((s) => s.from === 'C' && s.to === 'A' && s.amount === 1000));
    });

    test('minimizes multi-transaction circular debts', () => {
      const members = [
        { user_id: 'A', user: { display_name: 'Aarav' } },
        { user_id: 'B', user: { display_name: 'Bhavna' } },
        { user_id: 'C', user: { display_name: 'Chirag' } },
      ];

      // A pays ₹1200 split among A, B, C (₹400 each)
      // B pays ₹600 split between A and B (₹300 each)
      // Net: A paid 1200, owes 400 + 300 = 700 -> net +500
      //      B paid 600, owes 400 + 300 = 700 -> net -100
      //      C paid 0, owes 400 -> net -400
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

  // UNIT 5 (Bonus): validateBookingDates [Bookings Management Module]
  describe('Unit 5 (Bonus): validateBookingDates(startDate, endDate, tripStartDate, tripEndDate)', () => {
    test('accepts valid hotel dates within trip duration', () => {
      const res = validateBookingDates('2026-11-02', '2026-11-05', '2026-11-01', '2026-11-10');
      assert.equal(res.valid, true);
      assert.equal(res.error, null);
      assert.equal(res.warnings.length, 0);
    });

    test('rejects check-out preceding check-in', () => {
      const res = validateBookingDates('2026-11-05', '2026-11-02', '2026-11-01', '2026-11-10');
      assert.equal(res.valid, false);
      assert.equal(res.error, 'Check-out/arrival date cannot precede start date.');
    });

    test('flags warnings when booking extends past trip boundaries', () => {
      const res = validateBookingDates('2026-10-30', '2026-11-12', '2026-11-01', '2026-11-10');
      assert.equal(res.valid, true);
      assert.equal(res.warnings.length, 2);
    });
  });
});

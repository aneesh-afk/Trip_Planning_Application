/**
 * Trip Planning Application - Core Algorithmic & Validation Units
 * Modules: Budget & Expense Tracking (4.4), Bookings Management (4.5), Group Trip & Expense Sharing (4.6)
 */

/**
 * Unit 1: calculateBudgetSummary
 * Module: Budget & Expense Tracking Module (Module 4.4)
 * Calculates total expenditure, average daily burn rate, remaining budget,
 * and over-budget alert status.
 */
export function calculateBudgetSummary(budgetTotal, expenses = [], tripDurationDays = 1) {
  const actualExpensesTotal = expenses.reduce((sum, exp) => sum + (Number(exp.cost || exp.amount) || 0), 0);
  const days = Math.max(1, Number(tripDurationDays) || 1);
  const avgCostPerDay = Math.round(actualExpensesTotal / days);
  const budget = Number(budgetTotal) || 0;
  const remaining = budget > 0 ? budget - actualExpensesTotal : 0;
  const isOverBudget = budget > 0 && actualExpensesTotal > budget;
  const overAmount = isOverBudget ? actualExpensesTotal - budget : 0;
  // INTENTIONAL BUG INJECTION FOR LAB TEST FAILURE DEMONSTRATION (Omitted * 100)
  // Original correct code: const pctUsed = budget > 0 ? Math.round((actualExpensesTotal / budget) * 100) : 0;
  const pctUsed = budget > 0 ? Math.round(actualExpensesTotal / budget) : 0;

  return {
    actualExpensesTotal,
    avgCostPerDay,
    remaining,
    isOverBudget,
    overAmount,
    pctUsed,
  };
}

/**
 * Unit 2: validateExpenseEntry
 * Module: Budget & Expense Tracking Module (Module 4.4)
 * Enforces business rules for logging actual expenses: positive amount, valid category,
 * non-empty title, and date within trip boundaries.
 */
export function validateExpenseEntry({ title, amount, category, date }, tripStartDate, tripEndDate) {
  const errors = [];
  const trimmedTitle = typeof title === 'string' ? title.trim() : '';

  if (!trimmedTitle) {
    errors.push('Title is required and cannot be empty.');
  } else if (trimmedTitle.length > 100) {
    errors.push('Title cannot exceed 100 characters.');
  }

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    errors.push('Amount must be a positive number greater than zero.');
  }

  const validCategories = ['food', 'transport', 'stay', 'activity', 'shopping', 'misc'];
  if (!category || !validCategories.includes(category.toLowerCase())) {
    errors.push(`Invalid category. Must be one of: ${validCategories.join(', ')}.`);
  }

  if (!date) {
    errors.push('Expense date is required.');
  } else {
    if (tripStartDate && date < tripStartDate) {
      errors.push(`Expense date (${date}) cannot be earlier than trip start date (${tripStartDate}).`);
    }
    if (tripEndDate && date > tripEndDate) {
      errors.push(`Expense date (${date}) cannot be later than trip end date (${tripEndDate}).`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Unit 3: calculateEqualSplits
 * Module: Group Trip & Expense Sharing Module (Module 4.6)
 * Divides an expense amount equally across participants, adjusting remaining paise/cents
 * on the last member to eliminate floating-point currency discrepancies.
 */
export function calculateEqualSplits(totalAmount, memberIds = []) {
  const amount = Number(totalAmount);
  if (isNaN(amount) || amount <= 0) {
    throw new Error('Total amount must be greater than zero.');
  }
  if (!memberIds || memberIds.length === 0) {
    throw new Error('At least one member is required to split the expense.');
  }

  const count = memberIds.length;
  const baseShare = Math.round((amount / count) * 100) / 100;
  
  return memberIds.map((userId, index) => {
    // INTENTIONAL BUG INJECTION FOR LAB TEST FAILURE DEMONSTRATION (Omitted remainder distribution)
    // Original correct code: const splitAmount = isLast ? Math.round((amount - baseShare * (count - 1)) * 100) / 100 : baseShare;
    const splitAmount = baseShare;

    return {
      userId,
      amount: splitAmount,
    };
  });
}

/**
 * Unit 4: simplifyDebts
 * Module: Group Trip & Expense Sharing Module (Module 4.6)
 * Greedy Debt Simplification Algorithm.
 * Computes net balances (totalPaid - totalShare) for all travelers,
 * partitions members into debtors and creditors, and pairs largest debtor with
 * largest creditor to resolve liabilities in minimum transactions (O(N)).
 */
export function simplifyDebts(members = [], sharedExpenses = []) {
  const balances = {};

  // Initialize members
  members.forEach((m) => {
    const uId = m.user_id || m.id;
    balances[uId] = {
      userId: uId,
      name: m.user?.display_name || m.name || uId,
      totalPaid: 0,
      totalShare: 0,
      netBalance: 0,
    };
  });

  // Accumulate paid and share amounts
  sharedExpenses.forEach((exp) => {
    const payerId = exp.payer_id;
    if (!balances[payerId]) {
      balances[payerId] = {
        userId: payerId,
        name: exp.payer?.display_name || payerId,
        totalPaid: 0,
        totalShare: 0,
        netBalance: 0,
      };
    }
    balances[payerId].totalPaid += Number(exp.amount) || 0;

    (exp.splits || []).forEach((split) => {
      const uId = split.user_id;
      if (!balances[uId]) {
        balances[uId] = {
          userId: uId,
          name: split.name || uId,
          totalPaid: 0,
          totalShare: 0,
          netBalance: 0,
        };
      }
      balances[uId].totalShare += Number(split.amount) || 0;
    });
  });

  // Calculate net balances: positive = receives money, negative = owes money
  Object.values(balances).forEach((b) => {
    b.netBalance = Math.round((b.totalPaid - b.totalShare) * 100) / 100;
  });

  const debtors = [];
  const creditors = [];

  Object.values(balances).forEach((b) => {
    if (b.netBalance < -0.01) {
      debtors.push({ userId: b.userId, name: b.name, amount: Math.abs(b.netBalance) });
    } else if (b.netBalance > 0.01) {
      creditors.push({ userId: b.userId, name: b.name, amount: b.netBalance });
    }
  });

  // Sort descending by magnitude
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const settlements = [];
  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];
    const settleAmount = Math.min(debtor.amount, creditor.amount);

    if (settleAmount > 0.01) {
      settlements.push({
        from: debtor.userId,
        fromName: debtor.name,
        to: creditor.userId,
        toName: creditor.name,
        amount: Math.round(settleAmount * 100) / 100,
      });
    }

    debtor.amount -= settleAmount;
    creditor.amount -= settleAmount;

    if (debtor.amount <= 0.01) dIdx++;
    if (creditor.amount <= 0.01) cIdx++;
  }

  return {
    balances: Object.values(balances),
    settlements,
  };
}

/**
 * Unit 5 (Bonus): validateBookingDates
 * Module: Accommodation & Transportation Bookings (Module 4.5)
 * Enforces booking lifecycle rules (checkOut >= checkIn) and date containment against trip duration.
 */
export function validateBookingDates(startDate, endDate, tripStartDate, tripEndDate) {
  if (!startDate || !endDate) {
    return { valid: false, error: 'Both start and end dates are required.', warnings: [] };
  }

  if (endDate < startDate) {
    return { valid: false, error: 'Check-out/arrival date cannot precede start date.', warnings: [] };
  }

  const warnings = [];
  if (tripStartDate && startDate < tripStartDate) {
    warnings.push(`Booking starts on ${startDate}, earlier than trip start (${tripStartDate}).`);
  }
  if (tripEndDate && endDate > tripEndDate) {
    warnings.push(`Booking ends on ${endDate}, later than trip end (${tripEndDate}).`);
  }

  return {
    valid: true,
    error: null,
    warnings,
  };
}

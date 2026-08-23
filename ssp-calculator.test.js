(function (global) {
  'use strict';

  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const calculate = input => global.SspCalculator.calculate(input);
  const common = { averageWeeklyEarnings: 500, sickDays: ['Monday', 'Tuesday'] };

  const weekdays = calculate({ ...common, qualifyingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] });
  assert(weekdays.payableDays === 2, 'Weekday pattern should count two payable qualifying days.');
  assert(weekdays.dailyEntitlement === weekdays.weeklyEntitlement / 5, 'Weekday daily rate should divide by five qualifying days.');

  const weekends = calculate({ ...common, qualifyingDays: ['Saturday', 'Sunday'] });
  assert(weekends.payableDays === 0, 'Weekend-only pattern should have no payable days for weekday sickness.');

  const irregular = calculate({ averageWeeklyEarnings: 500, qualifyingDays: ['Monday', 'Wednesday', 'Saturday'], sickDays: ['Wednesday', 'Saturday'] });
  assert(irregular.payableDays === 2, 'Irregular pattern should count matching qualifying days.');
  assert(irregular.estimate === irregular.dailyEntitlement * 2, 'Irregular pattern estimate should use its daily entitlement.');

  global.SspCalculatorTests = Object.freeze({ passed: true });
}(typeof globalThis !== 'undefined' ? globalThis : this));
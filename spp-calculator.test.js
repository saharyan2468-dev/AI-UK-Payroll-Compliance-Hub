(function (global) {
  'use strict';

  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const calculate = input => global.SppCalculator.calculate(input);

  const sevenDays = calculate({ averageWeeklyEarnings: 500, qualifyingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], weeks: 2 });
  assert(sevenDays.payableDays === 14, 'Seven-day pattern should count fourteen payable days over two weeks.');
  assert(sevenDays.estimate > 0, 'Seven-day pattern should produce an estimate.');

  const weekdays = calculate({ averageWeeklyEarnings: 500, qualifyingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], weeks: 2 });
  assert(weekdays.payableDays === 10, 'Five-day pattern should count ten payable days over two weeks.');
  assert(weekdays.estimate < sevenDays.estimate, 'Five-day pattern should produce fewer payable days.');

  const irregular = calculate({ averageWeeklyEarnings: 500, qualifyingDays: ['Monday', 'Wednesday', 'Saturday'], weeks: 1 });
  assert(irregular.payableDays === 3, 'Irregular pattern should count its repeated qualifying days.');

  global.SppCalculatorTests = Object.freeze({ passed: true });
}(typeof globalThis !== 'undefined' ? globalThis : this));
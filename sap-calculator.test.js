(function (global) {
  'use strict';

  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const calculate = input => global.SapCalculator.calculate(input);
  const common = { averageWeeklyEarnings: 500, weeks: 6 };

  const sevenDays = calculate({ ...common, qualifyingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] });
  assert(sevenDays.highRateDays === 42, 'Seven-day pattern should count all high-rate qualifying days.');
  assert(sevenDays.estimate > 0, 'Seven-day pattern should produce an estimate.');

  const weekdays = calculate({ ...common, qualifyingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] });
  assert(weekdays.highRateDays === 30, 'Five-day pattern should count five qualifying days per week.');
  assert(weekdays.estimate < sevenDays.estimate, 'Five-day pattern should produce fewer payable days.');

  const irregular = calculate({ averageWeeklyEarnings: 500, weeks: 1, qualifyingDays: ['Monday', 'Wednesday', 'Saturday'] });
  assert(irregular.highRateDays === 3, 'Irregular pattern should count its qualifying days.');

  global.SapCalculatorTests = Object.freeze({ passed: true });
}(typeof globalThis !== 'undefined' ? globalThis : this));
(function (global) {
  'use strict';

  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const calculate = input => global.NeonatalCalculator.calculate(input);
  const common = { averageWeeklyEarnings: 500, weeks: 2 };

  const sevenDays = calculate({ ...common, qualifyingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], neonatalCareDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] });
  assert(sevenDays.payableDays === 14, 'Seven-day pattern should count fourteen payable days over two weeks.');
  assert(sevenDays.estimate > 0, 'Seven-day pattern should produce an estimate.');

  const weekdays = calculate({ ...common, qualifyingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], neonatalCareDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] });
  assert(weekdays.payableDays === 10, 'Five-day pattern should count ten payable days over two weeks.');
  assert(weekdays.estimate < sevenDays.estimate, 'Five-day pattern should produce fewer payable days.');

  const irregular = calculate({ averageWeeklyEarnings: 500, weeks: 1, qualifyingDays: ['Monday', 'Wednesday', 'Saturday'], neonatalCareDays: ['Wednesday', 'Saturday'] });
  assert(irregular.payableDays === 2, 'Irregular pattern should count matching neonatal-care days.');

  global.NeonatalCalculatorTests = Object.freeze({ passed: true });
}(typeof globalThis !== 'undefined' ? globalThis : this));
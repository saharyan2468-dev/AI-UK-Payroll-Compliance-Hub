(function (global) {
  'use strict';

  const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  function nonNegative(value, field) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`${field} must be a non-negative number.`);
    return parsed;
  }

  function normalizeDays(days) {
    if (!Array.isArray(days) || days.length === 0) throw new Error('Qualifying days must contain at least one day.');
    const normalized = days.map(day => typeof day === 'number' ? DAY_NAMES[day] : String(day).trim().toLowerCase());
    if (normalized.some(day => !DAY_NAMES.includes(day))) throw new Error('Qualifying days contain an invalid day.');
    return [...new Set(normalized)];
  }

  function calculate(input) {
    const values = input || {};
    const taxYear = values.taxYear || '2026/27';
    const taxRules = global.PayrollRules?.taxYears[taxYear];
    const rules = taxRules?.statutoryPayments?.sap;
    if (!rules) throw new Error(`SAP rules are unavailable for tax year: ${taxYear}.`);
    const averageWeeklyEarnings = nonNegative(values.averageWeeklyEarnings, 'Average weekly earnings');
    const qualifyingDays = normalizeDays(values.qualifyingDays);
    const weeksInput = values.weeks === undefined || values.weeks === '' ? 1 : values.weeks;
    const weeks = Math.min(rules.totalPayableWeeks, nonNegative(weeksInput, 'Payable weeks'));
    const highRateWeeklyAmount = averageWeeklyEarnings * rules.higherRate;
    const standardWeeklyAmount = Math.min(highRateWeeklyAmount, rules.standardWeeklyRate);
    const highRateDays = Math.min(weeks, rules.higherRateWeeks) * qualifyingDays.length;
    const standardRateDays = Math.max(0, weeks - rules.higherRateWeeks) * qualifyingDays.length;
    const dailyHighRate = highRateWeeklyAmount / rules.qualifyingDaysPerWeek;
    const dailyStandardRate = standardWeeklyAmount / rules.qualifyingDaysPerWeek;
    const estimate = highRateDays * dailyHighRate + standardRateDays * dailyStandardRate;
    return {
      taxYear, paymentType: 'sap', averageWeeklyEarnings, qualifyingDays, weeks, highRateDays, standardRateDays,
      highRateWeeklyAmount, standardWeeklyAmount, estimate, total: estimate,
      assumptions: ['This is an SAP amount estimate, not an eligibility determination.', 'The supplied qualifying-day pattern repeats each week.', 'SAP eligibility, notice, employment, placement and adoption-related evidence are not determined.', `The ${taxYear} two-stage SAP rates are applied for the selected number of weeks.`],
      source: taxRules.source,
      effectivePeriod: `${taxRules.effectiveFrom} to ${taxRules.effectiveTo}`,
      calculationExplanation: `The first ${rules.higherRateWeeks} weeks use ${rules.higherRate * 100}% of average weekly earnings. The remaining weeks use the lower of ${rules.higherRate * 100}% of average weekly earnings or ${money(rules.standardWeeklyRate)}. Amounts are distributed across ${rules.qualifyingDaysPerWeek} SAP qualifying days per week; your ${qualifyingDays.length}-day pattern determines the estimated payable days.`
    };
  }

  function money(value) { return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value || 0); }
  global.SapCalculator = Object.freeze({ calculate, supportedTaxYears: global.PayrollRules.supportedTaxYears });
}(typeof globalThis !== 'undefined' ? globalThis : this));
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
    const rules = taxRules?.statutoryPayments?.spp;
    if (!rules) throw new Error(`SPP rules are unavailable for tax year: ${taxYear}.`);
    const averageWeeklyEarnings = nonNegative(values.averageWeeklyEarnings, 'Average weekly earnings');
    const qualifyingDays = normalizeDays(values.qualifyingDays);
    const weeksInput = values.weeks === undefined || values.weeks === '' ? 1 : values.weeks;
    const weeks = Math.min(rules.maximumPayableWeeks, nonNegative(weeksInput, 'Payable weeks'));
    const weeklyAmount = Math.min(rules.standardWeeklyRate, averageWeeklyEarnings * rules.earningsRate);
    const dailyAmount = weeklyAmount / rules.qualifyingDaysPerWeek;
    const payableDays = weeks * qualifyingDays.length;
    const estimate = dailyAmount * payableDays;
    return {
      taxYear, paymentType: 'spp', averageWeeklyEarnings, qualifyingDays, weeks, payableDays, weeklyAmount, dailyAmount, estimate, total: estimate,
      assumptions: ['This is an SPP amount estimate, not an eligibility determination.', 'The supplied qualifying-day pattern repeats each week.', 'SPP eligibility, notice, qualifying relationship, employment and leave-date rules are not determined.', `The ${taxYear} rate is capped at the statutory weekly rate and limited to two weeks.`],
      source: taxRules.source,
      effectivePeriod: `${taxRules.effectiveFrom} to ${taxRules.effectiveTo}`,
      calculationExplanation: `SPP uses the lower of ${(rules.earningsRate * 100).toFixed(0)}% of average weekly earnings or ${money(rules.standardWeeklyRate)} per week. The weekly amount is distributed across ${rules.qualifyingDaysPerWeek} qualifying days, then applied to ${payableDays} payable qualifying day(s) across ${weeks} week(s).`
    };
  }

  function money(value) { return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value || 0); }
  global.SppCalculator = Object.freeze({ calculate, supportedTaxYears: global.PayrollRules.supportedTaxYears });
}(typeof globalThis !== 'undefined' ? globalThis : this));
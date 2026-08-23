(function (global) {
  'use strict';

  const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  function nonNegative(value, field) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`${field} must be a non-negative number.`);
    return parsed;
  }

  function normalizeDays(days, field) {
    if (!Array.isArray(days) || days.length === 0) throw new Error(`${field} must contain at least one day.`);
    const normalized = days.map(day => typeof day === 'number' ? DAY_NAMES[day] : String(day).trim().toLowerCase());
    if (normalized.some(day => !DAY_NAMES.includes(day))) throw new Error(`${field} contains an invalid day.`);
    return [...new Set(normalized)];
  }

  function calculate(input) {
    const values = input || {};
    const taxYear = values.taxYear || '2026/27';
    const rules = global.PayrollRules?.taxYears[taxYear]?.statutoryPayments?.neonatal;
    if (!rules) throw new Error(`Neonatal Care Pay rules are unavailable for tax year: ${taxYear}.`);
    const averageWeeklyEarnings = nonNegative(values.averageWeeklyEarnings, 'Average weekly earnings');
    const qualifyingDays = normalizeDays(values.qualifyingDays, 'Qualifying days');
    const neonatalCareDays = normalizeDays(values.neonatalCareDays, 'Neonatal care days');
    const weeksInput = values.weeks === undefined || values.weeks === '' ? 1 : values.weeks;
    const weeks = Math.min(rules.maximumPayableWeeks, nonNegative(weeksInput, 'Payable weeks'));
    const payableDaysPerWeek = neonatalCareDays.filter(day => qualifyingDays.includes(day)).length;
    const weeklyAmount = Math.min(rules.standardWeeklyRate, averageWeeklyEarnings * rules.earningsRate);
    const dailyAmount = weeklyAmount / rules.qualifyingDaysPerWeek;
    const payableDays = weeks * payableDaysPerWeek;
    const estimate = dailyAmount * payableDays;
    return {
      taxYear, paymentType: 'neonatal', averageWeeklyEarnings, qualifyingDays, neonatalCareDays,
      weeks, payableDaysPerWeek, payableDays, weeklyAmount, dailyAmount, estimate, total: estimate,
      assumptions: ['This is a Statutory Neonatal Care Pay amount estimate, not an eligibility determination.', 'The supplied qualifying-day and neonatal-care-day patterns repeat each week.', 'Neonatal care, employment, notice, leave-date and parental eligibility evidence are not determined.', 'The 2026/27 rate is capped at the statutory weekly rate and limited to 12 weeks.'],
      calculationExplanation: `Neonatal Care Pay uses the lower of ${(rules.earningsRate * 100).toFixed(0)}% of average weekly earnings or ${money(rules.standardWeeklyRate)} per week. The weekly amount is divided across ${rules.qualifyingDaysPerWeek} days, then applied to ${payableDays} matching neonatal-care qualifying day(s) across ${weeks} week(s).`
    };
  }

  function money(value) { return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value || 0); }
  global.NeonatalCalculator = Object.freeze({ calculate, supportedTaxYears: Object.freeze(['2026/27']) });
}(typeof globalThis !== 'undefined' ? globalThis : this));
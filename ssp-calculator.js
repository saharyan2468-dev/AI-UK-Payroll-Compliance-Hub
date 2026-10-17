(function (global) {
  'use strict';

  const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  function nonNegative(value, field) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`${field} must be a non-negative number.`);
    return parsed;
  }

  function normalizeDays(days, field) {
    if (!Array.isArray(days) || days.length === 0) throw new Error(`${field} must contain at least one qualifying day.`);
    const normalized = days.map(day => {
      const value = typeof day === 'number' ? DAY_NAMES[day] : String(day).trim().toLowerCase();
      if (!DAY_NAMES.includes(value)) throw new Error(`${field} contains an invalid day.`);
      return value;
    });
    return [...new Set(normalized)];
  }

  function calculate(input) {
    const values = input || {};
    const taxYear = values.taxYear || '2026/27';
    const taxRules = global.PayrollRules?.taxYears[taxYear];
    const rules = taxRules?.statutoryPayments?.ssp;
    if (!rules) throw new Error(`SSP rules are unavailable for tax year: ${taxYear}.`);
    const averageWeeklyEarnings = nonNegative(values.averageWeeklyEarnings, 'Average weekly earnings');
    const qualifyingDays = normalizeDays(values.qualifyingDays, 'Qualifying days');
    const sickDays = normalizeDays(values.sickDays, 'Sick days');
    const sickQualifyingDays = sickDays.filter(day => qualifyingDays.includes(day));
    const payableDays = Math.max(0, sickQualifyingDays.length - rules.waitingDays);
    const weeklyEntitlement = rules.averageWeeklyEarningsRate == null
      ? rules.weeklyRate
      : Math.min(rules.weeklyRate, averageWeeklyEarnings * rules.averageWeeklyEarningsRate);
    const dailyEntitlement = weeklyEntitlement / qualifyingDays.length;
    const estimate = dailyEntitlement * payableDays;
    return {
      taxYear,
      averageWeeklyEarnings,
      qualifyingDays,
      sickDays,
      sickQualifyingDays,
      payableDays,
      weeklyEntitlement,
      dailyEntitlement,
      estimate,
      total: estimate,
      threshold: rules.lowerEarningsLimit,
      rate: rules.averageWeeklyEarningsRate,
      waitingDays: rules.waitingDays,
      assumptions: ['This is an SSP amount estimate, not an eligibility determination.', 'Qualifying days repeat as the supplied weekly pattern.', 'Sick days are matched to the supplied qualifying-day pattern.', rules.averageWeeklyEarningsRate == null ? `The ${taxYear} SSP rate and ${rules.waitingDays} waiting days are applied; the lower earnings eligibility test is not assessed.` : `The ${taxYear} rules use no waiting days and the lower of 80% of average weekly earnings or the statutory weekly rate.`],
      calculationExplanation: rules.averageWeeklyEarningsRate == null
        ? `The ${taxYear} weekly rate of ${rules.weeklyRate} is divided across ${qualifyingDays.length} qualifying day(s), then multiplied by ${payableDays} payable qualifying day(s) after ${rules.waitingDays} waiting days.`
        : `Average weekly earnings are multiplied by ${(rules.averageWeeklyEarningsRate * 100).toFixed(0)}% and capped at ${rules.weeklyRate} per week. That weekly entitlement is divided across ${qualifyingDays.length} qualifying day(s), then multiplied by ${payableDays} payable qualifying day(s).`,
      source: taxRules.source,
      effectivePeriod: `${taxRules.effectiveFrom} to ${taxRules.effectiveTo}`
    };
  }

  global.SspCalculator = Object.freeze({ calculate, supportedTaxYears: global.PayrollRules.supportedTaxYears });
}(typeof globalThis !== 'undefined' ? globalThis : this));
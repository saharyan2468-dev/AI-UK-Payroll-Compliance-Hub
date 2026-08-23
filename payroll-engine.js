(function (global) {
  'use strict';

  function nonNegativeNumber(value, field) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      throw new Error(`${field} must be a non-negative number.`);
    }
    return parsed;
  }

  function getRules(taxYear) {
    const rules = global.PayrollRules?.taxYears[taxYear || '2026/27'];
    if (!rules) throw new Error(`Unsupported tax year: ${taxYear}.`);
    return rules;
  }

  function calculatePaye(grossPay, rules, region) {
    const taxablePay = Math.max(0, grossPay - rules.paye.personalAllowance);
    const bands = rules.paye.regions[region || 'englandNorthernIreland'].bands;
    let remaining = taxablePay;
    let previousLimit = 0;
    let paye = 0;
    const breakdown = [];
    bands.forEach(band => {
      const taxableInBand = Math.max(0, Math.min(remaining, band.limit - previousLimit));
      if (taxableInBand > 0) breakdown.push({ taxablePay: taxableInBand, rate: band.rate, tax: taxableInBand * band.rate });
      paye += taxableInBand * band.rate;
      remaining -= taxableInBand;
      previousLimit = band.limit;
    });
    return { taxablePay, paye, breakdown };
  }

  function calculateEmployeeNi(grossPay, rules, category) {
    const categoryRules = rules.ni.categories[category];
    const mainBand = Math.min(Math.max(0, grossPay - rules.ni.employeePrimaryThreshold), rules.ni.employeeUpperEarningsLimit - rules.ni.employeePrimaryThreshold);
    const upperBand = Math.max(0, grossPay - rules.ni.employeeUpperEarningsLimit);
    return {
      total: mainBand * categoryRules.employeeMainRate + upperBand * categoryRules.employeeUpperRate,
      breakdown: [
        { name: 'Main band', threshold: rules.ni.employeePrimaryThreshold, earnings: mainBand, rate: categoryRules.employeeMainRate, contribution: mainBand * categoryRules.employeeMainRate },
        { name: 'Upper band', threshold: rules.ni.employeeUpperEarningsLimit, earnings: upperBand, rate: categoryRules.employeeUpperRate, contribution: upperBand * categoryRules.employeeUpperRate }
      ]
    };
  }

  function calculateEmployerNi(grossPay, rules, category) {
    const categoryRules = rules.ni.categories[category];
    const aboveSecondaryThreshold = Math.max(0, grossPay - categoryRules.employerThreshold);
    const reliefBand = categoryRules.employerReliefToUel ? Math.min(aboveSecondaryThreshold, rules.ni.employeeUpperEarningsLimit - categoryRules.employerThreshold) : 0;
    const standardBand = aboveSecondaryThreshold - reliefBand;
    return {
      total: reliefBand * 0 + standardBand * categoryRules.employerRate,
      breakdown: [
        { name: 'Secondary threshold to UEL', threshold: categoryRules.employerThreshold, earnings: reliefBand, rate: 0, contribution: 0 },
        { name: 'Employer NI band', threshold: categoryRules.employerReliefToUel ? rules.ni.employeeUpperEarningsLimit : categoryRules.employerThreshold, earnings: standardBand, rate: categoryRules.employerRate, contribution: standardBand * categoryRules.employerRate }
      ]
    };
  }

  function calculatePension(grossPay, rules, input) {
    const qualifyingPay = Math.min(Math.max(0, grossPay - rules.pension.lowerQualifyingEarnings), rules.pension.upperQualifyingEarnings - rules.pension.lowerQualifyingEarnings);
    const employeeRate = input.employeePensionRate ?? rules.pension.minimumEmployeeRate;
    const employerRate = input.employerPensionRate ?? rules.pension.minimumEmployerRate;
    if (!Number.isFinite(employeeRate) || !Number.isFinite(employerRate) || employeeRate < 0 || employerRate < 0) throw new Error('Pension rates must be non-negative numbers.');
    return { qualifyingPay, employeePension: qualifyingPay * employeeRate, employerPension: qualifyingPay * employerRate, pension: qualifyingPay * (employeeRate + employerRate) };
  }

  function calculatePensionOnly(input) {
    const values = input || {};
    const taxYear = values.taxYear || '2026/27';
    const rules = getRules(taxYear);
    if (!rules.pension) throw new Error(`Pension rules are unavailable for tax year: ${taxYear}.`);
    const pensionableEarnings = nonNegativeNumber(values.pensionableEarnings, 'pensionableEarnings');
    const qualifyingEarnings = values.qualifyingEarnings === '' || values.qualifyingEarnings === undefined
      ? Math.min(Math.max(0, pensionableEarnings - rules.pension.lowerQualifyingEarnings), rules.pension.upperQualifyingEarnings - rules.pension.lowerQualifyingEarnings)
      : nonNegativeNumber(values.qualifyingEarnings, 'qualifyingEarnings');
    const employeeRate = Number(values.employeeContributionRate);
    const employerRate = Number(values.employerContributionRate);
    if (!Number.isFinite(employeeRate) || employeeRate < 0 || !Number.isFinite(employerRate) || employerRate < 0) throw new Error('Employee and employer contribution rates must be non-negative numbers.');
    const contributionBase = qualifyingEarnings;
    return {
      pensionableEarnings,
      qualifyingEarnings,
      contributionBase,
      employeeContribution: contributionBase * (employeeRate / 100),
      employerContribution: contributionBase * (employerRate / 100),
      totalContribution: contributionBase * ((employeeRate + employerRate) / 100),
      salarySacrifice: Boolean(values.salarySacrifice),
      taxYear,
      assumptions: ['Pensionable earnings and qualifying earnings are treated as annual amounts.', 'Salary sacrifice reduces the contribution base by the amount entered.', 'The calculation does not model scheme-specific definitions, tax relief methods, rounding, or contribution caps.'],
      calculationExplanation: 'Employee and employer contributions are calculated separately from the selected contribution base. Qualifying earnings default to the tax-year qualifying earnings band. Salary sacrifice is recorded as an assumption; its tax treatment and scheme-specific calculation require further details.'
    };
  }

  function calculatePayroll(input) {
    const values = input || {};
    const taxYear = values.taxYear || '2026/27';
    const rules = getRules(taxYear);
    if (!rules.paye || !rules.ni || !rules.pension) throw new Error(`Payroll rules are incomplete for tax year: ${taxYear}.`);
    const grossPay = nonNegativeNumber(values.grossPay, 'grossPay');
    const category = String(values.niCategory || 'A').trim().toUpperCase();
    const categoryRules = rules.ni.categories[category];
    if (!categoryRules) throw new Error(`Unsupported NI category "${category}".`);
    const taxCode = String(values.taxCode || '1257L').trim().toUpperCase();
    if (!rules.paye.supportedTaxCodes.includes(taxCode)) throw new Error(`Unsupported tax code "${taxCode}". This calculator accurately supports standard 1257L only; no estimate was produced.`);
    const region = values.region || 'englandNorthernIreland';
    if (!rules.paye.regions[region]) throw new Error(`Unsupported PAYE region: ${region}.`);
    const payeResult = calculatePaye(grossPay, rules, region);
    const employeeNi = calculateEmployeeNi(grossPay, rules, category);
    const employerNi = calculateEmployerNi(grossPay, rules, category);
    const pensionResult = calculatePension(grossPay, rules, values);
    return {
      grossPay,
      taxablePay: payeResult.taxablePay,
      paye: payeResult.paye,
      employeeNi: employeeNi.total,
      employerNi: employerNi.total,
      pension: pensionResult.pension,
      netPay: grossPay - payeResult.paye - employeeNi.total - pensionResult.employeePension,
      assumptions: ['Annual gross pay includes bonus or other taxable pay.', `Tax code ${taxCode} is supported as the standard personal allowance code.`, `${region} PAYE bands are used.`, `NI category ${category} rates are used.`, 'Employer NI uses the category-specific secondary threshold and relief rules.', 'Pension uses qualifying earnings and minimum 5% employee / 3% employer rates.'],
      taxYear,
      calculationExplanation: 'PAYE is calculated after the personal allowance using the selected regional bands. Employee and employer NI use their respective thresholds. Pension contributions use the qualifying earnings band, and net pay subtracts PAYE, employee NI and the employee pension contribution.',
      payeBreakdown: payeResult.breakdown,
      employeeNiBreakdown: employeeNi.breakdown,
      employerNiBreakdown: employerNi.breakdown,
      niCategory: category
    };
  }

  global.PayrollEngine = Object.freeze({ calculatePayroll, calculatePensionOnly, supportedTaxYears: Object.freeze(Object.keys(global.PayrollRules.taxYears)) });
}(typeof globalThis !== 'undefined' ? globalThis : this));
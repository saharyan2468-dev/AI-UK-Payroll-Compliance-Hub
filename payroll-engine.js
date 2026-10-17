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

  function getPeriodsPerYear(payFrequency) {
    const periods = { annual: 1, monthly: 12, weekly: 52, fortnightly: 26, fourWeekly: 13, quarterly: 4, biannual: 2 };
    const count = periods[payFrequency];
    if (!count) throw new Error('Pay frequency must be annual, monthly, weekly, fortnightly, fourWeekly, quarterly, or biannual.');
    return count;
  }

  function remainingPersonalAllowance(annualGrossPay, rules) {
    let personalAllowance = rules.paye.personalAllowance;
    const taperThreshold = rules.paye.taperThreshold;
    if (taperThreshold != null && annualGrossPay > taperThreshold) {
      personalAllowance = Math.max(0, personalAllowance - Math.min(personalAllowance, (annualGrossPay - taperThreshold) / 2));
    }
    return personalAllowance;
  }

  function resolvePayeBands(rules, region, personalAllowance, periodsPerYear, periodsElapsed = 1) {
    const additionalTaxableLimit = Math.max(0, ((rules.paye.additionalRateThreshold ?? Infinity) - personalAllowance) / periodsPerYear * periodsElapsed);
    return rules.paye.regions[region || 'englandNorthernIreland'].bands.map(band => ({
      rate: band.rate,
      limit: band.limit === 'additionalRate' ? additionalTaxableLimit : band.limit === Infinity ? Infinity : band.limit / periodsPerYear * periodsElapsed
    }));
  }

  function parseTaxCode(taxCode) {
    const normalized = String(taxCode || '').trim().toUpperCase().replace(/\s+/g, '');
    const match = /^([SC]?)(K\d{1,5}|\d{1,5}[LMTN]|BR|D[0-3]|0T|NT|T)(W1|M1|X|NONCUM)?$/.exec(normalized);
    if (!match) return { valid: false, code: normalized, error: 'This does not match a supported UK PAYE tax-code structure.' };
    const prefix = match[1];
    const body = match[2];
    const basisSuffix = match[3] || '';
    if ((body === 'D2' || body === 'D3') && prefix !== 'S') return { valid: false, code: normalized, error: `${body} is only supported with the Scottish S prefix.` };
    if (body === 'NT' && prefix) return { valid: false, code: normalized, error: 'NT does not use a Scottish or Welsh prefix.' };
    const numericMatch = body === '0T' ? null : /^(\d+)([LMTN])$/.exec(body);
    const kMatch = /^K(\d+)$/.exec(body);
    const numericComponent = numericMatch ? Number(numericMatch[1]) : kMatch ? Number(kMatch[1]) : null;
    if ((numericMatch && numericComponent === 0) || (kMatch && numericComponent === 0)) return { valid: false, code: normalized, error: 'A numeric PAYE tax code must contain a positive allowance component.' };
    const suffix = numericMatch?.[2] || (kMatch ? 'K' : '');
    const specialCode = numericMatch || kMatch ? null : body;
    const codedAllowanceAnnual = numericMatch ? numericComponent * 10 : kMatch ? -numericComponent * 10 : 0;
    const taxBasis = basisSuffix === 'W1' ? 'week1' : basisSuffix === 'M1' ? 'month1' : basisSuffix === 'X' || basisSuffix === 'NONCUM' ? 'nonCumulative' : 'cumulative';
    return {
      valid: true,
      code: normalized,
      prefix,
      numericComponent,
      suffix,
      specialCode,
      codedAllowanceAnnual,
      allowanceType: kMatch ? 'negative' : numericMatch ? 'coded' : 'none',
      emergencyIndicator: ['W1', 'M1', 'X', 'NONCUM'].includes(basisSuffix),
      basisSuffix,
      taxBasis,
      taxRegime: prefix === 'S' ? 'scottish' : prefix === 'C' ? 'welsh' : 'uk'
    };
  }

  function explainTaxCode(taxCode) {
    const parsed = parseTaxCode(taxCode);
    if (!parsed.valid) return `${parsed.error} Check the employee’s HMRC coding notice.`;
    const regime = parsed.taxRegime === 'scottish' ? 'Scottish' : parsed.taxRegime === 'welsh' ? 'Welsh' : 'UK';
    let explanation;
    if (parsed.suffix === 'K') explanation = `${parsed.code} represents £${Math.abs(parsed.codedAllowanceAnnual).toLocaleString('en-GB')} of negative coded allowance, added to taxable pay.`;
    else if (parsed.suffix === 'T') explanation = `${parsed.code} represents £${parsed.codedAllowanceAnnual.toLocaleString('en-GB')} of coded allowance, and the T suffix means HMRC needs to review elements of the code. A coded allowance is not necessarily identical to the statutory Personal Allowance.`;
    else if (parsed.suffix) explanation = `${parsed.code} represents £${parsed.codedAllowanceAnnual.toLocaleString('en-GB')} of coded allowance. A coded allowance is not necessarily identical to the statutory Personal Allowance.`;
    else if (parsed.specialCode === 'BR') explanation = `${parsed.code} applies the basic rate to all taxable pay and provides no coded allowance. It is often used for a second job or pension, but the reason for this employee’s code cannot be inferred.`;
    else if (parsed.specialCode === 'D0') explanation = `${parsed.code} applies the higher-rate code to all taxable pay, without a coded allowance.`;
    else if (parsed.specialCode === 'D1') explanation = `${parsed.code} applies the additional-rate code to all taxable pay, without a coded allowance.`;
    else if (parsed.specialCode === 'D2') explanation = `${parsed.code} applies the Scottish advanced-rate code to all taxable pay, without a coded allowance.`;
    else if (parsed.specialCode === 'D3') explanation = `${parsed.code} applies the Scottish top-rate code to all taxable pay, without a coded allowance.`;
    else if (parsed.specialCode === '0T') explanation = `${parsed.code} provides no coded Personal Allowance; progressive tax bands apply from the first pound.`;
    else if (parsed.specialCode === 'NT') explanation = 'NT means no PAYE tax is deducted under this code.';
    else if (parsed.specialCode === 'T') explanation = 'T indicates that HMRC needs to review elements of the tax code; no specific reason for the review can be inferred from the code alone.';
    else explanation = `${parsed.code} represents a coded allowance that HMRC may review; the numeric component corresponds to £${parsed.codedAllowanceAnnual.toLocaleString('en-GB')}.`;
    if (parsed.prefix) explanation += ` The ${parsed.prefix} prefix selects ${regime} tax bands.`;
    if (parsed.basisSuffix) explanation += ` ${parsed.basisSuffix} means tax is calculated on a non-cumulative basis for the current pay period.`;
    explanation += ' The reason this code was issued or changed cannot be determined from the code alone; check the HMRC coding notice.';
    return explanation;
  }

  function resolveTaxRegion(parsedCode, selectedRegion) {
    if (parsedCode.prefix === 'S') return 'scotland';
    if (parsedCode.prefix === 'C') return 'wales';
    return selectedRegion;
  }

  function resolveFlatTaxRate(parsedCode, rules) {
    if (parsedCode.specialCode === 'BR') return rules.paye.basicRate;
    if (parsedCode.specialCode === 'D0') return parsedCode.prefix === 'S' ? rules.paye.regions.scotland.bands[2]?.rate : rules.paye.higherRate;
    if (parsedCode.specialCode === 'D1') return parsedCode.prefix === 'S' ? rules.paye.regions.scotland.bands[3]?.rate : rules.paye.additionalRate;
    if (parsedCode.specialCode === 'D2') return rules.paye.regions.scotland.bands[4]?.rate;
    if (parsedCode.specialCode === 'D3') return rules.paye.regions.scotland.bands[5]?.rate;
    return null;
  }

  function calculateBandTax(taxablePay, bands) {
    let remaining = taxablePay;
    let previousLimit = 0;
    let tax = 0;
    const breakdown = [];
    bands.forEach((band, index) => {
      const taxableInBand = Math.max(0, Math.min(remaining, band.limit - previousLimit));
      if (taxableInBand > 0) breakdown.push({ name: `${(band.rate * 100).toFixed(0)}% band`, taxablePay: taxableInBand, rate: band.rate, tax: taxableInBand * band.rate });
      tax += taxableInBand * band.rate;
      remaining -= taxableInBand;
      previousLimit = band.limit;
    });
    return { tax, breakdown };
  }

  function calculatePaye(grossPay, rules, region, payFrequency = 'annual', parsedCode = parseTaxCode('1257L'), input = {}) {
    const periodsPerYear = getPeriodsPerYear(payFrequency);
    const requestedBasis = input.taxBasis || 'codeDefault';
    const taxBasis = requestedBasis === 'codeDefault' ? parsedCode.taxBasis : requestedBasis;
    if (!['cumulative', 'week1', 'month1', 'nonCumulative'].includes(taxBasis)) throw new Error('Tax basis must be code default, cumulative, week1, month1, or nonCumulative.');
    const cumulative = taxBasis === 'cumulative';
    const elapsedInput = input.periodsElapsed === undefined || input.periodsElapsed === '' ? 1 : Number(input.periodsElapsed);
    if (!Number.isInteger(elapsedInput) || elapsedInput < 1 || elapsedInput > periodsPerYear) throw new Error(`Periods elapsed must be a whole number from 1 to ${periodsPerYear}.`);
    const periodsElapsed = cumulative ? elapsedInput : 1;
    if (cumulative && periodsElapsed > 1 && (input.grossPayToDate === undefined || input.grossPayToDate === '')) throw new Error('Enter gross pay to date when cumulative periods elapsed is greater than one.');
    if (cumulative && periodsElapsed > 1 && (input.taxPaidToDate === undefined || input.taxPaidToDate === '')) throw new Error('Enter PAYE already paid when cumulative periods elapsed is greater than one.');
    const grossPayToDate = cumulative && input.grossPayToDate !== undefined && input.grossPayToDate !== ''
      ? nonNegativeNumber(input.grossPayToDate, 'grossPayToDate')
      : grossPay;
    if (cumulative && grossPayToDate < grossPay) throw new Error('Gross pay to date cannot be less than current-period gross pay.');
    const taxPaidToDate = cumulative && input.taxPaidToDate !== undefined && input.taxPaidToDate !== ''
      ? nonNegativeNumber(input.taxPaidToDate, 'taxPaidToDate')
      : 0;
    const standardAllowanceCode = parsedCode.suffix === 'L' && parsedCode.codedAllowanceAnnual === rules.paye.personalAllowance;
    const effectiveAnnualAllowance = standardAllowanceCode
      ? remainingPersonalAllowance(grossPay * periodsPerYear, rules)
      : parsedCode.codedAllowanceAnnual;
    const allowancePerPeriod = standardAllowanceCode
      ? effectiveAnnualAllowance < rules.paye.personalAllowance
        ? effectiveAnnualAllowance / periodsPerYear
        : (rules.paye.periodicPersonalAllowance[payFrequency] ?? effectiveAnnualAllowance / periodsPerYear)
      : parsedCode.codedAllowanceAnnual / periodsPerYear;
    const allowance = allowancePerPeriod * periodsElapsed;
    const taxablePayToDate = Math.max(0, grossPayToDate - allowance);
    const currentPeriodTaxablePay = Math.max(0, grossPay - allowancePerPeriod);
    let taxToDate = 0;
    let breakdown = [];
    const flatRate = resolveFlatTaxRate(parsedCode, rules);
    if (parsedCode.specialCode === 'NT') {
      taxToDate = 0;
    } else if (flatRate !== null) {
      taxToDate = (cumulative ? grossPayToDate : grossPay) * flatRate;
      breakdown = [{ name: `${(flatRate * 100).toFixed(0)}% flat-rate code`, taxablePay: cumulative ? grossPayToDate : grossPay, rate: flatRate, tax: taxToDate }];
    } else {
      const taxablePay = cumulative ? taxablePayToDate : currentPeriodTaxablePay;
      const bands = resolvePayeBands(rules, region, effectiveAnnualAllowance, periodsPerYear, periodsElapsed);
      const result = calculateBandTax(taxablePay, bands);
      taxToDate = result.tax;
      breakdown = result.breakdown;
    }
    const taxPaidThisPeriod = cumulative ? taxToDate - taxPaidToDate : taxToDate;
    const kCodeLimit = parsedCode.suffix === 'K' ? grossPay * rules.paye.kCodeDeductionLimit : null;
    const paye = kCodeLimit !== null && taxPaidThisPeriod > 0 ? Math.min(taxPaidThisPeriod, kCodeLimit) : taxPaidThisPeriod;
    return {
      personalAllowance: allowancePerPeriod,
      annualPersonalAllowance: effectiveAnnualAllowance,
      taperApplied: false,
      taxablePay: cumulative ? taxablePayToDate : currentPeriodTaxablePay,
      currentPeriodTaxablePay,
      grossPayToDate,
      taxPaidToDate,
      periodsElapsed,
      taxBasis,
      paye,
      taxToDate,
      payeBeforeKCodeLimit: taxPaidThisPeriod,
      kCodeLimit,
      kCodeLimitApplied: kCodeLimit !== null && paye < taxPaidThisPeriod,
      breakdown
    };
  }

  function calculateEmployeeNi(grossPay, rules, category, payFrequency = 'annual') {
    const categoryRules = rules.ni.categories[category];
    const thresholds = rules.ni.periodicThresholds[payFrequency];
    if (!thresholds) throw new Error(`NI thresholds are unavailable for pay frequency: ${payFrequency}.`);
    const primaryThreshold = thresholds.employeePrimaryThreshold;
    const upperEarningsLimit = thresholds.employeeUpperEarningsLimit;
    const mainBand = Math.min(Math.max(0, grossPay - primaryThreshold), upperEarningsLimit - primaryThreshold);
    const upperBand = Math.max(0, grossPay - upperEarningsLimit);
    return {
      total: mainBand * categoryRules.employeeMainRate + upperBand * categoryRules.employeeUpperRate,
      breakdown: [
        { name: 'Main band', threshold: primaryThreshold, earnings: mainBand, rate: categoryRules.employeeMainRate, contribution: mainBand * categoryRules.employeeMainRate },
        { name: 'Upper band', threshold: upperEarningsLimit, earnings: upperBand, rate: categoryRules.employeeUpperRate, contribution: upperBand * categoryRules.employeeUpperRate }
      ]
    };
  }

  function calculateEmployerNi(grossPay, rules, category, payFrequency = 'annual') {
    const categoryRules = rules.ni.categories[category];
    const thresholds = rules.ni.periodicThresholds[payFrequency];
    if (!thresholds) throw new Error(`Employer NI thresholds are unavailable for pay frequency: ${payFrequency}.`);
    const secondaryThreshold = thresholds.employerSecondaryThreshold;
    const reliefThreshold = categoryRules.employerReliefThresholdKey
      ? thresholds[categoryRules.employerReliefThresholdKey]
      : secondaryThreshold;
    if (reliefThreshold === undefined) throw new Error(`Employer NI relief threshold is unavailable for category ${category}.`);
    const aboveSecondaryThreshold = Math.max(0, grossPay - secondaryThreshold);
    const reliefBand = Math.max(0, Math.min(grossPay, reliefThreshold) - secondaryThreshold);
    const standardBand = Math.max(0, grossPay - Math.max(secondaryThreshold, reliefThreshold));
    return {
      total: standardBand * categoryRules.employerRate,
      breakdown: [
        { name: 'Secondary threshold to applicable upper secondary threshold', threshold: secondaryThreshold, earnings: reliefBand, rate: 0, contribution: 0 },
        { name: 'Employer NI above applicable upper secondary threshold', threshold: reliefThreshold, earnings: standardBand, rate: categoryRules.employerRate, contribution: standardBand * categoryRules.employerRate }
      ]
    };
  }

  function calculateNationalInsurance(input) {
    const values = input || {};
    const taxYear = values.taxYear || '2026/27';
    const rules = getRules(taxYear);
    if (!rules.ni) throw new Error(`National Insurance rules are unavailable for tax year: ${taxYear}.`);
    const grossPay = nonNegativeNumber(values.grossPay, 'grossPay');
    const category = String(values.niCategory || '').trim().toUpperCase();
    const categoryRules = rules.ni.categories[category];
    if (!categoryRules) throw new Error('NI category is required and must be supported.');
    const payFrequency = String(values.payFrequency || '').trim();
    if (!payFrequency) throw new Error('Pay frequency is required for National Insurance.');
    const periods = getPeriodsPerYear(payFrequency);
    const employee = calculateEmployeeNi(grossPay, rules, category, payFrequency);
    const employer = calculateEmployerNi(grossPay, rules, category, payFrequency);
    return {
      taxYear, grossPay, employeeNi: employee.total, employerNi: employer.total, niCategory: category,
      employeeNiBreakdown: employee.breakdown, employerNiBreakdown: employer.breakdown,
      payFrequency, periodValues: { grossPay, employeeNi: employee.total, employerNi: employer.total },
      assumptions: [`NI category ${category} rates and applicable employer relief are used.`, `Published ${payFrequency} Class 1 thresholds are applied directly to gross pay for this pay period.`, 'This estimate does not model director annual calculation methods or NIC adjustments.'],
      calculationExplanation: `Employee and employer National Insurance are calculated for this ${payFrequency} pay period using category ${category}, period-specific primary and upper earnings limits, and the employer secondary threshold.`,
      source: rules.source,
      effectivePeriod: `${rules.effectiveFrom} to ${rules.effectiveTo}`
    };
  }

  function calculatePension(grossPay, rules, input, payFrequency = 'annual') {
    const thresholds = rules.pension.periodicThresholds[payFrequency];
    if (!thresholds) throw new Error(`Pension thresholds are unavailable for pay frequency: ${payFrequency}.`);
    const qualifyingPay = Math.min(Math.max(0, grossPay - thresholds.lowerQualifying), thresholds.upperQualifying - thresholds.lowerQualifying);
    const employeeRate = input.employeePensionRate ?? rules.pension.minimumEmployeeRate;
    const employerRate = input.employerPensionRate ?? rules.pension.minimumEmployerRate;
    if (!Number.isFinite(employeeRate) || !Number.isFinite(employerRate) || employeeRate < 0 || employeeRate > 1 || employerRate < 0 || employerRate > 1) throw new Error('Pension rates must be between 0% and 100%.');
    return { qualifyingPay, employeePension: qualifyingPay * employeeRate, employerPension: qualifyingPay * employerRate, pension: qualifyingPay * (employeeRate + employerRate) };
  }

  function calculatePensionOnly(input) {
    const values = input || {};
    const taxYear = values.taxYear || '2026/27';
    const rules = getRules(taxYear);
    if (!rules.pension) throw new Error(`Pension rules are unavailable for tax year: ${taxYear}.`);
    const pensionableEarnings = nonNegativeNumber(values.pensionableEarnings, 'pensionableEarnings');
    const qualifyingEarnings = nonNegativeNumber(values.qualifyingEarnings, 'qualifyingEarnings');
    const employeeRate = Number(values.employeeContributionRate);
    const employerRate = Number(values.employerContributionRate);
    if (!Number.isFinite(employeeRate) || employeeRate < 0 || !Number.isFinite(employerRate) || employerRate < 0) throw new Error('Employee and employer contribution rates must be non-negative numbers.');
    const employeeContribution = qualifyingEarnings * employeeRate / 100;
    const employerContribution = qualifyingEarnings * employerRate / 100;
    return {
      pensionableEarnings,
      qualifyingEarnings,
      employeeContribution,
      employerContribution,
      totalContribution: employeeContribution + employerContribution,
      employeeContributionRate: employeeRate,
      employerContributionRate: employerRate,
      taxYear,
      source: rules.pension.source,
      effectivePeriod: `${rules.effectiveFrom} to ${rules.effectiveTo}`
    };
  }

  function calculateStudentLoan(input) {
    const values = input || {};
    const taxYear = values.taxYear || '2026/27';
    const rules = getRules(taxYear);
    if (!rules.studentLoan) throw new Error(`Student Loan rules are unavailable for tax year: ${taxYear}.`);
    const grossPay = nonNegativeNumber(values.grossPay, 'grossPay');
    const payFrequency = String(values.payFrequency || '').trim();
    if (!payFrequency) throw new Error('Pay frequency is required for Student Loan calculations.');
    if (!['annual', 'monthly', 'weekly', 'fortnightly', 'fourWeekly'].includes(payFrequency)) throw new Error('Student Loan pay frequency must be annual, monthly, weekly, fortnightly, or fourWeekly.');
    const suppliedPlans = Array.isArray(values.plans)
      ? values.plans.map(plan => String(plan).trim().toLowerCase()).filter(Boolean)
      : String(values.plans || '').split(',').map(plan => plan.trim().toLowerCase()).filter(Boolean);
    const validPlans = ['plan1', 'plan2', 'plan4', 'plan5', 'postgraduate'].filter(plan => rules.studentLoan[plan]);
    const invalidPlans = suppliedPlans.filter(plan => !validPlans.includes(plan));
    if (invalidPlans.length > 0) throw new Error(`Invalid plan(s): ${invalidPlans.join(', ')}. Valid plans: plan1, plan2, plan4, plan5, postgraduate.`);
    const studentPlanCandidates = [...new Set(suppliedPlans.filter(plan => plan !== 'postgraduate'))];
    const postgraduateSelected = suppliedPlans.includes('postgraduate');
    if (studentPlanCandidates.length === 0 && !postgraduateSelected) throw new Error('Select a Student Loan plan, a Postgraduate Loan, or both.');
    const studentPlan = studentPlanCandidates.sort((left, right) => rules.studentLoan[left].threshold - rules.studentLoan[right].threshold)[0] || null;
    const planAssumptions = studentPlanCandidates.length > 1
      ? [`Multiple ordinary loan plans were supplied; HMRC guidance says to use the lowest recovery threshold (Plan ${studentPlan.replace('plan', '')}) until the correct plan is confirmed. Ordinary-plan deductions are not stacked.`]
      : [];
    const deductionPeriods = { annual: 1, monthly: 1, weekly: 1, fortnightly: 2, fourWeekly: 4 }[payFrequency];
    const thresholdFrequency = payFrequency === 'fortnightly' || payFrequency === 'fourWeekly' ? 'weekly' : payFrequency;
    const deductions = {};
    const breakdown = [];
    const calculatePlanDeduction = plan => {
      const planRules = rules.studentLoan[plan];
      const thresholdPerCalculation = planRules.periodicThresholds[thresholdFrequency];
      if (thresholdPerCalculation === undefined) throw new Error(`Threshold for ${payFrequency} pay is unavailable for ${plan}.`);
      const earningsPerCalculation = deductionPeriods > 1 ? grossPay / deductionPeriods : grossPay;
      const deductionPerCalculation = Math.floor(Math.max(0, earningsPerCalculation - thresholdPerCalculation) * planRules.deductionRate + 1e-9);
      const threshold = thresholdPerCalculation * deductionPeriods;
      return {
        plan: plan === 'postgraduate' ? 'POSTGRADUATE' : plan.toUpperCase(),
        threshold,
        earningsAboveThreshold: Math.max(0, grossPay - threshold),
        deductionRate: planRules.deductionRate,
        deductionPerCalculation,
        calculationPeriods: deductionPeriods,
        deduction: deductionPerCalculation * deductionPeriods
      };
    };
    if (studentPlan) {
      const item = calculatePlanDeduction(studentPlan);
      deductions[studentPlan] = item.deduction;
      breakdown.push(item);
    }
    if (postgraduateSelected) {
      const item = calculatePlanDeduction('postgraduate');
      deductions.postgraduate = item.deduction;
      breakdown.push(item);
    }
    const studentLoanDeduction = studentPlan ? deductions[studentPlan] : 0;
    const postgraduateLoanDeduction = postgraduateSelected ? deductions.postgraduate : 0;
    const totalDeduction = studentLoanDeduction + postgraduateLoanDeduction;
    const plans = [...(studentPlan ? [studentPlan] : []), ...(postgraduateSelected ? ['postgraduate'] : [])];
    return {
      grossPay,
      payFrequency,
      plans,
      studentPlan,
      deductions,
      studentLoanDeduction,
      postgraduateLoanDeduction,
      totalStudentLoanDeduction: totalDeduction,
      breakdown,
      assumptions: [`Student Loan deductions use HMRC's ${payFrequency} payroll method and round each deduction down to whole pounds.`, ...planAssumptions, 'One ordinary student plan may be combined with a Postgraduate Loan.', 'Payroll-period changes, arrears, stop/start notices, and court-order restrictions are not modelled.'],
      calculationExplanation: `Repayments use 9% for Plans 1, 2, 4, and 5, or 6% for Postgraduate Loans, on earnings over the applicable threshold. Deductions are rounded down to whole pounds; fortnightly and four-weekly periods use weekly calculations multiplied by the number of weeks.`,
      source: rules.studentLoan.source,
      taxYear,
      effectivePeriod: `${rules.effectiveFrom} to ${rules.effectiveTo}`
    };
  }

  function calculatePayeOnly(input) {
    const values = input || {};
    const taxYear = values.taxYear || '2026/27';
    const rules = getRules(taxYear);
    if (!rules.paye) throw new Error(`PAYE rules are unavailable for tax year: ${taxYear}.`);
    const grossPay = nonNegativeNumber(values.grossPay, 'grossPay');
    const payFrequency = String(values.payFrequency || '').trim();
    if (!payFrequency) throw new Error('Pay frequency is required for PAYE.');
    getPeriodsPerYear(payFrequency);
    const taxCode = String(values.taxCode || '').trim().toUpperCase();
    if (!taxCode) throw new Error('Tax code is required for this estimate.');
    const parsedCode = parseTaxCode(taxCode);
    if (!parsedCode.valid) throw new Error(`Unsupported tax code "${taxCode}": ${parsedCode.error}`);
    const selectedRegion = String(values.region || '').trim();
    if (!selectedRegion && !parsedCode.prefix) throw new Error('Tax region is required for PAYE.');
    const region = resolveTaxRegion(parsedCode, selectedRegion || 'englandNorthernIreland');
    if (!rules.paye.regions[region]) throw new Error(`Unsupported PAYE region: ${region}.`);
    const payeResult = calculatePaye(grossPay, rules, region, payFrequency, parsedCode, values);
    const taxCodeType = parsedCode.emergencyIndicator ? 'emergency' : parsedCode.specialCode || parsedCode.suffix;
    return {
      grossPay,
      grossPayToDate: payeResult.grossPayToDate,
      personalAllowance: payeResult.personalAllowance,
      taxablePay: payeResult.taxablePay,
      paye: payeResult.paye,
      taxCode,
      taxCodeType,
      taxRegime: parsedCode.taxRegime,
      taxBasis: payeResult.taxBasis,
      taxCodeInterpretation: explainTaxCode(taxCode),
      taxCodeSource: rules.metadata.sources.taxCodes,
      taxCodeSource: rules.metadata.sources.taxCodes,
      taxPaidToDate: payeResult.taxPaidToDate,
      periodsElapsed: payeResult.periodsElapsed,
      kCodeLimit: payeResult.kCodeLimit,
      kCodeLimitApplied: payeResult.kCodeLimitApplied,
      region,
      taxYear,
      payFrequency,
      payeBreakdown: payeResult.breakdown,
      periodValues: { grossPay, taxablePay: payeResult.taxablePay, paye: payeResult.paye },
      assumptions: [
        `Gross pay and bonus are entered for each ${payFrequency} pay period.`,
        explainTaxCode(taxCode),
        `Tax is calculated on a ${payeResult.taxBasis} basis for ${payFrequency} pay using the ${region} rules.`,
        ...(payeResult.kCodeLimitApplied ? [`The K-code PAYE deduction was limited to 50% of current-period gross pay (${payeResult.kCodeLimit.toFixed(2)}).`] : []),
        'This estimate covers Income Tax (PAYE) only; it does not include National Insurance or pension contributions.'
      ],
      calculationExplanation: `${explainTaxCode(taxCode)} ${payeResult.taxBasis === 'cumulative' ? `Cumulative calculation through period ${payeResult.periodsElapsed} uses gross pay to date and subtracts tax already paid.` : 'Non-cumulative calculation uses only the current pay period.'}`,
      source: rules.source,
      effectivePeriod: `${rules.effectiveFrom} to ${rules.effectiveTo}`
    };
  }

  function calculatePayroll(input) {
    const values = input || {};
    const taxYear = values.taxYear || '2026/27';
    const rules = getRules(taxYear);
    if (!rules.paye || !rules.ni || !rules.pension) throw new Error(`Payroll rules are incomplete for tax year: ${taxYear}.`);
    const grossPay = nonNegativeNumber(values.grossPay, 'grossPay');
    const payFrequency = String(values.payFrequency || '').trim();
    if (!payFrequency) throw new Error('Pay frequency is required for payroll calculation.');
    const periods = getPeriodsPerYear(payFrequency);
    const category = String(values.niCategory || '').trim().toUpperCase();
    const categoryRules = rules.ni.categories[category];
    if (!categoryRules) throw new Error(`Unsupported NI category "${category}".`);
    const taxCode = String(values.taxCode || '').trim().toUpperCase();
    if (!taxCode) throw new Error('Tax code is required for this estimate.');
    const parsedCode = parseTaxCode(taxCode);
    if (!parsedCode.valid) throw new Error(`Unsupported tax code "${taxCode}": ${parsedCode.error}`);
    const selectedRegion = String(values.region || '').trim();
    if (!selectedRegion && !parsedCode.prefix) throw new Error('Tax region is required for payroll calculation.');
    const region = resolveTaxRegion(parsedCode, selectedRegion || 'englandNorthernIreland');
    if (!rules.paye.regions[region]) throw new Error(`Unsupported PAYE region: ${region}.`);
    const regionName = { englandNorthernIreland: 'England and Northern Ireland', wales: 'Wales', scotland: 'Scotland', northernIreland: 'Northern Ireland' }[region];
    if (values.contributionBasis && values.contributionBasis !== 'qualifyingEarnings') throw new Error('Integrated payroll supports the qualifying-earnings pension basis only. Other scheme bases require scheme rules.');
    if (values.salarySacrifice) throw new Error('Salary sacrifice is selected, but its PAYE, NI, and pensionable-pay effects depend on your scheme agreement and are not modelled by this estimate.');
    const payeResult = calculatePaye(grossPay, rules, region, payFrequency, parsedCode, values);
    const taxCodeType = parsedCode.emergencyIndicator ? 'emergency' : parsedCode.specialCode || parsedCode.suffix;
    const employeeNi = calculateEmployeeNi(grossPay, rules, category, payFrequency);
    const employerNi = calculateEmployerNi(grossPay, rules, category, payFrequency);
    const pensionResult = calculatePension(grossPay, rules, values, payFrequency);
    const requestedStudentPlans = values.studentLoanPlans || [];
    const studentLoanPlans = Array.isArray(requestedStudentPlans)
      ? [...requestedStudentPlans]
      : String(requestedStudentPlans).split(',').map(plan => plan.trim()).filter(Boolean);
    if (values.studentPlan && values.studentPlan !== 'none') studentLoanPlans.push(values.studentPlan);
    if (values.postgraduateLoan === true || values.postgraduateLoan === 'true') studentLoanPlans.push('postgraduate');
    const studentLoanResult = studentLoanPlans.length
      ? calculateStudentLoan({ grossPay, plans: studentLoanPlans, payFrequency, taxYear })
      : null;
    const studentLoanDeduction = studentLoanResult?.studentLoanDeduction || 0;
    const postgraduateLoanDeduction = studentLoanResult?.postgraduateLoanDeduction || 0;
    const totalLoanDeductions = studentLoanDeduction + postgraduateLoanDeduction;
    const netPay = grossPay - payeResult.paye - employeeNi.total - pensionResult.employeePension - totalLoanDeductions;
    const employerCost = grossPay + employerNi.total + pensionResult.employerPension;
    return {
      grossPay,
      personalAllowance: payeResult.personalAllowance,
      taxablePay: payeResult.taxablePay,
      paye: payeResult.paye,
      taxCodeType,
      taxCode,
      taxRegime: parsedCode.taxRegime,
      taxBasis: payeResult.taxBasis,
      taxCodeInterpretation: explainTaxCode(taxCode),
      taxCodeSource: rules.metadata.sources.taxCodes,
      taxCodeSource: rules.metadata.sources.taxCodes,
      grossPayToDate: payeResult.grossPayToDate,
      taxPaidToDate: payeResult.taxPaidToDate,
      periodsElapsed: payeResult.periodsElapsed,
      kCodeLimit: payeResult.kCodeLimit,
      kCodeLimitApplied: payeResult.kCodeLimitApplied,
      employeeNi: employeeNi.total,
      employerNi: employerNi.total,
      pension: pensionResult.pension,
      employeePension: pensionResult.employeePension,
      employerPension: pensionResult.employerPension,
      studentLoanDeduction,
      postgraduateLoanDeduction,
      totalStudentLoanDeduction: totalLoanDeductions,
      netPay,
      employerCost,
      assumptions: [`Gross pay is entered for each ${payFrequency} pay period.`, explainTaxCode(taxCode), `Tax code ${taxCode} uses ${payeResult.taxBasis} ${regionName} PAYE rules.`, ...(payeResult.kCodeLimitApplied ? [`The K-code PAYE deduction was limited to 50% of current-period gross pay (${payeResult.kCodeLimit.toFixed(2)}).`] : []), `NI category ${category} rates and applicable relief thresholds for ${payFrequency} are used.`, 'Pension uses the selected frequency qualifying-earnings band and configured contribution rates.', ...(studentLoanResult ? [`Student Loan deduction: ${studentLoanDeduction.toFixed(2)}; postgraduate deduction: ${postgraduateLoanDeduction.toFixed(2)}.`] : ['Student and postgraduate loans are not included.'])],
      taxYear,
      calculationExplanation: `${explainTaxCode(taxCode)} ${payeResult.taxBasis === 'cumulative' ? `Cumulative calculation through period ${payeResult.periodsElapsed} uses gross pay to date and subtracts tax already paid.` : 'Non-cumulative calculation uses only the current pay period.'} Employee and employer NI use their respective thresholds. Pension contributions use the qualifying earnings band.`,
      payeBreakdown: payeResult.breakdown,
      employeeNiBreakdown: employeeNi.breakdown,
      employerNiBreakdown: employerNi.breakdown,
      niCategory: category,
      payFrequency,
      periodValues: {
        grossPay,
        grossPayToDate: payeResult.grossPayToDate,
        taxPaidToDate: payeResult.taxPaidToDate,
        periodsElapsed: payeResult.periodsElapsed,
        taxablePay: payeResult.taxablePay,
        paye: payeResult.paye,
        employeeNi: employeeNi.total,
        employerNi: employerNi.total,
        pension: pensionResult.pension,
        employeePension: pensionResult.employeePension,
        employerPension: pensionResult.employerPension,
        studentLoanDeduction,
        postgraduateLoanDeduction,
        totalStudentLoanDeduction: totalLoanDeductions,
        netPay,
        employerCost
      },
      studentLoan: studentLoanResult,
      pensionSource: rules.pension.source,
      source: rules.source,
      effectivePeriod: `${rules.effectiveFrom} to ${rules.effectiveTo}`
    };
  }

  function calculatePensionEligibility(input) {
    const values = input || {};
    const taxYear = values.taxYear || '2026/27';
    const rules = getRules(taxYear);
    if (!rules.pension) throw new Error(`Pension rules are unavailable for tax year: ${taxYear}.`);
    const age = Number(values.age);
    if (values.age === '' || !Number.isInteger(age) || age < 0 || age > 125) throw new Error('Age must be a whole number between 0 and 125.');
    const grossPay = nonNegativeNumber(values.grossPay, 'grossPay');
    const payFrequency = values.payFrequency || 'annual';
    const thresholds = rules.pension.periodicThresholds[payFrequency];
    if (!thresholds) throw new Error(`Unsupported pay frequency: ${payFrequency}. Supported: annual, monthly, weekly, fortnightly, fourWeekly, quarterly, biannual.`);
    const eligibilityRules = rules.pension.eligibility;
    const workerStatus = String(values.workerStatus || 'employee').trim();
    if (!['employee', 'worker', 'selfEmployed'].includes(workerStatus)) throw new Error('Select a supported worker status.');
    const trigger = thresholds.trigger;
    let eligibility = 'Not automatically eligible';
    let explanation;
    if (workerStatus === 'selfEmployed') {
      explanation = 'Self-employed people are not automatically enrolled by an employer under workplace auto-enrolment. This tool does not assess personal pension eligibility.';
    } else if (age < eligibilityRules.minimumJoiningAge) {
      explanation = `You are aged ${age}, below the minimum joining age of ${eligibilityRules.minimumJoiningAge}.`;
    } else if (age >= eligibilityRules.maximumOptInAgeExclusive) {
      explanation = `You are aged ${age}, outside the workplace auto-enrolment age range. Check scheme rules for any other joining route.`;
    } else if (age >= eligibilityRules.automaticEnrolmentAge && age < eligibilityRules.statePensionAge && grossPay >= trigger) {
      eligibility = 'Automatically eligible';
      explanation = `You are aged ${age}, below the State Pension age of ${eligibilityRules.statePensionAge}, and earn at least the ${payFrequency} trigger of £${trigger.toFixed(2)}. This indicates automatic enrolment criteria; employer-specific duties and exceptions are not assessed.`;
    } else {
      eligibility = 'Potentially eligible / entitled to opt in';
      explanation = age >= eligibilityRules.automaticEnrolmentAge && grossPay < trigger
        ? `Your earnings fall below the earnings trigger of £${trigger.toFixed(2)} per ${payFrequency}. You are not automatically enrolled, but you may have a right to request to join; employer contribution duties depend on age and whether earnings reach the qualifying earnings lower limit of £${thresholds.lowerQualifying.toFixed(2)}. This assessment is not legal advice.`
        : `At age ${age} and earnings of £${grossPay.toFixed(2)} per ${payFrequency}, you are not in the automatic-enrolment category. You may have a right to request to join; employer contribution duties depend on age and whether earnings reach the qualifying earnings lower limit of £${thresholds.lowerQualifying.toFixed(2)}. This assessment is not legal advice.`;
    }
    return {
      age,
      grossPay,
      payFrequency,
      eligibilityStatus: eligibility,
      explanation,
      earningsTrigger: trigger,
      lowerQualifyingEarnings: thresholds.lowerQualifying,
      workerStatus,
      taxYear,
      assumptions: [`Assessment uses the ${payFrequency} earnings trigger of £${trigger.toFixed(2)} and lower qualifying limit of £${thresholds.lowerQualifying.toFixed(2)}.`, `Rules use age ${eligibilityRules.automaticEnrolmentAge} to State Pension age ${eligibilityRules.statePensionAge} for automatic enrolment; opt-in assessment is for ages ${eligibilityRules.minimumJoiningAge} to under ${eligibilityRules.maximumOptInAgeExclusive}.`, 'Worker classification, employer exceptions, and scheme-specific details must be verified; this is not legal advice.'],
      calculationExplanation: explanation,
      source: rules.pension.source,
      effectivePeriod: `${rules.effectiveFrom} to ${rules.effectiveTo}`
    };
  }

  function calculatePensionContribution(input) {
    const values = input || {};
    const taxYear = values.taxYear || '2026/27';
    const rules = getRules(taxYear);
    if (!rules.pension) throw new Error(`Pension rules are unavailable for tax year: ${taxYear}.`);
    const grossPay = nonNegativeNumber(values.grossPay, 'grossPay');
    const payFrequency = values.payFrequency || 'annual';
    const thresholds = rules.pension.periodicThresholds[payFrequency];
    if (!thresholds) throw new Error(`Unsupported pay frequency: ${payFrequency}. Supported: annual, monthly, weekly, fortnightly, fourWeekly, quarterly, biannual.`);
    const contributionBasis = values.contributionBasis || 'qualifyingEarnings';
    if (contributionBasis !== 'qualifyingEarnings') throw new Error('This estimate supports the statutory qualifying-earnings basis only. Pensionable-salary and other scheme-specific bases require the scheme rules.');
    if (values.salarySacrifice) throw new Error('Salary sacrifice is selected, but its pensionable-pay, PAYE, and NI effects depend on the scheme agreement and cannot be calculated by this estimate.');
    const lowerQualifyingEarnings = thresholds.lowerQualifying;
    const upperQualifyingEarnings = thresholds.upperQualifying;
    const qualifyingEarnings = Math.min(Math.max(0, grossPay - lowerQualifyingEarnings), upperQualifyingEarnings - lowerQualifyingEarnings);
    const employeeRate = Number(values.employeeContributionRate ?? rules.pension.minimumEmployeeRate);
    const employerRate = Number(values.employerContributionRate ?? rules.pension.minimumEmployerRate);
    if (!Number.isFinite(employeeRate) || employeeRate < 0 || employeeRate > 1 || !Number.isFinite(employerRate) || employerRate < 0 || employerRate > 1) throw new Error('Employee and employer contribution rates must be between 0% and 100%.');
    return {
      grossPay,
      pensionablePay: grossPay,
      lowerQualifyingEarnings,
      upperQualifyingEarnings,
      qualifyingEarnings,
      employeeContribution: qualifyingEarnings * employeeRate,
      employerContribution: qualifyingEarnings * employerRate,
      totalContribution: qualifyingEarnings * (employeeRate + employerRate),
      employeeContributionRate: employeeRate,
      employerContributionRate: employerRate,
      contributionBasis,
      contributionBasisLabel: 'Qualifying earnings',
      salarySacrifice: Boolean(values.salarySacrifice),
      payFrequency,
      taxYear,
      assumptions: [`Qualifying earnings are calculated between £${lowerQualifyingEarnings.toFixed(2)} (lower) and £${upperQualifyingEarnings.toFixed(2)} (upper) limits per ${payFrequency}.`, `Employee contribution rate: ${(employeeRate * 100).toFixed(1)}%; Employer contribution rate: ${(employerRate * 100).toFixed(1)}%.`, 'Rates are user-entered and may not equal the scheme minimum.', 'Scheme-specific pensionable-salary definitions, salary sacrifice, relief methods, rounding and contribution caps are not modelled.'],
      calculationExplanation: `Pension contributions are calculated on qualifying earnings (gross pay less lower limit, capped at upper limit) at the specified employee and employer rates.`,
      source: rules.pension.source,
      effectivePeriod: `${rules.effectiveFrom} to ${rules.effectiveTo}`
    };
  }

  function calculateStudentLoan(input) {
    const values = input || {};
    const taxYear = values.taxYear || '2026/27';
    const rules = getRules(taxYear);
    if (!rules.studentLoan) throw new Error(`Student Loan rules are unavailable for tax year: ${taxYear}.`);
    const grossPay = nonNegativeNumber(values.grossPay, 'grossPay');
    const payFrequency = String(values.payFrequency || '').trim();
    if (!payFrequency) throw new Error('Pay frequency is required for Student Loan calculations.');
    if (!['annual', 'monthly', 'weekly', 'fortnightly', 'fourWeekly'].includes(payFrequency)) throw new Error('Student Loan pay frequency must be annual, monthly, weekly, fortnightly, or fourWeekly.');
    const suppliedPlans = Array.isArray(values.plans)
      ? values.plans.map(plan => String(plan).trim().toLowerCase()).filter(Boolean)
      : String(values.plans || '').split(',').map(plan => plan.trim().toLowerCase()).filter(Boolean);
    const validPlans = ['plan1', 'plan2', 'plan4', 'plan5', 'postgraduate'].filter(plan => rules.studentLoan[plan]);
    const invalidPlans = suppliedPlans.filter(plan => !validPlans.includes(plan));
    if (invalidPlans.length > 0) throw new Error(`Invalid plan(s): ${invalidPlans.join(', ')}. Valid plans: plan1, plan2, plan4, plan5, postgraduate.`);
    const studentPlanCandidates = [...new Set(suppliedPlans.filter(plan => plan !== 'postgraduate'))];
    const postgraduateSelected = suppliedPlans.includes('postgraduate');
    if (studentPlanCandidates.length === 0 && !postgraduateSelected) throw new Error('Select a Student Loan plan, a Postgraduate Loan, or both.');
    const studentPlan = studentPlanCandidates.sort((left, right) => rules.studentLoan[left].threshold - rules.studentLoan[right].threshold)[0] || null;
    const planAssumptions = studentPlanCandidates.length > 1
      ? [`Multiple ordinary loan plans were supplied; HMRC guidance says to use the lowest recovery threshold (Plan ${studentPlan.replace('plan', '')}) until the correct plan is confirmed. Ordinary-plan deductions are not stacked.`]
      : [];
    const periodsPerLoanYear = { annual: 1, monthly: 12, weekly: 52 };
    const deductions = {};
    const breakdown = [];
    const calculatePlanDeduction = plan => {
      const planRules = rules.studentLoan[plan];
      const periodUnits = { fortnightly: 2, fourWeekly: 4 }[payFrequency] || 1;
      const thresholdFrequency = periodUnits > 1 ? 'weekly' : payFrequency;
      const threshold = planRules.periodicThresholds[thresholdFrequency];
      if (threshold === undefined) throw new Error(`Threshold for ${payFrequency} pay is unavailable for plan ${plan}.`);
      const earningsPerCalculationPeriod = periodUnits > 1 ? grossPay / periodUnits : grossPay;
      const thresholdForPayPeriod = threshold * periodUnits;
      const earningsAboveThreshold = Math.max(0, grossPay - thresholdForPayPeriod);
      const periodExcess = Math.max(0, earningsPerCalculationPeriod - threshold);
      const deductionPerCalculationPeriod = Math.floor(periodExcess * planRules.deductionRate + 1e-9);
      const deduction = deductionPerCalculationPeriod * periodUnits;
      return { threshold: thresholdForPayPeriod, earningsAboveThreshold, deductionRate: planRules.deductionRate, deduction, deductionPerCalculationPeriod, calculationPeriods: periodUnits };
    };
    if (studentPlan) {
      const detail = calculatePlanDeduction(studentPlan);
      deductions[studentPlan] = detail.deduction;
      breakdown.push({
        plan: studentPlan.toUpperCase(),
        ...detail
      });
    }
    if (postgraduateSelected) {
      const detail = calculatePlanDeduction('postgraduate');
      deductions.postgraduate = detail.deduction;
      breakdown.push({ plan: 'POSTGRADUATE', ...detail });
    }
    const studentLoanDeduction = studentPlan ? deductions[studentPlan] : 0;
    const postgraduateLoanDeduction = postgraduateSelected ? deductions.postgraduate : 0;
    const totalDeduction = studentLoanDeduction + postgraduateLoanDeduction;
    const plans = [...(studentPlan ? [studentPlan] : []), ...(postgraduateSelected ? ['postgraduate'] : [])];
    return {
      grossPay,
      plans,
      deductions,
      studentPlan,
      studentLoanDeduction,
      postgraduateLoanDeduction,
      totalStudentLoanDeduction: totalDeduction,
      breakdown,
      payFrequency,
      taxYear,
      assumptions: [`Student Loan deductions use the official ${payFrequency} method and round each resulting deduction down to whole pounds.`, ...planAssumptions, 'One ordinary Student Loan plan may be combined with a Postgraduate Loan.', 'Payroll-period changes, arrears, stop/start notices, and court-order restrictions are not modelled.'],
      calculationExplanation: `Student Loan repayments are calculated from earnings over each plan threshold at 9% (6% for postgraduate), rounded down to whole pounds. Fortnightly and four-weekly payments use the weekly calculation and multiply by the number of weeks in the period.`,
      source: rules.studentLoan.source,
      effectivePeriod: `${rules.effectiveFrom} to ${rules.effectiveTo}`
    };
  }

  global.PayrollEngine = Object.freeze({ calculatePayroll, calculatePayeOnly, calculateNationalInsurance, calculatePensionOnly, calculatePensionEligibility, calculatePensionContribution, calculateStudentLoan, parseTaxCode, explainTaxCode, supportedTaxYears: global.PayrollRules.supportedTaxYears });
}(typeof globalThis !== 'undefined' ? globalThis : this));
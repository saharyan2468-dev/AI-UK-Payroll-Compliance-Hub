document.write('<script src="payroll-rules.js"><\/script><script src="payroll-engine.js"><\/script><script src="ssp-calculator.js"><\/script><script src="smp-calculator.js"><\/script><script src="spp-calculator.js"><\/script><script src="sap-calculator.js"><\/script><script src="neonatal-calculator.js"><\/script>');

const calculatorConfigs = {
  paye: { kicker: 'INCOME TAX ESTIMATE', title: 'PAYE Calculator', fields: [['taxYear', 'Tax year', '2026/27'], ['payFrequency', 'Pay frequency', 'annual'], ['grossPay', 'Gross pay per period', '35000'], ['taxCode', 'Tax code', ''], ['taxBasis', 'Tax basis', 'codeDefault'], ['periodsElapsed', 'Periods elapsed (cumulative)', '1'], ['grossPayToDate', 'Gross pay to date', ''], ['taxPaidToDate', 'PAYE already paid', ''], ['region', 'Region', 'englandNorthernIreland'], ['bonus', 'Bonus / other taxable pay (per period)', '0']] },
  ni: { kicker: 'EMPLOYEE NATIONAL INSURANCE', title: 'NI Calculator', fields: [['taxYear', 'Tax year', '2026/27'], ['salary', 'Gross pay per period', '2500'], ['niCategory', 'NI category', ''], ['payFrequency', 'Pay frequency', 'monthly']] },
  pension: { kicker: 'WORKPLACE PENSION ESTIMATE', title: 'Pension Calculator', fields: [['grossPay', 'Gross pay per period', '2916.67'], ['contributionBasis', 'Contribution basis', 'qualifyingEarnings'], ['employeeContributionRate', 'Employee contribution %', 'minimum'], ['employerContributionRate', 'Employer contribution %', 'minimum'], ['salarySacrifice', 'Salary sacrifice', false], ['payFrequency', 'Pay frequency', 'monthly'], ['taxYear', 'Tax year', '2026/27']] },
  pensionEligibility: { kicker: 'AUTO-ENROLMENT ASSESSMENT', title: 'Pension Eligibility', fields: [['taxYear', 'Tax year', '2026/27'], ['age', 'Employee age', '35'], ['grossPay', 'Earnings per period', '2916.67'], ['payFrequency', 'Pay frequency', 'monthly'], ['workerStatus', 'Worker status', 'employee']] },
  studentLoan: { kicker: 'STUDENT LOAN ESTIMATE', title: 'Student Loan Calculator', fields: [['taxYear', 'Tax year', '2026/27'], ['grossPay', 'Gross earnings per period', '3000'], ['payFrequency', 'Pay frequency', 'monthly'], ['studentPlan', 'Student Loan plan', 'plan2'], ['postgraduateLoan', 'Postgraduate Loan', false]] },
  payrollSummary: { kicker: 'PERIOD PAYROLL ESTIMATE', title: 'Payroll Summary', fields: [['taxYear', 'Tax year', '2026/27'], ['grossPay', 'Gross pay per period', '3000'], ['payFrequency', 'Pay frequency', 'monthly'], ['taxCode', 'Tax code', '1257L'], ['taxBasis', 'Tax basis', 'codeDefault'], ['periodsElapsed', 'Periods elapsed (cumulative)', '1'], ['grossPayToDate', 'Gross pay to date', ''], ['taxPaidToDate', 'PAYE already paid', ''], ['region', 'Tax region', 'englandNorthernIreland'], ['niCategory', 'NI category', ''], ['studentPlan', 'Student Loan plan', 'none'], ['postgraduateLoan', 'Postgraduate Loan', false], ['employeeContributionRate', 'Employee pension %', 'minimum'], ['employerContributionRate', 'Employer pension %', 'minimum'], ['contributionBasis', 'Pension basis', 'qualifyingEarnings'], ['salarySacrifice', 'Salary sacrifice', false]] },
  statutory: { kicker: 'STATUTORY PAYMENT ESTIMATE', title: 'Statutory Payment Calculator', fields: [['type', 'Payment type', 'ssp'], ['averageWeeklyEarnings', 'Average weekly earnings', '500'], ['qualifyingDays', 'Qualifying days', 'Monday,Tuesday,Wednesday,Thursday,Friday'], ['sickDays', 'Sick days', 'Monday,Tuesday,Wednesday'], ['taxYear', 'Tax year', '2026/27'], ['weeks', 'Number of payable weeks', '1']] }
};

const elements = {
  form: document.getElementById('form'), result: document.getElementById('result'),
  kicker: document.getElementById('kicker'), title: document.getElementById('title'),
  chat: document.getElementById('chat'), messages: document.getElementById('messages')
};
let activeCalculator = 'paye';
let lastResult = null;
const money = value => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value || 0);

function inputMarkup([name, label, value]) {
  const options = {
    taxYear: PayrollRules.supportedTaxYears.map(taxYear => [taxYear, taxYear]),
    payFrequency: ['pension', 'pensionEligibility'].includes(activeCalculator) ? [['weekly', 'Weekly'], ['fortnightly', 'Fortnightly'], ['fourWeekly', '4-weekly'], ['monthly', 'Monthly'], ['quarterly', 'Quarterly'], ['biannual', 'Biannual'], ['annual', 'Annual']] : ['studentLoan', 'payrollSummary'].includes(activeCalculator) ? [['annual', 'Annual'], ['monthly', 'Monthly'], ['weekly', 'Weekly'], ['fortnightly', 'Fortnightly'], ['fourWeekly', '4-weekly']] : ['paye', 'ni'].includes(activeCalculator) ? [['annual', 'Annual'], ['monthly', 'Monthly'], ['weekly', 'Weekly'], ['fortnightly', 'Fortnightly'], ['fourWeekly', '4-weekly']] : [['annual', 'Annual'], ['monthly', 'Monthly'], ['weekly', 'Weekly']],
    taxBasis: [['codeDefault', 'Use tax code basis'], ['cumulative', 'Cumulative'], ['week1', 'Week 1 (W1)'], ['month1', 'Month 1 (M1)'], ['nonCumulative', 'Non-cumulative (X)']],
    contributionBasis: [['qualifyingEarnings', 'Qualifying earnings'], ['pensionableSalary', 'Pensionable salary (scheme rules required)'], ['otherPensionableEarnings', 'Other pensionable earnings (scheme rules required)']],
    studentPlan: [['none', 'No student loan'], ['plan1', 'Plan 1'], ['plan2', 'Plan 2'], ['plan4', 'Plan 4'], ['plan5', 'Plan 5']],
    region: [['englandNorthernIreland', 'England'], ['wales', 'Wales'], ['scotland', 'Scotland'], ['northernIreland', 'Northern Ireland']],
    workerStatus: [['employee', 'Employee'], ['worker', 'Worker'], ['selfEmployed', 'Self-employed']],
    niCategory: [['', 'Select NI category'], ['A', 'A - standard employee'], ['B', 'B - reduced rate'], ['C', 'C - over State Pension age'], ['D', 'D - Investment Zone deferment'], ['E', 'E - Investment Zone reduced rate'], ['F', 'F - Freeport standard'], ['H', 'H - apprentice under 25'], ['I', 'I - Freeport reduced rate'], ['J', 'J - deferred'], ['K', 'K - Investment Zone state pension age'], ['L', 'L - Freeport deferment'], ['M', 'M - employee under 21'], ['N', 'N - Investment Zone standard'], ['S', 'S - Freeport state pension age'], ['V', 'V - veteran'], ['Z', 'Z - under 21 deferred']],
    type: [['ssp', 'SSP - Statutory Sick Pay'], ['smp', 'SMP - Statutory Maternity Pay'], ['sap', 'SAP - Statutory Adoption Pay'], ['spp', 'SPP - Statutory Paternity Pay'], ['neonatal', 'Neonatal Care Pay']]
  }[name];
  if (options) return `<div class="field"><label>${label}</label><select name="${name}" required>${options.map(([optionValue, optionLabel]) => `<option value="${optionValue}" ${optionValue === value ? 'selected' : ''}>${optionLabel}</option>`).join('')}</select></div>`;
  if (name === 'salarySacrifice' || name === 'postgraduateLoan') return `<div class="field"><label>${label}</label><input name="${name}" type="checkbox" value="true"></div>`;
  const displayLabel = name === 'sickDays' ? 'Sick days / neonatal care days' : label;
  const type = name === 'taxCode' || name === 'qualifyingDays' || name === 'sickDays' || name === 'plans' ? 'text' : name === 'age' ? 'number' : 'number';
  const note = name === 'taxCode' ? '<small>Enter the code as shown on the HMRC notice. Code structure is interpreted; the reason for an adjustment is not inferred.</small>' : name === 'periodsElapsed' ? '<small>For cumulative mid-year calculations, enter gross pay to date and PAYE already paid.</small>' : name === 'plans' ? '<small>Comma-separated: plan1, plan2, plan4, plan5, postgraduate</small>' : '';
  const required = ['taxCode', 'grossPay', 'salary', 'age', 'averageWeeklyEarnings', 'employeeContributionRate', 'employerContributionRate'].includes(name) ? ' required' : '';
  const placeholder = name === 'taxCode' ? '1257L' : '';
  const inputValue = value === 'minimum' ? (name === 'employeeContributionRate' ? PayrollRules.taxYears['2026/27'].pension.minimumEmployeeRate : PayrollRules.taxYears['2026/27'].pension.minimumEmployerRate) * 100 : value;
  return `<div class="field"><label>${displayLabel}</label><input name="${name}" value="${inputValue}" type="${type}" min="0" step=".01"${required}${placeholder ? ` placeholder="${placeholder}"` : ''}>${note}</div>`;
}

function renderCalculator(key) {
  activeCalculator = key;
  const config = calculatorConfigs[key];
  elements.kicker.textContent = config.kicker;
  elements.title.textContent = config.title;
  elements.form.innerHTML = config.fields.map(inputMarkup).join('') + '<button class="calc-submit">Calculate estimate →</button>';
  updateTaxYearSpecificFields();
  elements.result.className = 'empty';
  elements.result.textContent = 'Enter figures above to see an estimate and explanation.';
}

function updateTaxYearSpecificFields() {
  const taxYear = elements.form.querySelector('[name="taxYear"]')?.value || '2026/27';
  const studentPlan = elements.form.querySelector('[name="studentPlan"]');
  const plan5 = studentPlan?.querySelector('option[value="plan5"]');
  if (!plan5) return;
  plan5.disabled = !PayrollRules.taxYears[taxYear].studentLoan.plan5;
  if (plan5.disabled && studentPlan.value === 'plan5') studentPlan.value = 'none';
}

elements.form.addEventListener('change', event => {
  if (event.target.name === 'taxYear') updateTaxYearSpecificFields();
});

function calculateStatutory(values) {
  const parseDays = value => String(value || '').split(',').map(day => day.trim()).filter(Boolean);
  if (values.type === 'ssp') {
    return SspCalculator.calculate({ averageWeeklyEarnings: values.averageWeeklyEarnings, qualifyingDays: parseDays(values.qualifyingDays), sickDays: parseDays(values.sickDays), taxYear: values.taxYear });
  }
  if (values.type === 'smp') return SmpCalculator.calculate({ averageWeeklyEarnings: values.averageWeeklyEarnings, qualifyingDays: parseDays(values.qualifyingDays), weeks: values.weeks, taxYear: values.taxYear });
  if (values.type === 'spp') return SppCalculator.calculate({ averageWeeklyEarnings: values.averageWeeklyEarnings, qualifyingDays: parseDays(values.qualifyingDays), weeks: values.weeks, taxYear: values.taxYear });
  if (values.type === 'sap') return SapCalculator.calculate({ averageWeeklyEarnings: values.averageWeeklyEarnings, qualifyingDays: parseDays(values.qualifyingDays), weeks: values.weeks, taxYear: values.taxYear });
  if (values.type === 'neonatal') return NeonatalCalculator.calculate({ averageWeeklyEarnings: values.averageWeeklyEarnings, qualifyingDays: parseDays(values.qualifyingDays), neonatalCareDays: parseDays(values.sickDays), weeks: values.weeks, taxYear: values.taxYear });
  throw new Error(`Unsupported statutory payment type: ${values.type || '(none)'}.`);
}

function calculateCurrentForm(values) {
  if (activeCalculator === 'statutory') return calculateStatutory(values);
  if (activeCalculator === 'pensionEligibility') {
    const eligibility = PayrollEngine.calculatePensionEligibility({ age: values.age, grossPay: values.grossPay, payFrequency: values.payFrequency, taxYear: values.taxYear, workerStatus: values.workerStatus });
    return { total: 0, eligibility, explanation: eligibility.explanation, payFrequency: values.payFrequency };
  }
  if (activeCalculator === 'studentLoan') {
    const plans = [];
    if (values.studentPlan && values.studentPlan !== 'none') plans.push(values.studentPlan);
    if (values.postgraduateLoan === 'true') plans.push('postgraduate');
    const studentLoan = PayrollEngine.calculateStudentLoan({ grossPay: values.grossPay, plans, payFrequency: values.payFrequency, taxYear: values.taxYear });
    return { total: studentLoan.totalStudentLoanDeduction, studentLoan, explanation: studentLoan.calculationExplanation, payFrequency: values.payFrequency };
  }
  if (activeCalculator === 'pension') {
    if (values.employeeContributionRate === '' || values.employerContributionRate === '') throw new Error('Enter both employee and employer contribution percentages.');
    const pension = PayrollEngine.calculatePensionContribution({
      grossPay: values.grossPay,
      employeeContributionRate: Number(values.employeeContributionRate) / 100,
      employerContributionRate: Number(values.employerContributionRate) / 100,
      payFrequency: values.payFrequency,
      taxYear: values.taxYear,
      contributionBasis: values.contributionBasis,
      salarySacrifice: values.salarySacrifice === 'true'
    });
    return { total: pension.totalContribution, pension, explanation: pension.calculationExplanation, payFrequency: values.payFrequency };
  }
  if (activeCalculator === 'payrollSummary') {
    if (values.employeeContributionRate === '' || values.employerContributionRate === '') throw new Error('Enter both employee and employer pension percentages.');
    const studentLoanPlans = [];
    if (values.studentPlan && values.studentPlan !== 'none') studentLoanPlans.push(values.studentPlan);
    if (values.postgraduateLoan === 'true') studentLoanPlans.push('postgraduate');
    const payroll = PayrollEngine.calculatePayroll({
      grossPay: values.grossPay,
      taxYear: values.taxYear,
      payFrequency: values.payFrequency,
      taxCode: values.taxCode,
      region: values.region,
      niCategory: values.niCategory,
      taxBasis: values.taxBasis,
      periodsElapsed: values.periodsElapsed,
      grossPayToDate: values.grossPayToDate,
      taxPaidToDate: values.taxPaidToDate,
      employeePensionRate: Number(values.employeeContributionRate) / 100,
      employerPensionRate: Number(values.employerContributionRate) / 100,
      contributionBasis: values.contributionBasis,
      salarySacrifice: values.salarySacrifice === 'true',
      studentLoanPlans
    });
    return { total: payroll.netPay, payrollSummary: payroll, explanation: payroll.calculationExplanation, payFrequency: values.payFrequency };
  }
  if (activeCalculator === 'ni') {
    const payFrequency = values.payFrequency || 'annual';
    const ni = PayrollEngine.calculateNationalInsurance({ grossPay: values.salary, niCategory: values.niCategory, payFrequency, taxYear: values.taxYear || '2026/27' });
    return { total: ni.periodValues.employeeNi, ni, explanation: ni.calculationExplanation, payFrequency: values.payFrequency };
  }
  if (activeCalculator === 'paye') {
    const payFrequency = values.payFrequency || 'annual';
    const grossPay = Number(values.grossPay) + Number(values.bonus || 0);
    const paye = PayrollEngine.calculatePayeOnly({
      grossPay, taxYear: values.taxYear || '2026/27', taxCode: values.taxCode, region: values.region, payFrequency,
      taxBasis: values.taxBasis, periodsElapsed: values.periodsElapsed, grossPayToDate: values.grossPayToDate, taxPaidToDate: values.taxPaidToDate
    });
    return { total: paye.periodValues.paye, paye, explanation: paye.calculationExplanation, payFrequency };
  }
  throw new Error('Unknown calculator selected.');
}

elements.form.onsubmit = event => {
  event.preventDefault();
  try {
    const calculation = calculateCurrentForm(Object.fromEntries(new FormData(elements.form)));
    lastResult = calculation;
    elements.result.className = 'result';
    const period = calculation.payFrequency === 'weekly' ? ' per week' : calculation.payFrequency === 'monthly' ? ' per month' : calculation.payFrequency === 'fortnightly' ? ' per fortnight' : calculation.payFrequency === 'fourWeekly' ? ' per 4 weeks' : calculation.payFrequency === 'quarterly' ? ' per quarter' : calculation.payFrequency === 'biannual' ? ' per 6 months' : ' per year';
    const niBreakdown = activeCalculator === 'ni' && calculation.ni ? `<div class="breakdown"><small>Employee NI bands:<br>${calculation.ni.employeeNiBreakdown.map(band => `${band.name} (threshold ${money(band.threshold)}): ${money(band.earnings)} at ${(band.rate * 100).toFixed(2)}% = ${money(band.contribution)}`).join('<br>')}</small><small>Employer NI bands:<br>${calculation.ni.employerNiBreakdown.map(band => `${band.name} (threshold ${money(band.threshold)}): ${money(band.earnings)} at ${(band.rate * 100).toFixed(2)}% = ${money(band.contribution)}`).join('<br>')}</small><small>Assumptions: ${calculation.ni.assumptions.join(' ')}</small><small>Source: <a href="${calculation.ni.source.url}" target="_blank" rel="noopener">${calculation.ni.source.name}</a></small><small>Tax year: ${calculation.ni.taxYear}; Effective period: ${calculation.ni.effectivePeriod}</small></div>` : '';
    const pensionBreakdown = calculation.pension ? `<div class="breakdown"><small>Gross pay: ${money(calculation.pension.grossPay)}${period}</small><small>Pensionable pay: ${money(calculation.pension.pensionablePay)}</small><small>Contribution basis: ${calculation.pension.contributionBasisLabel}</small><small>Lower qualifying earnings limit: ${money(calculation.pension.lowerQualifyingEarnings)}</small><small>Upper qualifying earnings limit: ${money(calculation.pension.upperQualifyingEarnings)}</small><small>Qualifying earnings: ${money(calculation.pension.qualifyingEarnings)}</small><small>Employee contribution (${(calculation.pension.employeeContributionRate * 100).toFixed(1)}%): ${money(calculation.pension.employeeContribution)}</small><small>Employer contribution (${(calculation.pension.employerContributionRate * 100).toFixed(1)}%): ${money(calculation.pension.employerContribution)}</small><small>Total contribution: ${money(calculation.pension.totalContribution)}</small><small>Assumptions: ${calculation.pension.assumptions.join(' ')}</small><small>Source: <a href="${calculation.pension.source.url}" target="_blank" rel="noopener">${calculation.pension.source.name}</a></small><small>Tax year: ${calculation.pension.taxYear}; Effective period: ${calculation.pension.effectivePeriod}</small></div>` : '';
    const pensionEligibilityBreakdown = activeCalculator === 'pensionEligibility' && calculation.eligibility ? `<div class="breakdown"><small><strong>Status:</strong> ${calculation.eligibility.eligibilityStatus}</small><small><strong>Age:</strong> ${calculation.eligibility.age}</small><small><strong>Earnings:</strong> ${money(calculation.eligibility.grossPay)} per ${calculation.eligibility.payFrequency}</small><small><strong>Earnings trigger:</strong> ${money(calculation.eligibility.earningsTrigger)} per ${calculation.eligibility.payFrequency}</small><small>Assumptions: ${calculation.eligibility.assumptions.join(' ')}</small><small>Source: <a href="${calculation.eligibility.source.url}" target="_blank" rel="noopener">${calculation.eligibility.source.name}</a></small><small>Tax year: ${calculation.eligibility.taxYear}; Effective period: ${calculation.eligibility.effectivePeriod}</small></div>` : '';
    const studentLoanBreakdown = activeCalculator === 'studentLoan' && calculation.studentLoan ? `<div class="breakdown"><small><strong>Plans:</strong> ${calculation.studentLoan.plans.join(', ').toUpperCase()}</small><small><strong>Gross pay:</strong> ${money(calculation.studentLoan.grossPay)} per ${calculation.studentLoan.payFrequency}</small><br>${calculation.studentLoan.breakdown.map(item => `<small><strong>${item.plan}:</strong> Threshold ${money(item.threshold)}, Earnings above ${money(item.earningsAboveThreshold)} at ${(item.deductionRate * 100).toFixed(1)}% = ${money(item.deduction)}</small>`).join('')}<small>Student Loan deduction: ${money(calculation.studentLoan.studentLoanDeduction)}</small><small>Postgraduate deduction: ${money(calculation.studentLoan.postgraduateLoanDeduction)}</small><small>Total deduction: ${money(calculation.studentLoan.totalStudentLoanDeduction)}</small><small>Assumptions: ${calculation.studentLoan.assumptions.join(' ')}</small><small>Source: <a href="${calculation.studentLoan.source.url}" target="_blank" rel="noopener">${calculation.studentLoan.source.name}</a>; <a href="${calculation.studentLoan.source.deductionTablesUrl}" target="_blank" rel="noopener">SL3 deduction tables</a></small><small>Tax year: ${calculation.studentLoan.taxYear}; Effective period: ${calculation.studentLoan.effectivePeriod}</small></div>` : '';
    const statutoryBreakdown = activeCalculator === 'statutory' && calculation.qualifyingDays ? `<div class="breakdown"><small>Estimate only, not eligibility: ${money(calculation.estimate)}</small><small>Average weekly earnings: ${money(calculation.averageWeeklyEarnings)}</small><small>Qualifying days: ${calculation.qualifyingDays.join(', ')}</small>${calculation.sickQualifyingDays ? `<small>Sick qualifying days: ${calculation.sickQualifyingDays.join(', ') || 'None'}</small><small>Payable qualifying days: ${calculation.payableDays}</small><small>Weekly SSP: ${money(calculation.weeklyEntitlement)}</small><small>Daily SSP: ${money(calculation.dailyEntitlement)}</small>` : calculation.paymentType === 'spp' ? `<small>Payable qualifying days: ${calculation.payableDays}</small><small>Weekly SPP: ${money(calculation.weeklyAmount)}</small><small>Daily SPP: ${money(calculation.dailyAmount)}</small>` : calculation.paymentType === 'sap' ? `<small>High-rate qualifying days: ${calculation.highRateDays}</small><small>Standard-rate qualifying days: ${calculation.standardRateDays}</small><small>High-rate weekly amount: ${money(calculation.highRateWeeklyAmount)}</small><small>Standard-rate weekly amount: ${money(calculation.standardWeeklyAmount)}</small>` : calculation.paymentType === 'neonatal' ? `<small>Neonatal care days: ${calculation.neonatalCareDays.join(', ')}</small><small>Payable qualifying days: ${calculation.payableDays}</small><small>Weekly Neonatal Care Pay: ${money(calculation.weeklyAmount)}</small><small>Daily Neonatal Care Pay: ${money(calculation.dailyAmount)}</small>` : `<small>High-rate qualifying days: ${calculation.highRateDays}</small><small>Standard-rate qualifying days: ${calculation.standardRateDays}</small><small>High-rate weekly amount: ${money(calculation.highRateWeeklyAmount)}</small><small>Standard-rate weekly amount: ${money(calculation.standardWeeklyAmount)}</small>`}<small>Source: <a href="${calculation.source.url}" target="_blank" rel="noopener">${calculation.source.name}</a></small><small>Assumptions: ${calculation.assumptions.join(' ')}</small></div>` : '';
    const payrollSummaryBreakdown = calculation.payrollSummary ? `<div class="breakdown"><small><strong>Payroll calculation (${calculation.payrollSummary.payFrequency}):</strong></small><small>Tax code: ${calculation.payrollSummary.taxCode} · Regime: ${calculation.payrollSummary.taxRegime} · Basis: ${calculation.payrollSummary.taxBasis}</small><small>${calculation.payrollSummary.taxCodeInterpretation}</small><small>Gross pay: ${money(calculation.payrollSummary.periodValues.grossPay)}</small><small>Gross pay to date: ${money(calculation.payrollSummary.periodValues.grossPayToDate)}</small><small>Coded allowance: ${money(calculation.payrollSummary.personalAllowance)}</small><small>Taxable pay: ${money(calculation.payrollSummary.periodValues.taxablePay)}</small><small>PAYE due: ${money(calculation.payrollSummary.periodValues.paye)}</small><small>Tax bands:<br>${calculation.payrollSummary.payeBreakdown.map(band => `${band.name}: ${money(band.taxablePay)} at ${(band.rate * 100).toFixed(0)}% = ${money(band.tax)}`).join('<br>')}</small>${calculation.payrollSummary.kCodeLimit !== null ? `<small>K-code 50% limit: ${money(calculation.payrollSummary.kCodeLimit)}${calculation.payrollSummary.kCodeLimitApplied ? ' (applied)' : ''}</small>` : ''}<small>Employee NI: ${money(calculation.payrollSummary.periodValues.employeeNi)}</small><small>Student Loan: ${money(calculation.payrollSummary.periodValues.studentLoanDeduction)}</small><small>Postgraduate Loan: ${money(calculation.payrollSummary.periodValues.postgraduateLoanDeduction)}</small><small>Employee pension: ${money(calculation.payrollSummary.periodValues.employeePension)}</small><small>Estimated net pay: ${money(calculation.payrollSummary.periodValues.netPay)}</small><small>Employer NI: ${money(calculation.payrollSummary.periodValues.employerNi)}</small><small>Employer pension: ${money(calculation.payrollSummary.periodValues.employerPension)}</small><small>Total employer cost: ${money(calculation.payrollSummary.periodValues.employerCost)}</small><small>Assumptions: ${calculation.payrollSummary.assumptions.join(' ')}</small><small>Source: <a href="${calculation.payrollSummary.source.url}" target="_blank" rel="noopener">HM Revenue & Customs</a>; <a href="${calculation.payrollSummary.pensionSource.url}" target="_blank" rel="noopener">${calculation.payrollSummary.pensionSource.name}</a>${calculation.payrollSummary.studentLoan?.source ? `; <a href="${calculation.payrollSummary.studentLoan.source.deductionTablesUrl}" target="_blank" rel="noopener">Student Loan deduction tables</a>` : ''}</small><small>Tax year: ${calculation.payrollSummary.taxYear}; Effective period: ${calculation.payrollSummary.effectivePeriod}</small></div>` : '';
    const payeBreakdown = calculation.paye ? `<div class="breakdown"><small><strong>Tax code:</strong> ${calculation.paye.taxCode} · <strong>Regime:</strong> ${calculation.paye.taxRegime} · <strong>Basis:</strong> ${calculation.paye.taxBasis}</small><small>${calculation.paye.taxCodeInterpretation}</small><small>Gross pay this period: ${money(calculation.paye.periodValues.grossPay)}</small><small>Gross pay to date: ${money(calculation.paye.grossPayToDate)}</small><small>PAYE already paid: ${money(calculation.paye.taxPaidToDate)}</small><small>Coded allowance this period: ${money(calculation.paye.personalAllowance)}</small><small>${calculation.paye.taxBasis === 'cumulative' ? 'Taxable pay to date' : 'Taxable pay this period'}: ${money(calculation.paye.periodValues.taxablePay)}</small><small>PAYE due this period: ${money(calculation.paye.periodValues.paye)}</small>${calculation.paye.kCodeLimit !== null ? `<small>K-code 50% deduction limit: ${money(calculation.paye.kCodeLimit)}${calculation.paye.kCodeLimitApplied ? ' (applied)' : ''}</small>` : ''}<small>Tax bands applied:<br>${calculation.paye.payeBreakdown.map(band => `${band.name}: ${money(band.taxablePay)} at ${(band.rate * 100).toFixed(0)}% = ${money(band.tax)}`).join('<br>')}</small><small>Assumptions: ${calculation.paye.assumptions.join(' ')}</small><small>Source: <a href="${calculation.paye.source.url}" target="_blank" rel="noopener">${calculation.paye.source.name}</a></small><small>Tax year: ${calculation.paye.taxYear}; Effective period: ${calculation.paye.effectivePeriod}</small></div>` : '';
    const breakdown = calculation.payrollSummary ? payrollSummaryBreakdown : calculation.eligibility ? pensionEligibilityBreakdown : calculation.studentLoan ? studentLoanBreakdown : calculation.pension ? pensionBreakdown : statutoryBreakdown ? statutoryBreakdown : calculation.ni ? `<div class="breakdown"><small>Gross earnings: ${money(calculation.ni.periodValues.grossPay || calculation.ni.grossPay)}</small><small>Employee NI: ${money(calculation.ni.periodValues.employeeNi)}</small><small>Employer NI: ${money(calculation.ni.periodValues.employerNi)}</small>${niBreakdown}</div>` : payeBreakdown;
    const resultType = activeCalculator === 'statutory' ? 'payment' : activeCalculator === 'paye' ? 'PAYE' : activeCalculator === 'pensionEligibility' ? 'eligibility' : activeCalculator === 'studentLoan' ? 'student loan deduction' : activeCalculator === 'payrollSummary' ? 'net pay and employer cost' : activeCalculator === 'pension' ? 'pension contribution' : 'NI';
    const displayAmount = activeCalculator === 'pensionEligibility' ? '–' : money(calculation.total);
    const explanation = calculation.explanation || calculation.calculationExplanation || 'This is an estimate and not an eligibility determination.';
    const resultTaxYear = calculation.taxYear || calculation.paye?.taxYear || calculation.ni?.taxYear || calculation.studentLoan?.taxYear || calculation.payrollSummary?.taxYear || elements.form.querySelector('[name="taxYear"]')?.value || '2026/27';
    const resultTaxRules = PayrollRules.taxYears[resultTaxYear];
    const taxCodeSource = calculation.paye?.taxCodeSource || calculation.payrollSummary?.taxCodeSource;
    elements.result.innerHTML = `<small class="result-tax-year">Tax year: ${resultTaxYear} · Effective: ${resultTaxRules.effectiveFrom} to ${resultTaxRules.effectiveTo} · Rules updated: ${resultTaxRules.metadata.lastUpdated}</small><small>Estimated ${resultType}${activeCalculator === 'statutory' || activeCalculator === 'pensionEligibility' ? '' : period}</small><b>${displayAmount}</b><small>${explanation}</small>${breakdown}${taxCodeSource ? `<small class="source-link">Tax code guidance: <a href="${taxCodeSource}" target="_blank" rel="noopener">HMRC employee tax codes</a></small>` : ''}`;
  } catch (error) {
    elements.result.className = 'empty';
    elements.result.textContent = error.message;
  }
};

[
  ['pensionEligibility', '05', 'Pension Eligibility', 'Auto-enrolment assessment'],
  ['studentLoan', '06', 'Student Loan', 'Plan and postgraduate deductions'],
  ['payrollSummary', '07', 'Payroll Summary', 'Integrated period estimate']
].forEach(([key, number, label, description]) => {
  if (document.querySelector(`[data-calc="${key}"]`)) return;
  const tab = document.createElement('button');
  tab.type = 'button';
  tab.className = 'calc-tab';
  tab.dataset.calc = key;
  tab.innerHTML = `${number} <b>${label}</b><small>${description}</small>`;
  document.querySelector('.tabs').appendChild(tab);
});

document.querySelectorAll('[data-calc]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-calc]').forEach(item => item.classList.remove('active'));
  button.classList.add('active');
  renderCalculator(button.dataset.calc);
}));
document.querySelectorAll('[data-modal]').forEach(button => button.addEventListener('click', () => { document.getElementById(button.dataset.modal).hidden = false; }));
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => { document.getElementById(button.dataset.close).hidden = true; }));

const addMessage = text => { const message = document.createElement('p'); message.textContent = text; elements.messages.append(message); };
const copilotAnswer = question => {
  const codeMatch = /\b(?:S|C)?(?:K\d{1,5}|\d{1,5}[LMT]|BR|D[0-3]|0T|NT|T)(?:\s*(?:W1|M1|X|NONCUM))?\b/i.exec(question);
  if (codeMatch && /what does|mean|explain|code|why/i.test(question)) return PayrollEngine.explainTaxCode(codeMatch[0]);
  if (/why.*tax code|tax code.*(change|changed|issue)/i.test(question)) return 'Tax codes can change when HMRC updates allowances, deductions, benefits, estimated income, or tax already due. This tool cannot see the employee’s HMRC coding notice and cannot identify the reason; check the latest notice or contact HMRC.';
  return /why/i.test(question) ? (lastResult ? 'This result is based on the rates, tax code, basis, and thresholds shown below it.' : 'Run a calculator first and I can explain it.') : /assumption|rate|threshold/i.test(question) ? (lastResult?.explanation || lastResult?.paye?.calculationExplanation || lastResult?.ni?.calculationExplanation || 'Run a calculator first and I can explain its assumptions.') : 'I can explain payroll results, tax codes, rates, thresholds, and assumptions.';
};
const openChat = () => elements.chat.setAttribute('aria-hidden', 'false');
document.getElementById('chat-launch').onclick = openChat;
document.getElementById('open-chat').onclick = openChat;
document.getElementById('close-chat').onclick = () => elements.chat.setAttribute('aria-hidden', 'true');
document.querySelectorAll('[data-q]').forEach(button => button.onclick = () => { addMessage(button.dataset.q); addMessage(copilotAnswer(button.dataset.q)); });
document.getElementById('chat-form').onsubmit = event => { event.preventDefault(); const input = document.getElementById('chat-input'); if (input.value) { addMessage(input.value); addMessage(copilotAnswer(input.value)); input.value = ''; } };
window.addEventListener('pagehide', () => { lastResult = null; elements.form.reset?.(); });
document.addEventListener('DOMContentLoaded', () => renderCalculator(activeCalculator), { once: true });
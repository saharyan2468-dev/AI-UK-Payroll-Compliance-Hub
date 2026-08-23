document.write('<script src="payroll-rules.js"><\/script><script src="payroll-engine.js"><\/script><script src="ssp-calculator.js"><\/script><script src="smp-calculator.js"><\/script><script src="spp-calculator.js"><\/script><script src="sap-calculator.js"><\/script><script src="neonatal-calculator.js"><\/script>');

const calculatorConfigs = {
  paye: { kicker: 'INCOME TAX ESTIMATE', title: 'PAYE Calculator', fields: [['taxYear', 'Tax year', '2026/27'], ['payFrequency', 'Pay frequency', 'annual'], ['grossPay', 'Gross pay', '35000'], ['taxCode', 'Tax code', '1257L'], ['region', 'Region', 'englandNorthernIreland'], ['bonus', 'Bonus / other taxable pay', '0']] },
  ni: { kicker: 'EMPLOYEE NATIONAL INSURANCE', title: 'NI Calculator', fields: [['salary', 'Annual gross salary', '35000'], ['niCategory', 'NI category', 'A'], ['payFrequency', 'Pay frequency', 'monthly']] },
  pension: { kicker: 'AUTO-ENROLMENT CONTRIBUTIONS', title: 'Pension Calculator', fields: [['pensionableEarnings', 'Pensionable earnings', '35000'], ['qualifyingEarnings', 'Qualifying earnings', '28760'], ['employeeContributionRate', 'Employee contribution %', '5'], ['employerContributionRate', 'Employer contribution %', '3'], ['salarySacrifice', 'Salary sacrifice', false], ['payFrequency', 'Pay frequency', 'annual'], ['taxYear', 'Tax year', '2026/27']] },
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
    taxYear: [['2026/27', '2026/27']],
    payFrequency: [['annual', 'Annual'], ['monthly', 'Monthly'], ['weekly', 'Weekly']],
    region: [['englandNorthernIreland', 'England / Northern Ireland'], ['wales', 'Wales'], ['scotland', 'Scotland']],
    niCategory: [['A', 'A - standard employee'], ['B', 'B - reduced rate'], ['C', 'C - over State Pension age'], ['D', 'D - contracted out'], ['E', 'E - reduced rate'], ['F', 'F - Freeport standard'], ['H', 'H - apprentice under 25'], ['I', 'I - Freeport reduced rate'], ['J', 'J - deferred'], ['K', 'K - no employee NI'], ['L', 'L - contracted out'], ['M', 'M - under 21'], ['N', 'N - Freeport standard'], ['S', 'S - Freeport over State Pension age'], ['V', 'V - veteran'], ['Z', 'Z - under 21 deferred']],
    rate: [['8', '8% - minimum total'], ['10', '10%'], ['12', '12%']],
    type: [['ssp', 'SSP - Statutory Sick Pay'], ['smp', 'SMP - Statutory Maternity Pay'], ['sap', 'SAP - Statutory Adoption Pay'], ['spp', 'SPP - Statutory Paternity Pay'], ['neonatal', 'Neonatal Care Pay']]
  }[name];
  if (options) return `<div class="field"><label>${label}</label><select name="${name}">${options.map(([optionValue, optionLabel]) => `<option value="${optionValue}" ${optionValue === value ? 'selected' : ''}>${optionLabel}</option>`).join('')}</select></div>`;
  if (name === 'salarySacrifice') return `<div class="field"><label>${label}</label><input name="${name}" type="checkbox" value="true"></div>`;
  const displayLabel = name === 'sickDays' ? 'Sick days / neonatal care days' : label;
  const type = name === 'taxCode' || name === 'qualifyingDays' || name === 'sickDays' ? 'text' : 'number';
  const note = name === 'taxCode' ? '<small>Only standard 1257L is currently supported accurately.</small>' : '';
  return `<div class="field"><label>${displayLabel}</label><input name="${name}" value="${value}" type="${type}" min="0" step=".01">${note}</div>`;
}

function renderCalculator(key) {
  activeCalculator = key;
  const config = calculatorConfigs[key];
  elements.kicker.textContent = config.kicker;
  elements.title.textContent = config.title;
  elements.form.innerHTML = config.fields.map(inputMarkup).join('') + '<button class="calc-submit">Calculate estimate →</button>';
  elements.result.className = 'empty';
  elements.result.textContent = 'Enter figures above to see an estimate and explanation.';
}

function calculateStatutory(values) {
  const parseDays = value => String(value || '').split(',').map(day => day.trim()).filter(Boolean);
  if (values.type === 'ssp') {
    return SspCalculator.calculate({ averageWeeklyEarnings: values.averageWeeklyEarnings, qualifyingDays: parseDays(values.qualifyingDays), sickDays: parseDays(values.sickDays), taxYear: values.taxYear });
  }
  if (values.type === 'smp') return SmpCalculator.calculate({ averageWeeklyEarnings: values.averageWeeklyEarnings, qualifyingDays: parseDays(values.qualifyingDays), weeks: values.weeks, taxYear: values.taxYear });
  if (values.type === 'spp') return SppCalculator.calculate({ averageWeeklyEarnings: values.averageWeeklyEarnings, qualifyingDays: parseDays(values.qualifyingDays), weeks: values.weeks, taxYear: values.taxYear });
  if (values.type === 'sap') return SapCalculator.calculate({ averageWeeklyEarnings: values.averageWeeklyEarnings, qualifyingDays: parseDays(values.qualifyingDays), weeks: values.weeks, taxYear: values.taxYear });
  if (values.type === 'neonatal') return NeonatalCalculator.calculate({ averageWeeklyEarnings: values.averageWeeklyEarnings, qualifyingDays: parseDays(values.qualifyingDays), neonatalCareDays: parseDays(values.sickDays), weeks: values.weeks, taxYear: values.taxYear });
  const weeklyPay = Number(values.averageWeeklyEarnings);
  const weeks = Number(values.weeks);
  if (!Number.isFinite(weeklyPay) || weeklyPay < 0 || !Number.isFinite(weeks) || weeks < 0) throw new Error('Weekly pay and payable weeks must be non-negative numbers.');
  const rules = PayrollRules.taxYears['2026/27'].statutoryPayments;
  const statutoryRate = values.type === 'ssp' ? rules.statutorySickPayWeeklyRate : rules.statutoryMaternityPayWeeklyRate;
  const replacementRate = values.type === 'ssp' ? rules.sickPayEarningsReplacementRate : rules.familyPayEarningsReplacementRate;
  const weeklyEstimate = Math.min(statutoryRate, weeklyPay * replacementRate);
  return { total: weeklyEstimate * weeks, explanation: 'This is an estimate only. Advanced statutory payment eligibility and timing rules are not implemented yet.' };
}

function calculateCurrentForm(values) {
  if (activeCalculator === 'statutory') return calculateStatutory(values);
  if (activeCalculator === 'pension') {
    const pension = PayrollEngine.calculatePensionOnly({ ...values, salarySacrifice: values.salarySacrifice === 'true' });
    const multiplier = values.payFrequency === 'monthly' ? 12 : values.payFrequency === 'weekly' ? 52 : 1;
    return { total: pension.totalContribution / multiplier, pension, explanation: pension.calculationExplanation, payFrequency: values.payFrequency };
  }
  const payFrequency = values.payFrequency || 'annual';
  const payMultiplier = payFrequency === 'monthly' ? 12 : payFrequency === 'weekly' ? 52 : 1;
  const grossPay = activeCalculator === 'paye' ? (Number(values.grossPay) * payMultiplier) + Number(values.bonus || 0) : values.salary;
  const payroll = PayrollEngine.calculatePayroll({
    grossPay, taxYear: values.taxYear || '2026/27', taxCode: values.taxCode, niCategory: values.niCategory,
    region: values.region,
    employeePensionRate: activeCalculator === 'pension' ? Number(values.rate) / 100 : undefined
  });
  const divisor = activeCalculator === 'paye' ? payMultiplier : activeCalculator === 'ni' ? payMultiplier : 12;
  const total = activeCalculator === 'paye' ? payroll.paye / divisor : activeCalculator === 'ni' ? payroll.employeeNi / divisor : payroll.pension / 12;
  return { total, payroll, explanation: payroll.calculationExplanation, payFrequency };
}

elements.form.onsubmit = event => {
  event.preventDefault();
  try {
    const calculation = calculateCurrentForm(Object.fromEntries(new FormData(elements.form)));
    lastResult = calculation;
    elements.result.className = 'result';
    const period = calculation.payFrequency === 'weekly' ? ' per week' : calculation.payFrequency === 'monthly' ? ' per month' : '';
    const niBreakdown = activeCalculator === 'ni' && calculation.payroll ? `<div class="breakdown"><small>Employee NI bands:<br>${calculation.payroll.employeeNiBreakdown.map(band => `${band.name}: ${money(band.earnings)} at ${(band.rate * 100).toFixed(2)}% = ${money(band.contribution)}`).join('<br>')}</small><small>Employer NI bands:<br>${calculation.payroll.employerNiBreakdown.map(band => `${band.name}: ${money(band.earnings)} at ${(band.rate * 100).toFixed(2)}% = ${money(band.contribution)}`).join('<br>')}</small></div>` : '';
    const pensionBreakdown = calculation.pension ? `<div class="breakdown"><small>Pensionable earnings: ${money(calculation.pension.pensionableEarnings)}</small><small>Qualifying earnings: ${money(calculation.pension.qualifyingEarnings)}</small><small>Contribution base: ${money(calculation.pension.contributionBase)}</small><small>Employee contribution: ${money(calculation.pension.employeeContribution)}</small><small>Employer contribution: ${money(calculation.pension.employerContribution)}</small><small>Total contribution: ${money(calculation.pension.totalContribution)}</small><small>Assumptions: ${calculation.pension.assumptions.join(' ')}</small></div>` : '';
    const statutoryBreakdown = activeCalculator === 'statutory' && calculation.qualifyingDays ? `<div class="breakdown"><small>Estimate only, not eligibility: ${money(calculation.estimate)}</small><small>Average weekly earnings: ${money(calculation.averageWeeklyEarnings)}</small><small>Qualifying days: ${calculation.qualifyingDays.join(', ')}</small>${calculation.sickQualifyingDays ? `<small>Sick qualifying days: ${calculation.sickQualifyingDays.join(', ') || 'None'}</small><small>Payable qualifying days: ${calculation.payableDays}</small><small>Weekly SSP: ${money(calculation.weeklyEntitlement)}</small><small>Daily SSP: ${money(calculation.dailyEntitlement)}</small>` : calculation.paymentType === 'spp' ? `<small>Payable qualifying days: ${calculation.payableDays}</small><small>Weekly SPP: ${money(calculation.weeklyAmount)}</small><small>Daily SPP: ${money(calculation.dailyAmount)}</small>` : calculation.paymentType === 'sap' ? `<small>High-rate qualifying days: ${calculation.highRateDays}</small><small>Standard-rate qualifying days: ${calculation.standardRateDays}</small><small>High-rate weekly amount: ${money(calculation.highRateWeeklyAmount)}</small><small>Standard-rate weekly amount: ${money(calculation.standardWeeklyAmount)}</small>` : calculation.paymentType === 'neonatal' ? `<small>Neonatal care days: ${calculation.neonatalCareDays.join(', ')}</small><small>Payable qualifying days: ${calculation.payableDays}</small><small>Weekly Neonatal Care Pay: ${money(calculation.weeklyAmount)}</small><small>Daily Neonatal Care Pay: ${money(calculation.dailyAmount)}</small>` : `<small>High-rate qualifying days: ${calculation.highRateDays}</small><small>Standard-rate qualifying days: ${calculation.standardRateDays}</small><small>High-rate weekly amount: ${money(calculation.highRateWeeklyAmount)}</small><small>Standard-rate weekly amount: ${money(calculation.standardWeeklyAmount)}</small>`}<small>Assumptions: ${calculation.assumptions.join(' ')}</small></div>` : '';
    const breakdown = calculation.pension ? pensionBreakdown : statutoryBreakdown ? statutoryBreakdown : calculation.payroll ? `<div class="breakdown"><small>Gross pay: ${money(calculation.payroll.grossPay)}</small><small>Taxable pay: ${money(calculation.payroll.taxablePay)}</small><small>PAYE: ${money(calculation.payroll.paye)}</small><small>Employee NI: ${money(calculation.payroll.employeeNi)}</small><small>Employer NI: ${money(calculation.payroll.employerNi)}</small><small>Pension: ${money(calculation.payroll.pension)}</small><small>Net pay: ${money(calculation.payroll.netPay)}</small>${niBreakdown}</div>` : '';
    const resultType = activeCalculator === 'statutory' ? 'payment' : activeCalculator === 'paye' ? 'PAYE' : activeCalculator === 'pension' ? 'pension contribution' : 'NI';
    elements.result.innerHTML = `<small>Estimated ${resultType}${activeCalculator === 'statutory' ? '' : period}</small><b>${money(calculation.total)}</b><small>${calculation.explanation}</small>${breakdown}`;
  } catch (error) {
    elements.result.className = 'empty';
    elements.result.textContent = error.message;
  }
};

document.querySelectorAll('[data-calc]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-calc]').forEach(item => item.classList.remove('active'));
  button.classList.add('active');
  renderCalculator(button.dataset.calc);
}));
document.querySelectorAll('[data-modal]').forEach(button => button.addEventListener('click', () => { document.getElementById(button.dataset.modal).hidden = false; }));
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => { document.getElementById(button.dataset.close).hidden = true; }));

const addMessage = text => { const message = document.createElement('p'); message.textContent = text; elements.messages.append(message); };
const copilotAnswer = question => /why/i.test(question) ? (lastResult ? 'This result is based on the rates and thresholds shown below it.' : 'Run a calculator first and I can explain it.') : /assumption|rate|threshold/i.test(question) ? (lastResult?.payroll?.calculationExplanation || 'Run a payroll calculator first and I can explain its assumptions.') : 'I can explain results, rates, thresholds, and assumptions.';
const openChat = () => elements.chat.setAttribute('aria-hidden', 'false');
document.getElementById('chat-launch').onclick = openChat;
document.getElementById('open-chat').onclick = openChat;
document.getElementById('close-chat').onclick = () => elements.chat.setAttribute('aria-hidden', 'true');
document.querySelectorAll('[data-q]').forEach(button => button.onclick = () => { addMessage(button.dataset.q); addMessage(copilotAnswer(button.dataset.q)); });
document.getElementById('chat-form').onsubmit = event => { event.preventDefault(); const input = document.getElementById('chat-input'); if (input.value) { addMessage(input.value); addMessage(copilotAnswer(input.value)); input.value = ''; } };
window.addEventListener('pagehide', () => { lastResult = null; elements.form.reset?.(); });
renderCalculator(activeCalculator);
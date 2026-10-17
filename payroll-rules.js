(function (global) {
  'use strict';

  const payrollRules = {
    effectiveTaxYearDates: {
      start: '6 April',
      end: '5 April'
    },
    taxYears: {
      '2025/26': {
        effectiveFrom: '2025-04-06',
        effectiveTo: '2026-04-05',
        metadata: {
          lastUpdated: '2026-03-01',
          sources: {
            hmrc: 'https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2025-to-2026',
            studentLoan: 'https://www.gov.uk/government/publications/sl3-student-loan-deduction-tables/2025-to-2026-student-and-postgraduate-loan-deduction-tables',
            pension: 'https://www.gov.uk/workplace-pensions/joining-a-workplace-pension',
            nmw: 'https://www.gov.uk/national-minimum-wage-rates',
            cis: 'https://www.gov.uk/what-you-must-do-as-a-cis-subcontractor',
            taxCodes: 'https://www.gov.uk/employee-tax-codes/letters'
          }
        },
        source: {
          name: 'HM Revenue & Customs',
          url: 'https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2025-to-2026'
        },
        paye: {
          kCodeDeductionLimit: 0.5,
          personalAllowance: 12570,
          periodicPersonalAllowance: { annual: 12570, monthly: 1048, weekly: 242 },
          taperThreshold: 100000,
          additionalRateThreshold: 125140,
          basicRateLimit: 37700,
          basicRate: 0.20,
          higherRate: 0.40,
          additionalRate: 0.45,
          regions: {
            englandNorthernIreland: { bands: [{ limit: 37700, rate: 0.20 }, { limit: 'additionalRate', rate: 0.40 }, { limit: Infinity, rate: 0.45 }] },
            wales: { bands: [{ limit: 37700, rate: 0.20 }, { limit: 'additionalRate', rate: 0.40 }, { limit: Infinity, rate: 0.45 }] },
            northernIreland: { bands: [{ limit: 37700, rate: 0.20 }, { limit: 'additionalRate', rate: 0.40 }, { limit: Infinity, rate: 0.45 }] },
            scotland: { bands: [{ limit: 2827, rate: 0.19 }, { limit: 14921, rate: 0.20 }, { limit: 31092, rate: 0.21 }, { limit: 62430, rate: 0.42 }, { limit: 'additionalRate', rate: 0.45 }, { limit: Infinity, rate: 0.48 }] }
          }
        },
        ni: {
          employeePrimaryThreshold: 12570,
          employeeUpperEarningsLimit: 50270,
          employeeMainRate: 0.08,
          employeeUpperRate: 0.02,
          employerSecondaryThreshold: 5000,
          employerRate: 0.15,
          lowerEarningsLimit: 6500,
          periodicThresholds: {
            annual: { lowerEarningsLimit: 6500, employeePrimaryThreshold: 12570, employeeUpperEarningsLimit: 50270, employerSecondaryThreshold: 5000, freeportUpperSecondaryThreshold: 25000, investmentZoneUpperSecondaryThreshold: 25000, under21UpperSecondaryThreshold: 50270, apprenticeUpperSecondaryThreshold: 50270, veteranUpperSecondaryThreshold: 50270 },
            monthly: { lowerEarningsLimit: 542, employeePrimaryThreshold: 1048, employeeUpperEarningsLimit: 4189, employerSecondaryThreshold: 417, freeportUpperSecondaryThreshold: 2083, investmentZoneUpperSecondaryThreshold: 2083, under21UpperSecondaryThreshold: 4189, apprenticeUpperSecondaryThreshold: 4189, veteranUpperSecondaryThreshold: 4189 },
            weekly: { lowerEarningsLimit: 125, employeePrimaryThreshold: 242, employeeUpperEarningsLimit: 967, employerSecondaryThreshold: 96, freeportUpperSecondaryThreshold: 481, investmentZoneUpperSecondaryThreshold: 481, under21UpperSecondaryThreshold: 967, apprenticeUpperSecondaryThreshold: 967, veteranUpperSecondaryThreshold: 967 }
          },
          categories: {
            A: { employeeMainRate: 0.08, employeeUpperRate: 0.02, employerRate: 0.15, employerThreshold: 5000 },
            B: { employeeMainRate: 0.0185, employeeUpperRate: 0.02, employerRate: 0.15, employerThreshold: 5000 },
            C: { employeeMainRate: 0, employeeUpperRate: 0, employerRate: 0.15, employerThreshold: 5000 },
            D: { employeeMainRate: 0.02, employeeUpperRate: 0.02, employerRate: 0.15, employerThreshold: 5000, employerReliefThresholdKey: 'investmentZoneUpperSecondaryThreshold' },
            E: { employeeMainRate: 0.0185, employeeUpperRate: 0.02, employerRate: 0.15, employerThreshold: 5000, employerReliefThresholdKey: 'investmentZoneUpperSecondaryThreshold' },
            F: { employeeMainRate: 0.08, employeeUpperRate: 0.02, employerRate: 0.15, employerThreshold: 5000, employerReliefThresholdKey: 'freeportUpperSecondaryThreshold' },
            H: { employeeMainRate: 0.08, employeeUpperRate: 0.02, employerRate: 0.15, employerThreshold: 5000, employerReliefThresholdKey: 'apprenticeUpperSecondaryThreshold' },
            I: { employeeMainRate: 0.0185, employeeUpperRate: 0.02, employerRate: 0.15, employerThreshold: 5000, employerReliefThresholdKey: 'freeportUpperSecondaryThreshold' },
            J: { employeeMainRate: 0.02, employeeUpperRate: 0.02, employerRate: 0.15, employerThreshold: 5000 },
            K: { employeeMainRate: 0, employeeUpperRate: 0, employerRate: 0.15, employerThreshold: 5000, employerReliefThresholdKey: 'investmentZoneUpperSecondaryThreshold' },
            L: { employeeMainRate: 0.02, employeeUpperRate: 0.02, employerRate: 0.15, employerThreshold: 5000, employerReliefThresholdKey: 'freeportUpperSecondaryThreshold' },
            M: { employeeMainRate: 0.08, employeeUpperRate: 0.02, employerRate: 0.15, employerThreshold: 5000, employerReliefThresholdKey: 'under21UpperSecondaryThreshold' },
            N: { employeeMainRate: 0.08, employeeUpperRate: 0.02, employerRate: 0.15, employerThreshold: 5000, employerReliefThresholdKey: 'investmentZoneUpperSecondaryThreshold' },
            S: { employeeMainRate: 0, employeeUpperRate: 0, employerRate: 0.15, employerThreshold: 5000, employerReliefThresholdKey: 'freeportUpperSecondaryThreshold' },
            V: { employeeMainRate: 0.08, employeeUpperRate: 0.02, employerRate: 0.15, employerThreshold: 5000, employerReliefThresholdKey: 'veteranUpperSecondaryThreshold' },
            Z: { employeeMainRate: 0.02, employeeUpperRate: 0.02, employerRate: 0.15, employerThreshold: 5000, employerReliefThresholdKey: 'under21UpperSecondaryThreshold' }
          }
        },
        pension: {
          minimumEarningsTrigger: 10000,
          lowerQualifyingEarnings: 6240,
          upperQualifyingEarnings: 50270,
          eligibility: { minimumJoiningAge: 16, automaticEnrolmentAge: 22, statePensionAge: 66, maximumOptInAgeExclusive: 75 },
          source: { name: 'The Pensions Regulator / DWP', url: 'https://www.gov.uk/workplace-pensions/joining-a-workplace-pension' },
          minimumEmployeeRate: 0.05,
          minimumEmployerRate: 0.03,
          periodicThresholds: {
            annual: { trigger: 10000, lowerQualifying: 6240, upperQualifying: 50270 },
            monthly: { trigger: 833.33, lowerQualifying: 520, upperQualifying: 4189.17 },
            weekly: { trigger: 192.31, lowerQualifying: 120, upperQualifying: 966.35 },
            fortnightly: { trigger: 384.62, lowerQualifying: 240, upperQualifying: 1932.69 },
            fourWeekly: { trigger: 769.23, lowerQualifying: 480, upperQualifying: 3865.38 },
            quarterly: { trigger: 2500, lowerQualifying: 1560, upperQualifying: 12567.5 },
            biannual: { trigger: 5000, lowerQualifying: 3120, upperQualifying: 25135 }
          }
        },
        studentLoan: {
          source: { name: 'HM Revenue & Customs / Student Loans Company', url: 'https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2025-to-2026', deductionTablesUrl: 'https://www.gov.uk/government/publications/sl3-student-loan-deduction-tables/2025-to-2026-student-and-postgraduate-loan-deduction-tables' },
          plan1: { threshold: 26065, deductionRate: 0.09, periodicThresholds: { annual: 26065, monthly: 2172.08, weekly: 501.25 } },
          plan2: { threshold: 28470, deductionRate: 0.09, periodicThresholds: { annual: 28470, monthly: 2372.50, weekly: 547.50 } },
          plan4: { threshold: 32745, deductionRate: 0.09, periodicThresholds: { annual: 32745, monthly: 2728.75, weekly: 629.71 } },
          plan5: null,
          postgraduate: { threshold: 21000, deductionRate: 0.06, periodicThresholds: { annual: 21000, monthly: 1750, weekly: 403.84 } }
        },
        statutoryPayments: {
          statutorySickPayWeeklyRate: 118.75,
          statutoryMaternityPayWeeklyRate: 187.18,
          statutoryAdoptionPayWeeklyRate: 187.18,
          statutoryPaternityPayWeeklyRate: 187.18,
          sickPayEarningsReplacementRate: null,
          familyPayEarningsReplacementRate: 0.90,
          ssp: { weeklyRate: 118.75, averageWeeklyEarningsRate: null, waitingDays: 3, lowerEarningsLimit: 125 },
          smp: { standardWeeklyRate: 187.18, higherRate: 0.90, higherRateWeeks: 6, totalPayableWeeks: 39, qualifyingDaysPerWeek: 7 },
          spp: { standardWeeklyRate: 187.18, earningsRate: 0.90, maximumPayableWeeks: 2, qualifyingDaysPerWeek: 7 },
          sap: { standardWeeklyRate: 187.18, higherRate: 0.90, higherRateWeeks: 6, totalPayableWeeks: 39, qualifyingDaysPerWeek: 7 },
          neonatal: { standardWeeklyRate: 187.18, earningsRate: 0.90, maximumPayableWeeks: 12, qualifyingDaysPerWeek: 7 }
        },
        nmw: { apprentice: 7.55, under18: 7.55, age18To20: 10, age21To22: 12.21, nationalLivingWage: 12.21 },
        employmentAllowance: { annualMaximum: 10500 },
        cis: { registeredDeductionRate: 0.20, unregisteredDeductionRate: 0.30, grossPaymentRate: 0 }
      },
      '2026/27': {
        effectiveFrom: '2026-04-06',
        effectiveTo: '2027-04-05',
        metadata: {
          lastUpdated: '2026-09-01',
          sources: {
            hmrc: 'https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2026-to-2027',
            studentLoan: 'https://www.gov.uk/government/publications/sl3-student-loan-deduction-tables/2026-to-2027-student-and-postgraduate-loan-deduction-tables',
            pension: 'https://www.gov.uk/workplace-pensions/joining-a-workplace-pension',
            nmw: 'https://www.gov.uk/national-minimum-wage-rates',
            cis: 'https://www.gov.uk/what-you-must-do-as-a-cis-subcontractor',
            taxCodes: 'https://www.gov.uk/employee-tax-codes/letters'
          }
        },
        source: {
          name: 'HM Revenue & Customs',
          url: 'https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2026-to-2027'
        },

        // HMRC Income Tax rates and Personal Allowances, 2026 to 2027.
        // Band limits are taxable-pay amounts. 'additionalRate' is 125140 minus remaining PA.
        paye: {
          kCodeDeductionLimit: 0.5,
          personalAllowance: 12570,
          periodicPersonalAllowance: { annual: 12570, monthly: 1048, weekly: 242 },
          taperThreshold: 100000,
          additionalRateThreshold: 125140,
          basicRateLimit: 37700,
          basicRate: 0.20,
          higherRate: 0.40,
          additionalRate: 0.45,
          regions: {
            englandNorthernIreland: {
              bands: [{ limit: 37700, rate: 0.20 }, { limit: 'additionalRate', rate: 0.40 }, { limit: Infinity, rate: 0.45 }]
            },
            wales: {
              bands: [{ limit: 37700, rate: 0.20 }, { limit: 'additionalRate', rate: 0.40 }, { limit: Infinity, rate: 0.45 }]
            },
            northernIreland: {
              bands: [{ limit: 37700, rate: 0.20 }, { limit: 'additionalRate', rate: 0.40 }, { limit: Infinity, rate: 0.45 }]
            },
            scotland: {
              bands: [{ limit: 3967, rate: 0.19 }, { limit: 16956, rate: 0.20 }, { limit: 31092, rate: 0.21 }, { limit: 62430, rate: 0.42 }, { limit: 'additionalRate', rate: 0.45 }, { limit: Infinity, rate: 0.48 }]
            }
          }
        },

        // HMRC National Insurance rates and thresholds, 2026 to 2027.
        ni: {
          employeePrimaryThreshold: 12570,
          employeeUpperEarningsLimit: 50270,
          employeeMainRate: 0.08,
          employeeUpperRate: 0.02,
          employerSecondaryThreshold: 5000,
          employerRate: 0.15,
          periodicThresholds: {
            annual: { employeePrimaryThreshold: 12570, employeeUpperEarningsLimit: 50270, employerSecondaryThreshold: 5000, freeportUpperSecondaryThreshold: 25000, investmentZoneUpperSecondaryThreshold: 25000, under21UpperSecondaryThreshold: 50270, apprenticeUpperSecondaryThreshold: 50270, veteranUpperSecondaryThreshold: 50270 },
            monthly: { employeePrimaryThreshold: 1048, employeeUpperEarningsLimit: 4189, employerSecondaryThreshold: 417, freeportUpperSecondaryThreshold: 2083, investmentZoneUpperSecondaryThreshold: 2083, under21UpperSecondaryThreshold: 4189, apprenticeUpperSecondaryThreshold: 4189, veteranUpperSecondaryThreshold: 4189 },
            weekly: { employeePrimaryThreshold: 242, employeeUpperEarningsLimit: 967, employerSecondaryThreshold: 96, freeportUpperSecondaryThreshold: 481, investmentZoneUpperSecondaryThreshold: 481, under21UpperSecondaryThreshold: 967, apprenticeUpperSecondaryThreshold: 967, veteranUpperSecondaryThreshold: 967 }
          },
          categories: {
            // HMRC CA38 National Insurance tables, 2026 to 2027: standard category A.
            A: { employeeMainRate: 0.08, employeeUpperRate: 0.02, employerRate: 0.15, employerThreshold: 5000 },
            // HMRC CA38: married women and widows reduced-rate category B.
            B: { employeeMainRate: 0.0185, employeeUpperRate: 0.02, employerRate: 0.15, employerThreshold: 5000 },
            // HMRC CA38: employees over State Pension age, category C.
            C: { employeeMainRate: 0, employeeUpperRate: 0, employerRate: 0.15, employerThreshold: 5000 },
            // HMRC 2026/27: Investment Zone deferment category D.
            D: { employeeMainRate: 0.02, employeeUpperRate: 0.02, employerRate: 0.15, employerThreshold: 5000, employerReliefThresholdKey: 'investmentZoneUpperSecondaryThreshold' },
            // HMRC CA38: married women and widows reduced-rate category E.
            E: { employeeMainRate: 0.0185, employeeUpperRate: 0.02, employerRate: 0.15, employerThreshold: 5000, employerReliefThresholdKey: 'investmentZoneUpperSecondaryThreshold' },
            // HMRC CA38: Freeports category F follows standard category A rates.
            F: { employeeMainRate: 0.08, employeeUpperRate: 0.02, employerRate: 0.15, employerThreshold: 5000, employerReliefThresholdKey: 'freeportUpperSecondaryThreshold' },
            // HMRC CA38: apprentices under 25, category H, employer relief to UEL.
            H: { employeeMainRate: 0.08, employeeUpperRate: 0.02, employerRate: 0.15, employerThreshold: 5000, employerReliefThresholdKey: 'apprenticeUpperSecondaryThreshold' },
            // HMRC CA38: Freeports reduced-rate category I.
            I: { employeeMainRate: 0.0185, employeeUpperRate: 0.02, employerRate: 0.15, employerThreshold: 5000, employerReliefThresholdKey: 'freeportUpperSecondaryThreshold' },
            // HMRC CA38: deferred category J employee rate applies above the UEL.
            J: { employeeMainRate: 0.02, employeeUpperRate: 0.02, employerRate: 0.15, employerThreshold: 5000 },
            // HMRC 2026/27: Investment Zone state-pension-age category K, with employer relief.
            K: { employeeMainRate: 0, employeeUpperRate: 0, employerRate: 0.15, employerThreshold: 5000, employerReliefThresholdKey: 'investmentZoneUpperSecondaryThreshold' },
            // HMRC 2026/27: Freeport deferment category L.
            L: { employeeMainRate: 0.02, employeeUpperRate: 0.02, employerRate: 0.15, employerThreshold: 5000, employerReliefThresholdKey: 'freeportUpperSecondaryThreshold' },
            // HMRC CA38: under-21 category M; employee NI as category A, employer relief to UEL.
            M: { employeeMainRate: 0.08, employeeUpperRate: 0.02, employerRate: 0.15, employerThreshold: 5000, employerReliefThresholdKey: 'under21UpperSecondaryThreshold' },
            // HMRC CA38: Freeports category N follows standard category A rates.
            N: { employeeMainRate: 0.08, employeeUpperRate: 0.02, employerRate: 0.15, employerThreshold: 5000, employerReliefThresholdKey: 'investmentZoneUpperSecondaryThreshold' },
            // HMRC CA38: Freeports employees over State Pension age, category S.
            S: { employeeMainRate: 0, employeeUpperRate: 0, employerRate: 0.15, employerThreshold: 5000, employerReliefThresholdKey: 'freeportUpperSecondaryThreshold' },
            // HMRC CA38: veterans category V; employee NI as category A, employer relief to UEL.
            V: { employeeMainRate: 0.08, employeeUpperRate: 0.02, employerRate: 0.15, employerThreshold: 5000, employerReliefThresholdKey: 'veteranUpperSecondaryThreshold' },
            // HMRC CA38: deferred under-21 category Z, employee NI deferred to above UEL.
            Z: { employeeMainRate: 0.02, employeeUpperRate: 0.02, employerRate: 0.15, employerThreshold: 5000, employerReliefThresholdKey: 'under21UpperSecondaryThreshold' }
          }
        },

        // The Pensions Regulator automatic enrolment earnings thresholds, 2026 to 2027.
        pension: {
          minimumEarningsTrigger: 10000,
          lowerQualifyingEarnings: 6240,
          upperQualifyingEarnings: 50270,
          eligibility: {
            minimumJoiningAge: 16,
            automaticEnrolmentAge: 22,
            statePensionAge: 66,
            maximumOptInAgeExclusive: 75
          },
          source: {
            name: 'The Pensions Regulator / DWP',
            url: 'https://www.thepensionsregulator.gov.uk/en/document-library/automatic-enrolment-detailed-guidance/5-guidance-for-automatic-enrolment-earnings-thresholds'
          },
          minimumEmployeeRate: 0.05,
          minimumEmployerRate: 0.03,
          periodicThresholds: {
            annual: { trigger: 10000, lowerQualifying: 6240, upperQualifying: 50270 },
            monthly: { trigger: 833.33, lowerQualifying: 520, upperQualifying: 4189.17 },
            weekly: { trigger: 192.31, lowerQualifying: 120, upperQualifying: 966.35 },
            fortnightly: { trigger: 384.62, lowerQualifying: 240, upperQualifying: 1932.69 },
            fourWeekly: { trigger: 769.23, lowerQualifying: 480, upperQualifying: 3865.38 },
            quarterly: { trigger: 2500, lowerQualifying: 1560, upperQualifying: 12567.5 },
            biannual: { trigger: 5000, lowerQualifying: 3120, upperQualifying: 25135 }
          }
        },

        // HMRC Student Loan deductions guidance, 2026 to 2027.
        studentLoan: {
          source: {
            name: 'HM Revenue & Customs / Student Loans Company',
            url: 'https://www.gov.uk/guidance/special-rules-for-student-loans',
            deductionTablesUrl: 'https://www.gov.uk/government/publications/sl3-student-loan-deduction-tables/2026-to-2027-student-and-postgraduate-loan-deduction-tables'
          },
          plan1: { threshold: 26900, deductionRate: 0.09, periodicThresholds: { annual: 26900, monthly: 2241.66, weekly: 517.30 } },
          plan2: { threshold: 29385, deductionRate: 0.09, periodicThresholds: { annual: 29385, monthly: 2448.75, weekly: 565.09 } },
          plan4: { threshold: 33795, deductionRate: 0.09, periodicThresholds: { annual: 33795, monthly: 2816.25, weekly: 649.90 } },
          plan5: { threshold: 25000, deductionRate: 0.09, periodicThresholds: { annual: 25000, monthly: 2083.33, weekly: 480.76 } },
          postgraduate: { threshold: 21000, deductionRate: 0.06, periodicThresholds: { annual: 21000, monthly: 1750, weekly: 403.84 } }
        },

        // GOV.UK statutory payment rates, 2026 to 2027.
        // Eligibility and timing rules are not implemented by the current UI.
        statutoryPayments: {
          statutorySickPayWeeklyRate: 123.25,
          statutoryMaternityPayWeeklyRate: 194.32,
          statutoryAdoptionPayWeeklyRate: 194.32,
          statutoryPaternityPayWeeklyRate: 194.32,
          sickPayEarningsReplacementRate: 0.70,
          familyPayEarningsReplacementRate: 0.90,
          // HMRC Statutory Sick Pay guidance, 2026 to 2027: £123.25 weekly rate.
          // From 6 April 2026 SSP is payable from the first full day and the LEL is removed.
          ssp: {
            weeklyRate: 123.25,
            averageWeeklyEarningsRate: 0.80,
            waitingDays: 0,
            lowerEarningsLimit: 0
          },
          // HMRC Statutory Maternity Pay guidance, 2026 to 2027: first 6 weeks at 90% AWE;
          // remaining 33 weeks at the lower of 90% AWE or the statutory weekly rate.
          smp: {
            standardWeeklyRate: 194.32,
            higherRate: 0.90,
            higherRateWeeks: 6,
            totalPayableWeeks: 39,
            qualifyingDaysPerWeek: 7
          },
          // HMRC Statutory Paternity Pay guidance, 2026 to 2027: lower of 90% AWE
          // or the statutory weekly rate, for up to two weeks.
          spp: {
            standardWeeklyRate: 194.32,
            earningsRate: 0.90,
            maximumPayableWeeks: 2,
            qualifyingDaysPerWeek: 7
          },
          // HMRC Statutory Adoption Pay guidance, 2026 to 2027: first 6 weeks at 90% AWE;
          // remaining 33 weeks at the lower of 90% AWE or the statutory weekly rate.
          sap: {
            standardWeeklyRate: 194.32,
            higherRate: 0.90,
            higherRateWeeks: 6,
            totalPayableWeeks: 39,
            qualifyingDaysPerWeek: 7
          },
          // HMRC Statutory Neonatal Care Pay guidance, 2026 to 2027: lower of 90% AWE
          // or the statutory weekly rate, for up to 12 weeks of neonatal care leave.
          neonatal: {
            standardWeeklyRate: 194.32,
            earningsRate: 0.90,
            maximumPayableWeeks: 12,
            qualifyingDaysPerWeek: 7
          }
        },

        // GOV.UK National Minimum Wage and National Living Wage rates, 2026 to 2027.
        // Rates are left unset until the official annual rates are confirmed.
        nmw: { apprentice: 8, under18: 8, age18To20: 10.85, age21To22: 12.71, nationalLivingWage: 12.71 },
        employmentAllowance: { annualMaximum: 10500 },
        cis: { registeredDeductionRate: 0.20, unregisteredDeductionRate: 0.30, grossPaymentRate: 0 }
      },
      '2027/28': {
        effectiveFrom: '2027-04-06',
        effectiveTo: '2028-04-05',
        paye: null,
        ni: null,
        pension: null,
        studentLoan: null,
        statutoryPayments: null,
        nmw: null
      },
      '2028/29': {
        effectiveFrom: '2028-04-06',
        effectiveTo: '2029-04-05',
        paye: null,
        ni: null,
        pension: null,
        studentLoan: null,
        statutoryPayments: null,
        nmw: null
      }
    }
  };

  payrollRules.supportedTaxYears = Object.freeze(Object.keys(payrollRules.taxYears).filter(taxYear => {
    const rules = payrollRules.taxYears[taxYear];
    return rules.paye && rules.ni && rules.pension && rules.studentLoan && rules.statutoryPayments && rules.nmw;
  }));
  global.PayrollRules = Object.freeze(payrollRules);
}(typeof globalThis !== 'undefined' ? globalThis : this));
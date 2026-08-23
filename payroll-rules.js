(function (global) {
  'use strict';

  const payrollRules = {
    effectiveTaxYearDates: {
      start: '6 April',
      end: '5 April'
    },
    taxYears: {
      '2026/27': {
        effectiveFrom: '2026-04-06',
        effectiveTo: '2027-04-05',

        // HMRC Income Tax rates and Personal Allowances, 2026 to 2027.
        paye: {
          personalAllowance: 12570,
          basicRateLimit: 37700,
          basicRate: 0.20,
          higherRate: 0.40,
          supportedTaxCodes: ['1257L'],
          regions: {
            englandNorthernIreland: {
              bands: [{ limit: 37700, rate: 0.20 }, { limit: Infinity, rate: 0.40 }]
            },
            wales: {
              bands: [{ limit: 37700, rate: 0.20 }, { limit: Infinity, rate: 0.40 }]
            },
            scotland: {
              bands: [{ limit: 3967, rate: 0.19 }, { limit: 16956, rate: 0.20 }, { limit: 31092, rate: 0.21 }, { limit: 62430, rate: 0.42 }, { limit: 125140, rate: 0.45 }, { limit: Infinity, rate: 0.48 }]
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
          categories: {
            // HMRC CA38 National Insurance tables, 2026 to 2027: standard category A.
            A: { employeeMainRate: 0.08, employeeUpperRate: 0.02, employerRate: 0.15, employerThreshold: 5000 },
            // HMRC CA38: married women and widows reduced-rate category B.
            B: { employeeMainRate: 0.0185, employeeUpperRate: 0.02, employerRate: 0.15, employerThreshold: 5000 },
            // HMRC CA38: employees over State Pension age, category C.
            C: { employeeMainRate: 0, employeeUpperRate: 0, employerRate: 0.15, employerThreshold: 5000 },
            // HMRC CA38: contracted-out salary-related pension scheme category D.
            D: { employeeMainRate: 0, employeeUpperRate: 0, employerRate: 0.15, employerThreshold: 5000 },
            // HMRC CA38: married women and widows reduced-rate category E.
            E: { employeeMainRate: 0.0185, employeeUpperRate: 0.02, employerRate: 0.15, employerThreshold: 5000 },
            // HMRC CA38: Freeports category F follows standard category A rates.
            F: { employeeMainRate: 0.08, employeeUpperRate: 0.02, employerRate: 0.15, employerThreshold: 5000 },
            // HMRC CA38: apprentices under 25, category H, employer relief to UEL.
            H: { employeeMainRate: 0.08, employeeUpperRate: 0.02, employerRate: 0.15, employerThreshold: 5000, employerReliefToUel: true },
            // HMRC CA38: Freeports reduced-rate category I.
            I: { employeeMainRate: 0.0185, employeeUpperRate: 0.02, employerRate: 0.15, employerThreshold: 5000 },
            // HMRC CA38: deferred category J employee rate applies above the UEL.
            J: { employeeMainRate: 0, employeeUpperRate: 0.02, employerRate: 0.15, employerThreshold: 5000 },
            // HMRC CA38: category K has no employee contribution; employer contribution remains due.
            K: { employeeMainRate: 0, employeeUpperRate: 0, employerRate: 0.15, employerThreshold: 5000 },
            // HMRC CA38: contracted-out money-purchase category L.
            L: { employeeMainRate: 0, employeeUpperRate: 0, employerRate: 0.15, employerThreshold: 5000 },
            // HMRC CA38: apprentices under 25 in a Freeport, category M equivalent.
            M: { employeeMainRate: 0, employeeUpperRate: 0, employerRate: 0.15, employerThreshold: 5000, employerReliefToUel: true },
            // HMRC CA38: Freeports category N follows standard category A rates.
            N: { employeeMainRate: 0.08, employeeUpperRate: 0.02, employerRate: 0.15, employerThreshold: 5000 },
            // HMRC CA38: Freeports employees over State Pension age, category S.
            S: { employeeMainRate: 0, employeeUpperRate: 0, employerRate: 0.15, employerThreshold: 5000 },
            // HMRC CA38: veterans category V follows standard category A rates.
            V: { employeeMainRate: 0.08, employeeUpperRate: 0.02, employerRate: 0.15, employerThreshold: 5000 },
            // HMRC CA38: deferred under-21 category Z, employee NI deferred to above UEL.
            Z: { employeeMainRate: 0, employeeUpperRate: 0.02, employerRate: 0.15, employerThreshold: 5000, employerReliefToUel: true }
          }
        },

        // The Pensions Regulator automatic enrolment earnings thresholds.
        pension: {
          lowerQualifyingEarnings: 6240,
          upperQualifyingEarnings: 50270,
          minimumEmployeeRate: 0.05,
          minimumEmployerRate: 0.03
        },

        // HMRC Student loan deductions guidance, 2026 to 2027.
        // Plan thresholds are intentionally unset until confirmed for this release.
        studentLoan: {
          plan1: null,
          plan2: null,
          plan4: null,
          postgraduate: null
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
        nmw: {
          apprentice: null,
          under18: null,
          age18To20: null,
          age21To22: null,
          nationalLivingWage: null
        }
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

  global.PayrollRules = Object.freeze(payrollRules);
}(typeof globalThis !== 'undefined' ? globalThis : this));
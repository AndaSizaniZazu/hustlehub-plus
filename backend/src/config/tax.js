/**
 * Approximate individual income tax for freelancers.
 *
 * Brackets and the primary rebate are the SARS 2027 year of assessment
 * (1 March 2026 – 28 February 2027), checked against:
 * https://www.sars.gov.za/tax-rates/income-tax/rates-of-tax-for-individuals/
 * (rates published 25 February 2026).
 *
 * Change TAX_CONFIG when SARS publishes a new table. Do not scatter rates
 * through controllers.
 *
 * What this estimate does:
 * 1. Treat tracked gig income as taxable income.
 * 2. Find the one bracket the income falls in.
 * 3. Tax = bracket base + rate × (income − bracket threshold).
 * 4. Subtract the primary rebate (under 65). No secondary or tertiary rebate,
 *    because the app does not store age.
 * 5. Tax is never below 0. Round money to cents.
 *
 * What it ignores: deductions, medical credits, allowances, and provisional tax.
 * This is not a SARS assessment.
 */

const TAX_CONFIG = {
  taxYear: '2027',
  period: '1 March 2026 – 28 February 2027',
  primaryRebate: 17820,
  brackets: [
    { upTo: 245100, rate: 0.18, base: 0, above: 0 },
    { upTo: 383100, rate: 0.26, base: 44118, above: 245100 },
    { upTo: 530200, rate: 0.31, base: 79998, above: 383100 },
    { upTo: 695800, rate: 0.36, base: 125599, above: 530200 },
    { upTo: 887000, rate: 0.39, base: 185215, above: 695800 },
    { upTo: 1878600, rate: 0.41, base: 259783, above: 887000 },
    { upTo: Infinity, rate: 0.45, base: 666339, above: 1878600 },
  ],
};

const roundMoney = (amount) => Math.round((amount + Number.EPSILON) * 100) / 100;

const estimateTax = (income) => {
  const taxable = Number(income);
  if (!Number.isFinite(taxable) || taxable <= 0) {
    return {
      taxYear: TAX_CONFIG.taxYear,
      estimatedTax: 0,
      netIncome: 0,
      grossTax: 0,
      rebate: TAX_CONFIG.primaryRebate,
      marginalRate: TAX_CONFIG.brackets[0].rate,
      effectiveRate: 0,
    };
  }

  const bracket = TAX_CONFIG.brackets.find((item) => taxable <= item.upTo);
  const grossTax = bracket.base + (taxable - bracket.above) * bracket.rate;
  const estimatedTax = roundMoney(Math.max(0, grossTax - TAX_CONFIG.primaryRebate));

  return {
    taxYear: TAX_CONFIG.taxYear,
    estimatedTax,
    netIncome: roundMoney(taxable - estimatedTax),
    grossTax: roundMoney(grossTax),
    rebate: TAX_CONFIG.primaryRebate,
    marginalRate: bracket.rate,
    effectiveRate: Math.round((estimatedTax / taxable) * 10000) / 10000, // e.g. 0.1234 = 12.34%
  };
};

module.exports = { TAX_CONFIG, estimateTax };

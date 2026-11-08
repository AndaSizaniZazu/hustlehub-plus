const { TAX_CONFIG, estimateTax } = require('../src/config/tax');

describe('estimateTax (SARS 2027 brackets)', () => {
  test('zero, negative and invalid income give no tax', () => {
    for (const income of [0, -100, 'abc', undefined]) {
      expect(estimateTax(income)).toMatchObject({ estimatedTax: 0, netIncome: 0, effectiveRate: 0 });
    }
  });

  test('income under the tax threshold pays nothing after the rebate', () => {
    // 18% of 90 000 = 16 200, less than the 17 820 rebate
    expect(estimateTax(90000)).toMatchObject({ grossTax: 16200, estimatedTax: 0, netIncome: 90000 });
  });

  test('first bracket: 18% minus rebate', () => {
    // 200 000 × 18% = 36 000 − 17 820 = 18 180
    expect(estimateTax(200000)).toMatchObject({
      grossTax: 36000, estimatedTax: 18180, netIncome: 181820, marginalRate: 0.18,
    });
  });

  test('second bracket uses base + rate on the amount above the threshold', () => {
    // 44 118 + 26% × (300 000 − 245 100) = 58 392 − 17 820 = 40 572
    const result = estimateTax(300000);
    expect(result).toMatchObject({ grossTax: 58392, estimatedTax: 40572, marginalRate: 0.26 });
    expect(result.effectiveRate).toBeCloseTo(0.1352, 4);
  });

  test('bracket edge value stays in the lower bracket', () => {
    expect(estimateTax(245100)).toMatchObject({ grossTax: 44118, marginalRate: 0.18 });
  });

  test('top bracket is 45%', () => {
    // 666 339 + 45% × (2 000 000 − 1 878 600) = 720 969 − 17 820 = 703 149
    expect(estimateTax(2000000)).toMatchObject({ grossTax: 720969, estimatedTax: 703149, marginalRate: 0.45 });
  });

  test('every bracket base matches the previous bracket at its upper edge', () => {
    for (let i = 1; i < TAX_CONFIG.brackets.length; i += 1) {
      const prev = TAX_CONFIG.brackets[i - 1];
      const expectedBase = prev.base + (prev.upTo - prev.above) * prev.rate;
      expect(Math.abs(TAX_CONFIG.brackets[i].base - expectedBase)).toBeLessThanOrEqual(1);
    }
  });
});

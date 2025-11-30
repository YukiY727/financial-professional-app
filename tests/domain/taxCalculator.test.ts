/**
 * 税金計算のテストコード
 */

import { assertEquals } from '@std/assert';
import {
  calculateSalaryDeduction,
  calculateTaxableIncome,
  calculateIncomeTax,
  calculateReconstructionTax,
  calculateResidentTax,
  calculateSocialInsurance,
  calculateTotalTax,
} from '../../shared/domain/taxCalculator.ts';

/**
 * 給与所得控除のテスト
 */
Deno.test('給与所得控除: 年収500万円の場合', () => {
  const salary = 5_000_000;
  const deduction = calculateSalaryDeduction(salary);

  // 500万円は360万円超〜660万円以下: 収入 × 20% + 44万円
  // 5,000,000 × 0.2 + 440,000 = 1,440,000
  assertEquals(deduction, 1_440_000);
});

Deno.test('給与所得控除: 年収150万円の場合（最低額）', () => {
  const salary = 1_500_000;
  const deduction = calculateSalaryDeduction(salary);

  // 162.5万円以下: 55万円
  assertEquals(deduction, 550_000);
});

Deno.test('給与所得控除: 年収1000万円の場合（上限付近）', () => {
  const salary = 10_000_000;
  const deduction = calculateSalaryDeduction(salary);

  // 850万円超: 195万円（上限）
  assertEquals(deduction, 1_950_000);
});

/**
 * 課税所得のテスト
 */
Deno.test('課税所得: 年収500万円の場合', () => {
  const grossIncome = 5_000_000;
  const taxableIncome = calculateTaxableIncome(grossIncome);

  // 総収入 - 給与所得控除(1,440,000) - 基礎控除(480,000)
  // 5,000,000 - 1,440,000 - 480,000 = 3,080,000
  assertEquals(taxableIncome, 3_080_000);
});

Deno.test('課税所得: マイナスにならない（低収入の場合）', () => {
  const grossIncome = 500_000;
  const taxableIncome = calculateTaxableIncome(grossIncome);

  // 控除額が総収入を超えてもマイナスにならない
  assertEquals(taxableIncome, 0);
});

/**
 * 所得税のテスト
 */
Deno.test('所得税: 課税所得300万円の場合', () => {
  const taxableIncome = 3_000_000;
  const incomeTax = calculateIncomeTax(taxableIncome);

  // 195万円超〜330万円以下: 課税所得 × 10% - 97,500
  // 3,000,000 × 0.10 - 97,500 = 202,500
  assertEquals(incomeTax, 202_500);
});

Deno.test('所得税: 課税所得700万円の場合', () => {
  const taxableIncome = 7_000_000;
  const incomeTax = calculateIncomeTax(taxableIncome);

  // 695万円超〜900万円以下: 課税所得 × 23% - 636,000
  // 7,000,000 × 0.23 - 636,000 = 974,000
  assertEquals(incomeTax, 974_000);
});

Deno.test('所得税: 課税所得0円の場合', () => {
  const taxableIncome = 0;
  const incomeTax = calculateIncomeTax(taxableIncome);

  assertEquals(incomeTax, 0);
});

/**
 * 復興特別所得税のテスト
 */
Deno.test('復興特別所得税: 所得税20万円の場合', () => {
  const incomeTax = 200_000;
  const reconstructionTax = calculateReconstructionTax(incomeTax);

  // 所得税 × 2.1% = 200,000 × 0.021 = 4,200
  assertEquals(reconstructionTax, 4_200);
});

/**
 * 住民税のテスト
 */
Deno.test('住民税: 課税所得300万円の場合', () => {
  const taxableIncome = 3_000_000;
  const residentTax = calculateResidentTax(taxableIncome);

  // 課税所得 × 10% + 均等割5,000円
  // 3,000,000 × 0.10 + 5,000 = 305,000
  assertEquals(residentTax, 305_000);
});

Deno.test('住民税: 課税所得0円の場合（均等割のみ）', () => {
  const taxableIncome = 0;
  const residentTax = calculateResidentTax(taxableIncome);

  // 均等割のみ
  assertEquals(residentTax, 5_000);
});

/**
 * 社会保険料のテスト
 */
Deno.test('社会保険料: 年収500万円の場合', () => {
  const annualIncome = 5_000_000;
  const socialInsurance = calculateSocialInsurance(annualIncome);

  // 月額給与: 5,000,000 / 12 ≈ 416,667
  // 厚生年金: 416,667 × 9.15% × 12 = 457,500 (概算)
  // 健康保険: 416,667 × 5% × 12 = 250,000 (概算)
  // 雇用保険: 5,000,000 × 0.6% = 30,000
  // 合計: 約 737,500

  // 実際の計算（端数処理込み）を確認
  assertEquals(socialInsurance > 730_000, true);
  assertEquals(socialInsurance < 750_000, true);
});

/**
 * 統合テスト: 税金合計計算
 */
Deno.test('税金合計: 年収500万円の場合', () => {
  const grossIncome = 5_000_000;
  const result = calculateTotalTax(grossIncome);

  // 給与所得控除
  assertEquals(result.salaryDeduction, 1_440_000);

  // 課税所得
  assertEquals(result.taxableIncome, 3_080_000);

  // 所得税（課税所得3,080,000円）
  // 3,080,000 × 0.10 - 97,500 = 210,500
  assertEquals(result.incomeTax, 210_500);

  // 復興特別所得税
  // 210,500 × 0.021 = 4,420.5 → 4,420
  assertEquals(result.reconstructionTax, 4_420);

  // 住民税
  // 3,080,000 × 0.10 + 5,000 = 313,000
  assertEquals(result.residentTax, 313_000);

  // 社会保険料
  assertEquals(result.socialInsurance > 730_000, true);
  assertEquals(result.socialInsurance < 750_000, true);

  // 税金合計
  assertEquals(result.total > 1_250_000, true);
  assertEquals(result.total < 1_280_000, true);
});

Deno.test('税金合計: 年収300万円の場合', () => {
  const grossIncome = 3_000_000;
  const result = calculateTotalTax(grossIncome);

  // 給与所得控除
  // 300万円は180万円超〜360万円以下: 収入 × 30% + 8万円
  // 3,000,000 × 0.3 + 80,000 = 980,000
  assertEquals(result.salaryDeduction, 980_000);

  // 課税所得
  // 3,000,000 - 980,000 - 480,000 = 1,540,000
  assertEquals(result.taxableIncome, 1_540_000);

  // 所得税（課税所得1,540,000円）
  // 195万円以下: 1,540,000 × 0.05 = 77,000
  assertEquals(result.incomeTax, 77_000);

  // 復興特別所得税
  // 77,000 × 0.021 = 1,617
  assertEquals(result.reconstructionTax, 1_617);

  // 住民税
  // 1,540,000 × 0.10 + 5,000 = 159,000
  assertEquals(result.residentTax, 159_000);
});

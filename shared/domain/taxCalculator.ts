/**
 * 税金計算ロジック（フロント/バック共有）
 */

import {
  BASIC_DEDUCTION,
  RECONSTRUCTION_TAX_RATE,
  RESIDENT_TAX_RATE,
  RESIDENT_TAX_FLAT,
  PENSION_RATE,
  PENSION_MAX_MONTHLY_SALARY,
  HEALTH_INSURANCE_RATE,
  HEALTH_MAX_MONTHLY_SALARY,
  EMPLOYMENT_INSURANCE_RATE,
  SALARY_DEDUCTION_RULES,
  INCOME_TAX_BRACKETS,
} from './constants.js';

/**
 * 給与所得控除額を計算
 *
 * @param salary 給与収入（円）
 * @returns 給与所得控除額（円）
 */
export function calculateSalaryDeduction(salary: number): number {
  for (const rule of SALARY_DEDUCTION_RULES) {
    if (salary <= rule.upperLimit) {
      if (rule.type === 'fixed') {
        return rule.fixedAmount!;
      } else {
        return Math.floor(salary * rule.rate! + rule.adjustment!);
      }
    }
  }
  // フォールバック（到達しないはず）
  return 1_950_000;
}

/**
 * 課税所得を計算
 *
 * @param grossIncome 総収入（円）
 * @returns 課税所得（円）
 */
export function calculateTaxableIncome(grossIncome: number): number {
  const salaryDeduction = calculateSalaryDeduction(grossIncome);
  const taxableIncome = grossIncome - salaryDeduction - BASIC_DEDUCTION;
  return Math.max(0, taxableIncome); // マイナスにならないように
}

/**
 * 所得税を計算（累進課税）
 *
 * @param taxableIncome 課税所得（円）
 * @returns 所得税（円）
 */
export function calculateIncomeTax(taxableIncome: number): number {
  if (taxableIncome <= 0) {
    return 0;
  }

  for (const bracket of INCOME_TAX_BRACKETS) {
    if (taxableIncome <= bracket.upperLimit) {
      return Math.floor(taxableIncome * bracket.rate - bracket.deduction);
    }
  }

  // フォールバック（到達しないはず）
  const lastBracket = INCOME_TAX_BRACKETS[INCOME_TAX_BRACKETS.length - 1];
  return Math.floor(taxableIncome * lastBracket.rate - lastBracket.deduction);
}

/**
 * 復興特別所得税を計算
 *
 * @param incomeTax 所得税（円）
 * @returns 復興特別所得税（円）
 */
export function calculateReconstructionTax(incomeTax: number): number {
  return Math.floor(incomeTax * RECONSTRUCTION_TAX_RATE);
}

/**
 * 住民税を計算
 *
 * @param taxableIncome 課税所得（円）
 * @returns 住民税（円）
 */
export function calculateResidentTax(taxableIncome: number): number {
  if (taxableIncome <= 0) {
    return RESIDENT_TAX_FLAT; // 均等割のみ
  }
  return Math.floor(taxableIncome * RESIDENT_TAX_RATE) + RESIDENT_TAX_FLAT;
}

/**
 * 社会保険料を計算
 *
 * @param annualIncome 年収（円）
 * @returns 社会保険料合計（円）
 */
export function calculateSocialInsurance(annualIncome: number): number {
  const monthlySalary = annualIncome / 12;

  // 厚生年金保険料
  const pensionBase = Math.min(monthlySalary, PENSION_MAX_MONTHLY_SALARY);
  const pensionMonthly = Math.floor(pensionBase * PENSION_RATE);
  const pensionAnnual = pensionMonthly * 12;

  // 健康保険料
  const healthBase = Math.min(monthlySalary, HEALTH_MAX_MONTHLY_SALARY);
  const healthMonthly = Math.floor(healthBase * HEALTH_INSURANCE_RATE);
  const healthAnnual = healthMonthly * 12;

  // 雇用保険料
  const employment = Math.floor(annualIncome * EMPLOYMENT_INSURANCE_RATE);

  return pensionAnnual + healthAnnual + employment;
}

/**
 * 税金合計を計算
 *
 * @param grossIncome 総収入（円）
 * @returns 税金情報オブジェクト
 */
export function calculateTotalTax(grossIncome: number): {
  salaryDeduction: number;
  taxableIncome: number;
  incomeTax: number;
  reconstructionTax: number;
  residentTax: number;
  socialInsurance: number;
  total: number;
} {
  const salaryDeduction = calculateSalaryDeduction(grossIncome);
  const taxableIncome = grossIncome - salaryDeduction - BASIC_DEDUCTION;
  const adjustedTaxableIncome = Math.max(0, taxableIncome);

  const incomeTax = calculateIncomeTax(adjustedTaxableIncome);
  const reconstructionTax = calculateReconstructionTax(incomeTax);
  const residentTax = calculateResidentTax(adjustedTaxableIncome);
  const socialInsurance = calculateSocialInsurance(grossIncome);

  const total = incomeTax + reconstructionTax + residentTax + socialInsurance;

  return {
    salaryDeduction,
    taxableIncome: adjustedTaxableIncome,
    incomeTax,
    reconstructionTax,
    residentTax,
    socialInsurance,
    total,
  };
}

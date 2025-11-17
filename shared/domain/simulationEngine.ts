/**
 * シミュレーションエンジン（フロント/バック共有）
 */

import type {
  SimulationInput,
  SimulationResult,
  YearlyRecord,
  IncomeInfo,
  TaxInfo,
  ExpenseInfo,
  SavingsInfo,
} from './types.js';
import { calculateTotalTax } from './taxCalculator.js';
import { DEFAULT_EXPENSE_ALLOCATION } from './constants.js';

/**
 * 年次キャッシュフローシミュレーションを実行
 *
 * @param input シミュレーション入力
 * @returns シミュレーション結果
 */
export function runSimulation(input: SimulationInput): SimulationResult {
  const { profile, simpleExpense } = input;
  const yearlyRecords: YearlyRecord[] = [];

  let totalAssets = profile.currentSavings;
  let annualIncome = profile.currentAnnualIncome;

  const startYear = new Date().getFullYear();
  const totalYears = profile.retirementAge - profile.currentAge;

  for (let i = 0; i < totalYears; i++) {
    const year = startYear + i;
    const age = profile.currentAge + i;

    // 1. 税金計算
    const taxCalc = calculateTotalTax(annualIncome);

    const income: IncomeInfo = {
      gross: annualIncome,
      salaryDeduction: taxCalc.salaryDeduction,
      taxableIncome: taxCalc.taxableIncome,
    };

    const tax: TaxInfo = {
      incomeTax: taxCalc.incomeTax,
      reconstructionTax: taxCalc.reconstructionTax,
      residentTax: taxCalc.residentTax,
      socialInsurance: taxCalc.socialInsurance,
      total: taxCalc.total,
    };

    // 2. 手取り計算
    const netIncome = annualIncome - taxCalc.total;

    // 3. 支出計算（simpleモード）
    const savingsAmount = Math.floor(netIncome * (simpleExpense.savingsRate / 100));
    const expenseTotal = netIncome - savingsAmount;

    const expense: ExpenseInfo = {
      housing: Math.floor(expenseTotal * DEFAULT_EXPENSE_ALLOCATION.housing),
      living: Math.floor(expenseTotal * DEFAULT_EXPENSE_ALLOCATION.living),
      other: Math.floor(expenseTotal * DEFAULT_EXPENSE_ALLOCATION.other),
      total: expenseTotal,
    };

    // 4. 資産更新
    totalAssets += savingsAmount;

    const savings: SavingsInfo = {
      annual: savingsAmount,
      total: totalAssets,
    };

    // 5. 年次レコード作成
    const record: YearlyRecord = {
      year,
      age,
      income,
      tax,
      netIncome,
      expense,
      savings,
    };

    yearlyRecords.push(record);

    // 6. 翌年準備（昇給）
    annualIncome = Math.floor(annualIncome * (1 + profile.incomeGrowthRate / 100));
  }

  // サマリー計算
  const summary = {
    totalYears,
    finalAge: profile.retirementAge,
    finalTotalAssets: totalAssets,
    totalTaxPaid: yearlyRecords.reduce((sum, r) => sum + r.tax.total, 0),
  };

  return {
    input,
    yearlyRecords,
    summary,
  };
}

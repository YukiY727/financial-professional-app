/**
 * 共有型定義（フロント/バック共通）
 */

/**
 * ユーザープロファイル
 */
export interface Profile {
  /** 現在の年齢 */
  currentAge: number;
  /** 退職年齢 */
  retirementAge: number;
  /** 現在の年収（円） */
  currentAnnualIncome: number;
  /** 昇給率（%） */
  incomeGrowthRate: number;
  /** 現在の貯金額（円） */
  currentSavings: number;
}

/**
 * 支出設定（シンプルモード）
 */
export interface SimpleExpense {
  /** 貯金率（%） */
  savingsRate: number;
}

/**
 * シミュレーション入力
 */
export interface SimulationInput {
  profile: Profile;
  expenseMode: 'simple';
  simpleExpense: SimpleExpense;
}

/**
 * 収入情報
 */
export interface IncomeInfo {
  /** 総収入（額面） */
  gross: number;
  /** 給与所得控除額 */
  salaryDeduction: number;
  /** 課税所得 */
  taxableIncome: number;
}

/**
 * 税金情報
 */
export interface TaxInfo {
  /** 所得税 */
  incomeTax: number;
  /** 復興特別所得税 */
  reconstructionTax: number;
  /** 住民税 */
  residentTax: number;
  /** 社会保険料 */
  socialInsurance: number;
  /** 税金合計 */
  total: number;
}

/**
 * 支出情報
 */
export interface ExpenseInfo {
  /** 住居費 */
  housing: number;
  /** 生活費 */
  living: number;
  /** その他 */
  other: number;
  /** 支出合計 */
  total: number;
}

/**
 * 貯蓄情報
 */
export interface SavingsInfo {
  /** 年間貯蓄額 */
  annual: number;
  /** 累計貯蓄額 */
  total: number;
}

/**
 * 年次レコード
 */
export interface YearlyRecord {
  /** 年 */
  year: number;
  /** 年齢 */
  age: number;
  /** 収入情報 */
  income: IncomeInfo;
  /** 税金情報 */
  tax: TaxInfo;
  /** 手取り収入 */
  netIncome: number;
  /** 支出情報 */
  expense: ExpenseInfo;
  /** 貯蓄情報 */
  savings: SavingsInfo;
}

/**
 * シミュレーション結果サマリー
 */
export interface SimulationSummary {
  /** 総年数 */
  totalYears: number;
  /** 最終年齢 */
  finalAge: number;
  /** 最終総資産 */
  finalTotalAssets: number;
  /** 総納税額 */
  totalTaxPaid: number;
}

/**
 * シミュレーション結果
 */
export interface SimulationResult {
  /** 入力データ */
  input: SimulationInput;
  /** 年次レコード */
  yearlyRecords: YearlyRecord[];
  /** サマリー */
  summary: SimulationSummary;
}

/**
 * UC-001: 老後までにいくら貯まるか - 具体例
 *
 * 仕様書 (docs/01_specification_overview.md) に基づいて、
 * Python スクリプト (scripts/calculate_uc001_examples.py) で計算した期待値。
 *
 * 重要な前提:
 * - 社会保険料控除を考慮した課税所得計算
 * - 課税所得 = 年収 - 給与所得控除 - 基礎控除 - 社会保険料
 * - 2024年度の税制・社会保険料率を使用
 */

/**
 * UC-001の入力データ型
 */
export interface UC001Input {
  currentAge: number // 現在の年齢
  retirementAge: number // 退職年齢
  currentAnnualIncome: number // 現在の年収 (額面)
  incomeGrowthRate: number // 昇給率 (例: 0.02 = 2%)
  currentSavings: number // 現在の貯金額
  savingsRate: number // 貯金率 (例: 0.20 = 20%)
}

/**
 * UC-001の期待される出力データ型
 */
export interface UC001Expected {
  finalAge: number // 退職時年齢
  finalTotalAssets: number // 退職時総資産
  totalYears: number // 運用年数
}

/**
 * UC-001の具体例データ型
 */
export interface UC001Example {
  id: string // 識別子
  description: string // 説明
  input: UC001Input // 入力
  expected: UC001Expected // 期待値
}

/**
 * UC-001の具体例リスト
 *
 * 7つのパターンを網羅:
 * 1. basic-case: 標準的なケース
 * 2. high-income: 高収入ケース
 * 3. boundary-min-age: 境界値 (最低年齢)
 * 4. boundary-max-age: 境界値 (高齢スタート)
 * 5. edge-no-growth: エッジケース (昇給率0%)
 * 6. edge-high-savings-rate: エッジケース (高貯金率)
 * 7. edge-short-period: エッジケース (短期間)
 */
export const UC001_EXAMPLES: UC001Example[] = [
  {
    id: 'basic-case',
    description: '30歳、年収500万円、貯金率20%、65歳退職',
    input: {
      currentAge: 30,
      retirementAge: 65,
      currentAnnualIncome: 5_000_000,
      incomeGrowthRate: 0.02, // 2%
      currentSavings: 1_000_000,
      savingsRate: 0.20, // 20%
    },
    expected: {
      finalAge: 65,
      finalTotalAssets: 38_310_355,
      totalYears: 35,
    },
  },
  {
    id: 'high-income',
    description: '高収入ケース: 年収1000万円',
    input: {
      currentAge: 35,
      retirementAge: 60,
      currentAnnualIncome: 10_000_000,
      incomeGrowthRate: 0.01, // 1%
      currentSavings: 5_000_000,
      savingsRate: 0.30, // 30%
    },
    expected: {
      finalAge: 60,
      finalTotalAssets: 63_939_117,
      totalYears: 25,
    },
  },
  {
    id: 'boundary-min-age',
    description: '境界値: 最低年齢20歳',
    input: {
      currentAge: 20,
      retirementAge: 65,
      currentAnnualIncome: 3_000_000,
      incomeGrowthRate: 0.03, // 3%
      currentSavings: 0,
      savingsRate: 0.15, // 15%
    },
    expected: {
      finalAge: 65,
      finalTotalAssets: 31_284_218,
      totalYears: 45,
    },
  },
  {
    id: 'boundary-max-age',
    description: '境界値: 60歳スタート',
    input: {
      currentAge: 60,
      retirementAge: 65,
      currentAnnualIncome: 8_000_000,
      incomeGrowthRate: 0.0, // 昇給なし
      currentSavings: 20_000_000,
      savingsRate: 0.40, // 40%
    },
    expected: {
      finalAge: 65,
      finalTotalAssets: 31_801_660,
      totalYears: 5,
    },
  },
  {
    id: 'edge-no-growth',
    description: 'エッジケース: 昇給率0%',
    input: {
      currentAge: 40,
      retirementAge: 65,
      currentAnnualIncome: 6_000_000,
      incomeGrowthRate: 0.0, // 昇給なし
      currentSavings: 3_000_000,
      savingsRate: 0.25, // 25%
    },
    expected: {
      finalAge: 65,
      finalTotalAssets: 31_776_600,
      totalYears: 25,
    },
  },
  {
    id: 'edge-high-savings-rate',
    description: 'エッジケース: 貯金率50%',
    input: {
      currentAge: 25,
      retirementAge: 60,
      currentAnnualIncome: 4_000_000,
      incomeGrowthRate: 0.025, // 2.5%
      currentSavings: 500_000,
      savingsRate: 0.50, // 50%
    },
    expected: {
      finalAge: 60,
      finalTotalAssets: 83_565_438,
      totalYears: 35,
    },
  },
  {
    id: 'edge-short-period',
    description: 'エッジケース: 5年間のみ',
    input: {
      currentAge: 55,
      retirementAge: 60,
      currentAnnualIncome: 7_000_000,
      incomeGrowthRate: 0.0,
      currentSavings: 10_000_000,
      savingsRate: 0.35, // 35%
    },
    expected: {
      finalAge: 60,
      finalTotalAssets: 19_235_165,
      totalYears: 5,
    },
  },
]

/**
 * IDから具体例を検索するヘルパー関数
 */
export function findExampleById(id: string): UC001Example | undefined {
  return UC001_EXAMPLES.find((example) => example.id === id)
}

/**
 * 説明から具体例を検索するヘルパー関数
 */
export function findExamplesByDescription(keyword: string): UC001Example[] {
  return UC001_EXAMPLES.filter((example) =>
    example.description.toLowerCase().includes(keyword.toLowerCase())
  )
}

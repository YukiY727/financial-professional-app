/**
 * UC-001: 老後までにいくら貯まるか - シミュレーションエンジン
 *
 * Phase 1: シンプルな手続き型実装
 * - 投資リターンは考慮しない (DEBT-004)
 * - インフレは考慮しない
 */

import { calcNetIncome } from './taxCalculator'
import type { UC001Input, UC001Expected } from '../../specs/examples/uc001.examples'

/**
 * シミュレーション結果の型
 */
export interface SimulationResult {
  finalAge: number // 退職時年齢
  finalTotalAssets: number // 退職時総資産
  totalYears: number // 運用年数
}

/**
 * 退職までの資産推移をシミュレーション
 *
 * 計算フロー:
 * 1. 手取り収入を計算 (税金・社会保険料を控除)
 * 2. 年間貯金額を計算 (手取り × 貯金率)
 * 3. 総資産を更新
 * 4. 昇給を反映
 * 5. 退職年齢まで繰り返し
 *
 * @param input - UC001の入力データ
 * @returns シミュレーション結果
 * @throws 入力バリデーションエラー
 */
export function simulateRetirementAssets(input: UC001Input): SimulationResult {
  // 入力バリデーション (Phase 1は最小限)
  validateInput(input)

  let totalAssets = input.currentSavings // 総資産
  let annualIncome = input.currentAnnualIncome // 年収 (額面)

  const totalYears = input.retirementAge - input.currentAge

  for (let yearOffset = 0; yearOffset < totalYears; yearOffset++) {
    // ステップ1: 手取り収入を計算
    const netIncome = calcNetIncome(annualIncome)

    // ステップ2: 年間貯金額を計算
    const annualSavings = Math.floor(netIncome * input.savingsRate)

    // ステップ3: 総資産を更新
    totalAssets += annualSavings

    // ステップ4: 昇給
    annualIncome = Math.floor(annualIncome * (1 + input.incomeGrowthRate))
  }

  return {
    finalAge: input.retirementAge,
    finalTotalAssets: totalAssets,
    totalYears,
  }
}

/**
 * 入力バリデーション
 *
 * Phase 1: 最小限のバリデーション
 * Phase 2: より詳細なバリデーションを追加 (DEBT-005)
 *
 * @param input - UC001の入力データ
 * @throws バリデーションエラー
 */
function validateInput(input: UC001Input): void {
  // 現在年齢が退職年齢より大きい場合はエラー
  if (input.currentAge >= input.retirementAge) {
    throw new Error(
      `現在年齢 (${input.currentAge}) は退職年齢 (${input.retirementAge}) より小さい必要があります`
    )
  }

  // 貯金率がマイナスの場合はエラー
  if (input.savingsRate < 0) {
    throw new Error(`貯金率 (${input.savingsRate}) はマイナスにできません`)
  }

  // 貯金率が100%を超える場合はエラー
  if (input.savingsRate > 1) {
    throw new Error(`貯金率 (${input.savingsRate}) は100%を超えることはできません`)
  }
}

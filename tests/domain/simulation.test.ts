/**
 * UC-001: 老後までにいくら貯まるか - テストケース
 *
 * 仕様モデルベース開発: specs/examples/uc001.examples.ts の具体例を使用
 */

import { describe, it, expect } from 'vitest'
import { UC001_EXAMPLES } from '../../specs/examples/uc001.examples'
import { simulateRetirementAssets } from '../../src/domain/simulation'

describe('UC-001: 老後までにいくら貯まるか', () => {
  /**
   * テーブル駆動テスト
   *
   * 7つの具体例をすべてテスト:
   * - basic-case: 標準的なケース
   * - high-income: 高収入ケース
   * - boundary-min-age: 境界値 (最低年齢)
   * - boundary-max-age: 境界値 (高齢スタート)
   * - edge-no-growth: エッジケース (昇給率0%)
   * - edge-high-savings-rate: エッジケース (高貯金率)
   * - edge-short-period: エッジケース (短期間)
   */
  it.each(UC001_EXAMPLES)(
    '$description',
    ({ input, expected }) => {
      // Act: シミュレーションを実行
      const result = simulateRetirementAssets(input)

      // Assert: 期待値と一致することを確認
      expect(result.finalAge).toBe(expected.finalAge)
      expect(result.totalYears).toBe(expected.totalYears)

      // 金額は千円単位で一致を確認 (浮動小数点誤差を考慮)
      expect(result.finalTotalAssets).toBeCloseTo(expected.finalTotalAssets, -3)
    }
  )

  /**
   * 個別テスト: basic-case の詳細検証
   *
   * 基本ケースについて、より詳細な検証を行う
   */
  describe('basic-case の詳細検証', () => {
    const basicCase = UC001_EXAMPLES.find((ex) => ex.id === 'basic-case')!

    it('退職時年齢が正しいこと', () => {
      const result = simulateRetirementAssets(basicCase.input)
      expect(result.finalAge).toBe(65)
    })

    it('運用年数が正しいこと', () => {
      const result = simulateRetirementAssets(basicCase.input)
      expect(result.totalYears).toBe(35)
    })

    it('退職時総資産が期待値と一致すること', () => {
      const result = simulateRetirementAssets(basicCase.input)
      expect(result.finalTotalAssets).toBeCloseTo(38_310_355, -3)
    })

    it('総資産がマイナスにならないこと', () => {
      const result = simulateRetirementAssets(basicCase.input)
      expect(result.finalTotalAssets).toBeGreaterThan(0)
    })
  })

  /**
   * 境界値テスト
   */
  describe('境界値テスト', () => {
    it('最低年齢 (20歳) からスタートできること', () => {
      const minAgeCase = UC001_EXAMPLES.find(
        (ex) => ex.id === 'boundary-min-age'
      )!
      const result = simulateRetirementAssets(minAgeCase.input)

      expect(result.finalAge).toBe(65)
      expect(result.totalYears).toBe(45)
      expect(result.finalTotalAssets).toBeGreaterThan(0)
    })

    it('高齢 (60歳) からスタートできること', () => {
      const maxAgeCase = UC001_EXAMPLES.find(
        (ex) => ex.id === 'boundary-max-age'
      )!
      const result = simulateRetirementAssets(maxAgeCase.input)

      expect(result.finalAge).toBe(65)
      expect(result.totalYears).toBe(5)
      expect(result.finalTotalAssets).toBeGreaterThan(0)
    })
  })

  /**
   * エッジケーステスト
   */
  describe('エッジケーステスト', () => {
    it('昇給率0%でもシミュレーションできること', () => {
      const noGrowthCase = UC001_EXAMPLES.find(
        (ex) => ex.id === 'edge-no-growth'
      )!
      const result = simulateRetirementAssets(noGrowthCase.input)

      expect(result.finalAge).toBe(65)
      expect(result.finalTotalAssets).toBeCloseTo(31_776_600, -3)
    })

    it('高貯金率 (50%) でもシミュレーションできること', () => {
      const highSavingsCase = UC001_EXAMPLES.find(
        (ex) => ex.id === 'edge-high-savings-rate'
      )!
      const result = simulateRetirementAssets(highSavingsCase.input)

      expect(result.finalAge).toBe(60)
      expect(result.finalTotalAssets).toBeCloseTo(83_565_438, -3)
    })

    it('短期間 (5年) のシミュレーションができること', () => {
      const shortPeriodCase = UC001_EXAMPLES.find(
        (ex) => ex.id === 'edge-short-period'
      )!
      const result = simulateRetirementAssets(shortPeriodCase.input)

      expect(result.finalAge).toBe(60)
      expect(result.totalYears).toBe(5)
      expect(result.finalTotalAssets).toBeCloseTo(19_235_165, -3)
    })
  })

  /**
   * 不正な入力のバリデーション
   *
   * Phase 1では最小限のバリデーション
   * Phase 2でエラーハンドリングを拡充 (DEBT-005)
   */
  describe('入力バリデーション (最小限)', () => {
    it('現在年齢が退職年齢より大きい場合はエラー', () => {
      expect(() => {
        simulateRetirementAssets({
          currentAge: 70,
          retirementAge: 65, // 現在年齢より小さい
          currentAnnualIncome: 5_000_000,
          incomeGrowthRate: 0.02,
          currentSavings: 1_000_000,
          savingsRate: 0.20,
        })
      }).toThrow()
    })

    it('貯金率がマイナスの場合はエラー', () => {
      expect(() => {
        simulateRetirementAssets({
          currentAge: 30,
          retirementAge: 65,
          currentAnnualIncome: 5_000_000,
          incomeGrowthRate: 0.02,
          currentSavings: 1_000_000,
          savingsRate: -0.10, // マイナス
        })
      }).toThrow()
    })

    it('貯金率が100%を超える場合はエラー', () => {
      expect(() => {
        simulateRetirementAssets({
          currentAge: 30,
          retirementAge: 65,
          currentAnnualIncome: 5_000_000,
          incomeGrowthRate: 0.02,
          currentSavings: 1_000_000,
          savingsRate: 1.50, // 150%
        })
      }).toThrow()
    })
  })

  /**
   * 計算の性質テスト (Property-Based Testing の簡易版)
   *
   * Phase 2で fast-check を使った本格的なProperty-Based Testingに拡張
   */
  describe('計算の性質', () => {
    it('貯金率が高いほど最終資産が多い', () => {
      const input1 = {
        currentAge: 30,
        retirementAge: 65,
        currentAnnualIncome: 5_000_000,
        incomeGrowthRate: 0.02,
        currentSavings: 1_000_000,
        savingsRate: 0.10, // 10%
      }

      const input2 = {
        ...input1,
        savingsRate: 0.30, // 30%
      }

      const result1 = simulateRetirementAssets(input1)
      const result2 = simulateRetirementAssets(input2)

      expect(result2.finalTotalAssets).toBeGreaterThan(result1.finalTotalAssets)
    })

    it('昇給率が高いほど最終資産が多い', () => {
      const input1 = {
        currentAge: 30,
        retirementAge: 65,
        currentAnnualIncome: 5_000_000,
        incomeGrowthRate: 0.0, // 昇給なし
        currentSavings: 1_000_000,
        savingsRate: 0.20,
      }

      const input2 = {
        ...input1,
        incomeGrowthRate: 0.05, // 5%
      }

      const result1 = simulateRetirementAssets(input1)
      const result2 = simulateRetirementAssets(input2)

      expect(result2.finalTotalAssets).toBeGreaterThan(result1.finalTotalAssets)
    })

    it('運用期間が長いほど最終資産が多い (同じ年収の場合)', () => {
      const input1 = {
        currentAge: 50,
        retirementAge: 60, // 10年間
        currentAnnualIncome: 6_000_000,
        incomeGrowthRate: 0.0,
        currentSavings: 0,
        savingsRate: 0.25,
      }

      const input2 = {
        currentAge: 40,
        retirementAge: 60, // 20年間
        currentAnnualIncome: 6_000_000,
        incomeGrowthRate: 0.0,
        currentSavings: 0,
        savingsRate: 0.25,
      }

      const result1 = simulateRetirementAssets(input1)
      const result2 = simulateRetirementAssets(input2)

      expect(result2.finalTotalAssets).toBeGreaterThan(result1.finalTotalAssets)
    })
  })
})

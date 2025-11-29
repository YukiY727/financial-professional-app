# 仕様モデルベース開発 実践ガイド

## ドキュメント情報

- **作成日**: 2025-11-29
- **対象者**: 開発チーム
- **目的**: 仕様モデルベース開発の具体的な実践方法を示す

---

## 1. なぜ仕様モデルベース開発か

### 1.1 このプロジェクトの特性

#### 金融計算の正確性が最重要
- 税金計算のロジックは複雑
- バグは信頼を失う致命的な問題
- 実装の正確性を検証する仕組みが必須

#### 仕様が段階的に進化する
- 曳光弾型開発により、仕様は流動的
- UC-001 → UC-002 → UC-101 と複雑化
- 各段階で学びを得て、次の設計に活かす

#### 税制が毎年変わる
- 仕様が「生きた文書」として進化
- 過去の仕様も保持する必要がある
- 変更履歴の追跡が重要

### 1.2 選択したアプローチ

**軽量な仕様モデルベース開発 (Specification by Example)**

```
仕様ドキュメント
  ↓ 具体例を抽出
実行可能な具体例 (テストケース)
  ↓ テストを通す
実装
  ↓ リファクタリング
保守可能なコード
```

**なぜこのアプローチか？**
- ✅ 曳光弾型開発と相性が良い (仕様が流動的)
- ✅ 段階的に拡張可能 (具体例 → 性質ベース → 形式手法)
- ✅ 学習コストが低い (形式手法より導入しやすい)
- ✅ リファクタリングの安全網 (テストが保護)

---

## 2. 段階的な進化戦略

### Phase 1: 具体例ベースのテスト

**対象**: UC-001 (老後までにいくら貯まるか)

**アプローチ**:
- 仕様から具体的なケースを5-10パターン作成
- 正常系、境界値、エッジケースを網羅
- 実行可能なテストケースとして記述

**例**:

```typescript
// specs/examples/uc001.examples.ts
export const UC001_EXAMPLES = [
  {
    id: 'basic-case',
    description: '30歳、年収500万円、貯金率20%、65歳退職',
    input: {
      currentAge: 30,
      retirementAge: 65,
      currentAnnualIncome: 5_000_000,
      incomeGrowthRate: 2.0,
      currentSavings: 1_000_000,
      savingsRate: 20.0,
    },
    expected: {
      finalAge: 65,
      finalTotalAssets: 50_000_000, // 仕様から計算
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
      incomeGrowthRate: 1.0,
      currentSavings: 5_000_000,
      savingsRate: 30.0,
    },
    expected: {
      finalAge: 60,
      finalTotalAssets: 120_000_000, // 仕様から計算
      totalYears: 25,
    },
  },
  {
    id: 'boundary-age',
    description: '境界値: 最低年齢',
    input: {
      currentAge: 20,
      retirementAge: 65,
      currentAnnualIncome: 3_000_000,
      incomeGrowthRate: 3.0,
      currentSavings: 0,
      savingsRate: 15.0,
    },
    expected: {
      finalAge: 65,
      finalTotalAssets: 80_000_000, // 仕様から計算
      totalYears: 45,
    },
  },
  {
    id: 'edge-no-growth',
    description: 'エッジケース: 昇給率0%',
    input: {
      currentAge: 40,
      retirementAge: 65,
      currentAnnualIncome: 6_000_000,
      incomeGrowthRate: 0.0,
      currentSavings: 3_000_000,
      savingsRate: 25.0,
    },
    expected: {
      finalAge: 65,
      finalTotalAssets: 40_000_000, // 仕様から計算
      totalYears: 25,
    },
  },
]
```

**テストケースへの変換**:

```typescript
// tests/domain/simulation.test.ts
import { describe, it, expect } from 'vitest'
import { UC001_EXAMPLES } from '../../specs/examples/uc001.examples'
import { simulateRetirementAssets } from '../../src/domain/simulation'

describe('UC-001: 老後までにいくら貯まるか', () => {
  it.each(UC001_EXAMPLES)(
    '$description',
    ({ input, expected }) => {
      // Act
      const result = simulateRetirementAssets(input)

      // Assert
      expect(result.finalAge).toBe(expected.finalAge)
      expect(result.finalTotalAssets).toBeCloseTo(expected.finalTotalAssets, -3) // 千円単位で一致
      expect(result.totalYears).toBe(expected.totalYears)
    }
  )
})
```

---

### Phase 2: 具体例の蓄積 + 性質ベースの検証

**対象**: UC-002, UC-101 (機能が複雑化)

**アプローチ**:
- Phase 1の具体例を保持しつつ、新しい具体例を追加
- 計算ロジックの**性質 (Property)** を検証するテストを追加

**具体例の蓄積**:

```typescript
// specs/examples/uc002.examples.ts
import { UC001_EXAMPLES } from './uc001.examples'

export const UC002_EXAMPLES = [
  ...UC001_EXAMPLES, // 既存の例を継承
  {
    id: 'yearly-cashflow',
    description: '年次キャッシュフロー推移の確認',
    input: {
      currentAge: 30,
      retirementAge: 35, // 短期間でテスト
      currentAnnualIncome: 5_000_000,
      incomeGrowthRate: 2.0,
      currentSavings: 1_000_000,
      savingsRate: 20.0,
    },
    expectedYearlyRecords: [
      { year: 2024, age: 30, totalAssets: 1_748_821 },
      { year: 2025, age: 31, totalAssets: 2_512_456 },
      { year: 2026, age: 32, totalAssets: 3_291_023 },
      { year: 2027, age: 33, totalAssets: 4_084_743 },
      { year: 2028, age: 34, totalAssets: 4_893_838 },
      { year: 2029, age: 35, totalAssets: 5_718_534 },
    ],
  },
]
```

**性質ベースの検証 (Property-Based Testing)**:

```typescript
// tests/properties/taxCalculation.properties.ts
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { calculateIncomeTax } from '../../src/domain/taxCalculator'

describe('税金計算の性質', () => {
  it('課税所得が増えれば税額も増える (単調増加)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100_000_000 }),
        fc.integer({ min: 0, max: 100_000_000 }),
        (income1, income2) => {
          if (income1 < income2) {
            const tax1 = calculateIncomeTax(income1)
            const tax2 = calculateIncomeTax(income2)
            expect(tax2).toBeGreaterThanOrEqual(tax1)
          }
        }
      )
    )
  })

  it('課税所得が0以上なら税額も0以上', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100_000_000 }),
        (income) => {
          const tax = calculateIncomeTax(income)
          expect(tax).toBeGreaterThanOrEqual(0)
        }
      )
    )
  })

  it('税額は課税所得を超えない', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100_000_000 }),
        (income) => {
          const tax = calculateIncomeTax(income)
          expect(tax).toBeLessThanOrEqual(income)
        }
      )
    )
  })

  it('同じ課税所得なら常に同じ税額 (純粋関数)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100_000_000 }),
        (income) => {
          const tax1 = calculateIncomeTax(income)
          const tax2 = calculateIncomeTax(income)
          expect(tax1).toBe(tax2)
        }
      )
    )
  })
})
```

---

### Phase 3: 複雑な計算の性質検証

**対象**: UC-105 (モンテカルロシミュレーション)

**アプローチ**:
- 確率的な計算の統計的性質を検証
- 分布の形状、収束性などを確認

```typescript
// tests/properties/monteCarlo.properties.ts
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { runMonteCarloSimulation } from '../../src/domain/monteCarlo'

describe('モンテカルロシミュレーションの性質', () => {
  it('シナリオ数が多いほど結果が安定する', () => {
    const params = {
      currentAge: 30,
      retirementAge: 65,
      currentAnnualIncome: 5_000_000,
      expectedReturn: 0.05,
      volatility: 0.15,
    }

    const result1000 = runMonteCarloSimulation(params, 1_000)
    const result10000 = runMonteCarloSimulation(params, 10_000)

    const stdDev1000 = calculateStdDev(result1000.finalAssets)
    const stdDev10000 = calculateStdDev(result10000.finalAssets)

    // 大数の法則: サンプル数が多いほど標準偏差が小さくなる
    expect(stdDev10000).toBeLessThan(stdDev1000 * 1.1)
  })

  it('期待リターンが高いほど最終資産の中央値が大きい', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 0.10 }),
        fc.double({ min: 0.01, max: 0.10 }),
        (return1, return2) => {
          if (return1 < return2) {
            const result1 = runMonteCarloSimulation({ expectedReturn: return1 }, 1_000)
            const result2 = runMonteCarloSimulation({ expectedReturn: return2 }, 1_000)

            const median1 = calculateMedian(result1.finalAssets)
            const median2 = calculateMedian(result2.finalAssets)

            expect(median2).toBeGreaterThan(median1)
          }
        }
      )
    )
  })
})
```

---

### Phase 4+: 税制の不変条件検証

**対象**: 複数年度の税制データ

**アプローチ**:
- 税制が変わっても保たれるべき性質を検証
- 年度ごとのデータの整合性を確認

```typescript
// tests/properties/taxPolicy.properties.ts
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { loadTaxPolicy } from '../../src/data/taxPolicyLoader'
import { calculateIncomeTax } from '../../src/domain/taxCalculator'

describe('税制の不変条件', () => {
  it('どの年度でも累進課税の性質が保たれる', () => {
    const years = [2024, 2025, 2026, 2027]

    years.forEach(year => {
      const taxPolicy = loadTaxPolicy(year)

      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100_000_000 }),
          (income) => {
            const tax = calculateIncomeTax(income, taxPolicy)
            const effectiveRate = income > 0 ? tax / income : 0

            // 不変条件: 実効税率は最高税率(45%)を超えない
            expect(effectiveRate).toBeLessThanOrEqual(0.45)
          }
        )
      )
    })
  })

  it('基礎控除は正の値', () => {
    const years = [2024, 2025, 2026]

    years.forEach(year => {
      const taxPolicy = loadTaxPolicy(year)
      expect(taxPolicy.basicDeduction).toBeGreaterThan(0)
    })
  })
})
```

---

## 3. 実装ガイドライン

### 3.1 具体例の作成方法

#### ステップ1: 仕様ドキュメントを読む

[01_specification_overview.md](01_specification_overview.md) から該当する仕様を抽出。

例: UC-001の仕様
- 入力: 年齢、年収、貯金率等
- 出力: 退職時の総資産額

#### ステップ2: 具体的なケースを考える

**カテゴリごとに網羅**:
- **正常系**: 典型的なケース (例: 30歳、年収500万円)
- **境界値**: 入力の上限・下限 (例: 年齢20歳、70歳)
- **エッジケース**: 特殊な条件 (例: 昇給率0%, 貯金率100%)

#### ステップ3: 期待値を計算する

仕様に基づいて手計算またはスプレッドシートで期待値を算出。

**例: 年収500万円の所得税計算**

```
給与収入: 5,000,000円
給与所得控除: 5,000,000 × 20% + 440,000 = 1,540,000円
基礎控除: 480,000円
課税所得: 5,000,000 - 1,540,000 - 480,000 = 2,980,000円

所得税: 2,980,000 × 10% - 97,500 = 200,500円
復興特別所得税: 200,500 × 2.1% = 4,210円
合計: 204,710円
```

#### ステップ4: 具体例をファイルに記述

```typescript
// specs/examples/tax.examples.ts
export const TAX_EXAMPLES = [
  {
    id: 'income-5m',
    description: '年収500万円の所得税計算',
    input: {
      grossIncome: 5_000_000,
    },
    expected: {
      salaryDeduction: 1_540_000,
      taxableIncome: 2_980_000,
      incomeTax: 200_500,
      reconstructionTax: 4_210,
      totalTax: 204_710,
    },
  },
]
```

### 3.2 テストケースへの変換

#### パターン1: 個別のテスト

```typescript
import { describe, it, expect } from 'vitest'
import { TAX_EXAMPLES } from '../../specs/examples/tax.examples'
import { calculateIncomeTax } from '../../src/domain/taxCalculator'

describe('所得税計算', () => {
  it('年収500万円の場合', () => {
    const example = TAX_EXAMPLES.find(e => e.id === 'income-5m')!

    const result = calculateIncomeTax(example.input.grossIncome)

    expect(result.salaryDeduction).toBe(example.expected.salaryDeduction)
    expect(result.taxableIncome).toBe(example.expected.taxableIncome)
    expect(result.incomeTax).toBe(example.expected.incomeTax)
    expect(result.totalTax).toBe(example.expected.totalTax)
  })
})
```

#### パターン2: テーブル駆動テスト

```typescript
describe('所得税計算', () => {
  it.each(TAX_EXAMPLES)(
    '$description',
    ({ input, expected }) => {
      const result = calculateIncomeTax(input.grossIncome)
      expect(result.totalTax).toBe(expected.totalTax)
    }
  )
})
```

### 3.3 TDD サイクル

```
1. Red: テストを書く (失敗する)
   ↓
2. Green: 最小限の実装でテストを通す
   ↓
3. Refactor: コードをきれいにする
   ↓
4. Repeat
```

**例**:

```typescript
// 1. Red: テストを書く
it('年収500万円の所得税は200,500円', () => {
  expect(calculateIncomeTax(2_980_000)).toBe(200_500)
})

// 2. Green: 最小実装
function calculateIncomeTax(taxableIncome: number): number {
  return 200_500 // ハードコード
}

// 3. Refactor: 正しいロジックに置き換え
function calculateIncomeTax(taxableIncome: number): number {
  if (taxableIncome <= 1_950_000) {
    return Math.floor(taxableIncome * 0.05)
  } else if (taxableIncome <= 3_300_000) {
    return Math.floor(taxableIncome * 0.10 - 97_500)
  }
  // ...
}
```

---

## 4. ディレクトリ構成

```
financial-professional-app/
├── specs/                              # 実行可能な仕様
│   ├── examples/                       # 具体例ベースの仕様
│   │   ├── uc001.examples.ts          # UC-001の具体例
│   │   ├── uc002.examples.ts          # UC-002の具体例
│   │   ├── tax.examples.ts            # 税金計算の具体例
│   │   └── ...
│   └── properties/                     # 性質ベースの仕様 (Phase 2+)
│       ├── taxCalculation.properties.ts
│       ├── monteCarlo.properties.ts
│       └── ...
├── tests/                              # テスト実装
│   ├── domain/
│   │   ├── taxCalculator.test.ts      # 具体例ベースのテスト
│   │   ├── simulation.test.ts
│   │   └── ...
│   └── properties/
│       ├── taxCalculation.properties.test.ts
│       └── ...
├── src/                                # 実装コード
│   └── domain/
│       ├── taxCalculator.ts
│       ├── simulation.ts
│       └── ...
└── docs/
    └── specification_by_example.md     # このファイル
```

---

## 5. ツールと技術スタック

### Phase 1: 基本構成

- **テストフレームワーク**: Vitest または Jest
- **言語**: TypeScript (型安全性)
- **具体例の形式**: TypeScript定数またはJSONファイル

### Phase 2+: 拡張

- **Property-Based Testing**: fast-check
- **カバレッジ**: vitest coverage または nyc

---

## 6. ベストプラクティス

### 6.1 具体例の命名

```typescript
// ✅ Good: 説明的なID
{
  id: 'high-income-with-spouse-deduction',
  description: '高収入+配偶者控除のケース',
  // ...
}

// ❌ Bad: 意味のないID
{
  id: 'test1',
  description: 'テスト',
  // ...
}
```

### 6.2 期待値の計算根拠を明記

```typescript
{
  id: 'income-5m',
  description: '年収500万円の所得税計算',
  input: { grossIncome: 5_000_000 },
  expected: {
    // 計算根拠をコメントで記述
    // 給与所得控除: 5,000,000 × 20% + 440,000 = 1,540,000
    salaryDeduction: 1_540_000,
    // 課税所得: 5,000,000 - 1,540,000 - 480,000 = 2,980,000
    taxableIncome: 2_980_000,
    // 所得税: 2,980,000 × 10% - 97,500 = 200,500
    incomeTax: 200_500,
  },
}
```

### 6.3 境界値を必ずテスト

```typescript
// 給与所得控除の境界値
const SALARY_DEDUCTION_BOUNDARIES = [
  { income: 1_625_000, deduction: 550_000 },        // 境界
  { income: 1_625_001, deduction: 550_000 },        // 境界+1
  { income: 1_800_000, deduction: 620_000 },        // 次の境界
  { income: 3_600_000, deduction: 1_160_000 },
  { income: 6_600_000, deduction: 1_760_000 },
  { income: 8_500_000, deduction: 1_950_000 },      // 上限
  { income: 10_000_000, deduction: 1_950_000 },     // 上限を超える
]
```

### 6.4 仕様変更時の対応

1. **具体例を更新**: `specs/examples/` の該当ファイルを修正
2. **テストを実行**: 失敗するテストを確認
3. **実装を修正**: テストが通るように実装を変更
4. **ドキュメント更新**: 変更理由を記録

---

## 7. 移行タイミング

### Property-Based Testingを追加すべき時

- ✅ 計算ロジックが複雑化 (投資計算、モンテカルロ等)
- ✅ 性質が明確に定義できる (単調増加、上限下限等)
- ✅ 具体例だけでは網羅しきれない

### 形式手法を検討すべき時

- ✅ システムが大規模化 (マイクロサービス化)
- ✅ 並行処理・分散システムの検証が必要
- ✅ 法的要件が厳しい (金融規制等)

**重要**: 現時点では**具体例ベース**で十分。必要性が測定されてから検討する。

---

## 8. まとめ

### このアプローチの利点

1. **仕様が実行可能**: テストとして実行できる
2. **段階的に進化**: Phase 1から始めて、必要に応じて拡張
3. **リファクタリングの安全網**: テストが保護
4. **ドキュメントとしても機能**: 具体例が仕様書になる

### 進め方

```
1. 仕様から具体例を作成 (specs/examples/)
2. 具体例をテストに変換 (tests/)
3. TDDで実装 (src/)
4. 仕様変更時は具体例を更新
```

### 次のステップ

- [ ] UC-001の具体例を作成
- [ ] テストケースに変換
- [ ] TDDで税金計算ロジックを実装
- [ ] UC-001のシミュレーションエンジンを実装

---

## 参考文献

- **Specification by Example** (Gojko Adzic)
- **Property-Based Testing** (fast-check documentation)
- **Test-Driven Development** (Kent Beck)

---

**最終更新**: 2025-11-29

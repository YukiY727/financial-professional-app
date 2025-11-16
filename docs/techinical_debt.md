# 技術的負債管理ドキュメント

## ドキュメント情報

- **作成日**: 2025-11-16
- **最終更新**: 2025-11-16
- **管理責任**: 開発チーム

---

## 技術的負債とは

このドキュメントでは、**最速実装のために意図的に選択した妥協点** を記録します。

### 方針

- **記録**: すべての妥協点を明確に記録
- **計画**: 返済時期と方法を明示
- **優先順位**: ビジネス価値と技術的影響で判断

### 開発方針

- **TDD（テスト駆動開発）**: すべての機能実装はテストファーストで進める
  - ユニットテストを先に作成し、実装を後で行う
  - テストカバレッジを維持しながら品質を担保
  - リファクタリングの安全性を確保

---

## 負債一覧

### DEBT-001: マスターデータのハードコード

**現状**:
```python
# Python定数として直接記述
BASIC_DEDUCTION = 480_000
SALARY_DEDUCTION_TABLE = [...]
INCOME_TAX_TABLE = [...]
```

**問題点**:
1. 年度更新時にコード変更が必要（デプロイ必須）
2. 過去年度のシミュレーションができない
3. 税制変更の履歴が残らない
4. テストデータの管理が困難
5. 複数年度の比較シミュレーションが不可

**ビジネスへの影響**:
- **高**: 毎年の税制改正対応にエンジニアリソースが必要
- **中**: 過去のシミュレーション再現ができない

**技術的影響**:
- **中**: リファクタリング時のテストコスト

**返済計画**:

#### Phase 2: 設定ファイル化（優先度: Medium）

**期限**: UC-003（ライフイベント）実装時

**実装内容**:
```yaml
# tax_policy_2024.yaml
year: 2024
basic_deduction: 480000
salary_deduction:
  - upper_limit: 1625000
    type: fixed
    value: 550000
  - upper_limit: 1800000
    type: formula
    rate: 0.4
    adjustment: -100000
  # ...

income_tax:
  - upper_limit: 1950000
    rate: 0.05
    deduction: 0
  # ...
```

**作業見積もり**: 2日
- ファイル構造設計: 0.5日
- パーサー実装: 0.5日
- 既存コード移行: 0.5日
- テスト: 0.5日

**リスク**:
- YAMLパーサーの依存関係追加
- 設定ファイルの検証ロジックが必要

---

#### Phase 3: DB化（優先度: Low）

**期限**: 複数ユーザー対応時

**実装内容**:
```sql
CREATE TABLE tax_policies (
    id SERIAL PRIMARY KEY,
    year INT NOT NULL,
    policy_type VARCHAR(50) NOT NULL,
    policy_data JSONB NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(year, policy_type)
);

CREATE INDEX idx_tax_policies_year ON tax_policies(year);
```

**作業見積もり**: 5日
- スキーマ設計: 1日
- マイグレーション作成: 1日
- DAO層実装: 1日
- キャッシュ機構: 1日
- テスト: 1日

**リスク**:
- パフォーマンス（キャッシュ必須）
- データ整合性の検証

---

### DEBT-002: 控除項目の省略

**現状**:
- 基礎控除のみ実装
- 配偶者控除、扶養控除等は未実装

**問題点**:
1. 計算結果が実態と乖離
2. 家族がいるユーザーには不正確
3. 控除額が大きい場合、資産予測が過小評価

**ビジネスへの影響**:
- **高**: 既婚者や扶養家族がいるユーザーの計算精度が低い
- **中**: 信頼性への懸念

**技術的影響**:
- **低**: 追加は容易（入力項目追加 + 計算式追加）

**返済計画**:

#### Phase 2.1: 配偶者控除・扶養控除（優先度: High）

**期限**: UC-002リリース後すぐ

**実装内容**:
```python
# 入力項目追加
{
  "family": {
    "has_spouse": true,
    "spouse_income": 500000,  # 配偶者の年収
    "dependents": 2           # 扶養人数
  }
}

# 控除計算
def calc_spouse_deduction(spouse_income):
    if spouse_income <= 1_030_000:
        return 380_000
    elif spouse_income <= 1_500_000:
        # 段階的減額
        return calc_reduced_deduction(spouse_income)
    else:
        return 0

def calc_dependent_deduction(num_dependents):
    return 380_000 * num_dependents
```

**作業見積もり**: 1日
- 入力フォーム追加: 0.25日
- 計算ロジック追加: 0.25日
- テスト: 0.25日
- ドキュメント更新: 0.25日

---

#### Phase 2.2: 社会保険料控除等（優先度: Medium）

**期限**: UC-101（投資）実装時

**実装内容**:
- 生命保険料控除
- 地震保険料控除
- 住宅ローン控除

**作業見積もり**: 2日

---

### DEBT-003: 標準報酬月額の簡略化

**現状**:
```python
monthly_salary = annual_income / 12  # 単純な割り算
```

**正確な計算**:
- 報酬月額テーブルに基づく等級判定
- 固定的賃金と非固定的賃金の区別

**問題点**:
1. 社会保険料の計算が若干不正確
2. ボーナスが多い人は影響が大きい

**ビジネスへの影響**:
- **低**: 誤差は年間数千円〜数万円程度

**技術的影響**:
- **低**: 計算ロジックの置き換えのみ

**返済計画**:

#### Phase 3: 正確な標準報酬月額計算（優先度: Low）

**期限**: 精度向上が求められた時

**実装内容**:
```python
# 標準報酬月額等級テーブル
STANDARD_MONTHLY_SALARY_TABLE = [
    {"grade": 1, "lower": 58000, "upper": 63000, "amount": 63000},
    {"grade": 2, "lower": 63000, "upper": 73000, "amount": 68000},
    # ...
]

def get_standard_monthly_salary(monthly_income):
    for grade in STANDARD_MONTHLY_SALARY_TABLE:
        if grade["lower"] <= monthly_income < grade["upper"]:
            return grade["amount"]
    return STANDARD_MONTHLY_SALARY_TABLE[-1]["amount"]
```

**作業見積もり**: 0.5日

---

### DEBT-004: 投資リターンの決定論的計算

**現状**（Phase 2時点）:
- 期待値ベースの決定論的計算
- ボラティリティ未考慮

**問題点**:
1. リスクが可視化されない
2. 確率分布が見えない
3. 最悪ケース・最良ケースが不明

**ビジネスへの影響**:
- **中**: 投資家向け機能としては不十分

**技術的影響**:
- **高**: モンテカルロシミュレーションの実装コスト大

**返済計画**:

#### Phase 4: モンテカルロシミュレーション（優先度: Medium）

**期限**: UC-105（確率分布）実装時

**実装内容**:
```python
import numpy as np

def monte_carlo_simulation(params, n_scenarios=1000):
    results = []
    for _ in range(n_scenarios):
        # ランダムなリターンを生成
        returns = np.random.normal(
            loc=expected_return,
            scale=volatility,
            size=n_years
        )
        # シミュレーション実行
        scenario_result = run_simulation_with_returns(params, returns)
        results.append(scenario_result)
    
    return {
        "scenarios": results,
        "percentiles": {
            "p10": np.percentile(final_assets, 10),
            "p50": np.percentile(final_assets, 50),
            "p90": np.percentile(final_assets, 90)
        }
    }
```

**作業見積もり**: 3日
- 確率モデル設計: 1日
- MC実装: 1日
- パフォーマンス最適化: 0.5日
- テスト・検証: 0.5日

**リスク**:
- 計算時間の増加
- サーバーリソース消費

---

### DEBT-005: エラーハンドリングの省略

**現状**:
- 入力バリデーションが最小限
- エッジケースの処理が不足

**問題点**:
1. 不正な入力でクラッシュの可能性
2. エラーメッセージが不親切
3. デバッグが困難

**ビジネスへの影響**:
- **高**: ユーザー体験の低下

**技術的影響**:
- **中**: 後付けでのバリデーション追加は手間

**返済計画**:

#### Phase 2: 包括的バリデーション（優先度: High）

**期限**: UC-002リリース前

**実装内容**:
```python
class InputValidator:
    def validate_profile(self, profile):
        errors = []
        
        if not (20 <= profile.current_age <= 70):
            errors.append("現在の年齢は20〜70歳で入力してください")
        
        if profile.retirement_age <= profile.current_age:
            errors.append("退職年齢は現在の年齢より大きい値を入力してください")
        
        if profile.current_annual_income <= 0:
            errors.append("年収は正の値を入力してください")
        
        # ... 他のバリデーション
        
        if errors:
            raise ValidationError(errors)
```

**作業見積もり**: 1日

---

## 負債の優先順位マトリクス

| 負債ID | 項目 | ビジネス影響 | 技術的影響 | 優先度 | 期限 |
|--------|------|------------|-----------|--------|------|
| DEBT-002 | 控除項目 | 高 | 低 | High | UC-002後 |
| DEBT-005 | エラーハンドリング | 高 | 中 | High | UC-002前 |
| DEBT-001 | マスター設定ファイル化 | 高 | 中 | Medium | UC-003時 |
| DEBT-004 | MC シミュレーション | 中 | 高 | Medium | UC-105時 |
| DEBT-003 | 標準報酬月額 | 低 | 低 | Low | 要望時 |
| DEBT-001 | マスターDB化 | 高 | 中 | Low | スケール時 |

---

## 返済の追跡

### 完了した負債

（まだなし）

---

### 進行中の負債

（まだなし）

---

## 新規負債の追加ルール

1. **記録必須**: 妥協した時点でこのドキュメントに記録
2. **テンプレート使用**: 以下のフォーマットで記述

```markdown
### DEBT-XXX: [負債名]

**現状**:
（現在の実装状況）

**問題点**:
1. 
2. 

**ビジネスへの影響**:
- **レベル**: 説明

**技術的影響**:
- **レベル**: 説明

**返済計画**:
（フェーズ、期限、作業内容）
```

3. **定期レビュー**: スプリントごとに優先順位を見直し

---

## 参考情報

### 技術的負債の管理原則

1. **可視化**: すべての負債を記録・共有
2. **意図的**: 戦略的な判断として負債を選択
3. **計画的**: 返済計画を明確にする
4. **段階的**: 小さく返済していく

### 関連ドキュメント

- `01_specification_overview.md`: 全体仕様
- `README.md`: プロジェクト概要（今後作成）
- `ARCHITECTURE.md`: アーキテクチャ設計（今後作成）

---

## 変更履歴

| 日付 | 変更内容 |
|------|---------|
| 2025-11-16 | 初版作成 |
# ライフプラン・投資シミュレーションシステム 仕様書

## ドキュメント情報

- **作成日**: 2025-11-16
- **バージョン**: 0.1.0（設計フェーズ）
- **ステータス**: 仕様策定完了、実装前

---

## 目次

1. [開発戦略](#1-開発戦略)
2. [ユースケース全体像](#2-ユースケース全体像)
3. [曳光弾経路](#3-曳光弾経路)
4. [データモデル](#4-データモデル)
5. [税金計算仕様](#5-税金計算仕様)
6. [計算フロー](#6-計算フロー)
7. [技術的負債](#7-技術的負債)
8. [次のステップ](#8-次のステップ)

---

## 1. 開発戦略

### 1.1 基本方針

- **アプローチ**: 進化的アーキテクチャ + 曳光弾型開発
- **成長戦略**: 一般ユーザー → 投資家 → FP士へと段階的に機能拡張
- **技術的負債管理**: 最速実装を優先し、負債を記録・計画的に返済

### 1.2 曳光弾経路

```
第1弾: UC-001（老後までにいくら貯まるか）
  ↓
第2弾: UC-002（年次キャッシュフロー推移）
  ↓
第3弾: UC-101（投資リターンを含めた資産推移）
```

### 1.3 アクター

| アクター | 説明 | 優先度 |
|---------|------|--------|
| 一般ユーザー | 個人のライフプラン管理 | 高（第1弾） |
| 投資家 | 積極的に資産運用を行う個人 | 高（第3弾） |
| FP士 | ファイナンシャルプランナー | 低（後続フェーズ） |

---

## 2. ユースケース全体像

### 2.1 レイヤー構造

#### Layer 1（基礎層）- 最小の土台

```
UC-001: 老後までにいくら貯まるか知りたい
  - 最も基本的なシミュレーション
  - 入力 → 計算 → 出力の最小パス
  - 依存: なし
```

#### Layer 2（中級層）- 基礎の拡張

```
UC-002: 年次のキャッシュフロー推移を見たい
  - 依存: UC-001

UC-006: 自分の税金・社会保険料がいくらか知りたい
  - 依存: UC-001

UC-004: 貯金率を変えた場合の比較をしたい
  - 依存: UC-001

UC-005: 退職年齢を変えた場合の影響を知りたい
  - 依存: UC-001
```

#### Layer 3（応用層）- ライフイベント対応

```
UC-003: ライフイベントの影響を知りたい
  - 依存: UC-002
```

#### Layer 4（投資導入層）

```
UC-101: 投資リターンを含めた資産推移を見たい
  - 依存: UC-002
```

#### Layer 5（投資最適化層）

```
UC-102: NISA枠をどう使うべきか提案が欲しい
  - 依存: UC-101

UC-103: iDeCoの活用効果を知りたい
  - 依存: UC-101

UC-104: 課税口座とNISA/iDeCoの使い分けを最適化したい
  - 依存: UC-101, UC-102, UC-103

UC-107: 税引後リターンを最大化したい
  - 依存: UC-104
```

#### Layer 6（投資高度分析層）

```
UC-105: リスク（確率分布）を考慮したシミュレーションをしたい
  - 依存: UC-101

UC-106: ポートフォリオ最適化の提案が欲しい
  - 依存: UC-105, UC-104
```

#### Layer 7（記録・振り返り層）- 投資家の学習ループ

```
UC-108: 投資の意思決定とその根拠を記録したい【第1弾】
  - 日時、予測、根拠、アクションを記録
  - 依存: UC-101

UC-109: 過去の意思決定の結果を振り返りたい【第2弾】
  - 意思決定後のリターン計算
  - カウンターファクチュアル比較
  - ベンチマーク比較
  - 依存: UC-108, UC-101

UC-110: 意思決定のタイムラインを可視化したい【第3弾】
  - チャート連携
  - イベント表示
  - 予測と実績の対比
  - 依存: UC-109

UC-111: 意思決定パターンの傾向を分析したい
  - 依存: UC-109
```

#### Layer 8（FP専門層）

```
UC-201: 顧客のライフプラン表を作成したい
  - 依存: UC-003

UC-202: 顧客向けレポート（PDF）を生成したい
  - 依存: UC-201

UC-203: 複数シナリオを比較して提案したい
  - 依存: UC-004, UC-005

UC-204: 法人設立vs個人の比較をしたい
  - 依存: UC-101, UC-107

UC-205: 相続シミュレーションを行いたい
  - 依存: UC-101
```

---

## 3. 曳光弾経路

### 3.1 第1弾：UC-001（老後までにいくら貯まるか）

**目的**: システム全体を貫通する最小パスの実装

**機能**:
- 基本情報入力（年齢、年収、貯金率等）
- 簡易税金計算
- 退職時の総資産額計算

**成果物**:
- 入力 → 計算 → 結果（1つの数値）

---

### 3.2 第2弾：UC-002（年次キャッシュフロー推移）

**目的**: 年次データの可視化

**機能**:
- UC-001の拡張
- 全年次のキャッシュフロー記録
- 税金・支出の内訳表示
- グラフ表示

**成果物**:
- 年次データテーブル
- 資産推移グラフ

---

### 3.3 第3弾：UC-101（投資リターンを含めた資産推移）

**目的**: 投資家向け機能の導入

**機能**:
- UC-002に投資計算を追加
- 口座別管理（課税、NISA、iDeCo）
- 投資リターン計算
- 税引後リターンの反映

**成果物**:
- 投資を含む年次データ
- 口座別資産推移

---

## 4. データモデル

### 4.1 入力データモデル

#### Phase 1: UC-001〜002の入力

```json
{
  "profile": {
    "current_age": 30,
    "retirement_age": 65,
    "current_annual_income": 5000000,
    "income_growth_rate": 2.0,
    "current_savings": 1000000
  },
  
  "expense_mode": "simple",
  
  "simple_expense": {
    "savings_rate": 20.0
  },
  
  "detailed_expense": {
    "housing": {
      "type": "amount",
      "value": 1200000
    },
    "living": {
      "type": "percentage",
      "value": 30.0
    },
    "other": {
      "type": "amount",
      "value": 500000
    }
  }
}
```

**入力制約**:

| 項目 | 型 | 制約 |
|------|-----|------|
| 現在の年齢 | 整数 | 20 ≤ 年齢 ≤ 70 |
| 退職年齢 | 整数 | 現在の年齢 < 退職年齢 ≤ 80 |
| 現在の年収 | 整数（円） | 0 < 年収 ≤ 100,000,000 |
| 昇給率 | 小数（%） | -10 ≤ 昇給率 ≤ 20 |
| 貯金率 | 小数（%） | 0 ≤ 貯金率 ≤ 100 |
| 現在の貯金額 | 整数（円） | 0 ≤ 貯金額 |

**支出入力モード**:
- `simple`: 貯金率で指定
- `detailed`: 住居費・生活費・その他を個別指定

**支出指定方法**（detailedモード）:
- `type: "amount"`: 固定額（円）
- `type: "percentage"`: 年収の%

---

#### Phase 2: UC-101で追加される投資情報

```json
{
  "investment": {
    "enabled": true,
    
    "initial_assets": {
      "taxable": 2000000,
      "nisa": 1000000,
      "ideco": 500000
    },
    
    "allocation": {
      "taxable": {
        "stock": 60.0,
        "bond": 30.0,
        "cash": 10.0
      },
      "nisa": {
        "stock": 80.0,
        "bond": 20.0,
        "cash": 0.0
      },
      "ideco": {
        "stock": 70.0,
        "bond": 30.0,
        "cash": 0.0
      }
    },
    
    "annual_contribution": 1200000,
    "nisa_priority": true,
    "ideco_monthly": 23000,
    
    "expected_returns": {
      "use_custom": false,
      "stock": 5.0,
      "bond": 2.0,
      "cash": 0.1
    }
  }
}
```

**デフォルト値**:

```json
{
  "defaults": {
    "expected_returns": {
      "stock": 5.0,
      "bond": 2.0,
      "cash": 0.1
    },
    "expense_allocation": {
      "housing": 30.0,
      "living": 50.0,
      "other": 20.0
    }
  }
}
```

---

### 4.2 マスターデータ

**実装方法**: ハードコード（Python定数）
**対象年度**: 2024年度
**移行計画**: TECHNICAL_DEBT.mdに記録

#### 含まれるデータ

- **基礎控除**: 480,000円
- **給与所得控除テーブル**: 6段階
- **所得税率テーブル**: 7段階累進課税
- **復興特別所得税率**: 2.1%
- **住民税率**: 所得割10% + 均等割5,000円
- **社会保険料率**:
  - 厚生年金: 9.15%（本人負担）
  - 健康保険: 5%（本人負担）
  - 雇用保険: 0.6%
- **NISA制度**（2024年〜新NISA）:
  - 年間投資枠: 360万円（つみたて120万円 + 成長240万円）
  - 非課税保有限度額: 1,800万円
- **iDeCo上限**（加入区分別、月額）:
  - 自営業者: 68,000円
  - 会社員（企業年金なし）: 23,000円
  - 会社員（企業年金あり）: 20,000円
  - 公務員: 12,000円
- **資本利得税率**: 20.315%

---

### 4.3 計算結果データ（年次レコード）

#### Phase 1: UC-001〜002の年次レコード

```python
{
  "year": 2024,
  "age": 30,
  
  "income": {
    "gross": 5000000,
    "salary_deduction": 1540000,
    "taxable_income": 2980000
  },
  
  "tax": {
    "income_tax": 199000,
    "reconstruction_tax": 4179,
    "resident_tax": 298000,
    "social_insurance": 750000,
    "total": 1251179
  },
  
  "net_income": 3748821,
  
  "expense": {
    "housing": 900000,
    "living": 1500000,
    "other": 600000,
    "total": 3000000
  },
  
  "savings": {
    "annual": 748821,
    "total": 1748821
  }
}
```

#### Phase 2: UC-101で追加される投資情報

```python
{
  # ... Phase 1の内容 ...
  
  "investment": {
    "assets": {
      "taxable": {
        "stock": 1000000,
        "bond": 500000,
        "cash": 200000,
        "total": 1700000
      },
      "nisa": {
        "stock": 800000,
        "bond": 200000,
        "cash": 0,
        "total": 1000000
      },
      "ideco": {
        "stock": 350000,
        "bond": 150000,
        "cash": 0,
        "total": 500000
      },
      "total": 3200000
    },
    
    "activity": {
      "contribution": 1200000,
      "nisa_used": 1000000,
      "ideco_used": 276000,
      "taxable_used": 0
    },
    
    "return": {
      "stock_return": 50000,
      "bond_return": 10000,
      "realized_gain": 60000,
      "tax_on_gain": 12189,
      "net_return": 47811
    }
  }
}
```

#### シミュレーション結果全体

```python
simulation_result = {
  "input": { ... },
  
  "yearly_records": [
    { "year": 2024, "age": 30, ... },
    { "year": 2025, "age": 31, ... },
    ...
    { "year": 2059, "age": 65, ... }
  ],
  
  "summary": {
    "total_years": 35,
    "final_age": 65,
    "final_total_assets": 50000000,
    "total_tax_paid": 15000000,
    "total_investment_return": 20000000
  }
}
```

---

## 5. 税金計算仕様

### 5.1 給与所得控除（国税庁準拠）

| 給与収入 | 給与所得控除額 |
|---------|---------------|
| 〜162.5万円 | 55万円 |
| 162.5万円超 〜 180万円 | 収入 × 40% - 10万円 |
| 180万円超 〜 360万円 | 収入 × 30% + 8万円 |
| 360万円超 〜 660万円 | 収入 × 20% + 44万円 |
| 660万円超 〜 850万円 | 収入 × 10% + 110万円 |
| 850万円超 | 195万円（上限） |

**計算式**:
```python
def calc_salary_deduction(salary):
    if salary <= 1_625_000:
        return 550_000
    elif salary <= 1_800_000:
        return salary * 0.4 - 100_000
    elif salary <= 3_600_000:
        return salary * 0.3 + 80_000
    elif salary <= 6_600_000:
        return salary * 0.2 + 440_000
    elif salary <= 8_500_000:
        return salary * 0.1 + 1_100_000
    else:
        return 1_950_000
```

---

### 5.2 所得税（累進課税）

**課税所得の計算**:
```
課税所得 = 給与収入 - 給与所得控除 - 基礎控除 - その他控除

基礎控除 = 480,000円（2024年度）
その他控除 = 0円（Phase 1では省略、後で追加）
```

**所得税率テーブル**:

| 課税所得 | 税率 | 控除額 |
|---------|------|--------|
| 〜195万円 | 5% | 0円 |
| 195万円超 〜 330万円 | 10% | 97,500円 |
| 330万円超 〜 695万円 | 20% | 427,500円 |
| 695万円超 〜 900万円 | 23% | 636,000円 |
| 900万円超 〜 1,800万円 | 33% | 1,536,000円 |
| 1,800万円超 〜 4,000万円 | 40% | 2,796,000円 |
| 4,000万円超 | 45% | 4,796,000円 |

**計算式**:
```python
def calc_income_tax(taxable_income):
    if taxable_income <= 1_950_000:
        return taxable_income * 0.05
    elif taxable_income <= 3_300_000:
        return taxable_income * 0.10 - 97_500
    elif taxable_income <= 6_950_000:
        return taxable_income * 0.20 - 427_500
    elif taxable_income <= 9_000_000:
        return taxable_income * 0.23 - 636_000
    elif taxable_income <= 18_000_000:
        return taxable_income * 0.33 - 1_536_000
    elif taxable_income <= 40_000_000:
        return taxable_income * 0.40 - 2_796_000
    else:
        return taxable_income * 0.45 - 4_796_000
```

**復興特別所得税**:
```
復興特別所得税 = 所得税 × 2.1%
所得税（合計） = 所得税 + 復興特別所得税
```

---

### 5.3 住民税

```
住民税 = 所得割 + 均等割

所得割 = 課税所得 × 10%
均等割 = 5,000円

※課税所得は所得税と同じ計算を使用（Phase 1では簡略化）
```

---

### 5.4 社会保険料

**厚生年金保険料**:
```
標準報酬月額 = 年収 / 12（簡略化）
厚生年金保険料率 = 9.15%（本人負担）

月額保険料 = 標準報酬月額 × 9.15%
年額 = 月額保険料 × 12

上限: 標準報酬月額65万円（月額保険料 59,475円）
```

**健康保険料**:
```
健康保険料率 = 5%（本人負担、全国平均）

月額保険料 = 標準報酬月額 × 5%
年額 = 月額保険料 × 12

上限: 標準報酬月額139万円
```

**雇用保険料**:
```
雇用保険料率 = 0.6%（本人負担、2024年度）
年額 = 年収 × 0.6%
```

**社会保険料合計**:
```
社会保険料 = 厚生年金 + 健康保険 + 雇用保険
```

---

### 5.5 後で追加予定の控除

- 配偶者控除: 380,000円
- 扶養控除: 380,000円 × 扶養人数
- 社会保険料控除: 支払った社会保険料全額
- 生命保険料控除: 最大120,000円
- 地震保険料控除: 最大50,000円
- 住宅ローン控除: 別枠（税額控除）

→ 入力項目追加 → 控除額計算ロジック追加で対応可能

---

## 6. 計算フロー

### 6.1 年次シミュレーションのアルゴリズム

```python
# 初期化
total_assets = current_savings
annual_income = current_annual_income
yearly_records = []

# 年次ループ
for year in range(start_year, end_year + 1):
    age = current_age + (year - start_year)
    
    # 1. 税金計算
    salary_deduction = calc_salary_deduction(annual_income)
    taxable_income = annual_income - salary_deduction - BASIC_DEDUCTION
    
    income_tax = calc_income_tax(taxable_income)
    reconstruction_tax = income_tax * RECONSTRUCTION_TAX_RATE
    resident_tax = taxable_income * RESIDENT_TAX_RATE + RESIDENT_TAX_FLAT
    social_insurance = calc_social_insurance(annual_income)
    
    total_tax = income_tax + reconstruction_tax + resident_tax + social_insurance
    
    # 2. 手取り計算
    net_income = annual_income - total_tax
    
    # 3. 支出計算
    if expense_mode == "simple":
        savings_amount = net_income * (savings_rate / 100)
        expense_total = net_income - savings_amount
        # 支出内訳は標準配分
        housing = expense_total * 0.30
        living = expense_total * 0.50
        other = expense_total * 0.20
    else:
        housing = calc_expense_value(housing_config, annual_income, net_income)
        living = calc_expense_value(living_config, annual_income, net_income)
        other = calc_expense_value(other_config, annual_income, net_income)
        expense_total = housing + living + other
        savings_amount = net_income - expense_total
    
    # 4. 資産更新
    total_assets += savings_amount
    
    # 5. 年次レコード作成
    record = {
        "year": year,
        "age": age,
        "income": {
            "gross": annual_income,
            "salary_deduction": salary_deduction,
            "taxable_income": taxable_income
        },
        "tax": {
            "income_tax": income_tax,
            "reconstruction_tax": reconstruction_tax,
            "resident_tax": resident_tax,
            "social_insurance": social_insurance,
            "total": total_tax
        },
        "net_income": net_income,
        "expense": {
            "housing": housing,
            "living": living,
            "other": other,
            "total": expense_total
        },
        "savings": {
            "annual": savings_amount,
            "total": total_assets
        }
    }
    yearly_records.append(record)
    
    # 6. 翌年準備
    annual_income = annual_income * (1 + income_growth_rate / 100)

return {
    "yearly_records": yearly_records,
    "summary": {
        "total_years": len(yearly_records),
        "final_age": yearly_records[-1]["age"],
        "final_total_assets": yearly_records[-1]["savings"]["total"],
        "total_tax_paid": sum(r["tax"]["total"] for r in yearly_records)
    }
}
```

---

### 6.2 支出計算のヘルパー関数

```python
def calc_expense_value(config, annual_income, net_income):
    """
    支出額を計算
    
    config: {"type": "amount" or "percentage", "value": 数値}
    """
    if config["type"] == "amount":
        return config["value"]
    else:  # percentage
        return net_income * (config["value"] / 100)
```

---

### 6.3 社会保険料計算の詳細

```python
def calc_social_insurance(annual_income):
    monthly_salary = annual_income / 12
    
    # 厚生年金
    pension_monthly = min(monthly_salary, PENSION_MAX_MONTHLY_SALARY) * PENSION_RATE
    pension_annual = pension_monthly * 12
    
    # 健康保険
    health_monthly = min(monthly_salary, HEALTH_MAX_MONTHLY_SALARY) * HEALTH_INSURANCE_RATE
    health_annual = health_monthly * 12
    
    # 雇用保険
    employment = annual_income * EMPLOYMENT_INSURANCE_RATE
    
    return pension_annual + health_annual + employment
```

---

## 7. 技術的負債

### 7.1 マスターデータのリファクタリング

**現状**:
- ハードコード（Python定数）
- 2024年度のみ対応

**問題点**:
- 年度更新時にコード変更が必要
- 過去年度のシミュレーションができない
- テストが困難

**移行計画**:

#### Phase 2: 設定ファイル化
- **期限**: UC-003（ライフイベント）実装時
- **形式**: JSON or YAML
- **構造**: `tax_policy_2024.json`, `tax_policy_2025.json`

#### Phase 3: DB化
- **期限**: 複数ユーザー対応時
- **テーブル**: `tax_policy`, `social_insurance_policy`, `nisa_policy`
- **カラム**: `year`, `policy_type`, `value` (JSONB)

**影響範囲**:
- 税金計算モジュール全体
- テストコード

**優先度**:
- Phase 2: Medium（UC-003着手時）
- Phase 3: Low（スケール時）

---

### 7.2 控除項目の追加

**現状**:
- 基礎控除のみ実装

**TODO**:
- 配偶者控除
- 扶養控除
- 社会保険料控除
- 生命保険料控除
- 地震保険料控除
- 住宅ローン控除

**実装方針**:
- 入力項目を追加
- 控除額計算ロジックを追加
- 既存の計算フローに組み込み

---

### 7.3 標準報酬月額の正確な計算

**現状**:
- 簡略化（年収/12）

**TODO**:
- 報酬月額テーブルの適用
- より正確な社会保険料計算

---

## 8. 次のステップ

### 8.1 実装に向けた選択肢

#### A. 計算ロジックの詳細化
- 各関数の疑似コード作成
- エッジケース処理の定義

#### B. アーキテクチャ設計
- コンポーネント分割（モジュール構成）
- 最小限の設計（クラス？関数？）

#### C. 実装開始
- 言語/フレームワーク選定
- UC-001からコーディング開始

#### D. テストケース作成
- 具体的な入力例と期待値定義
- 計算の妥当性検証

### 8.2 推奨順序

```
D（テストケース）→ B（アーキテクチャ）→ C（実装）
```

**理由**:
- テストケースで仕様の理解を確認
- アーキテクチャで実装の見通しを立てる
- 実装は自信を持って進められる

---

## 付録

### A. 参考資料

- 元仕様書: 提供された詳細仕様書
- 国税庁: 所得税・給与所得控除
- 厚生労働省: 社会保険料率
- 金融庁: NISA・iDeCo制度

### B. 用語集

| 用語 | 説明 |
|------|------|
| 曳光弾型開発 | システム全体を貫通する最小機能を先に実装する手法 |
| 進化的アーキテクチャ | 段階的に機能を追加・改善していく設計手法 |
| 技術的負債 | 将来のリファクタリングが必要な実装上の妥協 |
| 標準報酬月額 | 社会保険料計算の基礎となる月額報酬 |

---

## 変更履歴

| 日付 | バージョン | 変更内容 |
|------|-----------|---------|
| 2025-11-16 | 0.1.0 | 初版作成（仕様策定完了） |
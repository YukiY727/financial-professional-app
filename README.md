# ライフプラン・投資シミュレーションシステム

統合的な税金計算・ライフプラン・投資シミュレーションを提供するシステム

---

## 📋 プロジェクト概要

このシステムは、**税金ロジック（年次確定）＋ライフプランCF（年次）＋投資シミュレーション（税引後・年次・確率）** を同一時系列エンジンで処理し、ユーザーのロールに応じたUIで提供します。

### 主な特徴

- ✅ **正確な税金計算**: 所得税・住民税・社会保険料を年度別マスターで管理
- ✅ **年次キャッシュフロー**: 収入・支出・税金・貯蓄の詳細な年次推移
- ✅ **投資統合**: NISA・iDeCo・課税口座を考慮した資産シミュレーション
- ✅ **意思決定記録**: 投資判断とその結果を記録・分析（投資家向け）
- ✅ **進化的設計**: 段階的に機能を追加できるアーキテクチャ

---

## 🎯 開発方針

### アプローチ

**進化的アーキテクチャ + 曳光弾型開発**

- 最小機能で全体を貫通
- 段階的に機能拡張
- 技術的負債を記録・計画的に返済

### 成長戦略

```
一般ユーザー向け → 投資家向け → FP士向け
```

---

## 🚀 曳光弾経路（実装順序）

### Phase 1: UC-001（老後までにいくら貯まるか）

**目的**: システム全体を貫通する最小パス

**機能**:
- 基本情報入力
- 簡易税金計算
- 退職時資産額計算

**成果物**: 1つの数値結果

---

### Phase 2: UC-002（年次キャッシュフロー推移）

**目的**: 年次データの可視化

**機能**:
- 全年次のCF記録
- 税金・支出の内訳
- グラフ表示

**成果物**: 年次テーブル + グラフ

---

### Phase 3: UC-101（投資リターンを含む資産推移）

**目的**: 投資家向け機能導入

**機能**:
- 口座別資産管理（課税・NISA・iDeCo）
- 投資リターン計算
- 税引後リターン反映

**成果物**: 投資を含む年次推移

---

### Phase 4以降

- UC-105: モンテカルロシミュレーション
- UC-108-110: 意思決定記録・振り返り
- UC-201-205: FP士向けレポート機能

---

## 📁 ドキュメント構成

```
/docs
├── 01_specification_overview.md    # 仕様書全体（このファイルの詳細版）
├── TECHNICAL_DEBT.md                # 技術的負債の管理
├── ARCHITECTURE.md                  # アーキテクチャ設計（今後作成）
└── API_SPECIFICATION.md             # API仕様（今後作成）
```

---

## 🗂️ データモデル概要

### 入力データ

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
  }
}
```

### 年次レコード（出力）

```python
{
  "year": 2024,
  "age": 30,
  "income": {...},
  "tax": {
    "income_tax": 199000,
    "resident_tax": 298000,
    "social_insurance": 750000,
    "total": 1251179
  },
  "expense": {...},
  "savings": {
    "annual": 748821,
    "total": 1748821
  }
}
```

詳細は `01_specification_overview.md` を参照

---

## 🧮 税金計算の特徴

### 実装済み（Phase 1）

- ✅ 給与所得控除（国税庁準拠・6段階）
- ✅ 所得税（累進課税・7段階）
- ✅ 復興特別所得税（2.1%）
- ✅ 住民税（所得割10% + 均等割5,000円）
- ✅ 社会保険料（厚生年金・健康保険・雇用保険）

### 今後追加予定

- ⏳ 配偶者控除・扶養控除（Phase 2）
- ⏳ 生命保険料控除・地震保険料控除（Phase 2）
- ⏳ 住宅ローン控除（Phase 3）
- ⏳ 年度別マスターの外部化（Phase 2-3）

---

## 🛠️ 技術スタック

### バックエンド

- **言語**: TypeScript (Node.js 22)
- **フレームワーク**: Express
- **ビルド**: TypeScript Compiler (tsc)

### フロントエンド

- **フレームワーク**: React + TypeScript
- **ビルドツール**: Vite
- **スタイル**: CSS

### 共有ロジック

- **言語**: TypeScript
- **配置**: `shared/domain/`
- **目的**: フロント/バック共通の計算ロジック

### データ管理

- **Phase 1**: ハードコード（TypeScript定数） ✅
- **Phase 2**: YAML/JSON設定ファイル（予定）
- **Phase 3**: PostgreSQL + JSONB（予定）

---

## 🚀 クイックスタート

### 前提条件

- Node.js 22以上
- npm または pnpm

### 1. 依存関係インストール

```bash
# バックエンド
cd backend
npm install

# フロントエンド
cd ../frontend
npm install
```

### 2. サーバー起動

**ターミナル1: バックエンド**
```bash
cd backend
npm run dev
```

バックエンドが http://localhost:3000 で起動します。

**ターミナル2: フロントエンド**
```bash
cd frontend
npm run dev
```

フロントエンドが http://localhost:5173 で起動します。

### 3. ブラウザでアクセス

http://localhost:5173 を開いてシミュレーションを実行できます。

### APIエンドポイント

- **ヘルスチェック**: `GET http://localhost:3000/api/health`
- **シミュレーション**: `POST http://localhost:3000/api/simulate`

### サンプルリクエスト

```bash
curl -X POST http://localhost:3000/api/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "profile": {
      "currentAge": 30,
      "retirementAge": 65,
      "currentAnnualIncome": 5000000,
      "incomeGrowthRate": 2.0,
      "currentSavings": 1000000
    },
    "expenseMode": "simple",
    "simpleExpense": {
      "savingsRate": 20.0
    }
  }'
```

---

## 📊 開発状況

### Phase 1 完了 ✅ (2025-11-17)

- [x] 要件定義
- [x] ユースケース整理
- [x] データモデル設計
- [x] 税金計算仕様策定
- [x] 技術的負債の記録
- [x] **UC-001実装（曳光弾型）**
  - [x] 共有ドメインロジック（TypeScript）
  - [x] バックエンドAPI（Node.js + Express）
  - [x] フロントエンド（React + TypeScript）
  - [x] テストコード作成
  - [x] 動作確認完了

**詳細**: [IMPLEMENTATION.md](./IMPLEMENTATION.md) を参照

### 進行中

- [ ] UC-002実装（年次キャッシュフロー推移）

### 未着手

- [ ] UC-101実装
- [ ] グラフ表示機能

---

## 🧪 テスト戦略

### Phase 1: ユニットテスト

```python
def test_calc_income_tax():
    # 課税所得300万円の場合
    assert calc_income_tax(3_000_000) == 202_500
    
def test_calc_salary_deduction():
    # 年収500万円の場合
    assert calc_salary_deduction(5_000_000) == 1_440_000
```

### Phase 2: 統合テスト

- 年次シミュレーション全体の検証
- エッジケース（マイナス所得等）の確認

### Phase 3: E2Eテスト

- UI操作からレポート生成までの一連のフロー

---

## 📝 技術的負債の管理

すべての技術的負債は `TECHNICAL_DEBT.md` で管理しています。

### 主要な負債

| 負債ID | 項目 | 優先度 | 期限 |
|--------|------|--------|------|
| DEBT-002 | 控除項目追加 | High | UC-002後 |
| DEBT-005 | エラーハンドリング | High | UC-002前 |
| DEBT-001 | マスター設定ファイル化 | Medium | UC-003時 |

詳細は `TECHNICAL_DEBT.md` を参照

---

## 🤝 コントリビューション

### 開発フロー

1. Issue作成
2. ブランチ作成（`feature/UC-XXX`）
3. 実装 + テスト
4. Pull Request
5. レビュー
6. マージ

### コーディング規約

- PEP 8準拠（Python）
- 型ヒント必須
- docstring必須（Google Style）

---

## 📚 参考資料

### 税制・制度

- [国税庁: 所得税](https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/shotoku.htm)
- [厚生労働省: 社会保険料率](https://www.mhlw.go.jp/)
- [金融庁: NISA](https://www.fsa.go.jp/policy/nisa2/)

### 技術

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [NumPy Documentation](https://numpy.org/doc/)

---

## 📄 ライセンス

（未定）

---

## 👥 チーム

- プロジェクトオーナー: （未定）
- 開発: （未定）
- レビュー: （未定）

---

## 📞 お問い合わせ

（未定）

---

## 変更履歴

| 日付 | バージョン | 変更内容 |
|------|-----------|---------|
| 2025-11-17 | 0.2.0 | **Phase 1実装完了**: UC-001（曳光弾型）|
| 2025-11-16 | 0.1.0 | 初版作成（設計フェーズ完了） |
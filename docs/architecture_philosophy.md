# アーキテクチャ哲学：すべての設計はトレードオフである

## ドキュメント情報

- **作成日**: 2025-11-16
- **最終更新**: 2025-11-16
- **対象者**: 開発チーム全員
- **目的**: アーキテクチャ選択の根拠と原則を明文化し、一貫性のある意思決定を可能にする

---

## 1. 基本原則

### 1.1 Google SREの教え

> "Everything is a trade-off. There is no perfect architecture, only appropriate architectures for specific contexts."

すべてのアーキテクチャ決定は以下のバランスを取る行為である：

- **速度 vs 品質**
- **柔軟性 vs シンプルさ**
- **パフォーマンス vs 保守性**
- **抽象化 vs 具体性**
- **早期最適化 vs 技術的負債**

### 1.2 このプロジェクトの価値観

1. **Ship Early, Ship Often**: 早く出して、フィードバックから学ぶ
2. **Measure First, Optimize Later**: 問題を測定してから最適化する
3. **Write Tests, Not Documentation**: テストが仕様書である
4. **Make It Work, Make It Right, Make It Fast**: この順序を守る
5. **YAGNI over Future-Proofing**: 今必要なものだけを作る

---

## 2. アーキテクチャパターンの比較

### 2.1 システム全体構造

#### Option A: モノリシック構造

**構成**:
```
financial-app/
├── backend/
│   ├── api/
│   ├── domain/
│   │   ├── tax_calculator.py
│   │   ├── simulation_engine.py
│   │   └── investment_calculator.py
│   └── data/
│       └── tax_policies.json
├── frontend/
│   └── react-app/
└── tests/
```

**Pros**:
- **シンプル**: 単一のリポジトリ、単一のデプロイ
- **開発速度**: 機能追加が速い（API変更が容易）
- **デバッグ容易**: 全体のコールスタックが追える
- **トランザクション**: データ整合性が保証しやすい
- **低レイテンシ**: プロセス内関数呼び出し

**Cons**:
- **スケーラビリティ**: 部分的なスケールが困難
- **技術選択**: 全体で同じ言語・フレームワーク
- **デプロイリスク**: 一部の変更が全体に影響
- **チーム拡大**: 複数チームでの並行開発が困難

**適用判断**:
- ✅ チーム規模: 1-5人
- ✅ ユーザー数: ~10,000人
- ✅ 開発初期フェーズ
- ✅ 要件が流動的

**このプロジェクトでの選択**: ✅ **採用**

**理由**:
- チーム規模: 1人（初期）
- 要件が未確定（ユーザーフィードバックが必要）
- 計算ロジックは密結合（税金・社会保険・投資が相互依存）
- 過度な分散は Premature Optimization

---

#### Option B: マイクロサービス構造

**構成**:
```
services/
├── tax-service/
│   ├── api/
│   └── calculator/
├── investment-service/
│   ├── api/
│   └── portfolio/
├── simulation-service/
│   ├── orchestrator/
│   └── aggregator/
└── api-gateway/
```

**Pros**:
- **独立デプロイ**: サービスごとに独立してリリース
- **技術多様性**: サービスごとに最適な技術選択
- **スケーラビリティ**: 負荷の高いサービスのみスケール
- **障害分離**: 一部の障害が全体に波及しない
- **チーム独立性**: サービスごとに責任範囲が明確

**Cons**:
- **複雑性**: ネットワーク通信、分散トレーシング、サービスメッシュ
- **データ整合性**: 分散トランザクション、Saga パターン
- **開発速度低下**: API変更の調整コスト
- **運用コスト**: 複数のデプロイ、モニタリング、ログ集約
- **デバッグ困難**: 分散した呼び出しチェーン

**適用判断**:
- ✅ チーム規模: 10人以上
- ✅ ユーザー数: 100,000人以上
- ✅ 独立したビジネスドメイン
- ✅ 異なるスケール要件

**このプロジェクトでの選択**: ❌ **不採用**

**理由**:
- Premature Optimization
- ドメイン間の境界が不明瞭（税金と投資は密結合）
- 運用コストが利益を上回る
- **後日移行可能**（Modular Monolith → Microservices）

---

#### Option C: イベント駆動アーキテクチャ（Event-Driven Architecture）

**構成**:
```
financial-app/
├── services/
│   ├── simulation-service/
│   │   └── publishes: SimulationCreated, SimulationCompleted
│   ├── notification-service/
│   │   └── subscribes: SimulationCompleted
│   ├── analytics-service/
│   │   └── subscribes: SimulationCreated, UserActionPerformed
│   └── report-service/
│       └── subscribes: SimulationCompleted
├── event-bus/
│   └── kafka/rabbitmq/pubsub
└── event-store/
    └── event-sourcing (optional)
```

**アーキテクチャ図**:
```
[User] → [API Gateway] → [Simulation Service]
                              ↓ publishes: SimulationCompleted
                         [Event Bus: Kafka]
                              ↓ subscribes
         ┌────────────────────┼────────────────────┐
         ↓                    ↓                    ↓
  [Notification      [Analytics         [Report
   Service]           Service]           Service]
         ↓                    ↓                    ↓
    [Send Email]      [Track Metrics]     [Generate PDF]
```

**イベント例**:
```json
{
  "event_id": "evt_123",
  "event_type": "SimulationCompleted",
  "timestamp": "2024-11-16T10:30:00Z",
  "aggregate_id": "sim_456",
  "version": 1,
  "payload": {
    "user_id": "user_789",
    "simulation_id": "sim_456",
    "final_assets": 50000000,
    "years_simulated": 35
  }
}
```

**Pros**:

- **疎結合**: サービス間の依存が最小化される
- **スケーラビリティ**: 各サービスが独立してスケール可能
- **非同期処理**: 重い処理をバックグラウンドで実行
- **拡張性**: 新しいサービスをイベント購読で簡単に追加
- **障害分離**: 一部のサービスが停止しても他は動作
- **監査ログ**: すべてのイベントが記録される（Event Sourcing）
- **リアルタイム性**: WebSocket経由でリアルタイム通知可能
- **再処理**: イベント再生で過去の状態を再現可能

**Cons**:

- **複雑性**: イベントバス、メッセージキュー、サブスクリプション管理
- **デバッグ困難**: 非同期処理のトレースが難しい
- **結果整合性**: Eventual Consistency（最終的整合性）のみ保証
- **順序保証**: イベントの順序制御が必要
- **重複処理**: Idempotency（冪等性）の実装が必須
- **運用コスト**: Kafka/RabbitMQのクラスタ管理、監視
- **学習コスト**: 非同期プログラミング、イベントモデリング
- **テスト複雑性**: 非同期処理のテストが困難
- **レイテンシ**: 同期処理より遅い（メッセージキュー経由）

**適用判断**:

- ✅ 非同期処理が多い（メール送信、レポート生成、分析）
- ✅ スケーラビリティが重要（大量のイベント処理）
- ✅ マイクロサービス構成
- ✅ 監査ログ、イベント履歴が必要
- ✅ リアルタイム通知機能
- ✅ 複数システム間の連携（例：外部API、レガシーシステム）

**このプロジェクトでの選択**: ⏰ **Phase 3以降で部分採用を検討**

**理由**:
- **Phase 1-2では不要**: MVP段階では過剰な複雑性
- **Phase 3で検討すべきユースケース**:
  - ✅ バックグラウンドジョブ: レポート生成（PDF）、大規模シミュレーション
  - ✅ 通知: シミュレーション完了時のメール送信
  - ✅ 分析: ユーザー行動のトラッキング
  - ✅ 外部連携: 証券会社API、銀行APIとの連携
- **部分採用戦略**: モノリス内でイベントパターンを使う（Modular Monolith + Events）

**移行シナリオ**:
```
Phase 1-2: 同期処理（関数呼び出し）
   ↓
Phase 2.5: モノリス内イベントバス（in-memory）
   例: Python の `asyncio.Queue` や `EventEmitter` パターン
   ↓
Phase 3: 外部イベントバス（Kafka/RabbitMQ）
   測定: バックグラウンド処理が全体の20%以上を占める
```

**部分採用の例（Modular Monolith + Events）**:
```python
# domain/events.py
from dataclasses import dataclass
from typing import Callable
from collections import defaultdict

@dataclass
class SimulationCompleted:
    simulation_id: str
    user_id: str
    final_assets: int

class EventBus:
    def __init__(self):
        self._handlers: dict[type, list[Callable]] = defaultdict(list)

    def subscribe(self, event_type: type, handler: Callable):
        self._handlers[event_type].append(handler)

    async def publish(self, event):
        for handler in self._handlers[type(event)]:
            await handler(event)

# services/notification_service.py
async def on_simulation_completed(event: SimulationCompleted):
    # メール送信（非同期）
    await send_email(event.user_id, f"シミュレーション完了: {event.final_assets}円")

# services/analytics_service.py
async def on_simulation_completed(event: SimulationCompleted):
    # 分析データ記録（非同期）
    await track_event("simulation_completed", event.simulation_id)

# main.py
event_bus = EventBus()
event_bus.subscribe(SimulationCompleted, on_simulation_completed)
event_bus.subscribe(SimulationCompleted, on_simulation_completed)

# simulation実行後
await event_bus.publish(SimulationCompleted(
    simulation_id="sim_123",
    user_id="user_456",
    final_assets=50000000
))
```

**Event Sourcing（イベントソーシング）の検討**:

Event Sourcingは、すべての状態変更をイベントとして記録する手法。

```python
# 通常の状態管理
simulation = {
    "id": "sim_123",
    "final_assets": 50000000,  # 最終状態のみ保存
}

# Event Sourcing
events = [
    {"type": "SimulationCreated", "timestamp": "2024-11-16T10:00:00Z", "data": {...}},
    {"type": "ParameterUpdated", "timestamp": "2024-11-16T10:05:00Z", "data": {...}},
    {"type": "SimulationCompleted", "timestamp": "2024-11-16T10:30:00Z", "data": {...}},
]
# イベントを再生することで任意の時点の状態を復元可能
```

**Event Sourcing の Pros**:

- **完全な履歴**: すべての変更が記録される
- **監査**: コンプライアンス要件を満たす
- **時間旅行**: 過去の任意の時点の状態を復元
- **デバッグ**: 問題の原因を追跡しやすい
- **分析**: ユーザー行動の詳細な分析が可能

**Event Sourcing の Cons**:

- **複雑性**: イベントのバージョニング、スキーマ進化
- **ストレージ**: イベントが蓄積される（削除できない）
- **パフォーマンス**: イベント再生のコスト（スナップショット必須）
- **学習コスト**: 非常に高い

**このプロジェクトでの Event Sourcing**: ❌ **不採用**
- 金融アプリでは監査ログが重要だが、Event Sourcing は過剰
- 代替案: シンプルな Audit Log テーブル（変更履歴を記録）

---

### 2.2 データストレージ戦略

#### Option A: ハードコード（Python定数）

**実装**:
```python
# tax_constants.py
BASIC_DEDUCTION = 480_000
SALARY_DEDUCTION_TABLE = [
    (1_625_000, 550_000, "fixed"),
    (1_800_000, 0.4, -100_000, "formula"),
    # ...
]
```

**Pros**:
- **実装速度**: 最速（コピペで完了）
- **パフォーマンス**: メモリアクセス、キャッシュ不要
- **型安全**: IDEの補完、Lintによるチェック
- **バージョン管理**: Gitで変更履歴を追跡
- **テスト容易**: インポートするだけ

**Cons**:
- **変更コスト**: コード修正 → デプロイ必須
- **複数年度**: 過去年度のシミュレーション不可
- **動的変更**: 実行時の変更不可
- **非エンジニア**: 税理士が直接編集できない

**適用判断**:
- ✅ Phase 1（MVP、単年度のみ）
- ✅ 変更頻度: 年1回
- ✅ データ量: 小（数KB）

**このプロジェクトでの選択**: ✅ **Phase 1で採用**

---

#### Option B: 設定ファイル（YAML/JSON）

**実装**:
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
```

**Pros**:
- **デプロイ不要**: ファイル更新のみ
- **可読性**: YAMLは人間が読みやすい
- **バージョン管理**: Gitで管理可能
- **複数年度**: ファイルを分ければ対応可能
- **非エンジニア**: 編集が比較的容易

**Cons**:
- **パース処理**: 起動時のオーバーヘッド
- **型安全性**: ランタイムエラーの可能性
- **バリデーション**: スキーマ検証が必要
- **テスト**: ファイル読み込みのモック化

**適用判断**:
- ✅ Phase 2（複数年度対応）
- ✅ 変更頻度: 年数回
- ✅ 非エンジニアの編集ニーズ

**このプロジェクトでの選択**: ⏰ **Phase 2で移行予定**

**移行タイミング**: UC-003（ライフイベント）実装時

---

#### Option C: データベース（PostgreSQL + JSONB）

**実装**:
```sql
CREATE TABLE tax_policies (
    id SERIAL PRIMARY KEY,
    year INT NOT NULL,
    policy_type VARCHAR(50) NOT NULL,
    policy_data JSONB NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    UNIQUE(year, policy_type)
);

CREATE INDEX idx_tax_policies_year ON tax_policies(year);
CREATE INDEX idx_tax_policies_data ON tax_policies USING GIN(policy_data);
```

**Pros**:
- **動的変更**: 実行時にデータ更新可能
- **履歴管理**: 有効期間、変更履歴を保存
- **クエリ**: 複雑な検索・集計が可能
- **トランザクション**: データ整合性が保証される
- **権限管理**: ユーザーごとのアクセス制御

**Cons**:
- **複雑性**: マイグレーション、ORM、接続管理
- **パフォーマンス**: ネットワーク、クエリのオーバーヘッド
- **運用コスト**: DB管理、バックアップ、監視
- **テスト**: DBのセットアップ、フィクスチャ管理
- **依存関係**: データベースサーバーが必須

**適用判断**:
- ✅ 複数ユーザー（SaaS化）
- ✅ 動的な税制変更（リアルタイム反映）
- ✅ 管理画面で設定変更
- ✅ 監査ログが必要

**このプロジェクトでの選択**: ⏰ **Phase 3以降で検討**

**移行タイミング**: マルチテナント対応時

---

### 2.3 計算エンジンの設計

#### Option A: 手続き型（関数ベース）

**実装**:
```python
def simulate_yearly_cashflow(profile, settings):
    total_assets = profile.current_savings
    records = []

    for year in range(start_year, end_year + 1):
        income = calculate_income(year, profile)
        tax = calculate_tax(income)
        net_income = income - tax
        expense = calculate_expense(net_income, settings)
        savings = net_income - expense
        total_assets += savings

        records.append({
            "year": year,
            "income": income,
            "tax": tax,
            "savings": savings,
            "total_assets": total_assets
        })

    return records
```

**Pros**:
- **シンプル**: 理解しやすい、デバッグしやすい
- **パフォーマンス**: 関数呼び出しのみ、オーバーヘッド最小
- **テスト容易**: 純粋関数、入出力が明確
- **学習コスト**: 低い（誰でも読める）

**Cons**:
- **拡張性**: 条件分岐が増えると複雑化
- **状態管理**: グローバル変数、引数の受け渡し
- **再利用**: 関数の粒度設計が難しい
- **ポリモーフィズム**: 戦略の切り替えが煩雑

**適用判断**:
- ✅ シンプルなビジネスロジック
- ✅ 状態が少ない
- ✅ 拡張の予定が少ない

**このプロジェクトでの選択**: ✅ **Phase 1で採用**

---

#### Option B: オブジェクト指向（クラスベース）

**実装**:
```python
class SimulationEngine:
    def __init__(self, tax_calculator, expense_calculator, investment_calculator):
        self.tax_calculator = tax_calculator
        self.expense_calculator = expense_calculator
        self.investment_calculator = investment_calculator

    def simulate(self, profile):
        state = SimulationState(profile.current_savings)

        for year in self.year_range(profile):
            income = self.calculate_income(year, profile)
            tax = self.tax_calculator.calculate(income)
            expense = self.expense_calculator.calculate(income - tax)

            state.update(income, tax, expense)

        return state.to_records()

class TaxCalculator:
    def calculate(self, income):
        return self._calc_income_tax(income) + self._calc_resident_tax(income)
```

**Pros**:
- **カプセル化**: 状態と振る舞いを一箇所に
- **拡張性**: Strategy パターン、Factory パターン
- **テスト**: モック、スタブが容易
- **再利用**: 継承、コンポジション
- **ポリモーフィズム**: インターフェースによる切り替え

**Cons**:
- **複雑性**: クラス設計、依存関係管理
- **学習コスト**: デザインパターンの理解が必要
- **オーバーヘッド**: オブジェクト生成、メモリ使用量
- **過度な抽象化**: YAGNI違反のリスク

**適用判断**:
- ✅ 複雑なビジネスロジック
- ✅ 複数の計算戦略（税制が国ごとに異なる等）
- ✅ 状態管理が必要

**このプロジェクトでの選択**: ⏰ **Phase 2以降で検討**

**移行タイミング**: 投資計算が複雑化した時点（UC-101以降）

---

#### Option C: 関数型（イミュータブル + パイプライン）

**実装**:
```python
from typing import NamedTuple
from functools import reduce

class YearlyRecord(NamedTuple):
    year: int
    income: int
    tax: int
    savings: int
    total_assets: int

def simulate(profile: Profile) -> list[YearlyRecord]:
    return pipe(
        range(start_year, end_year + 1),
        map(lambda year: calculate_income(year, profile)),
        map(lambda income: (income, calculate_tax(income))),
        map(lambda data: (*data, calculate_expense(data[0] - data[1]))),
        scan(lambda acc, data: acc + (data[0] - data[1] - data[2]), profile.current_savings),
        map(lambda data: YearlyRecord(*data))
    )
```

**Pros**:
- **不変性**: バグが減る、並列処理が容易
- **コンポーザビリティ**: 小さな関数を組み合わせる
- **テスト**: 副作用がない、予測可能
- **並列化**: マルチコア活用が容易

**Cons**:
- **学習コスト**: 高い（関数型パラダイムの理解）
- **可読性**: 慣れるまで読みづらい
- **パフォーマンス**: イミュータブルなコピー
- **エコシステム**: Pythonは手続き型/OOPが主流

**適用判断**:
- ✅ データパイプライン処理
- ✅ 並列計算が必要
- ✅ チームが関数型に精通

**このプロジェクトでの選択**: ❌ **不採用**

**理由**:
- チームの学習コスト > 得られる利益
- Pythonエコシステムに合わない
- **部分的に採用**: 純粋関数、イミュータブルな設計は取り入れる

---

### 2.4 テスト戦略

#### Option A: TDD（Test-Driven Development）

**プロセス**:
```
1. Red: テストを書く（失敗する）
2. Green: 最小限の実装で通す
3. Refactor: リファクタリング
4. Repeat
```

**実装例**:
```python
# tests/test_tax_calculator.py
def test_income_tax_basic_case():
    # Given: 年収500万円
    income = 5_000_000

    # When: 所得税を計算
    tax = calculate_income_tax(income)

    # Then: 期待値と一致
    assert tax == 199_000

# tax_calculator.py
def calculate_income_tax(income):
    # テストを通すための最小実装
    pass  # まだ実装しない
```

**Pros**:
- **品質**: バグが少ない、リグレッション防止
- **設計**: テスタブルな設計に自然となる
- **ドキュメント**: テストが仕様書になる
- **リファクタリング**: 安心して変更できる
- **自信**: テストがあるから大胆に書き直せる

**Cons**:
- **初期コスト**: テスト作成時間
- **学習コスト**: TDDの習得
- **要件不明時**: 仕様が固まっていないと書けない
- **UI/統合**: 単体テストだけでは不十分

**適用判断**:
- ✅ ビジネスロジック（税金計算、投資計算）
- ✅ 仕様が明確
- ✅ 長期保守が前提

**このプロジェクトでの選択**: ✅ **採用**

**適用範囲**:
- ✅ 税金計算ロジック
- ✅ 社会保険料計算
- ✅ 投資リターン計算
- ✅ シミュレーションエンジン

**非適用範囲**:
- UI コンポーネント（E2Eテストで代替）
- データベーススキーマ（マイグレーションテスト）

---

#### Option B: Post-Implementation Testing

**プロセス**:
```
1. 実装する
2. 動作確認する
3. テストを書く（時間があれば）
```

**Pros**:
- **速度**: 初期実装が速い
- **柔軟性**: 仕様変更に柔軟
- **探索的**: プロトタイピングに向く

**Cons**:
- **品質**: バグが混入しやすい
- **リファクタリング**: 怖くて変更できない
- **テストカバレッジ**: 後回しになりがち
- **技術的負債**: テストがないまま本番稼働

**このプロジェクトでの選択**: ❌ **不採用**

**理由**:
- 金融計算は正確性が最重要
- 税金計算のバグは信頼を失う
- 長期保守を前提としている

---

### 2.5 プログラミング言語選択

#### 基本方針：型安全性とトレードオフ

**金融アプリの特殊性**:

- ❗ **計算ミスは致命的**: 税金計算のバグは信頼を失う
- ❗ **型安全性が最優先**: コンパイル時のエラー検出が重要
- ❗ **長期保守**: 税制変更に対応し続ける必要がある

**言語選択の優先順位**:

1. **型安全性** > 開発速度
2. **保守性** > 初期実装コスト
3. **テスタビリティ** > パフォーマンス（測定後に最適化）

---

#### Option A: TypeScript（最推奨 - フルスタック統一）

**適用例**:

```typescript
// shared/domain/taxCalculator.ts
export function calculateIncomeTax(taxableIncome: number): number {
  if (taxableIncome <= 1_950_000) {
    return Math.floor(taxableIncome * 0.05);
  } else if (taxableIncome <= 3_300_000) {
    return Math.floor(taxableIncome * 0.10 - 97_500);
  } else if (taxableIncome <= 6_950_000) {
    return Math.floor(taxableIncome * 0.20 - 427_500);
  }
  // ...
  throw new Error(`Invalid taxable income: ${taxableIncome}`);
}

// 型定義を共有
interface TaxCalculationResult {
  incomeTax: number;
  residentTax: number;
  socialInsurance: number;
  total: number;
}

// バックエンド: Node.js / Deno / Bun
// backend/api/simulation.ts
import { calculateIncomeTax } from '../shared/domain/taxCalculator';

app.post('/api/simulate', (req, res) => {
  const tax = calculateIncomeTax(req.body.income);
  // ...
});

// フロントエンド: React
// frontend/src/components/SimulationForm.tsx
import { calculateIncomeTax } from '../../shared/domain/taxCalculator';

function SimulationForm() {
  const previewTax = calculateIncomeTax(income); // クライアントサイドプレビュー
  // ...
}
```

**Pros**:

- ✅ **型安全性**: 静的型チェック、コンパイル時エラー検出
- ✅ **フロント/バック統一**: 同じ言語、同じロジック、同じ型定義
- ✅ **コード共有**: 計算ロジックをフロント/バックで再利用
- ✅ **開発体験**: IDE補完、リファクタリング支援が強力
- ✅ **エコシステム**: npm、型定義ライブラリが豊富
- ✅ **バックエンド選択肢**: Node.js、Deno、Bunから選べる
- ✅ **学習コスト**: 1つの言語習得で全スタック開発可能
- ✅ **デプロイ**: Vercel、Cloudflare Workers等のエッジ環境

**Cons**:

- ⚠️ **数値計算**: PythonのNumPy/Pandasほど充実していない
- ⚠️ **パフォーマンス**: Node.jsは重い計算が苦手
- ⚠️ **学習コスト**: 型システムの理解が必要（ただし1回だけ）

**適用判断**:

- ✅ フルスタック開発（フロント/バックを統一したい）
- ✅ 型安全性が最重要
- ✅ コード共有のメリットが大きい
- ✅ モダンなエコシステムを活用したい

**このプロジェクトでの選択**: ✅ **Phase 1から採用（最推奨）**

**理由**:

- **型安全性が最優先**: 金融計算でランタイムエラーは許されない
- **フロント/バック統一**: 計算ロジックを両方で使える（リアルタイムプレビュー）
- **長期保守**: 税制変更時の修正が1箇所で済む
- **学習効率**: チームが1つの言語に集中できる
- **MVP速度**: Deno/Bunなら依存関係管理がシンプル

---

#### Option B: Go（パフォーマンス重視）

**適用例**:

```go
// backend/domain/tax_calculator.go
package domain

import "errors"

// 型安全: コンパイル時に型エラーを検出
func CalculateIncomeTax(taxableIncome int) (int, error) {
    if taxableIncome < 0 {
        return 0, errors.New("taxable income must be non-negative")
    }

    if taxableIncome <= 1_950_000 {
        return taxableIncome * 5 / 100, nil
    } else if taxableIncome <= 3_300_000 {
        return taxableIncome*10/100 - 97_500, nil
    } else if taxableIncome <= 6_950_000 {
        return taxableIncome*20/100 - 427_500, nil
    }
    // ...
    return 0, errors.New("invalid taxable income")
}

// 構造体で型定義
type TaxCalculationResult struct {
    IncomeTax       int
    ResidentTax     int
    SocialInsurance int
    Total           int
}
```

**Pros**:

- ✅ **型安全性**: 静的型付け、コンパイル時エラー検出
- ✅ **パフォーマンス**: C言語並みの高速処理
- ✅ **並行処理**: goroutine、channelで並行処理が容易
- ✅ **シンプル**: 言語仕様が小さい、学習コスト比較的低い
- ✅ **デプロイ**: シングルバイナリ、依存関係なし
- ✅ **メモリ効率**: GC付きで低メモリ消費
- ✅ **スケーラビリティ**: 大規模システムに強い

**Cons**:

- ⚠️ **エコシステム**: Webフレームワークが少ない
- ⚠️ **数値計算**: ライブラリがPython/TypeScriptより少ない
- ⚠️ **フロントエンド**: WebAssemblyは可能だがエコシステム未成熟
- ⚠️ **エラーハンドリング**: if err != nil の繰り返し
- ⚠️ **ジェネリクス**: Go 1.18+ で追加されたが制約あり

**適用判断**:

- ✅ パフォーマンスが重要
- ✅ 大量の並行処理（大規模シミュレーション）
- ✅ マイクロサービス
- ✅ バックエンドのみの開発

**このプロジェクトでの選択**: ⏰ **Phase 2以降で部分採用を検討**

**採用検討シナリオ**:

- 大規模シミュレーション（10,000シナリオのモンテカルロ）
- パフォーマンスボトルネック（計算エンジン）
- マイクロサービス化（simulation-service）

**理由**:

- Phase 1ではTypeScriptで十分（測定ファースト）
- パフォーマンス問題が実測された時点で導入
- バックエンドの一部のみをGoに置き換え可能

---

#### Option C: Python（プロトタイピング・データ分析用）

**適用例**:

```python
# scripts/tax_analysis.py
from typing import NamedTuple
import pandas as pd
import matplotlib.pyplot as plt

class TaxResult(NamedTuple):
    income: int
    tax: int
    effective_rate: float

def calculate_income_tax(taxable_income: int) -> int:
    """所得税を計算（型ヒント付き）"""
    if taxable_income <= 1_950_000:
        return int(taxable_income * 0.05)
    elif taxable_income <= 3_300_000:
        return int(taxable_income * 0.10 - 97_500)
    # ...

# データ分析
incomes = range(1_000_000, 10_000_000, 100_000)
results = [TaxResult(inc, calculate_income_tax(inc), ...) for inc in incomes]
df = pd.DataFrame(results)
df.plot(x='income', y='effective_rate')
```

**Pros**:

- ✅ **プロトタイピング**: 早い開発速度、試行錯誤に向く
- ✅ **データ分析**: NumPy、Pandas、Matplotlibが強力
- ✅ **学習コスト**: 低い（初心者でも習得しやすい）
- ✅ **スクリプト**: ワンタイムスクリプト、データ移行に便利
- ✅ **型ヒント**: Python 3.10+ で型安全性が向上（ただし実行時チェックなし）

**Cons**:

- ❌ **型安全性**: 動的型付け、**ランタイムエラーのリスク大**
- ❌ **本番運用**: 金融計算の本番コードには不適
- ❌ **パフォーマンス**: 実行速度が遅い（GILの制約）
- ❌ **デプロイ**: 依存関係の管理が面倒（requirements.txt、venv）

**適用判断**:

- ✅ プロトタイピング、実験的コード
- ✅ データ分析、統計処理
- ✅ ワンタイムスクリプト
- ❌ **本番の計算ロジック（型安全性が必要）**

**このプロジェクトでの選択**: ⏰ **補助ツールのみ採用**

**採用範囲**:

- ✅ データ分析スクリプト（税制シミュレーション比較）
- ✅ 開発ツール（テストデータ生成）
- ✅ マイグレーションスクリプト
- ❌ **本番APIコード（TypeScript/Goを使用）**

**重要な決定**:

> Pythonは動的型付けのため、**金融計算の本番コードには採用しない**。
> データ分析やスクリプトのみに限定する。

---

#### Option D: Rust（極限最適化用）

**適用例**:

```rust
// wasm/monte_carlo.rs (WebAssembly用)
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn calculate_income_tax(taxable_income: u32) -> Result<u32, JsValue> {
    match taxable_income {
        0..=1_950_000 => Ok((taxable_income as f64 * 0.05) as u32),
        1_950_001..=3_300_000 => Ok((taxable_income as f64 * 0.10 - 97_500.0) as u32),
        1_950_001..=6_950_000 => Ok((taxable_income as f64 * 0.20 - 427_500.0) as u32),
        _ => Err(JsValue::from_str("Invalid taxable income")),
    }
}

// モンテカルロシミュレーション（10万回を1秒以内）
#[wasm_bindgen]
pub fn monte_carlo_simulation(scenarios: u32) -> Vec<u32> {
    (0..scenarios)
        .into_par_iter() // Rayon: 並列処理
        .map(|_| run_single_scenario())
        .collect()
}
```

**Pros**:

- ✅ **型安全性**: 最強の型システム、コンパイル時エラー検出
- ✅ **パフォーマンス**: C/C++並みの最高速度
- ✅ **メモリ安全**: 所有権システム、ゼロコストな抽象化
- ✅ **並行処理**: データ競合をコンパイル時に防ぐ
- ✅ **WebAssembly**: ブラウザで実行可能（計算をクライアントサイドで）

**Cons**:

- ❌ **学習コスト**: 非常に高い（所有権、ライフタイム）
- ❌ **開発速度**: コンパイルエラーと戦う時間が長い
- ❌ **エコシステム**: Webフレームワークが未成熟
- ❌ **人材**: 採用が困難

**適用判断**:

- ✅ WebAssembly（ブラウザで重い計算）
- ✅ 極限のパフォーマンス（10万回シミュレーション）
- ✅ システムプログラミング
- ❌ **MVP、プロトタイプ（学習コストが高すぎる）**

**このプロジェクトでの選択**: ⏰ **Phase 3以降で部分採用を検討**

**採用検討シナリオ**:

- WebAssembly化（ブラウザで大規模モンテカルロシミュレーション）
- 計算エンジンの最適化（10万回を1秒以内で実行）
- Go でも遅い場合の最終手段

**理由**:

- Phase 1-2: TypeScriptで十分
- Phase 3: パフォーマンスボトルネックが測定された場合のみ
- WebAssemblyなら TypeScriptコードから呼び出せる

---

### 2.5.1 このプロジェクトの言語戦略（型安全性を最優先）

#### ✅ 推奨: Phase 1から TypeScript フルスタック

**構成**:

```
financial-app/
├── shared/
│   └── domain/
│       ├── taxCalculator.ts      # 計算ロジック（共有）
│       ├── simulationEngine.ts   # シミュレーション（共有）
│       └── types.ts               # 型定義（共有）
├── backend/
│   ├── api/
│   │   └── simulation.ts         # Node.js/Deno/Bun
│   └── db/
│       └── repository.ts
├── frontend/
│   └── src/
│       ├── components/           # React + TypeScript
│       └── hooks/
└── tests/
    └── domain/
        └── taxCalculator.test.ts # Jest/Vitest
```

**技術スタック**:

- **バックエンド**: Deno または Bun（推奨）、または Node.js
- **フロントエンド**: React + TypeScript + Vite
- **共有ロジック**: `shared/domain/` に計算ロジックを配置
- **テスト**: Vitest（Deno/Bun）または Jest（Node.js）
- **型チェック**: `tsc --noEmit`（CI/CDで実行）

**メリット**:

1. **型安全性**: コンパイル時にエラーを検出（金融計算で最重要）
2. **コード共有**: フロント/バックで同じ計算ロジックを使用
3. **リアルタイムプレビュー**: クライアントサイドで計算結果を即座に表示
4. **学習効率**: チームが1つの言語に集中
5. **保守性**: 税制変更時の修正が1箇所で済む

**なぜ Deno/Bun を推奨するか**:

- **Deno**:
  - TypeScript ネイティブ（トランスパイル不要）
  - 標準ライブラリが充実
  - セキュア（デフォルトでサンドボックス）
  - `deno test` でテスト実行

- **Bun**:
  - 超高速（Node.jsの3倍速い）
  - TypeScript/JSX ネイティブ
  - `bun test` でテスト実行
  - npm互換

---

#### Phase 2: パフォーマンス最適化（測定後に判断）

##### シナリオA: TypeScript + Go（ハイブリッド）

###### パフォーマンスボトルネックが測定された場合のみ

```
financial-app/
├── shared/domain/              # TypeScript（共有）
├── backend/
│   ├── api/                    # TypeScript (Deno/Bun)
│   └── calculation-engine/     # Go（高速計算エンジン）
│       └── monte_carlo.go      # 10,000シナリオ並列実行
├── frontend/                   # TypeScript + React
└── scripts/                    # Python（データ分析のみ）
```

**Goに移行すべきタイミング**:

- TypeScriptで10,000シナリオのモンテカルロに10秒以上かかる
- 並行ユーザー数が1,000人を超える
- CPU使用率が常に80%以上

##### シナリオB: TypeScript + Rust/WASM（ブラウザ最適化）

###### クライアントサイドで重い計算が必要な場合

```
financial-app/
├── shared/domain/              # TypeScript
├── backend/                    # TypeScript
├── frontend/
│   ├── src/                    # TypeScript + React
│   └── wasm/
│       └── monte_carlo.wasm    # Rust → WebAssembly
└── wasm-src/
    └── monte_carlo.rs          # Rust
```

**Rustに移行すべきタイミング**:

- ブラウザで100,000シナリオのシミュレーションが必要
- モバイルデバイスでのパフォーマンスが重要
- サーバーコストを削減したい（計算をクライアントサイドに移行）

---

#### Phase 3: マイクロサービス化（スケール時）

##### ユーザー数10,000人以上、チーム5人以上の場合

```
services/
├── api-gateway/                # Go（高速、並行処理）
├── simulation-service/         # TypeScript（ビジネスロジック）
├── calculation-engine/         # Go（大規模並行計算）
├── user-service/               # TypeScript
└── analytics-service/          # Python（データ分析）
```

---

### 2.5.2 言語選択の判断基準（型安全性ファースト）

#### 最重要原則

> **金融アプリでは型安全性が最優先**
>
> 動的型付け言語（Python、JavaScript）は本番の計算ロジックには使用しない。
> TypeScript、Go、Rustのみを採用する。

#### 新しい言語を追加する前のチェックリスト

```text
□ 測定: 既存言語ではパフォーマンス要件を満たせないか？
□ 型安全性: 静的型付けか？コンパイル時エラー検出できるか？
□ ROI: 学習コスト < 得られる利益か？
□ チーム: メンバーが習得できるか？
□ 保守: 長期保守のコストは許容範囲か？
□ エコシステム: ライブラリ、ツールは十分か？
□ デプロイ: CI/CDパイプラインへの影響は？
□ 移行パス: 段階的に移行できるか？
```

#### 言語を追加すべきケース

- ✅ パフォーマンス測定で明確なボトルネック（10秒以上の遅延）
- ✅ WebAssemblyで計算をクライアントサイドに移行
- ✅ 型安全性を保ちながら特定の優位性がある

#### 言語を追加すべきでないケース

- ❌ 流行っているから
- ❌ 好きな言語だから
- ❌ 測定せずにパフォーマンスを懸念
- ❌ **動的型付け言語を本番計算ロジックに使う**

#### このプロジェクトの最終決定

| 言語 | 採用範囲 | 理由 |
|------|---------|------|
| **TypeScript** | フルスタック（Phase 1〜） | 型安全性、コード共有、学習効率 |
| **Go** | 計算エンジン（Phase 2〜、測定後） | パフォーマンス、並行処理 |
| **Rust** | WebAssembly（Phase 3〜、測定後） | 極限最適化、ブラウザ実行 |
| **Python** | スクリプトのみ | データ分析、ツール（本番コード不可） |
| **JavaScript** | ❌ 不採用 | 動的型付け、TypeScriptで代替 |

---

### 2.6 フロントエンド技術

#### Option A: React + TypeScript + Vite

**構成**:
```
frontend/
├── src/
│   ├── components/
│   │   ├── SimulationForm.tsx
│   │   ├── ResultChart.tsx
│   │   └── YearlyTable.tsx
│   ├── hooks/
│   │   └── useSimulation.ts
│   ├── api/
│   │   └── simulationApi.ts
│   └── types/
│       └── simulation.ts
└── package.json
```

**Pros**:
- **エコシステム**: 巨大、ライブラリが豊富
- **型安全**: TypeScriptによる型チェック
- **パフォーマンス**: 仮想DOM、最適化
- **開発体験**: HMR、デバッグツール、IDE補完
- **採用**: 人材が多い

**Cons**:
- **学習コスト**: React Hooks、状態管理
- **ビルド複雑性**: Webpack/Vite設定
- **依存関係**: npm地獄
- **バンドルサイズ**: 初期ロードが重い

**適用判断**:
- ✅ SPA（Single Page Application）
- ✅ リッチなUI（グラフ、インタラクション）
- ✅ 状態管理が複雑

**このプロジェクトでの選択**: ✅ **採用（Phase 2以降）**

---

#### Option B: Vanilla HTML + HTMX + Alpine.js

**構成**:
```html
<form hx-post="/api/simulate" hx-target="#result">
  <input type="number" name="annual_income" />
  <button type="submit">計算</button>
</form>

<div id="result" x-data="{ show: false }">
  <!-- サーバーからHTMLが返される -->
</div>
```

**Pros**:
- **シンプル**: 学習コスト最小
- **パフォーマンス**: バンドルなし、キャッシュ可能
- **SEO**: サーバーサイドレンダリング
- **メンテナンス**: フレームワーク更新不要

**Cons**:
- **機能制限**: 複雑なUIは困難
- **状態管理**: 複雑化すると破綻
- **再利用**: コンポーネント化が難しい
- **エコシステム**: ライブラリが少ない

**適用判断**:
- ✅ シンプルなフォーム
- ✅ サーバーサイド中心
- ✅ MVP、プロトタイプ

**このプロジェクトでの選択**: ✅ **Phase 1で採用**

**理由**:
- MVP は単純なフォーム + 結果表示
- 実装速度を最優先
- Phase 2でReactに移行可能

---

### 2.6 バックエンドAPI設計

#### Option A: RESTful API

**エンドポイント**:
```
POST   /api/simulations
GET    /api/simulations/:id
GET    /api/simulations/:id/yearly-records
PATCH  /api/simulations/:id
DELETE /api/simulations/:id
```

**リクエスト例**:
```json
POST /api/simulations
{
  "profile": {
    "current_age": 30,
    "retirement_age": 65,
    "current_annual_income": 5000000
  },
  "settings": {
    "savings_rate": 20.0
  }
}
```

**レスポンス例**:
```json
{
  "id": "abc123",
  "summary": {
    "final_total_assets": 50000000
  },
  "yearly_records": [...]
}
```

**Pros**:
- **標準**: HTTP標準、理解しやすい
- **キャッシュ**: HTTP キャッシュが使える
- **ツール**: Postman、Swagger等が豊富
- **ステートレス**: スケールしやすい

**Cons**:
- **オーバーフェッチ**: 不要なデータも取得
- **アンダーフェッチ**: 複数リクエスト必要
- **N+1問題**: 関連データの取得
- **バージョニング**: APIバージョン管理

**このプロジェクトでの選択**: ✅ **採用**

---

#### Option B: GraphQL

**スキーマ**:
```graphql
type Query {
  simulation(id: ID!): Simulation
}

type Mutation {
  createSimulation(input: SimulationInput!): Simulation
}

type Simulation {
  id: ID!
  summary: Summary!
  yearlyRecords(year: Int): [YearlyRecord!]!
}
```

**クエリ例**:
```graphql
mutation {
  createSimulation(input: {
    profile: {
      currentAge: 30
      retirementAge: 65
      currentAnnualIncome: 5000000
    }
  }) {
    id
    summary {
      finalTotalAssets
    }
    yearlyRecords {
      year
      savings
    }
  }
}
```

**Pros**:
- **柔軟性**: 必要なデータだけ取得
- **型安全**: スキーマで型定義
- **自己文書化**: スキーマがドキュメント
- **N+1解決**: DataLoader

**Cons**:
- **学習コスト**: 高い
- **複雑性**: リゾルバ、キャッシュ
- **キャッシュ**: HTTPキャッシュが使えない
- **オーバーヘッド**: 小規模では過剰

**このプロジェクトでの選択**: ❌ **不採用**

**理由**:
- API構造がシンプル（CRUD + シミュレーション実行）
- GraphQLの利点を活かせるケースが少ない
- 学習コスト > 得られる利益

---

## 3. このプロジェクトのアーキテクチャ決定

### 3.1 Phase 1（MVP）: 最小構成

```
financial-app/
├── backend/
│   ├── api/
│   │   └── main.py              # FastAPI
│   ├── domain/
│   │   ├── tax_calculator.py    # 純粋関数
│   │   ├── simulation.py        # 手続き型
│   │   └── constants.py         # ハードコード
│   └── tests/
│       ├── test_tax_calculator.py
│       └── test_simulation.py
├── frontend/
│   ├── index.html               # HTMX
│   └── styles.css               # Tailwind CSS
└── README.md
```

**技術スタック**:
- Backend: **Python + FastAPI**
- Frontend: **HTML + HTMX + Alpine.js**
- Testing: **pytest + TDD**
- Data: **ハードコード（Python定数）**

**理由**:
- 実装速度を最優先
- 仕様の検証が最重要
- 過度な抽象化を避ける

---

### 3.2 Phase 2（成長期）: 機能拡張

```
financial-app/
├── backend/
│   ├── api/
│   ├── domain/
│   │   ├── calculators/
│   │   │   ├── tax.py
│   │   │   ├── investment.py
│   │   │   └── social_insurance.py
│   │   ├── engines/
│   │   │   └── simulation_engine.py  # クラスベース
│   │   └── models/
│   │       └── profile.py
│   ├── data/
│   │   ├── tax_policy_2024.yaml
│   │   └── tax_policy_2025.yaml
│   └── tests/
├── frontend/                      # React に移行
│   ├── src/
│   │   ├── components/
│   │   └── hooks/
│   └── package.json
└── docker-compose.yml
```

**技術スタック**:
- Backend: **Python + FastAPI + クラス設計**
- Frontend: **React + TypeScript + Vite**
- Data: **YAML設定ファイル**

**移行理由**:
- 投資計算の複雑化（Strategy パターンが有効）
- UIの高度化（グラフ、インタラクション）
- 複数年度対応

---

### 3.3 Phase 3（スケール期）: SaaS化

```
financial-app/
├── services/
│   ├── api-gateway/
│   ├── simulation-service/
│   └── user-service/
├── infrastructure/
│   ├── kubernetes/
│   └── terraform/
├── database/
│   └── migrations/
└── monitoring/
```

**技術スタック**:
- Backend: **Modular Monolith → Microservices（段階的）**
- Database: **PostgreSQL + JSONB**
- Infra: **Kubernetes + GCP/AWS**

**移行判断**:
- ユーザー数: 10,000人以上
- チーム規模: 5人以上
- 収益化が確定

---

## 4. コーディング規約とベストプラクティス

### 4.1 命名規則

```python
# ✅ Good: 意図が明確
def calculate_income_tax(taxable_income: int) -> int:
    pass

# ❌ Bad: 略語、曖昧
def calc_tax(amt: int) -> int:
    pass
```

**原則**:
- 関数名: 動詞 + 名詞（`calculate_income_tax`, `get_user_profile`）
- 変数名: 名詞（`taxable_income`, `total_assets`）
- 定数: UPPER_SNAKE_CASE（`BASIC_DEDUCTION`）
- クラス: PascalCase（`TaxCalculator`, `SimulationEngine`）

---

### 4.2 関数設計

```python
# ✅ Good: 単一責任、純粋関数
def calculate_income_tax(taxable_income: int) -> int:
    """所得税を計算する（復興特別所得税を含む）"""
    base_tax = _apply_progressive_tax(taxable_income)
    reconstruction_tax = base_tax * RECONSTRUCTION_TAX_RATE
    return int(base_tax + reconstruction_tax)

# ❌ Bad: 副作用、複数責任
def calculate_and_save_tax(user_id: str) -> None:
    user = get_user(user_id)  # DB アクセス
    tax = calculate_tax(user.income)  # 計算
    save_tax(user_id, tax)  # DB 書き込み
    send_email(user.email, tax)  # メール送信
```

**原則**:
- **純粋関数**: 同じ入力 → 同じ出力、副作用なし
- **単一責任**: 1つの関数は1つのことだけ
- **短く**: 20行以内（目安）
- **ドキュメント**: Docstring で説明

---

### 4.3 エラーハンドリング

```python
# ✅ Good: 明示的な例外、バリデーション
class ValidationError(Exception):
    pass

def calculate_tax(income: int) -> int:
    if income < 0:
        raise ValidationError("年収は0以上である必要があります")

    if income > 100_000_000:
        raise ValidationError("年収は1億円以下で入力してください")

    # 正常な計算
    return _calc_income_tax(income)

# ❌ Bad: 暗黙のエラー、assert
def calculate_tax(income: int) -> int:
    assert income >= 0  # 本番環境で無効化される
    return _calc_income_tax(income)
```

**原則**:
- **Fail Fast**: 早期にバリデーション
- **明示的な例外**: カスタム例外クラス
- **ユーザーフレンドリー**: エラーメッセージは分かりやすく
- **ログ**: 重要なエラーはログに記録

---

### 4.4 テストコード

```python
# ✅ Good: AAA パターン、具体的なケース
def test_income_tax_for_5million_yen_earner():
    """年収500万円の場合の所得税計算"""
    # Arrange: テストデータ準備
    annual_income = 5_000_000
    salary_deduction = 1_540_000
    basic_deduction = 480_000
    taxable_income = annual_income - salary_deduction - basic_deduction

    # Act: 実行
    income_tax = calculate_income_tax(taxable_income)

    # Assert: 検証
    expected = 199_000
    assert income_tax == expected, f"Expected {expected}, but got {income_tax}"

# ❌ Bad: 曖昧なテスト名、マジックナンバー
def test_tax():
    assert calculate_income_tax(3000000) == 199000
```

**原則**:
- **AAA パターン**: Arrange, Act, Assert
- **1テスト1検証**: 1つのテストで1つのことを検証
- **具体的な名前**: `test_income_tax_for_5million_yen_earner`
- **エッジケース**: 境界値、異常値もテスト

---

## 5. 意思決定のフレームワーク

### 5.1 新機能追加時のチェックリスト

```
□ YAGNI: 今本当に必要か？
□ 測定: 問題を測定したか？
□ 代替案: 他の選択肢を検討したか？
□ トレードオフ: Pros/Cons を明確にしたか?
□ テスト: テストファーストで書けるか？
□ 負債: 技術的負債を記録したか？
□ ドキュメント: 設計判断を記録したか？
```

---

### 5.2 リファクタリングのタイミング

**すぐにやる**:
- バグを見つけた時
- テストがない箇所を触る時
- 同じコードを3回書いた時（DRY原則）

**後回しにする**:
- パフォーマンス問題が測定されていない
- ユーザーからのフィードバックがない
- ROI（投資対効果）が低い

**絶対やらない**:
- デプロイ直前
- 仕様が不明確
- テストがない状態

---

## 6. まとめ：このプロジェクトの哲学

### 6.1 優先順位

1. **正確性**: 税金計算のバグは許されない → **TDD必須**
2. **速度**: 早くリリースしてフィードバックを得る → **MVP、段階的リリース**
3. **保守性**: 長期運用を前提 → **テスト、ドキュメント**
4. **シンプルさ**: 過度な抽象化を避ける → **YAGNI、手続き型から開始**

---

### 6.2 アーキテクチャ進化の原則

```
Phase 1: Modular Monolith（手続き型 + ハードコード）
   ↓
   ユーザーが増える、要件が明確になる
   ↓
Phase 2: Modular Monolith（OOP + YAML）
   ↓
   スケール問題、チーム拡大
   ↓
Phase 3: Microservices（独立サービス + DB）
```

**重要**: 各フェーズで「問題を測定」してから移行する

---

### 6.3 継続的改善

- **毎スプリント**: 技術的負債を1つ返済
- **四半期ごと**: アーキテクチャレビュー
- **年次**: 大規模リファクタリング検討

---

## 変更履歴

| 日付 | 変更内容 |
|------|---------|
| 2025-11-16 | 初版作成 |

import { useState } from 'react'
import './App.css'
import type { SimulationInput, SimulationResult } from '../../shared/domain/types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // フォーム入力
  const [currentAge, setCurrentAge] = useState(30);
  const [retirementAge, setRetirementAge] = useState(65);
  const [currentAnnualIncome, setCurrentAnnualIncome] = useState(5000000);
  const [incomeGrowthRate, setIncomeGrowthRate] = useState(2.0);
  const [currentSavings, setCurrentSavings] = useState(1000000);
  const [savingsRate, setSavingsRate] = useState(20.0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const input: SimulationInput = {
      profile: {
        currentAge,
        retirementAge,
        currentAnnualIncome,
        incomeGrowthRate,
        currentSavings,
      },
      expenseMode: 'simple',
      simpleExpense: {
        savingsRate,
      },
    };

    try {
      const response = await fetch(`${API_URL}/api/simulate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'シミュレーションに失敗しました');
      }

      const data: SimulationResult = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>💰 ライフプラン・シミュレーター（Phase 1: UC-001）</h1>

      <div className="content">
        <form onSubmit={handleSubmit} className="form">
          <h2>基本情報</h2>

          <div className="form-group">
            <label>
              現在の年齢:
              <input
                type="number"
                value={currentAge}
                onChange={(e) => setCurrentAge(Number(e.target.value))}
                min="20"
                max="70"
                required
              />
              <span>歳</span>
            </label>
          </div>

          <div className="form-group">
            <label>
              退職年齢:
              <input
                type="number"
                value={retirementAge}
                onChange={(e) => setRetirementAge(Number(e.target.value))}
                min={currentAge + 1}
                max="80"
                required
              />
              <span>歳</span>
            </label>
          </div>

          <div className="form-group">
            <label>
              現在の年収:
              <input
                type="number"
                value={currentAnnualIncome}
                onChange={(e) => setCurrentAnnualIncome(Number(e.target.value))}
                min="1"
                max="100000000"
                step="100000"
                required
              />
              <span>円</span>
            </label>
          </div>

          <div className="form-group">
            <label>
              昇給率:
              <input
                type="number"
                value={incomeGrowthRate}
                onChange={(e) => setIncomeGrowthRate(Number(e.target.value))}
                min="-10"
                max="20"
                step="0.1"
                required
              />
              <span>%</span>
            </label>
          </div>

          <div className="form-group">
            <label>
              現在の貯金額:
              <input
                type="number"
                value={currentSavings}
                onChange={(e) => setCurrentSavings(Number(e.target.value))}
                min="0"
                step="100000"
                required
              />
              <span>円</span>
            </label>
          </div>

          <div className="form-group">
            <label>
              貯金率:
              <input
                type="number"
                value={savingsRate}
                onChange={(e) => setSavingsRate(Number(e.target.value))}
                min="0"
                max="100"
                step="1"
                required
              />
              <span>%</span>
            </label>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? '計算中...' : 'シミュレーション実行'}
          </button>
        </form>

        {error && (
          <div className="error">
            <h3>エラー</h3>
            <p>{error}</p>
          </div>
        )}

        {result && (
          <div className="result">
            <h2>シミュレーション結果</h2>

            <div className="summary">
              <h3>📊 サマリー</h3>
              <div className="summary-item">
                <span className="label">退職時の総資産:</span>
                <span className="value">
                  {result.summary.finalTotalAssets.toLocaleString()}円
                </span>
              </div>
              <div className="summary-item">
                <span className="label">シミュレーション期間:</span>
                <span className="value">{result.summary.totalYears}年間</span>
              </div>
              <div className="summary-item">
                <span className="label">総納税額:</span>
                <span className="value">
                  {result.summary.totalTaxPaid.toLocaleString()}円
                </span>
              </div>
            </div>

            <div className="yearly-records">
              <h3>📈 年次推移（最初の5年）</h3>
              <table>
                <thead>
                  <tr>
                    <th>年</th>
                    <th>年齢</th>
                    <th>年収</th>
                    <th>税金合計</th>
                    <th>手取り</th>
                    <th>年間貯蓄</th>
                    <th>累計資産</th>
                  </tr>
                </thead>
                <tbody>
                  {result.yearlyRecords.slice(0, 5).map((record) => (
                    <tr key={record.year}>
                      <td>{record.year}</td>
                      <td>{record.age}歳</td>
                      <td>{record.income.gross.toLocaleString()}円</td>
                      <td>{record.tax.total.toLocaleString()}円</td>
                      <td>{record.netIncome.toLocaleString()}円</td>
                      <td>{record.savings.annual.toLocaleString()}円</td>
                      <td><strong>{record.savings.total.toLocaleString()}円</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {result.yearlyRecords.length > 5 && (
                <p className="note">※ 最初の5年分のみ表示しています</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App

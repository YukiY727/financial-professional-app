import './style.css'
import { simulateRetirementAssets } from './domain/simulation'

// フォーム送信時の処理
document.getElementById('simulationForm')?.addEventListener('submit', (e) => {
  e.preventDefault()

  // フォームから値を取得
  const currentAge = parseInt(
    (document.getElementById('currentAge') as HTMLInputElement).value
  )
  const retirementAge = parseInt(
    (document.getElementById('retirementAge') as HTMLInputElement).value
  )
  const currentAnnualIncome = parseInt(
    (document.getElementById('currentAnnualIncome') as HTMLInputElement).value
  )
  const incomeGrowthRate =
    parseFloat(
      (document.getElementById('incomeGrowthRate') as HTMLInputElement).value
    ) / 100 // %を小数に変換
  const currentSavings = parseInt(
    (document.getElementById('currentSavings') as HTMLInputElement).value
  )
  const savingsRate =
    parseFloat((document.getElementById('savingsRate') as HTMLInputElement).value) /
    100 // %を小数に変換

  try {
    // シミュレーション実行
    const result = simulateRetirementAssets({
      currentAge,
      retirementAge,
      currentAnnualIncome,
      incomeGrowthRate,
      currentSavings,
      savingsRate,
    })

    // 結果を表示
    const resultDiv = document.getElementById('result')!
    resultDiv.classList.remove('hidden')

    document.getElementById('finalAge')!.textContent = `${result.finalAge}歳`
    document.getElementById('totalYears')!.textContent = `${result.totalYears}年`
    document.getElementById('finalTotalAssets')!.textContent =
      `${result.finalTotalAssets.toLocaleString('ja-JP')}円`

    // 結果までスムーズにスクロール
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  } catch (error) {
    if (error instanceof Error) {
      alert(`エラー: ${error.message}`)
    } else {
      alert('計算中にエラーが発生しました')
    }
  }
})

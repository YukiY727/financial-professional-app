/**
 * 税金・社会保険料計算モジュール
 *
 * Phase 1: ハードコードされた定数 (2024年度の税制)
 * - DEBT-001: マスターデータのハードコード → Phase 2で設定ファイル化
 * - DEBT-002: 控除項目の省略 (基礎控除のみ) → Phase 2で配偶者控除・扶養控除を追加
 */

/**
 * 基本控除・税率
 */
const BASIC_DEDUCTION = 480_000 // 基礎控除
const RECONSTRUCTION_TAX_RATE = 0.021 // 復興特別所得税率
const RESIDENT_TAX_RATE = 0.1 // 住民税率 (所得割)
const RESIDENT_TAX_FLAT = 5_000 // 住民税均等割

/**
 * 社会保険料率
 */
const PENSION_RATE = 0.0915 // 厚生年金保険料率 (本人負担)
const HEALTH_INSURANCE_RATE = 0.05 // 健康保険料率 (本人負担、協会けんぽ東京支部を参考)
const EMPLOYMENT_INSURANCE_RATE = 0.006 // 雇用保険料率

/**
 * 給与所得控除の計算に使用する定数
 */
const SALARY_DEDUCTION_THRESHOLD_1 = 1_625_000
const SALARY_DEDUCTION_THRESHOLD_2 = 1_800_000
const SALARY_DEDUCTION_THRESHOLD_3 = 3_600_000
const SALARY_DEDUCTION_THRESHOLD_4 = 6_600_000
const SALARY_DEDUCTION_THRESHOLD_5 = 8_500_000
const SALARY_DEDUCTION_MIN = 550_000
const SALARY_DEDUCTION_MAX = 1_950_000

/**
 * 所得税の累進課税に使用する定数
 */
const INCOME_TAX_BRACKET_1 = 1_950_000
const INCOME_TAX_BRACKET_2 = 3_300_000
const INCOME_TAX_BRACKET_3 = 6_950_000
const INCOME_TAX_BRACKET_4 = 9_000_000
const INCOME_TAX_BRACKET_5 = 18_000_000
const INCOME_TAX_BRACKET_6 = 40_000_000

const INCOME_TAX_RATE_1 = 0.05
const INCOME_TAX_RATE_2 = 0.1
const INCOME_TAX_RATE_3 = 0.2
const INCOME_TAX_RATE_4 = 0.23
const INCOME_TAX_RATE_5 = 0.33
const INCOME_TAX_RATE_6 = 0.4
const INCOME_TAX_RATE_7 = 0.45

const INCOME_TAX_DEDUCTION_2 = 97_500
const INCOME_TAX_DEDUCTION_3 = 427_500
const INCOME_TAX_DEDUCTION_4 = 636_000
const INCOME_TAX_DEDUCTION_5 = 1_536_000
const INCOME_TAX_DEDUCTION_6 = 2_796_000
const INCOME_TAX_DEDUCTION_7 = 4_796_000

/**
 * 給与所得控除を計算
 *
 * 給与所得者の概算経費として、年収に応じた控除額が認められる。
 * 2020年（令和2年）以降の計算式を使用。
 *
 * @param salary - 年収 (額面)
 * @returns 給与所得控除額
 */
export function calcSalaryDeduction(salary: number): number {
  if (salary <= SALARY_DEDUCTION_THRESHOLD_1) {
    return SALARY_DEDUCTION_MIN
  } else if (salary <= SALARY_DEDUCTION_THRESHOLD_2) {
    return Math.floor(salary * 0.4 - 100_000)
  } else if (salary <= SALARY_DEDUCTION_THRESHOLD_3) {
    return Math.floor(salary * 0.3 + 80_000)
  } else if (salary <= SALARY_DEDUCTION_THRESHOLD_4) {
    return Math.floor(salary * 0.2 + 440_000)
  } else if (salary <= SALARY_DEDUCTION_THRESHOLD_5) {
    return Math.floor(salary * 0.1 + 1_100_000)
  } else {
    return SALARY_DEDUCTION_MAX
  }
}

/**
 * 所得税を計算 (復興特別所得税含む)
 *
 * 累進課税: 課税所得が多いほど高い税率が適用される。
 * 復興特別所得税: 東日本大震災の復興財源として、所得税額の2.1%が加算される。
 *
 * @param taxableIncome - 課税所得
 * @returns 所得税額 (復興特別所得税含む)
 */
export function calcIncomeTax(taxableIncome: number): number {
  let baseTax: number

  if (taxableIncome <= INCOME_TAX_BRACKET_1) {
    baseTax = taxableIncome * INCOME_TAX_RATE_1
  } else if (taxableIncome <= INCOME_TAX_BRACKET_2) {
    baseTax = taxableIncome * INCOME_TAX_RATE_2 - INCOME_TAX_DEDUCTION_2
  } else if (taxableIncome <= INCOME_TAX_BRACKET_3) {
    baseTax = taxableIncome * INCOME_TAX_RATE_3 - INCOME_TAX_DEDUCTION_3
  } else if (taxableIncome <= INCOME_TAX_BRACKET_4) {
    baseTax = taxableIncome * INCOME_TAX_RATE_4 - INCOME_TAX_DEDUCTION_4
  } else if (taxableIncome <= INCOME_TAX_BRACKET_5) {
    baseTax = taxableIncome * INCOME_TAX_RATE_5 - INCOME_TAX_DEDUCTION_5
  } else if (taxableIncome <= INCOME_TAX_BRACKET_6) {
    baseTax = taxableIncome * INCOME_TAX_RATE_6 - INCOME_TAX_DEDUCTION_6
  } else {
    baseTax = taxableIncome * INCOME_TAX_RATE_7 - INCOME_TAX_DEDUCTION_7
  }

  const reconstructionTax = baseTax * RECONSTRUCTION_TAX_RATE
  return Math.floor(baseTax + reconstructionTax)
}

/**
 * 社会保険料を計算
 *
 * 簡略化: 年収を12で割った月給に対して保険料率をかける。
 * 実際には標準報酬月額等級テーブルに基づくが、概算としてこの方法を採用。
 *
 * 構成:
 * - 厚生年金保険料: 老後の年金のための保険
 * - 健康保険料: 医療費の自己負担を軽減するための保険
 * - 雇用保険料: 失業時の給付のための保険
 *
 * DEBT-003: 標準報酬月額の簡略化 → Phase 2で等級テーブルを導入
 *
 * @param annualIncome - 年収 (額面)
 * @returns 社会保険料総額 (年間)
 */
export function calcSocialInsurance(annualIncome: number): number {
  const monthlySalary = annualIncome / 12 // 月給 (簡略化)

  // 厚生年金保険料 (本人負担分)
  const pension = monthlySalary * PENSION_RATE * 12

  // 健康保険料 (本人負担分)
  const health = monthlySalary * HEALTH_INSURANCE_RATE * 12

  // 雇用保険料
  const employment = annualIncome * EMPLOYMENT_INSURANCE_RATE

  return Math.floor(pension + health + employment)
}

/**
 * 課税所得を計算
 *
 * 重要: 社会保険料控除を含める
 * 課税所得 = 年収 - 給与所得控除 - 基礎控除 - 社会保険料
 *
 * @param annualIncome - 年収 (額面)
 * @returns 課税所得
 */
export function calcTaxableIncome(annualIncome: number): number {
  const salaryDeduction = calcSalaryDeduction(annualIncome)
  const socialInsurance = calcSocialInsurance(annualIncome)
  const taxableIncome =
    annualIncome - salaryDeduction - BASIC_DEDUCTION - socialInsurance

  // 課税所得がマイナスになる場合は0とする
  return Math.max(0, taxableIncome)
}

/**
 * 住民税を計算
 *
 * 住民税 = 課税所得 × 10% + 均等割 5,000円
 *
 * @param taxableIncome - 課税所得
 * @returns 住民税額
 */
export function calcResidentTax(taxableIncome: number): number {
  return Math.floor(taxableIncome * RESIDENT_TAX_RATE + RESIDENT_TAX_FLAT)
}

/**
 * 手取り収入を計算
 *
 * 手取り = 年収 - 所得税 - 住民税 - 社会保険料
 *
 * @param annualIncome - 年収 (額面)
 * @returns 手取り収入
 */
export function calcNetIncome(annualIncome: number): number {
  const taxableIncome = calcTaxableIncome(annualIncome)
  const incomeTax = calcIncomeTax(taxableIncome)
  const residentTax = calcResidentTax(taxableIncome)
  const socialInsurance = calcSocialInsurance(annualIncome)

  return annualIncome - incomeTax - residentTax - socialInsurance
}

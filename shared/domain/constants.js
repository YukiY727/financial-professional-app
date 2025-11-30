/**
 * 税制・社会保険料のマスターデータ（2024年度）
 *
 * Phase 1ではハードコード。Phase 2で設定ファイル化予定。
 */
/** 基礎控除額（円） */
export const BASIC_DEDUCTION = 480_000;
/** 復興特別所得税率（%） */
export const RECONSTRUCTION_TAX_RATE = 0.021;
/** 住民税率（所得割） */
export const RESIDENT_TAX_RATE = 0.10;
/** 住民税（均等割） */
export const RESIDENT_TAX_FLAT = 5_000;
/** 厚生年金保険料率（本人負担） */
export const PENSION_RATE = 0.0915;
/** 厚生年金の標準報酬月額上限（円） */
export const PENSION_MAX_MONTHLY_SALARY = 650_000;
/** 健康保険料率（本人負担、全国平均） */
export const HEALTH_INSURANCE_RATE = 0.05;
/** 健康保険の標準報酬月額上限（円） */
export const HEALTH_MAX_MONTHLY_SALARY = 1_390_000;
/** 雇用保険料率（本人負担） */
export const EMPLOYMENT_INSURANCE_RATE = 0.006;
export const SALARY_DEDUCTION_RULES = [
    { upperLimit: 1_625_000, type: 'fixed', fixedAmount: 550_000 },
    { upperLimit: 1_800_000, type: 'formula', rate: 0.4, adjustment: -100_000 },
    { upperLimit: 3_600_000, type: 'formula', rate: 0.3, adjustment: 80_000 },
    { upperLimit: 6_600_000, type: 'formula', rate: 0.2, adjustment: 440_000 },
    { upperLimit: 8_500_000, type: 'formula', rate: 0.1, adjustment: 1_100_000 },
    { upperLimit: Infinity, type: 'fixed', fixedAmount: 1_950_000 }, // 上限
];
export const INCOME_TAX_BRACKETS = [
    { upperLimit: 1_950_000, rate: 0.05, deduction: 0 },
    { upperLimit: 3_300_000, rate: 0.10, deduction: 97_500 },
    { upperLimit: 6_950_000, rate: 0.20, deduction: 427_500 },
    { upperLimit: 9_000_000, rate: 0.23, deduction: 636_000 },
    { upperLimit: 18_000_000, rate: 0.33, deduction: 1_536_000 },
    { upperLimit: 40_000_000, rate: 0.40, deduction: 2_796_000 },
    { upperLimit: Infinity, rate: 0.45, deduction: 4_796_000 },
];
/**
 * デフォルト支出配分（simpleモードで使用）
 */
export const DEFAULT_EXPENSE_ALLOCATION = {
    housing: 0.30,
    living: 0.50,
    other: 0.20,
};

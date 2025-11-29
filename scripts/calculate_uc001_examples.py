#!/usr/bin/env python3
"""
UC-001の具体例の期待値を計算するスクリプト

仕様書 (01_specification_overview.md) に基づいて、
UC-001 (老後までにいくら貯まるか) の期待値を計算します。

重要な前提知識:
1. 給与所得控除: 給与所得者に認められる概算経費
2. 課税所得: 年収から各種控除を引いた、実際に税金がかかる所得
3. 累進課税: 所得が多いほど高い税率が適用される仕組み
4. 社会保険料控除: 支払った社会保険料は全額所得控除の対象
5. 標準報酬月額: 本来は等級テーブルで決まるが、ここでは簡略化
"""

# 定数 (2024年度の制度に基づく)
BASIC_DEDUCTION = 480_000  # 基礎控除
RECONSTRUCTION_TAX_RATE = 0.021  # 復興特別所得税率
RESIDENT_TAX_RATE = 0.10  # 住民税率 (所得割)
RESIDENT_TAX_FLAT = 5_000  # 住民税均等割
PENSION_RATE = 0.0915  # 厚生年金保険料率 (本人負担)
HEALTH_INSURANCE_RATE = 0.05  # 健康保険料率 (本人負担、協会けんぽ東京支部を参考)
EMPLOYMENT_INSURANCE_RATE = 0.006  # 雇用保険料率


def calc_salary_deduction(salary):
    """
    給与所得控除を計算

    給与所得者の概算経費として、年収に応じた控除額が認められる。
    2020年（令和2年）以降の計算式を使用。
    """
    if salary <= 1_625_000:
        return 550_000
    elif salary <= 1_800_000:
        return int(salary * 0.4 - 100_000)
    elif salary <= 3_600_000:
        return int(salary * 0.3 + 80_000)
    elif salary <= 6_600_000:
        return int(salary * 0.2 + 440_000)
    elif salary <= 8_500_000:
        return int(salary * 0.1 + 1_100_000)
    else:
        return 1_950_000  # 上限


def calc_income_tax(taxable_income):
    """
    所得税を計算 (復興特別所得税含む)

    累進課税: 課税所得が多いほど高い税率が適用される。
    復興特別所得税: 東日本大震災の復興財源として、所得税額の2.1%が加算される。
    """
    if taxable_income <= 1_950_000:
        base_tax = taxable_income * 0.05
    elif taxable_income <= 3_300_000:
        base_tax = taxable_income * 0.10 - 97_500
    elif taxable_income <= 6_950_000:
        base_tax = taxable_income * 0.20 - 427_500
    elif taxable_income <= 9_000_000:
        base_tax = taxable_income * 0.23 - 636_000
    elif taxable_income <= 18_000_000:
        base_tax = taxable_income * 0.33 - 1_536_000
    elif taxable_income <= 40_000_000:
        base_tax = taxable_income * 0.40 - 2_796_000
    else:
        base_tax = taxable_income * 0.45 - 4_796_000

    reconstruction_tax = base_tax * RECONSTRUCTION_TAX_RATE  # 復興特別所得税
    return int(base_tax + reconstruction_tax)


def calc_social_insurance(annual_income):
    """
    社会保険料を計算

    簡略化: 年収を12で割った月給に対して保険料率をかける。
    実際には標準報酬月額等級テーブルに基づくが、概算としてこの方法を採用。

    構成:
    - 厚生年金保険料: 老後の年金のための保険
    - 健康保険料: 医療費の自己負担を軽減するための保険
    - 雇用保険料: 失業時の給付のための保険
    """
    monthly_salary = annual_income / 12  # 月給 (簡略化)

    # 厚生年金保険料 (本人負担分)
    pension = monthly_salary * PENSION_RATE * 12

    # 健康保険料 (本人負担分)
    health = monthly_salary * HEALTH_INSURANCE_RATE * 12

    # 雇用保険料
    employment = annual_income * EMPLOYMENT_INSURANCE_RATE

    return int(pension + health + employment)


def simulate_retirement_assets(
    current_age,  # 現在の年齢
    retirement_age,  # 退職年齢
    current_annual_income,  # 現在の年収 (額面)
    income_growth_rate,  # 昇給率 (例: 0.02 = 2%)
    current_savings,  # 現在の貯金額
    savings_rate,  # 貯金率 (例: 0.20 = 20%)
    verbose=False  # 詳細表示するか
):
    """
    退職時の総資産額をシミュレーション

    計算フロー:
    1. 社会保険料を計算 (これが所得控除の対象となる)
    2. 課税所得を計算 (年収 - 給与所得控除 - 基礎控除 - 社会保険料控除)
    3. 所得税・住民税を計算
    4. 手取り収入を計算 (年収 - 税金 - 社会保険料)
    5. 貯金額を計算 (手取り × 貯金率)
    6. 総資産を更新

    Returns:
        dict: {
            'final_age': 退職時年齢,
            'final_total_assets': 退職時総資産,
            'total_years': 運用年数,
            'yearly_records': 年次レコード (verboseがTrueの場合)
        }
    """
    total_assets = current_savings  # 総資産
    annual_income = current_annual_income  # 年収 (額面)
    yearly_records = []  # 年次レコード

    for year_offset in range(retirement_age - current_age):
        age = current_age + year_offset  # 年齢

        # ステップ1: 社会保険料を先に計算 (これが所得控除の対象)
        social_insurance = calc_social_insurance(annual_income)

        # ステップ2: 給与所得控除を計算
        salary_deduction = calc_salary_deduction(annual_income)

        # ステップ3: 課税所得を計算
        # 重要: 社会保険料控除を含める
        taxable_income = annual_income - salary_deduction - BASIC_DEDUCTION - social_insurance

        # 課税所得がマイナスになる場合は0とする
        taxable_income = max(0, taxable_income)

        # ステップ4: 所得税を計算
        income_tax = calc_income_tax(taxable_income)

        # ステップ5: 住民税を計算
        resident_tax = int(taxable_income * RESIDENT_TAX_RATE + RESIDENT_TAX_FLAT)

        # ステップ6: 税金合計
        total_tax = income_tax + resident_tax + social_insurance

        # ステップ7: 手取り収入
        net_income = annual_income - total_tax

        # ステップ8: 年間貯金額
        annual_savings = int(net_income * savings_rate)

        # ステップ9: 総資産を更新
        total_assets += annual_savings

        if verbose:
            yearly_records.append({
                'age': age,
                'annual_income': annual_income,  # 年収 (額面)
                'salary_deduction': salary_deduction,  # 給与所得控除
                'social_insurance': social_insurance,  # 社会保険料 (所得控除の対象)
                'taxable_income': taxable_income,  # 課税所得
                'income_tax': income_tax,  # 所得税 (復興特別所得税含む)
                'resident_tax': resident_tax,  # 住民税
                'total_tax': total_tax,  # 税金合計
                'net_income': net_income,  # 手取り収入
                'annual_savings': annual_savings,  # 年間貯金額
                'total_assets': total_assets,  # 総資産
            })

        # ステップ10: 昇給
        annual_income = int(annual_income * (1 + income_growth_rate))

    result = {
        'final_age': retirement_age,
        'final_total_assets': total_assets,
        'total_years': retirement_age - current_age,
    }

    if verbose:
        result['yearly_records'] = yearly_records

    return result


def print_example(name, description, params, result):
    """具体例を表示"""
    print(f"\n{'=' * 70}")
    print(f"📋 {name}: {description}")
    print(f"{'=' * 70}")
    print(f"\n【入力】")
    print(f"  現在年齢: {params['current_age']}歳")
    print(f"  退職年齢: {params['retirement_age']}歳")
    print(f"  現在年収: {params['current_annual_income']:,}円")
    print(f"  昇給率: {params['income_growth_rate'] * 100}%")
    print(f"  現在貯金: {params['current_savings']:,}円")
    print(f"  貯金率: {params['savings_rate'] * 100}%")
    print(f"\n【出力】")
    print(f"  退職時年齢: {result['final_age']}歳")
    print(f"  退職時総資産: {result['final_total_assets']:,}円")
    print(f"  運用年数: {result['total_years']}年")

    if 'yearly_records' in result:
        print(f"\n【年次詳細 (最初の3年)】")
        for i, record in enumerate(result['yearly_records'][:3]):
            print(f"\n  --- {record['age']}歳 (Year {i + 1}) ---")
            print(f"    年収 (額面): {record['annual_income']:,}円")
            print(f"    給与所得控除: {record['salary_deduction']:,}円")
            print(f"    社会保険料: {record['social_insurance']:,}円 (所得控除)")
            print(f"    課税所得: {record['taxable_income']:,}円")
            print(f"    所得税: {record['income_tax']:,}円")
            print(f"    住民税: {record['resident_tax']:,}円")
            print(f"    税金合計: {record['total_tax']:,}円")
            print(f"    手取り: {record['net_income']:,}円")
            print(f"    年間貯金: {record['annual_savings']:,}円")
            print(f"    総資産: {record['total_assets']:,}円")


def main():
    """UC-001の具体例を計算"""
    print("\n🧮 UC-001: 老後までにいくら貯まるか - 具体例計算")
    print("=" * 70)
    print("\n重要: 社会保険料控除を考慮した正確な計算を実施")
    print("      (年収 - 給与所得控除 - 基礎控除 - 社会保険料 = 課税所得)")

    # ケース1: 基本ケース
    params1 = {
        'current_age': 30,  # 現在年齢
        'retirement_age': 65,  # 退職年齢
        'current_annual_income': 5_000_000,  # 現在年収 (額面)
        'income_growth_rate': 0.02,  # 昇給率 2%
        'current_savings': 1_000_000,  # 現在貯金
        'savings_rate': 0.20,  # 貯金率 20%
    }
    result1 = simulate_retirement_assets(**params1, verbose=True)
    print_example('basic-case', '30歳、年収500万円、貯金率20%、65歳退職', params1, result1)

    # ケース2: 高収入
    params2 = {
        'current_age': 35,
        'retirement_age': 60,
        'current_annual_income': 10_000_000,  # 年収1000万円
        'income_growth_rate': 0.01,  # 昇給率 1%
        'current_savings': 5_000_000,
        'savings_rate': 0.30,  # 貯金率 30%
    }
    result2 = simulate_retirement_assets(**params2)
    print_example('high-income', '高収入ケース: 年収1000万円', params2, result2)

    # ケース3: 境界値 - 最低年齢
    params3 = {
        'current_age': 20,  # 最低年齢
        'retirement_age': 65,
        'current_annual_income': 3_000_000,
        'income_growth_rate': 0.03,  # 昇給率 3%
        'current_savings': 0,  # 貯金ゼロからスタート
        'savings_rate': 0.15,  # 貯金率 15%
    }
    result3 = simulate_retirement_assets(**params3)
    print_example('boundary-min-age', '境界値: 最低年齢20歳', params3, result3)

    # ケース4: 境界値 - 高齢スタート
    params4 = {
        'current_age': 60,  # 60歳スタート
        'retirement_age': 65,
        'current_annual_income': 8_000_000,
        'income_growth_rate': 0.0,  # 昇給なし
        'current_savings': 20_000_000,  # 既に貯金あり
        'savings_rate': 0.40,  # 貯金率 40%
    }
    result4 = simulate_retirement_assets(**params4)
    print_example('boundary-max-age', '境界値: 60歳スタート', params4, result4)

    # ケース5: エッジケース - 昇給率0%
    params5 = {
        'current_age': 40,
        'retirement_age': 65,
        'current_annual_income': 6_000_000,
        'income_growth_rate': 0.0,  # 昇給なし
        'current_savings': 3_000_000,
        'savings_rate': 0.25,  # 貯金率 25%
    }
    result5 = simulate_retirement_assets(**params5)
    print_example('edge-no-growth', 'エッジケース: 昇給率0%', params5, result5)

    # ケース6: エッジケース - 高貯金率
    params6 = {
        'current_age': 25,
        'retirement_age': 60,
        'current_annual_income': 4_000_000,
        'income_growth_rate': 0.025,  # 昇給率 2.5%
        'current_savings': 500_000,
        'savings_rate': 0.50,  # 貯金率 50%
    }
    result6 = simulate_retirement_assets(**params6)
    print_example('edge-high-savings-rate', 'エッジケース: 貯金率50%', params6, result6)

    # ケース7: エッジケース - 短期間
    params7 = {
        'current_age': 55,
        'retirement_age': 60,  # 5年間のみ
        'current_annual_income': 7_000_000,
        'income_growth_rate': 0.0,
        'current_savings': 10_000_000,
        'savings_rate': 0.35,  # 貯金率 35%
    }
    result7 = simulate_retirement_assets(**params7)
    print_example('edge-short-period', 'エッジケース: 5年間のみ', params7, result7)

    # サマリー
    print(f"\n\n{'=' * 70}")
    print(f"📊 計算完了サマリー")
    print(f"{'=' * 70}")
    print(f"\n計算した具体例: 7パターン")
    print(f"  1. basic-case: {result1['final_total_assets']:,}円")
    print(f"  2. high-income: {result2['final_total_assets']:,}円")
    print(f"  3. boundary-min-age: {result3['final_total_assets']:,}円")
    print(f"  4. boundary-max-age: {result4['final_total_assets']:,}円")
    print(f"  5. edge-no-growth: {result5['final_total_assets']:,}円")
    print(f"  6. edge-high-savings-rate: {result6['final_total_assets']:,}円")
    print(f"  7. edge-short-period: {result7['final_total_assets']:,}円")
    print(f"\n次のステップ: これらの値を specs/examples/uc001.examples.ts に記述")
    print()


if __name__ == '__main__':
    main()

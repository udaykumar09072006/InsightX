"""InsightX Analytics & Statistical Testing Module
Computes business KPIs, monthly performance trends, Pareto product distributions,
and rigorous statistical hypothesis testing (Welch's t-test, Gini coefficient).
"""
import csv
import json
import math
import datetime
from pathlib import Path
from collections import defaultdict

from src.config import CLEAN_CSV_PATH, KPI_SUMMARY_PATH, PROCESSED_DATA_DIR


def welchs_t_test(sample1: list[float], sample2: list[float]) -> dict:
    """Performs Welch's two-sample t-test for unequal variances and unequal sample sizes."""
    n1 = len(sample1)
    n2 = len(sample2)
    if n1 < 2 or n2 < 2:
        return {"error": "Insufficient sample size"}

    mean1 = sum(sample1) / n1
    mean2 = sum(sample2) / n2

    var1 = sum((x - mean1) ** 2 for x in sample1) / (n1 - 1)
    var2 = sum((x - mean2) ** 2 for x in sample2) / (n2 - 1)

    se1 = var1 / n1
    se2 = var2 / n2
    se_diff = math.sqrt(se1 + se2)

    if se_diff == 0:
        return {"error": "Zero standard error"}

    t_stat = (mean1 - mean2) / se_diff

    # Welch-Satterthwaite degrees of freedom
    num = (se1 + se2) ** 2
    denom = (se1 ** 2) / (n1 - 1) + (se2 ** 2) / (n2 - 1)
    df = num / denom if denom > 0 else 1.0

    # Two-tailed p-value approximation using normal / Student-t approximation
    # For large df (> 30), standard normal CDF is very close
    z = abs(t_stat)
    # Error function approximation of normal survival
    p_val = math.erfc(z / math.sqrt(2.0))

    # Cohen's d (pooled standard deviation)
    pooled_sd = math.sqrt(((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2))
    cohens_d = (mean1 - mean2) / pooled_sd if pooled_sd > 0 else 0.0

    # 95% Confidence Interval for (mean1 - mean2)
    ci_margin = 1.96 * se_diff
    diff = mean1 - mean2

    return {
        "n1": n1,
        "n2": n2,
        "mean1": round(mean1, 2),
        "mean2": round(mean2, 2),
        "std1": round(math.sqrt(var1), 2),
        "std2": round(math.sqrt(var2), 2),
        "t_statistic": round(t_stat, 4),
        "degrees_of_freedom": round(df, 1),
        "p_value": p_val,
        "p_value_formatted": "< 0.0001" if p_val < 0.0001 else f"{p_val:.4f}",
        "is_significant_alpha_0_05": p_val < 0.05,
        "cohens_d": round(cohens_d, 4),
        "mean_difference": round(diff, 2),
        "ci_95_lower": round(diff - ci_margin, 2),
        "ci_95_upper": round(diff + ci_margin, 2)
    }


def calculate_gini(values: list[float]) -> float:
    """Calculates Gini coefficient of inequality for an array of positive values."""
    sorted_vals = sorted(values)
    n = len(sorted_vals)
    if n == 0 or sum(sorted_vals) == 0:
        return 0.0
    total = sum(sorted_vals)
    cumulative_sum = 0
    gini_sum = 0
    for i, v in enumerate(sorted_vals, 1):
        cumulative_sum += v
        gini_sum += (2 * i - n - 1) * v
    return round(gini_sum / (n * total), 4)


def run_full_analytics():
    """Generates complete aggregated analytics, trends, Pareto breakdown, and tests."""
    print("Computing KPIs, Monthly Trends, Pareto, and Statistical Tests...")

    # Data aggregators
    monthly_stats = defaultdict(lambda: {
        "gross_revenue": 0.0,
        "cancellation_value": 0.0,
        "orders": set(),
        "customers": set(),
        "items_sold": 0,
        "line_count": 0
    })

    product_stats = defaultdict(lambda: {
        "description": "",
        "revenue": 0.0,
        "quantity": 0,
        "orders": set()
    })

    country_stats = defaultdict(lambda: {
        "revenue": 0.0,
        "orders": set(),
        "customers": set(),
        "units": 0
    })

    order_totals = defaultdict(float)
    order_countries = {}
    order_customers = {}
    customer_spend = defaultdict(float)

    total_gross_revenue = 0.0
    total_cancellation_value = 0.0
    all_completed_orders = set()
    all_identified_customers = set()
    total_units_sold = 0

    with open(CLEAN_CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            inv_no = row['invoice_no']
            stock = row['stock_code']
            desc = row['description']
            qty = int(row['quantity'])
            price = float(row['unit_price'])
            line_total = float(row['line_total'])
            status = row['status']
            cust_id = row['customer_id']
            country = row['country']
            m_key = row['invoice_date'][:7]  # YYYY-MM
            is_guest = row['is_guest'] == '1'

            if status == 'COMPLETED':
                total_gross_revenue += line_total
                total_units_sold += qty
                all_completed_orders.add(inv_no)
                order_totals[inv_no] += line_total
                order_countries[inv_no] = country

                if not is_guest and cust_id:
                    all_identified_customers.add(cust_id)
                    order_customers[inv_no] = cust_id
                    customer_spend[cust_id] += line_total

                if m_key:
                    m_entry = monthly_stats[m_key]
                    m_entry["gross_revenue"] += line_total
                    m_entry["orders"].add(inv_no)
                    m_entry["items_sold"] += qty
                    m_entry["line_count"] += 1
                    if not is_guest and cust_id:
                        m_entry["customers"].add(cust_id)

                p_entry = product_stats[stock]
                p_entry["revenue"] += line_total
                p_entry["quantity"] += qty
                p_entry["orders"].add(inv_no)
                if desc and desc != "UNKNOWN DESCRIPTION":
                    p_entry["description"] = desc

                c_entry = country_stats[country]
                c_entry["revenue"] += line_total
                c_entry["orders"].add(inv_no)
                c_entry["units"] += qty
                if not is_guest and cust_id:
                    c_entry["customers"].add(cust_id)

            elif status == 'CANCELLED':
                total_cancellation_value += abs(line_total)
                if m_key:
                    monthly_stats[m_key]["cancellation_value"] += abs(line_total)

    total_orders = len(all_completed_orders)
    aov = round(total_gross_revenue / total_orders, 2) if total_orders else 0.0

    # Monthly Trends with MoM Growth
    sorted_months = sorted(monthly_stats.keys())
    monthly_trend_rows = []
    prev_rev = None

    for m in sorted_months:
        entry = monthly_stats[m]
        rev = round(entry["gross_revenue"], 2)
        orders_cnt = len(entry["orders"])
        m_aov = round(rev / orders_cnt, 2) if orders_cnt else 0.0
        mom_growth = round(((rev - prev_rev) / prev_rev) * 100, 2) if prev_rev else None
        prev_rev = rev

        monthly_trend_rows.append({
            "month": m,
            "gross_revenue": rev,
            "net_revenue": round(rev - entry["cancellation_value"], 2),
            "cancellations_value": round(entry["cancellation_value"], 2),
            "orders": orders_cnt,
            "active_customers": len(entry["customers"]),
            "items_sold": entry["items_sold"],
            "average_order_value": m_aov,
            "mom_growth_pct": mom_growth
        })

    # Save Monthly Trends CSV
    with open(PROCESSED_DATA_DIR / "monthly_trends.csv", 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=[
            "month", "gross_revenue", "net_revenue", "cancellations_value",
            "orders", "active_customers", "items_sold", "average_order_value", "mom_growth_pct"
        ])
        writer.writeheader()
        writer.writerows(monthly_trend_rows)

    # Top Products and Pareto 80/20 Analysis
    sorted_products = sorted(product_stats.items(), key=lambda x: x[1]["revenue"], reverse=True)
    cum_rev = 0.0
    pareto_products = []
    top_20_pct_count = int(len(sorted_products) * 0.2)
    top_20_pct_revenue = 0.0

    for rank, (code, p) in enumerate(sorted_products, 1):
        cum_rev += p["revenue"]
        rev_pct = round((p["revenue"] / total_gross_revenue) * 100, 4) if total_gross_revenue else 0
        cum_pct = round((cum_rev / total_gross_revenue) * 100, 2) if total_gross_revenue else 0

        if rank <= top_20_pct_count:
            top_20_pct_revenue += p["revenue"]

        pareto_products.append({
            "rank": rank,
            "stock_code": code,
            "description": p["description"],
            "revenue": round(p["revenue"], 2),
            "quantity": p["quantity"],
            "orders_count": len(p["orders"]),
            "revenue_share_pct": rev_pct,
            "cumulative_share_pct": cum_pct
        })

    pareto_top_20_share = round((top_20_pct_revenue / total_gross_revenue) * 100, 2) if total_gross_revenue else 0

    # Save Top Products CSV
    with open(PROCESSED_DATA_DIR / "product_performance.csv", 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=[
            "rank", "stock_code", "description", "revenue", "quantity",
            "orders_count", "revenue_share_pct", "cumulative_share_pct"
        ])
        writer.writeheader()
        writer.writerows(pareto_products)

    # Country Performance
    country_list = []
    for c_name, c_data in sorted(country_stats.items(), key=lambda x: x[1]["revenue"], reverse=True):
        rev = round(c_data["revenue"], 2)
        orders_c = len(c_data["orders"])
        country_list.append({
            "country": c_name,
            "revenue": rev,
            "revenue_share_pct": round((rev / total_gross_revenue) * 100, 2) if total_gross_revenue else 0,
            "orders": orders_c,
            "aov": round(rev / orders_c, 2) if orders_c else 0,
            "unique_customers": len(c_data["customers"]),
            "units_sold": c_data["units"]
        })

    with open(PROCESSED_DATA_DIR / "country_performance.csv", 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=[
            "country", "revenue", "revenue_share_pct", "orders", "aov", "unique_customers", "units_sold"
        ])
        writer.writeheader()
        writer.writerows(country_list)

    # Statistical Investigation 1: UK vs International Average Order Value (Welch's t-test)
    uk_aovs = [total for inv, total in order_totals.items() if order_countries.get(inv) == 'United Kingdom' and total > 0]
    intl_aovs = [total for inv, total in order_totals.items() if order_countries.get(inv) != 'United Kingdom' and total > 0]
    welch_res = welchs_t_test(uk_aovs, intl_aovs)

    # Statistical Investigation 2: Customer Revenue Concentration (Gini Coefficient)
    identified_spends = [s for s in customer_spend.values() if s > 0]
    gini_score = calculate_gini(identified_spends)

    # Top 10% Customer Revenue Concentration
    sorted_cust_spends = sorted(identified_spends, reverse=True)
    top_10_pct_cust_count = int(len(sorted_cust_spends) * 0.1)
    top_10_pct_spend = sum(sorted_cust_spends[:top_10_pct_cust_count])
    total_cust_spend = sum(sorted_cust_spends)
    top_10_cust_revenue_share = round((top_10_pct_spend / total_cust_spend) * 100, 2) if total_cust_spend else 0

    # Compile KPI summary JSON
    kpis = {
        "total_gross_revenue": round(total_gross_revenue, 2),
        "total_cancellation_value": round(total_cancellation_value, 2),
        "net_revenue": round(total_gross_revenue - total_cancellation_value, 2),
        "total_orders": total_orders,
        "total_units_sold": total_units_sold,
        "unique_identified_customers": len(all_identified_customers),
        "average_order_value": aov,
        "total_products": len(product_stats),
        "total_countries": len(country_stats),
        "start_date": "2010-12-01",
        "end_date": "2011-12-09",
        "pareto_summary": {
            "top_20_pct_products_share": pareto_top_20_share,
            "top_10_pct_customers_share": top_10_cust_revenue_share,
            "gini_coefficient": gini_score
        },
        "statistical_tests": {
            "uk_vs_international_aov": {
                "name": "Welch's Two-Sample t-test: UK vs International Average Order Value",
                "hypothesis_null": "Average Order Value in United Kingdom is identical to International destinations (mu_UK = mu_Intl).",
                "hypothesis_alt": "Average Order Value differs between United Kingdom and International destinations (mu_UK != mu_Intl).",
                "results": welch_res
            },
            "customer_inequality": {
                "name": "Gini Coefficient of Customer Revenue Distribution",
                "gini_coefficient": gini_score,
                "interpretation": f"A Gini index of {gini_score} denotes high revenue inequality; the top 10% of customers account for {top_10_cust_revenue_share}% of all identified sales."
            }
        },
        "monthly_trends": monthly_trend_rows,
        "top_countries": country_list[:10],
        "top_products": pareto_products[:15]
    }

    with open(KPI_SUMMARY_PATH, 'w', encoding='utf-8') as f:
        json.dump(kpis, f, indent=2)

    print("Analytics & Statistical investigations completed successfully.")
    return kpis


if __name__ == '__main__':
    run_full_analytics()

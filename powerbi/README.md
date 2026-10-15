# Power BI Implementation Guide — InsightX

This guide provides step-by-step instructions to reproduce the **InsightX Executive Analytics & RFM Dashboard** in Power BI Desktop.

> **Environment Note**: Because Power BI Desktop is a Windows-native application requiring GUI installation, this repository provides all data model specifications, dimensional tables, and DAX measures needed to construct the report.

---

## 1. Data Ingestion Steps
1. Open **Power BI Desktop**.
2. Click **Get Data** > **Text/CSV** (or **PostgreSQL database** if connected to an instance).
3. Select and import the 6 processed tables from the `data/processed/` directory:
   - `fact_sales.csv`
   - `dim_date.csv`
   - `dim_product.csv`
   - `dim_customer.csv`
   - `dim_country.csv`
   - `customer_rfm.csv`
4. In the Power Query editor, verify data types:
   - `date_key`: Text
   - `full_date`: Date
   - `line_total`, `unit_price`, `monetary`: Fixed Decimal / Decimal Number
   - `quantity`, `recency`, `frequency`: Whole Number
5. Click **Close & Apply**.

---

## 2. Setting Up Relationships
Navigate to the **Model View** and establish the star schema relationships as documented in `powerbi/data_model.md`:
- Connect `dim_date[date_key]` to `fact_sales[date_key]` (1 to Many, Single)
- Connect `dim_product[stock_code]` to `fact_sales[stock_code]` (1 to Many, Single)
- Connect `dim_customer[customer_id]` to `fact_sales[customer_id]` (1 to Many, Single)
- Connect `dim_country[country]` to `fact_sales[country]` (1 to Many, Single)
- Connect `dim_customer[customer_id]` to `customer_rfm[customer_id]` (1 to 1, Both)

---

## 3. Creating DAX Measures
Create a dedicated measures table called `_Measures`:
1. Enter Data > Name it `_Measures`.
2. Add each DAX measure from `powerbi/measures.md`:
   - `Gross Sales`, `Refunds & Cancellations`, `Net Revenue`, `Return Rate %`
   - `Total Orders`, `Total Units Sold`, `Identified Customers`, `Average Order Value`
   - `Previous Month Sales`, `MoM Sales Growth %`, `YTD Sales`
   - `Repeat Customers`, `Repeat Purchase Rate %`

---

## 4. Report Visual Pages Layout

### Page 1: Executive Overview
- **Header**: InsightX Executive E-Commerce Overview (Filter by Date Range, Country).
- **KPI Cards**: Gross Sales (£10.64M), Completed Orders (19,960), Total Units (5.57M), AOV (£533.17), Identified Customers (4,338).
- **Line and Clustered Column Chart**: Gross Revenue & MoM Growth % by Month (`dim_date[month_name]`).
- **Donut / Bar Chart**: Revenue Contribution by Country (`dim_country[country]`).
- **Table Visual**: Top 10 Products by Revenue.

### Page 2: Sales & Product Performance
- **Pareto Chart**: Cumulative Revenue Share by Product Rank.
- **Scatter Plot**: Units Sold vs Average Unit Price.
- **Matrix Visual**: Product Category / Descriptions with gross sales, unit counts, and return rates.

### Page 3: Customer Intelligence & RFM
- **Treemap / Matrix**: RFM Segment distribution (`Champions`, `Loyal`, `At Risk`, `Hibernating`).
- **Bar Chart**: Revenue Contribution % by Segment.
- **Scatter Plot**: Recency (Days) vs Frequency (Orders) with bubble size representing Monetary spend.

### Page 4: Cohort Retention Matrix
- **Matrix Visual**:
  - Rows: `Cohort Month` (YYYY-MM)
  - Columns: `Period Offset` (0 to 12)
  - Values: `Retention Rate %`
  - Conditional Formatting: Background color scale (White to Deep Slate Blue).

### Page 5: Data Quality & Methodology
- Cards for Duplicates Purged (5,268), Cancellations Audited (9,251), and Missing Customer IDs Handled (135,080).
- Detailed methodology text box documenting transaction inclusion policies.

# InsightX — Data Quality & Integrity Report

## 1. Raw Dataset Profile
- **Source**: UCI Machine Learning Repository (Online Retail, Donation Date: 2015, DOI: 10.24432/C5BW33).
- **Format**: Microsoft Excel OpenXML Workbook (`Online Retail.xlsx`, 23.7 MB).
- **Date Range**: December 1, 2010 08:26 to December 9, 2011 12:50.
- **Total Ingested Records**: 541,909 rows.

## 2. Anomalies Audited & Resolution Matrix

| Anomaly Type | Row Count | % of Raw Data | Handling Policy | Business / Analytical Impact |
|:---|:---|:---|:---|:---|
| **Exact Duplicates** | 5,268 | 0.97% | Purged during cleaning | Prevents artificial inflation of volume and double-counting of invoices. |
| **Missing CustomerID** | 135,080 | 24.93% | Preserved and tagged as `GUEST` / `is_guest=1` | Retained in macro revenue, country, and product reports (£1.75M gross sales); excluded from RFM and Cohorts. |
| **Cancellations (Invoice starts with 'C')** | 9,251 | 1.71% | Tagged as `status='CANCELLED'`, line total treated as refund | Tracked separately to report Net Revenue (£10.18M) and refund rate (4.34%). |
| **Damaged / Negative Quantity Adjustments** | 1,336 | 0.25% | Tagged as `status='ADJUSTMENT'` | Purged from sales metrics (internal stock reconciliations and damaged inventory write-offs). |
| **Zero / Negative Unit Price Lines** | 2,515 | 0.46% | Tagged as `status='ADJUSTMENT'` | Free promotional items, bad debt write-offs, or administrative logs (e.g., 'amazon fee', 'adjust bad debt'). |
| **Missing Product Descriptions** | 1,454 | 0.27% | Replaced with `'UNKNOWN DESCRIPTION'` | Product code retained for SKU tally; flag highlighted in catalog audit. |

## 3. Reconciliation Between Raw & Clean Data

| Metric | Raw Extraction | Transformed Fact Sales | Difference / Reason |
|:---|:---|:---|:---|
| Total Lines | 541,909 | 536,641 | -5,268 rows (purged exact duplicates) |
| Completed Sales Lines | N/A | 524,878 | Positive volume, non-cancelled, unit price > 0 |
| Cancellation Lines | N/A | 9,251 | Legitimate customer return transactions |
| Operational Adjustments | N/A | 2,512 | Stock corrections, damages, system logs |
| Gross Sales Volume | £10,642,110.80 | £10,642,110.80 | Exactly reconciled (0.00 variance) |
| Cancellation Value | £461,844.20 | £461,844.20 | Exactly reconciled (0.00 variance) |
| Net Revenue | £10,180,266.60 | £10,180,266.60 | Exactly reconciled (0.00 variance) |

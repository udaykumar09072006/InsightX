"""InsightX Python Metric Registry
Approved business metrics and dataset boundary declarations.
"""
from typing import Dict, Any

METRIC_REGISTRY: Dict[str, Dict[str, Any]] = {
    "gross_sales": {
        "id": "gross_sales",
        "name": "Gross Sales Revenue",
        "category": "Financial",
        "description": "Total revenue recognized from valid completed order lines (quantity > 0, unit_price > 0).",
        "sqlExpression": "ROUND(SUM(line_total), 2)",
        "requiredTables": ["fact_sales"],
        "defaultFilters": ["status = 'COMPLETED'"],
        "unit": "£ (GBP)",
        "limitations": "Product cost (COGS) is not recorded in the dataset."
    },
    "net_revenue": {
        "id": "net_revenue",
        "name": "Net Realized Revenue",
        "category": "Financial",
        "description": "Gross Sales minus Cancellation Refunds and return credit notes.",
        "sqlExpression": "ROUND(SUM(CASE WHEN status = 'COMPLETED' THEN line_total ELSE 0 END) - SUM(CASE WHEN status = 'CANCELLED' THEN ABS(line_total) ELSE 0 END), 2)",
        "requiredTables": ["fact_sales"],
        "defaultFilters": ["status IN ('COMPLETED', 'CANCELLED')"],
        "unit": "£ (GBP)",
        "limitations": "Assumes cancellations in period net against the trade window."
    },
    "total_orders": {
        "id": "total_orders",
        "name": "Completed Orders Count",
        "category": "Volume",
        "description": "Distinct count of unique completed invoice identifiers.",
        "sqlExpression": "COUNT(DISTINCT invoice_no)",
        "requiredTables": ["fact_sales"],
        "defaultFilters": ["status = 'COMPLETED'"],
        "unit": "Invoices",
        "limitations": "Multiple line items in an invoice are grouped into 1 order."
    },
    "average_order_value": {
        "id": "average_order_value",
        "name": "Average Order Value (AOV)",
        "category": "Volume",
        "description": "Gross Sales Revenue divided by Total Completed Orders.",
        "sqlExpression": "ROUND(SUM(line_total) / NULLIF(COUNT(DISTINCT invoice_no), 0), 2)",
        "requiredTables": ["fact_sales"],
        "defaultFilters": ["status = 'COMPLETED'"],
        "unit": "£ / Order",
        "limitations": "Wholesale bulk orders skew international AOV substantially above UK domestic."
    }
}

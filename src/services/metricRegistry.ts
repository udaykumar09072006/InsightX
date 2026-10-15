/**
 * InsightX Approved Metric Registry
 * Defines standardized, auditable business metrics, formulas, required tables,
 * and analytical limitations.
 */

export interface MetricDefinition {
  id: string;
  name: string;
  category: 'Financial' | 'Volume' | 'Customer' | 'Product' | 'Retention';
  description: string;
  sqlExpression: string;
  requiredTables: string[];
  defaultFilters: string[];
  aggregationGrain: string;
  unit: string;
  limitations: string;
}

export const METRIC_REGISTRY: Record<string, MetricDefinition> = {
  gross_sales: {
    id: 'gross_sales',
    name: 'Gross Sales Revenue',
    category: 'Financial',
    description: 'Total revenue recognized from valid completed order lines (quantity > 0, unit_price > 0).',
    sqlExpression: "ROUND(SUM(line_total), 2)",
    requiredTables: ['fact_sales'],
    defaultFilters: ["status = 'COMPLETED'"],
    aggregationGrain: 'Line Item / Order / Time Period',
    unit: '£ (GBP)',
    limitations: 'Does not deduct customer return credits; product cost (COGS) is not recorded in the dataset.'
  },
  net_revenue: {
    id: 'net_revenue',
    name: 'Net Realized Revenue',
    category: 'Financial',
    description: 'Gross Sales minus Cancellation Refunds and return credit notes.',
    sqlExpression: "ROUND(SUM(CASE WHEN status = 'COMPLETED' THEN line_total ELSE 0 END) - SUM(CASE WHEN status = 'CANCELLED' THEN ABS(line_total) ELSE 0 END), 2)",
    requiredTables: ['fact_sales'],
    defaultFilters: ["status IN ('COMPLETED', 'CANCELLED')"],
    aggregationGrain: 'Order / Period',
    unit: '£ (GBP)',
    limitations: 'Assumes all cancellation records in the period belong to the net accounting window.'
  },
  cancellations_refunds: {
    id: 'cancellations_refunds',
    name: 'Cancellations & Refunds Value',
    category: 'Financial',
    description: 'Total financial value of invoices starting with C representing customer returns or cancellations.',
    sqlExpression: "ROUND(SUM(ABS(line_total)), 2)",
    requiredTables: ['fact_sales'],
    defaultFilters: ["status = 'CANCELLED'"],
    aggregationGrain: 'Line Item / Invoice',
    unit: '£ (GBP)',
    limitations: 'Covers transactions marked with C prefix; damaged inventory write-offs without C are classified as operational adjustments.'
  },
  total_orders: {
    id: 'total_orders',
    name: 'Completed Orders Count',
    category: 'Volume',
    description: 'Distinct count of unique completed invoice identifiers.',
    sqlExpression: "COUNT(DISTINCT invoice_no)",
    requiredTables: ['fact_sales'],
    defaultFilters: ["status = 'COMPLETED'"],
    aggregationGrain: 'Order Level',
    unit: 'Invoices',
    limitations: 'Multiple items on the same invoice are counted as a single order.'
  },
  units_sold: {
    id: 'units_sold',
    name: 'Physical Units Sold',
    category: 'Volume',
    description: 'Sum of physical product quantities fulfilled in completed orders.',
    sqlExpression: "SUM(quantity)",
    requiredTables: ['fact_sales'],
    defaultFilters: ["status = 'COMPLETED'"],
    aggregationGrain: 'Product Line Level',
    unit: 'Units',
    limitations: 'Excludes negative quantities from returns, damages, or inventory write-offs.'
  },
  average_order_value: {
    id: 'average_order_value',
    name: 'Average Order Value (AOV)',
    category: 'Volume',
    description: 'Gross Sales Revenue divided by Total Completed Orders.',
    sqlExpression: "ROUND(SUM(line_total) / NULLIF(COUNT(DISTINCT invoice_no), 0), 2)",
    requiredTables: ['fact_sales'],
    defaultFilters: ["status = 'COMPLETED'"],
    aggregationGrain: 'Order Level',
    unit: '£ / Order',
    limitations: 'Subject to wholesale order volume skew; international wholesale orders average substantially higher baskets than UK domestic retail.'
  },
  identified_customers: {
    id: 'identified_customers',
    name: 'Unique Identified Customers',
    category: 'Customer',
    description: 'Distinct count of verified registered customer identifiers (excluding anonymous guest checkouts).',
    sqlExpression: "COUNT(DISTINCT customer_id)",
    requiredTables: ['fact_sales'],
    defaultFilters: ["status = 'COMPLETED'", "customer_id <> 'GUEST'", "customer_id IS NOT NULL"],
    aggregationGrain: 'Customer Account',
    unit: 'Customers',
    limitations: 'Approximately 24.9% of transactions lack a CustomerID and are classified as GUEST checkouts.'
  },
  repeat_purchase_rate: {
    id: 'repeat_purchase_rate',
    name: 'Repeat Purchase Rate %',
    category: 'Retention',
    description: 'Proportion of identified customers with two or more completed orders over their lifetime.',
    sqlExpression: "ROUND((COUNT(DISTINCT CASE WHEN total_orders >= 2 THEN customer_id END) * 100.0 / NULLIF(COUNT(DISTINCT customer_id), 0)), 2)",
    requiredTables: ['dim_customer'],
    defaultFilters: ["customer_id <> 'GUEST'"],
    aggregationGrain: 'Customer Base',
    unit: '%',
    limitations: 'Evaluates identified customers only; guest checkouts cannot be tracked for repurchase intervals.'
  }
};

export const APPROVED_TABLES = [
  'fact_sales',
  'dim_date',
  'dim_customer',
  'dim_product',
  'dim_country',
  'customer_rfm'
];

export const DATASET_BOUNDS = {
  startDate: '2010-12-01',
  endDate: '2011-12-09',
  totalRawRows: 541909,
  cleanRows: 536641,
  currency: 'GBP (£)',
  citation: 'Chen, D. (2015). Online Retail [Dataset]. UCI Machine Learning Repository. DOI: 10.24432/C5BW33'
};

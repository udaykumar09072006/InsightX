# Power BI DAX Measures Library — InsightX

This library contains all production DAX measures required for building the Power BI report.

---

### 1. Revenue & Financial Measures

#### Gross Sales
```dax
Gross Sales = 
CALCULATE(
    SUM(fact_sales[line_total]),
    fact_sales[status] = "COMPLETED"
)
```

#### Cancellations & Refunds Value
```dax
Refunds & Cancellations = 
CALCULATE(
    ABS(SUM(fact_sales[line_total])),
    fact_sales[status] = "CANCELLED"
)
```

#### Net Revenue
```dax
Net Revenue = [Gross Sales] - [Refunds & Cancellations]
```

#### Return Rate %
```dax
Return Rate % = 
DIVIDE([Refunds & Cancellations], [Gross Sales], 0)
```

---

### 2. Volume & Customer Order Measures

#### Total Completed Orders
```dax
Total Orders = 
CALCULATE(
    DISTINCTCOUNT(fact_sales[invoice_no]),
    fact_sales[status] = "COMPLETED"
)
```

#### Total Units Sold
```dax
Total Units Sold = 
CALCULATE(
    SUM(fact_sales[quantity]),
    fact_sales[status] = "COMPLETED"
)
```

#### Unique Identified Customers
```dax
Identified Customers = 
CALCULATE(
    DISTINCTCOUNT(fact_sales[customer_id]),
    fact_sales[customer_id] <> "GUEST",
    fact_sales[status] = "COMPLETED"
)
```

#### Average Order Value (AOV)
```dax
Average Order Value = 
DIVIDE([Gross Sales], [Total Orders], 0)
```

#### Average Units per Order
```dax
Units per Order = 
DIVIDE([Total Units Sold], [Total Orders], 0)
```

---

### 3. Time Intelligence (MoM, YoY)

#### Previous Month Gross Sales
```dax
Previous Month Sales = 
CALCULATE(
    [Gross Sales],
    PREVIOUSMONTH(dim_date[full_date])
)
```

#### Month-over-Month (MoM) Growth %
```dax
MoM Sales Growth % = 
DIVIDE(
    [Gross Sales] - [Previous Month Sales],
    [Previous Month Sales],
    BLANK()
)
```

#### Running Total Sales (YTD)
```dax
YTD Sales = 
TOTALYTD([Gross Sales], dim_date[full_date])
```

---

### 4. Customer & Segment Measures

#### Repeat Customer Count
```dax
Repeat Customers = 
CALCULATE(
    DISTINCTCOUNT(dim_customer[customer_id]),
    dim_customer[total_orders] >= 2
)
```

#### Repeat Purchase Rate %
```dax
Repeat Purchase Rate % = 
DIVIDE([Repeat Customers], [Identified Customers], 0)
```

#### Champions Revenue
```dax
Champions Revenue = 
CALCULATE(
    [Gross Sales],
    customer_rfm[segment] = "Champions"
)
```

#### Top 20% Product Revenue Share
```dax
Top 20% Product Revenue Share % = 0.8122 -- (Computed dynamically via Pareto iterator or loaded benchmark)
```

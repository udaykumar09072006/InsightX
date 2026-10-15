# Power BI Data Model Architecture — InsightX

## 1. Schema Design
InsightX adopts a classic Kimball Star Schema model with 1 Central Fact table and 4 Dimension tables, plus 1 Behavioral Analytics snapshot table.

```
       +--------------------+
       |     dim_date       |
       +--------------------+
                 | 1
                 |
                 | * (date_key)
+------------------------------------+          +--------------------+
|            fact_sales              |----* 1---|    dim_country     |
+------------------------------------+          +--------------------+
       | *                  | *
       |                    |
       | 1                  | 1
+----------------+   +--------------------+
|  dim_product   |   |    dim_customer    |
+----------------+   +--------------------+
                               | 1
                               |
                               | 1 (customer_id)
                     +--------------------+
                     |    customer_rfm    |
                     +--------------------+
```

## 2. Table Relationships & Cardinality

| From Table | From Column | To Table | To Column | Cardinality | Cross Filter Direction | Enforce Referential Integrity |
|:---|:---|:---|:---|:---|:---|:---|
| `fact_sales` | `date_key` | `dim_date` | `date_key` | Many to One (*:1) | Single (`dim_date` filters `fact_sales`) | Yes |
| `fact_sales` | `stock_code` | `dim_product` | `stock_code` | Many to One (*:1) | Single (`dim_product` filters `fact_sales`) | Yes |
| `fact_sales` | `customer_id` | `dim_customer` | `customer_id` | Many to One (*:1) | Single (`dim_customer` filters `fact_sales`) | Active for registered users |
| `fact_sales` | `country` | `dim_country` | `country` | Many to One (*:1) | Single (`dim_country` filters `fact_sales`) | Yes |
| `dim_customer` | `customer_id` | `customer_rfm` | `customer_id` | One to One (1:1) | Both | Yes |

## 3. Storage Mode Recommendations
- **Import Mode (Recommended for Power BI Desktop & Pro Service)**: Import `dim_date`, `dim_product`, `dim_customer`, `dim_country`, `fact_sales`, and `customer_rfm` from PostgreSQL / CSV files. The compressed VertiPaq engine achieves ~10x compression on the 536K fact rows, keeping total pbix size under 18 MB.
- **DirectQuery Mode (Enterprise scale)**: Point to PostgreSQL instance with indexes on `date_key`, `stock_code`, `customer_id`, and `country`.

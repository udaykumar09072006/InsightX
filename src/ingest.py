"""InsightX Data Ingestion Module
Extracts raw data from UCI Online Retail archive and converts to standard CSV format.
"""
import zipfile
import xml.etree.ElementTree as ET
import datetime
import csv
import re
import sys
from pathlib import Path

from src.config import RAW_XLSX_PATH, RAW_ZIP_PATH, RAW_CSV_PATH, RAW_DATA_DIR

COL_MAP = {'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5, 'G': 6, 'H': 7}
COL_NAMES = ['InvoiceNo', 'StockCode', 'Description', 'Quantity', 'InvoiceDate', 'UnitPrice', 'CustomerID', 'Country']


def excel_date_to_datetime_str(serial_float: float) -> str:
    """Converts Excel floating point date to ISO datetime string.
    Excel uses 1899-12-30 as base day due to 1900 leap year bug.
    """
    try:
        base = datetime.datetime(1899, 12, 30)
        delta = datetime.timedelta(days=serial_float)
        dt = base + delta
        return dt.strftime('%Y-%m-%d %H:%M:%S')
    except Exception:
        return ""


def extract_raw_data() -> dict:
    """Streams Online Retail.xlsx into data/raw/online_retail_raw.csv and returns raw statistics."""
    if not RAW_XLSX_PATH.exists() and RAW_ZIP_PATH.exists():
        print(f"Unzipping {RAW_ZIP_PATH} to {RAW_DATA_DIR}...")
        with zipfile.ZipFile(RAW_ZIP_PATH) as z:
            z.extractall(RAW_DATA_DIR)

    if not RAW_XLSX_PATH.exists():
        raise FileNotFoundError(f"Missing dataset at {RAW_XLSX_PATH}")

    print(f"Parsing shared strings from {RAW_XLSX_PATH.name}...")
    shared_strings = []
    with zipfile.ZipFile(RAW_XLSX_PATH) as z:
        with z.open('xl/sharedStrings.xml') as f:
            for _, elem in ET.iterparse(f):
                if elem.tag.endswith('}t'):
                    shared_strings.append(elem.text or '')
                elif elem.tag.endswith('}si'):
                    elem.clear()

    print(f"Loaded {len(shared_strings)} shared strings. Parsing worksheet...")

    total_rows = 0
    null_customer_count = 0
    null_desc_count = 0

    col_pattern = re.compile(r'([A-Z]+)(\d+)')

    with zipfile.ZipFile(RAW_XLSX_PATH) as z, open(RAW_CSV_PATH, 'w', newline='', encoding='utf-8') as out_f:
        writer = csv.writer(out_f)
        writer.writerow(COL_NAMES)

        with z.open('xl/worksheets/sheet1.xml') as f:
            for _, elem in ET.iterparse(f):
                if elem.tag.endswith('}row'):
                    row_data = [''] * 8
                    for c in elem:
                        cell_ref = c.get('r', '')
                        m = col_pattern.match(cell_ref)
                        if not m:
                            continue
                        col_letter = m.group(1)
                        if col_letter not in COL_MAP:
                            continue
                        idx = COL_MAP[col_letter]

                        t = c.get('t')
                        v_elem = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                        raw_val = v_elem.text if v_elem is not None else ''

                        if t == 's' and raw_val:
                            try:
                                val = shared_strings[int(raw_val)]
                            except (IndexError, ValueError):
                                val = raw_val
                        else:
                            val = raw_val

                        # Date conversion for column E (InvoiceDate)
                        if idx == 4 and val:
                            try:
                                num = float(val)
                                val = excel_date_to_datetime_str(num)
                            except ValueError:
                                pass
                        # Customer ID formatting: strip trailing .0 if integer
                        elif idx == 6 and val:
                            try:
                                f_cid = float(val)
                                if f_cid.is_integer():
                                    val = str(int(f_cid))
                            except ValueError:
                                pass

                        row_data[idx] = val

                    # Skip header row if it matches COL_NAMES
                    if row_data[0] == 'InvoiceNo':
                        elem.clear()
                        continue

                    # Count anomalies
                    if not row_data[6]:
                        null_customer_count += 1
                    if not row_data[2]:
                        null_desc_count += 1

                    writer.writerow(row_data)
                    total_rows += 1
                    elem.clear()

                    if total_rows % 100000 == 0:
                        print(f"Processed {total_rows} rows...")

    stats = {
        "total_raw_rows": total_rows,
        "null_customer_count": null_customer_count,
        "null_customer_pct": round((null_customer_count / total_rows) * 100, 2) if total_rows else 0,
        "null_desc_count": null_desc_count,
        "raw_csv_path": str(RAW_CSV_PATH)
    }
    print(f"Extraction complete: {total_rows} rows written to {RAW_CSV_PATH}.")
    print(f"Missing Customer IDs: {null_customer_count} ({stats['null_customer_pct']}%)")
    return stats


if __name__ == '__main__':
    extract_raw_data()

/**
 * Shared Type Definitions for InsightX Copilot & Analytics
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

export interface ChartSpecification {
  type: 'line' | 'bar' | 'horizontal_bar' | 'pie' | 'kpi' | 'table';
  x?: string;
  y?: string;
  series?: string;
  title?: string;
}

export interface CopilotQueryRequest {
  question: string;
  filters?: {
    start_date?: string | null;
    end_date?: string | null;
    countries?: string[];
  };
  chart_preference?: string;
}

export interface CopilotQueryResponse {
  request_id: string;
  status: 'success' | 'clarification' | 'unsupported' | 'error';
  question: string;
  summary: string;
  sql: string;
  columns: string[];
  rows: any[];
  chart: ChartSpecification;
  metric_definitions: MetricDefinition[];
  filters_applied: Record<string, any>;
  data_period: {
    start: string;
    end: string;
    note?: string;
  };
  warnings: string[];
  row_count: number;
  execution_ms: number;
}

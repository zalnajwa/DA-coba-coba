import { ReportFilter } from '../types';

export function exportToCSV(data: any[], _filename?: string): string {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => `"${row[h]}"`).join(','));
  return [headers.join(','), ...rows].join('\n');
}

export function exportIncomeStatement(_filter: ReportFilter): string {
  // Logic
  return '';
}

export function exportBalanceSheet(_asOfDate: Date): string {
  // Logic
  return '';
}

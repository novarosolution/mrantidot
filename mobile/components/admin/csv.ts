import { Platform } from 'react-native';
import { shareTextFile, type ShareTextFileResult } from '@/lib/shareFile';

/** CSV text for admin exports (reports, payroll). Excel-friendly: BOM, CRLF, quoted cells. */

export type CsvValue = string | number | boolean | null | undefined;

export function csvCell(value: CsvValue): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function csvRows(headers: string[], rows: CsvValue[][]): string {
  return [headers, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
}

/** Several titled tables in one file, separated by a blank line (opens cleanly in Excel / Sheets). */
export function csvSections(sections: { title?: string; headers: string[]; rows: CsvValue[][] }[]): string {
  return sections
    .map((s) => (s.title ? `${csvCell(s.title)}\r\n${csvRows(s.headers, s.rows)}` : csvRows(s.headers, s.rows)))
    .join('\r\n\r\n');
}

/** Web: downloads `filename`; phones: the share sheet with the CSV text. */
export function shareCsv(filename: string, content: string, title?: string): Promise<ShareTextFileResult> {
  // The BOM makes Excel read the download as UTF-8 (₹, names); the share sheet gets plain text.
  const body = Platform.OS === 'web' ? `\uFEFF${content}` : content;
  return shareTextFile({ filename, title: title ?? filename, mimeType: 'text/csv', content: body });
}

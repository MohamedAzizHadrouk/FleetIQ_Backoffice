import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// TUNAV Bleu Royal (RVB 8, 72, 254) – en-tête des exports PDF (migration-map §6)
export const PDF_HEAD_FILL_COLOR: [number, number, number] = [8, 72, 254];

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportTableToExcel(
  headers: readonly string[],
  rows: string[][],
  sheetName: string,
  filename: string
) {
  const sheet = XLSX.utils.aoa_to_sheet([[...headers], ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  downloadBlob(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }),
    filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`
  );
}

export function exportTableToPdf(
  title: string,
  headers: readonly string[],
  rows: string[][],
  filename: string
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  doc.setFontSize(14);
  doc.text(title, 40, 36);
  doc.setFontSize(10);
  doc.text(`Exporté le ${new Date().toLocaleString('fr-FR')}`, 40, 52);

  autoTable(doc, {
    startY: 64,
    head: [headers as unknown as string[]],
    body: rows,
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: PDF_HEAD_FILL_COLOR }
  });

  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

/** Export CSV (séparateur « ; », UTF-8 avec BOM : s'ouvre directement dans Excel) – carte FleetIQ 10. */
export function exportTableToCsv(headers: readonly string[], rows: string[][], filename: string) {
  const cell = (v: string) => (/[";\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const text = [headers, ...rows].map((r) => r.map((v) => cell(String(v ?? ''))).join(';')).join('\r\n');
  downloadBlob(new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' }), filename.endsWith('.csv') ? filename : `${filename}.csv`);
}

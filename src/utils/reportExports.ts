import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import tacomLogo from '@/assets/tacom-logo.png';

export type Row = (string | number)[];

// Red do sistema (HSL 0 84% 60%)
const SYSTEM_RED: [number, number, number] = [232, 62, 62];
const SYSTEM_RED_DARK: [number, number, number] = [180, 35, 35];

let cachedLogo: HTMLImageElement | null = null;
const loadLogo = (): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    if (cachedLogo) return resolve(cachedLogo);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      cachedLogo = img;
      resolve(img);
    };
    img.onerror = reject;
    img.src = tacomLogo;
  });

export interface ExportOptions {
  title: string;
  fileName: string; // sem extensão
  headers: string[];
  rows: Row[];
  /** Larguras opcionais (mm) para colunas no PDF */
  columnWidths?: number[];
  /** Orientação do PDF */
  orientation?: 'p' | 'l';
  /** Cor do header (RGB). Default cinza */
  headerColor?: [number, number, number];
  /** Cor do total (RGB). Default cinza escuro */
  totalColor?: [number, number, number];
  /** Linha extra de total (já formatada) */
  totalRow?: Row;
}

const csvEscape = (v: string | number) => {
  const s = String(v ?? '');
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

export const exportCSV = ({ fileName, headers, rows, totalRow }: ExportOptions) => {
  const lines = [headers.map(csvEscape).join(';')];
  rows.forEach(r => lines.push(r.map(csvEscape).join(';')));
  if (totalRow) lines.push(totalRow.map(csvEscape).join(';'));
  const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportXLSX = ({ title, fileName, headers, rows, totalRow }: ExportOptions) => {
  const data: any[][] = [headers, ...rows];
  if (totalRow) data.push(totalRow);
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, title.substring(0, 30));
  XLSX.writeFile(wb, `${fileName}.xlsx`);
};

export const exportPDF = (opts: ExportOptions) => {
  const {
    title,
    fileName,
    headers,
    rows,
    columnWidths,
    orientation = 'l',
    headerColor = [110, 110, 110],
    totalColor = [80, 80, 80],
    totalRow,
  } = opts;

  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(headerColor[0], headerColor[1], headerColor[2]);
  doc.rect(0, 0, pageW, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text(title.toUpperCase(), pageW / 2, 12, { align: 'center' });

  const columnStyles: Record<number, any> = {};
  if (columnWidths) {
    columnWidths.forEach((w, i) => {
      columnStyles[i] = { cellWidth: w };
    });
  }

  autoTable(doc, {
    head: [headers],
    body: rows.map(r => r.map(c => String(c ?? ''))),
    foot: totalRow ? [totalRow.map(c => String(c ?? ''))] : undefined,
    startY: 24,
    margin: { left: 8, right: 8 },
    styles: { fontSize: 8, cellPadding: 1.5, overflow: 'linebreak' },
    headStyles: {
      fillColor: headerColor,
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
    },
    footStyles: {
      fillColor: totalColor,
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles,
    didDrawPage: (data) => {
      const pageNo = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(110, 110, 110);
      doc.text(
        `Página ${data.pageNumber} de ${pageNo}`,
        pageW - 8,
        doc.internal.pageSize.getHeight() - 5,
        { align: 'right' }
      );
      doc.text(
        `Gerado em ${new Date().toLocaleString('pt-BR')}`,
        8,
        doc.internal.pageSize.getHeight() - 5
      );
    },
  });

  doc.save(`${fileName}.pdf`);
};

export const printReport = ({ title, headers, rows, totalRow }: ExportOptions) => {
  const win = window.open('', '_blank', 'width=1024,height=768');
  if (!win) return;
  const head = headers.map(h => `<th>${h}</th>`).join('');
  const body = rows
    .map(
      r =>
        `<tr>${r
          .map(c => `<td>${String(c ?? '').replace(/</g, '&lt;')}</td>`)
          .join('')}</tr>`
    )
    .join('');
  const foot = totalRow
    ? `<tfoot><tr>${totalRow
        .map(c => `<th>${String(c ?? '')}</th>`)
        .join('')}</tr></tfoot>`
    : '';

  win.document.write(`<!doctype html><html><head><meta charset="utf-8" />
  <title>${title}</title>
  <style>
    body{font-family:Arial,sans-serif;padding:16px;color:#222}
    h1{font-size:18px;margin:0 0 12px}
    table{width:100%;border-collapse:collapse;font-size:11px}
    th,td{border:1px solid #888;padding:4px 6px;text-align:left}
    thead th{background:#6e6e6e;color:#fff}
    tfoot th{background:#505050;color:#fff}
    tbody tr:nth-child(even){background:#f5f5f5}
    @media print{button{display:none}}
  </style></head><body>
  <h1>${title}</h1>
  <button onclick="window.print()">Imprimir</button>
  <table><thead><tr>${head}</tr></thead><tbody>${body}</tbody>${foot}</table>
  <script>window.onload=()=>setTimeout(()=>window.print(),300)</script>
  </body></html>`);
  win.document.close();
};

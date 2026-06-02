import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, FileSpreadsheet, Printer, Download } from 'lucide-react';
import {
  exportCSV,
  exportXLSX,
  exportPDF,
  printReport,
  ExportOptions,
} from '@/utils/reportExports';

interface Props {
  /** Função chamada no momento do clique para coletar os dados atuais filtrados */
  getData: () => ExportOptions;
  className?: string;
}

const ReportExportBar: React.FC<Props> = ({ getData, className }) => {
  const wrap = (fn: (o: ExportOptions) => void) => () => {
    try {
      fn(getData());
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className || ''}`}>
      <Button variant="outline" size="sm" onClick={wrap(exportCSV)}>
        <Download className="h-4 w-4 mr-1" /> CSV
      </Button>
      <Button variant="outline" size="sm" onClick={wrap(exportXLSX)}>
        <FileSpreadsheet className="h-4 w-4 mr-1" /> XLSX
      </Button>
      <Button variant="outline" size="sm" onClick={wrap(exportPDF)}>
        <FileText className="h-4 w-4 mr-1" /> PDF
      </Button>
      <Button variant="outline" size="sm" onClick={wrap(printReport)}>
        <Printer className="h-4 w-4 mr-1" /> Imprimir
      </Button>
    </div>
  );
};

export default ReportExportBar;

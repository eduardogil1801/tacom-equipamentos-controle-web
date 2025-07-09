import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText, File } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface Equipment {
  id: string;
  numero_serie: string;
  tipo: string;
  modelo?: string;
  estado?: string;
  status?: string;
  data_entrada: string;
  data_saida?: string;
  id_empresa: string;
  empresas?: {
    name: string;
    estado?: string;
  };
}

interface EquipmentExportProps {
  data: Equipment[];
}

const EquipmentExport: React.FC<EquipmentExportProps> = ({ data }) => {
  const formatStatusForExport = (status?: string) => {
    switch (status) {
      case 'disponivel': return 'Disponível';
      case 'manutencao': return 'Manutenção';
      case 'em_uso': return 'Em Uso';
      case 'aguardando_manutencao': return 'Aguardando Manutenção';
      case 'danificado': return 'Danificado';
      case 'indisponivel': return 'Indisponível';
      default: return status || 'N/A';
    }
  };

  const formatDateForExport = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  const prepareDataForExport = () => {
    return data.map(equipment => ({
      'Número de Série': equipment.numero_serie,
      'Tipo': equipment.tipo,
      'Modelo': equipment.modelo || '-',
      'Empresa': equipment.empresas?.name || 'N/A',
      'Estado': equipment.empresas?.estado || equipment.estado || '-',
      'Status': formatStatusForExport(equipment.status),
      'Data de Entrada': formatDateForExport(equipment.data_entrada)
    }));
  };

  const exportToExcel = () => {
    const exportData = prepareDataForExport();
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    
    // Ajustar largura das colunas
    const columnWidths = [
      { wch: 20 }, // Número de Série
      { wch: 20 }, // Tipo
      { wch: 15 }, // Modelo
      { wch: 25 }, // Empresa
      { wch: 20 }, // Estado
      { wch: 20 }, // Status
      { wch: 15 }  // Data de Entrada
    ];
    worksheet['!cols'] = columnWidths;
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Equipamentos');
    
    const fileName = `equipamentos_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const exportData = prepareDataForExport();
    
    // Título
    doc.setFontSize(18);
    doc.text('Relatório de Equipamentos', 14, 20);
    
    // Data do relatório
    doc.setFontSize(12);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);
    
    // Tabela
    const tableHeaders = [
      'Número de Série',
      'Tipo',
      'Modelo',
      'Empresa',
      'Estado',
      'Status',
      'Data Entrada'
    ];
    
    const tableData = exportData.map(item => [
      item['Número de Série'],
      item['Tipo'],
      item['Modelo'],
      item['Empresa'],
      item['Estado'],
      item['Status'],
      item['Data de Entrada']
    ]);
    
    (doc as any).autoTable({
      head: [tableHeaders],
      body: tableData,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { top: 40 }
    });
    
    const fileName = `equipamentos_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  const exportToCSV = () => {
    const exportData = prepareDataForExport();
    const headers = Object.keys(exportData[0]);
    
    // Criar conteúdo CSV
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row];
          // Escapar vírgulas e aspas
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');
    
    // Criar e baixar arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `equipamentos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Exportar Dados
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToExcel} className="flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4 text-green-600" />
          Exportar para Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF} className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-red-600" />
          Exportar para PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToCSV} className="flex items-center gap-2">
          <File className="h-4 w-4 text-blue-600" />
          Exportar para CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default EquipmentExport;
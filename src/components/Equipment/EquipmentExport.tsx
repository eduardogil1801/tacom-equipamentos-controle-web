import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText, File } from 'lucide-react';
// import * as XLSX from 'xlsx'; // Removed for compatibility
// import jsPDF from 'jspdf'; // Removed for compatibility
// import 'jspdf-autotable'; // Removed for compatibility

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
    alert("Exportação para Excel não disponível no momento");
  };

  const exportToPDF = () => {
    alert("Exportação para PDF não disponível no momento");
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
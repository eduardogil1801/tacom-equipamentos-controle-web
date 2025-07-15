import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Package } from 'lucide-react';

interface Equipment {
  id: string;
  numero_serie: string;
  tipo: string;
  status?: string;
  id_empresa: string;
  empresas?: {
    name: string;
  };
}

interface MaintenanceMovement {
  id: string;
  id_equipamento?: string;
  tipos_manutencao?: {
    codigo: string;
    descricao: string;
  };
}

interface EquipmentTableProps {
  equipments: Equipment[];
  maintenanceMovements: MaintenanceMovement[];
  selectedMaintenanceType: string;
}

// Sistema de cores para tipos de equipamento
const equipmentTypeColors: { [key: string]: string } = {
  'tipo 1': '#4CAF50', // Verde
  'tipo 2': '#FF9800', // Laranja/Amarelo
  'tipo 3': '#F44336', // Vermelho
  'tipo 4': '#8BC34A', // Verde claro
  'tipo 5': '#2196F3', // Azul
  'tipo 6': '#9C27B0', // Roxo
  'tipo 7': '#757575', // Cinza
};

const getEquipmentTypeColor = (tipo: string): string => {
  // Busca por correspondência exata primeiro
  if (equipmentTypeColors[tipo]) {
    return equipmentTypeColors[tipo];
  }
  
  // Se não encontrar, usa uma cor baseada no hash do tipo
  const hash = tipo.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const colors = Object.values(equipmentTypeColors);
  return colors[Math.abs(hash) % colors.length];
};

const getStatusBadge = (status?: string) => {
  switch (status) {
    case 'disponivel':
      return <Badge className="bg-green-500 text-white hover:bg-green-600">Disponível</Badge>;
    case 'em_uso':
      return <Badge className="bg-blue-500 text-white hover:bg-blue-600">Em Uso</Badge>;
    case 'manutencao':
      return <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">Em Manutenção</Badge>;
    case 'aguardando_manutencao':
      return <Badge className="bg-orange-500 text-white hover:bg-orange-600">Aguardando Manutenção</Badge>;
    case 'danificado':
      return <Badge className="bg-red-500 text-white hover:bg-red-600">Danificado</Badge>;
    case 'indisponivel':
      return <Badge className="bg-gray-500 text-white hover:bg-gray-600">Indisponível</Badge>;
    case 'devolvido':
      return <Badge className="bg-purple-500 text-white hover:bg-purple-600">Devolvido</Badge>;
    default:
      return <Badge className="bg-gray-500 text-white hover:bg-gray-600">Em Estoque</Badge>;
  }
};

const getMaintenanceType = (equipmentId: string, maintenanceMovements: MaintenanceMovement[]): string => {
  const maintenance = maintenanceMovements.find(m => m.id_equipamento === equipmentId);
  if (maintenance?.tipos_manutencao) {
    return maintenance.tipos_manutencao.descricao;
  }
  return '-';
};

const EquipmentTable: React.FC<EquipmentTableProps> = ({
  equipments,
  maintenanceMovements,
  selectedMaintenanceType
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<keyof Equipment>('numero_serie');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Filtrar equipamentos por tipo de manutenção
  const filteredEquipments = useMemo(() => {
    if (selectedMaintenanceType === 'all') {
      return equipments;
    }
    
    return equipments.filter(equipment => {
      const maintenance = maintenanceMovements.find(m => m.id_equipamento === equipment.id);
      if (!maintenance?.tipos_manutencao) return false;
      
      const maintenanceCode = maintenance.tipos_manutencao.codigo.toLowerCase();
      return maintenanceCode.includes(selectedMaintenanceType.toLowerCase());
    });
  }, [equipments, maintenanceMovements, selectedMaintenanceType]);

  // Ordenar equipamentos
  const sortedEquipments = useMemo(() => {
    return [...filteredEquipments].sort((a, b) => {
      let aValue = a[sortField] || '';
      let bValue = b[sortField] || '';
      
      if (sortField === 'empresas') {
        aValue = a.empresas?.name || '';
        bValue = b.empresas?.name || '';
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [filteredEquipments, sortField, sortDirection]);

  // Paginação
  const totalPages = Math.ceil(sortedEquipments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEquipments = sortedEquipments.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field: keyof Equipment) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: keyof Equipment) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Equipamentos ({filteredEquipments.length})</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Itens por página:</span>
            <Select value={itemsPerPage.toString()} onValueChange={(value) => {
              setItemsPerPage(Number(value));
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {sortedEquipments.length > 0 ? (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader className="bg-gray-50 dark:bg-gray-800">
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => handleSort('tipo')}
                    >
                      Tipo de Equipamento {getSortIcon('tipo')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => handleSort('numero_serie')}
                    >
                      Número do Equipamento {getSortIcon('numero_serie')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => handleSort('empresas')}
                    >
                      Empresa {getSortIcon('empresas')}
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tipo de Manutenção</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedEquipments.map((equipment, index) => (
                    <TableRow 
                      key={equipment.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                        index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-900/50'
                      }`}
                    >
                      <TableCell>
                        <Badge 
                          style={{ 
                            backgroundColor: getEquipmentTypeColor(equipment.tipo),
                            color: 'white'
                          }}
                          className="hover:opacity-80"
                        >
                          {equipment.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{equipment.numero_serie}</TableCell>
                      <TableCell>{equipment.empresas?.name || 'N/A'}</TableCell>
                      <TableCell>{getStatusBadge(equipment.status)}</TableCell>
                      <TableCell>{getMaintenanceType(equipment.id, maintenanceMovements)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, sortedEquipments.length)} de {sortedEquipments.length} equipamentos
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <span className="text-sm">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum equipamento encontrado</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EquipmentTable;
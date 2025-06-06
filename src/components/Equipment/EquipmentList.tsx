
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Edit, Trash } from 'lucide-react';
import { Equipment, Company } from '@/types';
import EquipmentForm from './EquipmentForm';

const EquipmentList: React.FC = () => {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [filters, setFilters] = useState({
    serialNumber: '',
    company: '',
    entryDate: '',
    exitDate: ''
  });

  useEffect(() => {
    // Load data from localStorage
    const savedEquipments = localStorage.getItem('tacom-equipments');
    const savedCompanies = localStorage.getItem('tacom-companies');
    
    if (savedEquipments) {
      setEquipments(JSON.parse(savedEquipments));
    }
    
    if (savedCompanies) {
      setCompanies(JSON.parse(savedCompanies));
    } else {
      // Initialize with some default companies
      const defaultCompanies = [
        { id: '1', name: 'Empresa Demo 1', cnpj: '12.345.678/0001-90', contact: '(51) 3333-4444' },
        { id: '2', name: 'Empresa Demo 2', cnpj: '98.765.432/0001-10', contact: '(51) 9999-8888' }
      ];
      setCompanies(defaultCompanies);
      localStorage.setItem('tacom-companies', JSON.stringify(defaultCompanies));
    }
  }, []);

  const handleSaveEquipment = (equipment: Omit<Equipment, 'id'>) => {
    const newEquipment = {
      ...equipment,
      id: editingEquipment?.id || Date.now().toString()
    };

    let updatedEquipments;
    if (editingEquipment) {
      updatedEquipments = equipments.map(eq => 
        eq.id === editingEquipment.id ? newEquipment : eq
      );
    } else {
      updatedEquipments = [...equipments, newEquipment];
    }

    setEquipments(updatedEquipments);
    localStorage.setItem('tacom-equipments', JSON.stringify(updatedEquipments));
    setShowForm(false);
    setEditingEquipment(null);
  };

  const handleDeleteEquipment = (id: string) => {
    const updatedEquipments = equipments.filter(eq => eq.id !== id);
    setEquipments(updatedEquipments);
    localStorage.setItem('tacom-equipments', JSON.stringify(updatedEquipments));
  };

  const filteredEquipments = equipments.filter(equipment => {
    const company = companies.find(c => c.id === equipment.companyId);
    return (
      equipment.serialNumber.toLowerCase().includes(filters.serialNumber.toLowerCase()) &&
      (company?.name.toLowerCase().includes(filters.company.toLowerCase()) || !filters.company) &&
      (equipment.entryDate.includes(filters.entryDate) || !filters.entryDate) &&
      (equipment.exitDate?.includes(filters.exitDate) || !filters.exitDate)
    );
  });

  if (showForm) {
    return (
      <EquipmentForm
        equipment={editingEquipment}
        companies={companies}
        onSave={handleSaveEquipment}
        onCancel={() => {
          setShowForm(false);
          setEditingEquipment(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Controle de Equipamentos</h1>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-primary hover:bg-primary/90 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar Equipamento
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="serialFilter">Número de Série</Label>
              <Input
                id="serialFilter"
                placeholder="Filtrar por série..."
                value={filters.serialNumber}
                onChange={(e) => setFilters({...filters, serialNumber: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="companyFilter">Empresa</Label>
              <Input
                id="companyFilter"
                placeholder="Filtrar por empresa..."
                value={filters.company}
                onChange={(e) => setFilters({...filters, company: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="entryDateFilter">Data de Entrada</Label>
              <Input
                id="entryDateFilter"
                type="date"
                value={filters.entryDate}
                onChange={(e) => setFilters({...filters, entryDate: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="exitDateFilter">Data de Saída</Label>
              <Input
                id="exitDateFilter"
                type="date"
                value={filters.exitDate}
                onChange={(e) => setFilters({...filters, exitDate: e.target.value})}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Equipment List */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Equipamentos ({filteredEquipments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Tipo</th>
                  <th className="text-left p-2">Série</th>
                  <th className="text-left p-2">Empresa</th>
                  <th className="text-left p-2">Entrada</th>
                  <th className="text-left p-2">Saída</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredEquipments.map(equipment => {
                  const company = companies.find(c => c.id === equipment.companyId);
                  return (
                    <tr key={equipment.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">{equipment.type}</td>
                      <td className="p-2 font-mono">{equipment.serialNumber}</td>
                      <td className="p-2">{company?.name || 'N/A'}</td>
                      <td className="p-2">{new Date(equipment.entryDate).toLocaleDateString('pt-BR')}</td>
                      <td className="p-2">
                        {equipment.exitDate ? new Date(equipment.exitDate).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          equipment.exitDate 
                            ? 'bg-gray-100 text-gray-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {equipment.exitDate ? 'Retirado' : 'Em Estoque'}
                        </span>
                      </td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingEquipment(equipment);
                              setShowForm(true);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteEquipment(equipment.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredEquipments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhum equipamento encontrado
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EquipmentList;

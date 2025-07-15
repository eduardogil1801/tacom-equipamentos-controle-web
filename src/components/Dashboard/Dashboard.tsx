
import React, { useState, useEffect } from 'react';
import DashboardFilters from './DashboardFilters';
import DashboardStats from './DashboardStats';
import DashboardCharts from './DashboardCharts';
import EquipmentTable from './EquipmentTable';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useDashboardCalculations } from '@/hooks/useDashboardCalculations';

const Dashboard: React.FC = () => {
  const {
    equipments,
    allEquipments,
    companies,
    equipmentTypes,
    maintenanceTypes,
    maintenanceMovements,
    tacomCompany,
    loading,
    loadData,
    applyFilters
  } = useDashboardData();

  // Filtros
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [selectedEquipmentType, setSelectedEquipmentType] = useState('all');
  const [selectedMaintenanceType, setSelectedMaintenanceType] = useState('all');

  const calculations = useDashboardCalculations(
    equipments,
    allEquipments,
    companies,
    maintenanceMovements,
    tacomCompany,
    selectedCompany
  );

  useEffect(() => {
    applyFilters(selectedCompany, selectedEquipmentType);
  }, [selectedCompany, selectedEquipmentType, allEquipments, applyFilters]);

  const selectedCompanyName = companies.find(c => c.id === selectedCompany)?.name;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <DashboardFilters
        companies={companies}
        equipmentTypes={equipmentTypes}
        maintenanceTypes={maintenanceTypes}
        selectedCompany={selectedCompany}
        selectedEquipmentType={selectedEquipmentType}
        selectedMaintenanceType={selectedMaintenanceType}
        onCompanyChange={setSelectedCompany}
        onEquipmentTypeChange={setSelectedEquipmentType}
        onMaintenanceTypeChange={setSelectedMaintenanceType}
        onRefresh={loadData}
        loading={loading}
      />

      <DashboardStats
        isCompanyFiltered={calculations.isCompanyFiltered}
        isTacomFiltered={calculations.isTacomFiltered}
        totalEquipments={calculations.totalEquipments}
        inStockEquipments={calculations.inStockEquipments}
        equipmentsInMaintenanceCount={calculations.equipmentsInMaintenanceCount}
        filteredCompanyTotal={calculations.filteredCompanyTotal}
        filteredCompanyInStock={calculations.filteredCompanyInStock}
        filteredCompanyWithdrawn={calculations.filteredCompanyWithdrawn}
        selectedCompanyName={selectedCompanyName}
      />

      <DashboardCharts
        pieChartData={calculations.pieChartData}
        maintenanceTypesData={calculations.maintenanceTypesData}
        isCompanyFiltered={calculations.isCompanyFiltered}
        isTacomFiltered={calculations.isTacomFiltered}
        ensureValidNumber={calculations.ensureValidNumber}
      />

      <EquipmentTable
        equipments={equipments}
        maintenanceMovements={maintenanceMovements}
        selectedMaintenanceType={selectedMaintenanceType}
      />
    </div>
  );
};

export default Dashboard;

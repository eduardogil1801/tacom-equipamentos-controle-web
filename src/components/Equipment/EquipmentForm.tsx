
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEquipmentForm } from '@/hooks/useEquipmentForm';
import EquipmentFormFields from './EquipmentFormFields';
import EquipmentFormActions from './EquipmentFormActions';

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
}

interface Company {
  id: string;
  name: string;
  estado?: string;
}

interface EquipmentFormProps {
  equipment?: Equipment | null;
  companies: Company[];
  onCancel: () => void;
  onSave: () => void;
}

const EquipmentForm: React.FC<EquipmentFormProps> = ({
  equipment,
  companies,
  onCancel,
  onSave
}) => {
  const navigate = useNavigate();
  const {
    formData,
    equipmentTypes,
    selectedCompany,
    loading,
    handleInputChange,
    handleCompanyChange,
    handleSubmit
  } = useEquipmentForm(equipment, companies, onSave);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onCancel || (() => navigate(-1))}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">
          {equipment ? 'Editar Equipamento' : 'Novo Equipamento'}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Equipamento</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <EquipmentFormFields
              formData={formData}
              equipmentTypes={equipmentTypes}
              companies={companies}
              onInputChange={handleInputChange}
              onCompanyChange={handleCompanyChange}
            />
            
            <EquipmentFormActions
              loading={loading}
              onCancel={onCancel}
            />
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EquipmentForm;

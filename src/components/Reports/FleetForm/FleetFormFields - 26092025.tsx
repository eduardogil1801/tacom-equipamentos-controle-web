
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Company {
  id: string;
  name: string;
  cnpj?: string;
}

interface FleetData {
  nome_empresa: string;
  cod_operadora: string;
  mes_referencia: string;
  simples_com_imagem: number;
  simples_sem_imagem: number;
  secao: number;
  citgis: number;
  buszoom: number;
  nuvem: number;
}

interface FleetFormFieldsProps {
  companies: Company[];
  formData: FleetData;
  userResponsibleName: string;
  onCompanyChange: (companyName: string) => void;
  onInputChange: (field: keyof FleetData, value: string | number) => void;
}

const FleetFormFields: React.FC<FleetFormFieldsProps> = ({
  companies,
  formData,
  userResponsibleName,
  onCompanyChange,
  onInputChange
}) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="empresa">Nome da Empresa *</Label>
          <Select 
            value={formData.nome_empresa} 
            onValueChange={onCompanyChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione uma empresa" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-300 shadow-lg z-50 max-h-[200px] overflow-y-auto">
              {companies.map(company => (
                <SelectItem 
                  key={company.id} 
                  value={company.name}
                  className="cursor-pointer hover:bg-gray-100"
                >
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cod_operadora">Código da Operadora *</Label>
          <Input
            id="cod_operadora"
            placeholder="Código automático"
            value={formData.cod_operadora}
            readOnly
            className="bg-gray-100"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mes_referencia">Mês de Referência *</Label>
          <Input
            id="mes_referencia"
            type="month"
            value={formData.mes_referencia}
            onChange={(e) => onInputChange('mes_referencia', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="simples_com_imagem">Simples C/Imagem</Label>
          <Input
            id="simples_com_imagem"
            type="number"
            min="0"
            value={formData.simples_com_imagem}
            onChange={(e) => onInputChange('simples_com_imagem', parseInt(e.target.value) || 0)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="simples_sem_imagem">Simples S/Imagem</Label>
          <Input
            id="simples_sem_imagem"
            type="number"
            min="0"
            value={formData.simples_sem_imagem}
            onChange={(e) => onInputChange('simples_sem_imagem', parseInt(e.target.value) || 0)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="secao">Seção</Label>
          <Input
            id="secao"
            type="number"
            min="0"
            value={formData.secao}
            onChange={(e) => onInputChange('secao', parseInt(e.target.value) || 0)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="citgis">CITGIS</Label>
          <Input
            id="citgis"
            type="number"
            min="0"
            value={formData.citgis}
            onChange={(e) => onInputChange('citgis', parseInt(e.target.value) || 0)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="buszoom">BUSZOOM</Label>
          <Input
            id="buszoom"
            type="number"
            min="0"
            value={formData.buszoom}
            onChange={(e) => onInputChange('buszoom', parseInt(e.target.value) || 0)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="nuvem">Telemetria</Label>
          <Input
            id="nuvem"
            type="number"
            min="0"
            value={formData.nuvem}
            onChange={(e) => onInputChange('nuvem', parseInt(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="usuario_responsavel">Usuário Responsável</Label>
        <Input
          id="usuario_responsavel"
          value={userResponsibleName}
          readOnly
          className="bg-gray-100"
        />
      </div>
    </>
  );
};

export default FleetFormFields;

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Company {
  id: string;
  name: string;
  cnpj?: string;
  cod_operadora?: string; // Novo campo
}

interface FleetData {
  nome_empresa: string;
  cod_operadora: string;
  mes_referencia: string;
  simples_com_imagem: number;
  simples_sem_imagem: number;
  secao: number;
  telemetria: number;
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
  onLoadPreviousData?: (companyName: string) => void;
}

const FleetFormFields: React.FC<FleetFormFieldsProps> = ({
  companies,
  formData,
  userResponsibleName,
  onCompanyChange,
  onInputChange,
  onLoadPreviousData
}) => {
  // Calcular automaticamente o campo Nuvem (Total Bilhetagem)
  const calculateNuvem = () => {
    return formData.simples_sem_imagem + formData.simples_com_imagem + formData.secao;
  };

  const handleNumericChange = (field: keyof FleetData, value: string) => {
    const numericValue = parseInt(value) || 0;
    onInputChange(field, numericValue);
    
    // Se alterou um dos campos que compõem a nuvem, recalcular automaticamente
    if (['simples_sem_imagem', 'simples_com_imagem', 'secao'].includes(field)) {
      // Usar setTimeout para garantir que o estado foi atualizado antes do cálculo
      setTimeout(() => {
        const newNuvem = 
          (field === 'simples_sem_imagem' ? numericValue : formData.simples_sem_imagem) +
          (field === 'simples_com_imagem' ? numericValue : formData.simples_com_imagem) +
          (field === 'secao' ? numericValue : formData.secao);
        onInputChange('nuvem', newNuvem);
      }, 0);
    }
  };

  const formatMesForInput = (mes: string) => {
    console.log('Formatando mês para input:', mes);
    
    if (!mes) return '';
    
    // Se já está no formato YYYY-MM, retornar como está
    if (mes.includes('-') && mes.length === 7) {
      console.log('Mês já no formato YYYY-MM:', mes);
      return mes;
    }
    
    // Se está no formato YYYY-MM-DD, extrair apenas YYYY-MM
    if (mes.includes('-') && mes.length === 10) {
      const result = mes.substring(0, 7);
      console.log('Mês extraído de data completa:', result);
      return result;
    }
    
    // Se está no formato MM/YYYY, converter para YYYY-MM
    if (mes.includes('/')) {
      const [month, year] = mes.split('/');
      const result = `${year}-${month.padStart(2, '0')}`;
      console.log('Mês convertido de MM/YYYY para YYYY-MM:', result);
      return result;
    }
    
    console.log('Mês retornado sem conversão:', mes);
    return mes;
  };

  const handleMesChange = (value: string) => {
    console.log('Mês selecionado no input:', value);
    // O input type="month" retorna no formato YYYY-MM
    // Vamos manter este formato internamente
    onInputChange('mes_referencia', value);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Nome da Empresa - ComboBox */}
        <div className="space-y-2">
          <Label htmlFor="empresa">Nome da Empresa *</Label>
          <Select 
            value={formData.nome_empresa} 
            onValueChange={(value) => {
              onCompanyChange(value);
              // Carregar dados do mês anterior se houver
              if (onLoadPreviousData) {
                onLoadPreviousData(value);
              }
            }}
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

        {/* Código da Operadora - Preenchido automaticamente */}
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

        {/* Mês de Referência - Em branco para entrada manual */}
        <div className="space-y-2">
          <Label htmlFor="mes_referencia">Mês de Referência *</Label>
          <Input
            id="mes_referencia"
            type="month"
            value={formatMesForInput(formData.mes_referencia)}
            onChange={(e) => handleMesChange(e.target.value)}
            required
            placeholder="Selecione o mês"
          />
        </div>
      </div>

      {/* Campos reorganizados conforme solicitação */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Simples C/Image - Agora primeiro */}
        <div className="space-y-2">
          <Label htmlFor="simples_com_imagem">Simples C/Image</Label>
          <Input
            id="simples_com_imagem"
            type="number"
            min="0"
            value={formData.simples_com_imagem}
            onChange={(e) => handleNumericChange('simples_com_imagem', e.target.value)}
          />
        </div>

        {/* Simples S/Image - Agora segundo */}
        <div className="space-y-2">
          <Label htmlFor="simples_sem_imagem">Simples S/Image</Label>
          <Input
            id="simples_sem_imagem"
            type="number"
            min="0"
            value={formData.simples_sem_imagem}
            onChange={(e) => handleNumericChange('simples_sem_imagem', e.target.value)}
          />
        </div>

        {/* Seção */}
        <div className="space-y-2">
          <Label htmlFor="secao">Seção</Label>
          <Input
            id="secao"
            type="number"
            min="0"
            value={formData.secao}
            onChange={(e) => handleNumericChange('secao', e.target.value)}
          />
        </div>

        {/* Nuvem (calculado automaticamente) */}
        <div className="space-y-2">
          <Label htmlFor="nuvem">Nuvem</Label>
          <Input
            id="nuvem"
            type="number"
            min="0"
            value={formData.nuvem}
            readOnly
            className="bg-blue-50 border-blue-200 font-medium text-blue-700"
            title="Este campo é calculado automaticamente: Simples S/Image + Simples C/Image + Seção"
          />
        </div>

        {/* Total Bilhetagem (igual ao Nuvem) */}
        <div className="space-y-2">
          <Label htmlFor="total_bilhetagem">Total Bilhetagem</Label>
          <Input
            id="total_bilhetagem"
            type="number"
            min="0"
            value={formData.nuvem} // Mesmo valor da Nuvem
            readOnly
            className="bg-green-50 border-green-200 font-medium text-green-700"
            title="Total Bilhetagem = Nuvem (Simples S/Image + Simples C/Image + Seção)"
          />
        </div>
      </div>

      {/* Serviços Adicionais */}
      <div className="space-y-2">
        <Label className="text-lg font-semibold">Serviços Adicionais</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* CITGIS */}
          <div className="space-y-2">
            <Label htmlFor="citgis">CITGIS</Label>
            <Input
              id="citgis"
              type="number"
              min="0"
              value={formData.citgis}
              onChange={(e) => handleNumericChange('citgis', e.target.value)}
            />
          </div>

          {/* BUSZOOM */}
          <div className="space-y-2">
            <Label htmlFor="buszoom">BUSZOOM</Label>
            <Input
              id="buszoom"
              type="number"
              min="0"
              value={formData.buszoom}
              onChange={(e) => handleNumericChange('buszoom', e.target.value)}
            />
          </div>

          {/* Telemetria */}
          <div className="space-y-2">
            <Label htmlFor="telemetria">Telemetria</Label>
            <Input
              id="telemetria"
              type="number"
              min="0"
              value={formData.telemetria}
              onChange={(e) => handleNumericChange('telemetria', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Usuário Responsável - Não pode ser alterado */}
      <div className="space-y-2">
        <Label htmlFor="usuario_responsavel">Usuário Responsável</Label>
        <Input
          id="usuario_responsavel"
          value={userResponsibleName}
          readOnly
          className="bg-gray-100"
          title="Este campo é preenchido automaticamente com o usuário logado"
        />
      </div>
    </>
  );
};

export default FleetFormFields;
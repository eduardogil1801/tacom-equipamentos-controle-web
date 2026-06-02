
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMovementForm } from '@/hooks/useMovementForm';
import MovementFormFields from './MovementFormFields';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface MovementPageProps {
  onBack?: () => void;
}

const MovementPage: React.FC<MovementPageProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const {
    selectedEquipments,
    setSelectedEquipments,
    companies,
    maintenanceTypes,
    equipmentTypes,
    movementData,
    loading,
    isDestinationTacom,
    handleInputChange,
    handleSubmit,
    updateOriginCompany,
    confirmation,
    confirmPending,
    cancelPending,
  } = useMovementForm();

  const handleEquipmentSelect = (equipments: any[]) => {
    setSelectedEquipments(equipments);
    updateOriginCompany(equipments);
  };

  const removeEquipment = (equipmentId: string) => {
    setSelectedEquipments(prev => prev.filter(eq => eq.id !== equipmentId));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSubmit();
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => onBack ? onBack() : navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">Movimentações de Equipamentos</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nova Movimentação</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <MovementFormFields
              movementData={movementData}
              companies={companies}
              maintenanceTypes={maintenanceTypes}
              equipmentTypes={equipmentTypes}
              isDestinationTacom={isDestinationTacom()}
              selectedEquipments={selectedEquipments}
              onInputChange={handleInputChange}
              onEquipmentSelect={handleEquipmentSelect}
              onRemoveEquipment={removeEquipment}
            />

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => onBack ? onBack() : navigate(-1)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Registrando...' : 'Registrar Movimentação'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <AlertDialog open={!!confirmation} onOpenChange={(open) => { if (!open) cancelPending(); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              {confirmation?.title ?? 'Confirmar'}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 pt-2">
                {confirmation?.messages.map((msg, i) => (
                  <p key={i} className="text-sm text-foreground">{msg}</p>
                ))}
                <p className="text-sm text-muted-foreground pt-2">
                  Deseja continuar?
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPending}>Continuar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MovementPage;

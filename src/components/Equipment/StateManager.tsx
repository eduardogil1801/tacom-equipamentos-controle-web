
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface StateManagerProps {
  estados: string[];
  onAddState: (state: string) => void;
}

const StateManager: React.FC<StateManagerProps> = ({ estados, onAddState }) => {
  const [newState, setNewState] = useState('');
  const [open, setOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newState.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, digite um nome para o estado.",
        variant: "destructive",
      });
      return;
    }

    if (estados.includes(newState.trim())) {
      toast({
        title: "Erro",
        description: "Este estado já existe na lista.",
        variant: "destructive",
      });
      return;
    }

    onAddState(newState.trim());
    setNewState('');
    setOpen(false);
    
    toast({
      title: "Sucesso",
      description: "Novo estado adicionado com sucesso!",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="ml-2">
          <Plus className="h-4 w-4" />
          Novo Estado
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Novo Estado</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="state">Nome do Estado</Label>
            <Input
              id="state"
              placeholder="Ex: Paraná"
              value={newState}
              onChange={(e) => setNewState(e.target.value)}
              required
            />
          </div>
          <div className="flex gap-4 pt-4">
            <Button type="submit">
              Adicionar
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StateManager;

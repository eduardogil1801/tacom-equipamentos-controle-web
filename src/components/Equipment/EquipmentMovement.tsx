
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { formatDateForDisplay } from '@/utils/dateUtils';

type Movement = {
  id: string;
  tipo_movimento: string;
  data_movimento: string;
  observacoes?: string;
  usuario_responsavel?: string;
  equipamentos?: {
    numero_serie: string;
    tipo: string;
    empresas?: {
      name: string;
    };
  };
};

const EquipmentMovement = () => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    const fetchMovements = async () => {
      const { data, error } = await supabase
        .from('movimentacoes')
        .select(`
          *,
          equipamentos (
            numero_serie,
            tipo,
            empresas (
              name
            )
          )
        `)
        .order('data_criacao', { ascending: false })
        .order('data_movimento', { ascending: false });

      if (error) {
        console.error('Erro ao buscar movimentos:', error);
      } else {
        setMovements(data as Movement[]);
      }
    };

    fetchUser();
    fetchMovements();
  }, []);

  const sector = (user?.user_metadata as { sector?: string })?.sector || 'Não informado';

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Movimentações de Equipamentos</h1>
      <p className="mb-4">Setor: {sector}</p>
      <table className="min-w-full bg-white border border-gray-300">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Equipamento</th>
            <th className="py-2 px-4 border-b">Empresa</th>
            <th className="py-2 px-4 border-b">Tipo Movimento</th>
            <th className="py-2 px-4 border-b">Data</th>
            <th className="py-2 px-4 border-b">Responsável</th>
            <th className="py-2 px-4 border-b">Observações</th>
          </tr>
        </thead>
        <tbody>
          {movements.map((movement) => (
            <tr key={movement.id}>
              <td className="py-2 px-4 border-b">
                {movement.equipamentos?.numero_serie || 'N/A'} - {movement.equipamentos?.tipo || 'N/A'}
              </td>
              <td className="py-2 px-4 border-b">
                {movement.equipamentos?.empresas?.name || 'N/A'}
              </td>
              <td className="py-2 px-4 border-b">{movement.tipo_movimento}</td>
              <td className="py-2 px-4 border-b">
                {formatDateForDisplay(movement.data_movimento)}
              </td>
              <td className="py-2 px-4 border-b">{movement.usuario_responsavel || 'N/A'}</td>
              <td className="py-2 px-4 border-b">{movement.observacoes || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EquipmentMovement;

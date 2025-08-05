
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useLocalAuth';
import { formatDateForDisplay } from '@/utils/dateUtils';

type Movement = {
  id: string;
  tipo_movimento: string;
  data_movimento: string;
  data_criacao: string;
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
  const { user } = useAuth();

  useEffect(() => {
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
        // Filtrar para mostrar apenas usuários cadastrados no sistema e primeira movimentação por equipamento/tipo/data
        const filteredData = data?.filter(movement => 
          movement.usuario_responsavel && 
          movement.usuario_responsavel !== 'Sistema' && 
          movement.usuario_responsavel !== 'Usuário não identificado'
        ) || [];
        
        const uniqueMovements = filteredData.filter((movement, index, array) => {
          const key = `${movement.id_equipamento}-${movement.tipo_movimento}-${movement.data_movimento}`;
          return array.findIndex(m => 
            `${m.id_equipamento}-${m.tipo_movimento}-${m.data_movimento}` === key
          ) === index;
        });
        
        setMovements(uniqueMovements as Movement[]);
      }
    };

    fetchMovements();
  }, []);

  const currentUserName = user ? `${user.name} ${user.surname}` : 'Usuário não logado';

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Movimentações de Equipamentos</h1>
      <p className="mb-4">Usuário logado: {currentUserName}</p>
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
                {new Date(movement.data_criacao).toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
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

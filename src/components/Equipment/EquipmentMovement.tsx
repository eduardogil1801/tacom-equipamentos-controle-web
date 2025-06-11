
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

type Movement = {
  id: number;
  name: string;
  email: string;
  type: string;
  date: string;
  user_id: string;
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
        .from('equipment_movements')
        .select('*')
        .order('date', { ascending: false });

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
            <th className="py-2 px-4 border-b">Nome</th>
            <th className="py-2 px-4 border-b">Email</th>
            <th className="py-2 px-4 border-b">Tipo</th>
            <th className="py-2 px-4 border-b">Data</th>
          </tr>
        </thead>
        <tbody>
          {movements.map((movement) => (
            <tr key={movement.id}>
              <td className="py-2 px-4 border-b">{movement.name}</td>
              <td className="py-2 px-4 border-b">{movement.email}</td>
              <td className="py-2 px-4 border-b">{movement.type}</td>
              <td className="py-2 px-4 border-b">
                {new Date(movement.date).toLocaleDateString('pt-BR')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EquipmentMovement;

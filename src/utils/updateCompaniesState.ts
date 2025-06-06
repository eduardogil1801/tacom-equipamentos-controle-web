
import { supabase } from '@/integrations/supabase/client';

export const updateAllCompaniesState = async () => {
  try {
    const { data, error } = await supabase
      .from('empresas')
      .update({ estado: 'Rio Grande do Sul' })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all records

    if (error) throw error;
    
    console.log(`Updated ${data?.length || 0} companies with Rio Grande do Sul state`);
    return data;
  } catch (error) {
    console.error('Error updating companies state:', error);
    throw error;
  }
};

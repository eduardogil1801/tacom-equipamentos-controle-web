
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useReportPermissions = () => {
  const { user } = useAuth();
  const [reportPermissions, setReportPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadReportPermissions();
    }
  }, [user?.id]);

  const loadReportPermissions = async () => {
    if (!user?.id) return;

    // Administradores têm acesso a todos os relatórios
    if (user.userType === 'administrador') {
      setReportPermissions([
        'companies-report',
        'equipment-distribution-report',
        'equipment-history-report',
        'equipment-status-report',
        'fleet-report',
        'inventory-report',
        'inventory-stock-report',
        'maintenance-report',
        'monthly-report',
        'movements-report'
      ]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('module_name')
        .eq('user_id', user.id)
        .eq('can_view', true)
        .like('module_name', '%-report');

      if (error) throw error;

      const permissions = data?.map(p => p.module_name) || [];
      setReportPermissions(permissions);
    } catch (error) {
      console.error('Erro ao carregar permissões de relatórios:', error);
      setReportPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const hasReportPermission = (reportKey: string): boolean => {
    return reportPermissions.includes(reportKey);
  };

  return {
    reportPermissions,
    hasReportPermission,
    loading
  };
};

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { RotateCcw, CheckCircle, WifiOff } from 'lucide-react';
import { useAuth } from '@/hooks/useHybridAuth';

const ConnectionStatus: React.FC = () => {
  const { connectionStatus, retryConnection } = useAuth();

  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'online':
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          text: 'Online',
          description: 'Conectado ao Supabase - Dados em tempo real',
          variant: 'success' as const,
          className: 'bg-green-100 text-green-800 border-green-200'
        };
      case 'offline':
        return {
          icon: <WifiOff className="h-4 w-4" />,
          text: 'Offline',
          description: 'Usando dados locais - Funcionalidade limitada',
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 border-red-200'
        };
      case 'testing':
        return {
          icon: <RotateCcw className="h-4 w-4 animate-spin" />,
          text: 'Testando',
          description: 'Verificando conexão com Supabase...',
          variant: 'secondary' as const,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
        };
      default:
        return {
          icon: <WifiOff className="h-4 w-4" />,
          text: 'Offline',
          description: 'Status desconhecido',
          variant: 'secondary' as const,
          className: 'bg-gray-100 text-gray-800 border-gray-200'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={config.variant}
            className={`${config.className} cursor-help flex items-center gap-1 px-2 py-1`}
          >
            {config.icon}
            <span className="text-xs font-medium">{config.text}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="text-sm">{config.description}</p>
          {connectionStatus === 'offline' && (
            <p className="text-xs mt-1 opacity-75">
              Clique no botão de reconectar para tentar novamente
            </p>
          )}
        </TooltipContent>
      </Tooltip>

      {connectionStatus === 'offline' && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={retryConnection}
              className="h-8 w-8 p-0 hover:bg-blue-50"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Tentar reconectar</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
};

export default ConnectionStatus;
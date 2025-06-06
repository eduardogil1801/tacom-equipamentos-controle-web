import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { User, LogOut, ChevronDown, Package, Building, BarChart3, FileText, Settings, Home } from 'lucide-react';
interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}
const Header: React.FC<HeaderProps> = ({
  currentPage,
  onNavigate
}) => {
  const {
    user,
    logout
  } = useAuth();
  const [reportsOpen, setReportsOpen] = useState(false);
  const handleLogout = () => {
    logout();
  };
  const navigationItems = [{
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home
  }, {
    id: 'equipments',
    label: 'Equipamentos',
    icon: Package
  }, {
    id: 'companies',
    label: 'Empresas',
    icon: Building
  }];
  const reportItems = [{
    id: 'reports-inventory',
    label: 'Inventário'
  }, {
    id: 'reports-movements',
    label: 'Movimentações'
  }, {
    id: 'reports-companies',
    label: 'Empresas'
  }, {
    id: 'reports-equipment-status',
    label: 'Status dos Equipamentos'
  }, {
    id: 'reports-equipment-distribution',
    label: 'Distribuição de Equipamentos'
  }, {
    id: 'reports-fleet',
    label: 'Frota'
  }, {
    id: 'reports-monthly',
    label: 'Mensal'
  }, {
    id: 'reports-equipment-history',
    label: 'Histórico de Equipamentos'
  }];
  return <header className="bg-gradient-to-r from-primary/10 to-secondary/10 shadow-lg border-b border-primary/20 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3 bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 shadow-md border border-primary/20">
              <div className="relative">
                <img src="/lovable-uploads/be97db19-c61d-4e37-905a-65b5d5b74d82.png" alt="TACOM Logo" className="h-8 w-auto drop-shadow-sm" />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-full mix-blend-overlay"></div>
              </div>
              <div className="flex flex-col">
                
                <span className="text-xs text-muted-foreground font-medium tracking-wider">Controle de Equipamentos</span>
              </div>
            </div>
            
            <nav className="flex space-x-1">
              {navigationItems.map(item => {
              const Icon = item.icon;
              return <Button key={item.id} variant={currentPage === item.id ? "default" : "ghost"} onClick={() => onNavigate(item.id)} className="flex items-center gap-2 transition-all duration-200 hover:shadow-md">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>;
            })}
              
              <DropdownMenu open={reportsOpen} onOpenChange={setReportsOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant={currentPage.startsWith('reports-') ? "default" : "ghost"} className="flex items-center gap-2 transition-all duration-200 hover:shadow-md">
                    <FileText className="h-4 w-4" />
                    Relatórios
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {reportItems.map(item => <DropdownMenuItem key={item.id} onClick={() => {
                  onNavigate(item.id);
                  setReportsOpen(false);
                }} className={currentPage === item.id ? "bg-primary/10" : ""}>
                      {item.label}
                    </DropdownMenuItem>)}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant={currentPage === 'protocol' ? "default" : "ghost"} onClick={() => onNavigate('protocol')} className="flex items-center gap-2 transition-all duration-200 hover:shadow-md">
                <BarChart3 className="h-4 w-4" />
                Protocolo
              </Button>

              <Button variant={currentPage === 'settings' ? "default" : "ghost"} onClick={() => onNavigate('settings')} className="flex items-center gap-2 transition-all duration-200 hover:shadow-md">
                <Settings className="h-4 w-4" />
                Configurações
              </Button>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 hover:bg-white/50 transition-all duration-200">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:block">{user?.name}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>{user?.name} {user?.surname}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="flex items-center space-x-2 text-red-600">
                  <LogOut className="h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>;
};
export default Header;
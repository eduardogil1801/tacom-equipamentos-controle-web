
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { 
  LayoutDashboard, 
  Package, 
  Building, 
  FileText, 
  Settings, 
  LogOut, 
  Menu,
  X,
  Truck,
  ClipboardList,
  Users,
  Shield
} from 'lucide-react';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, onNavigate }) => {
  const { user, logout, checkPermission } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      permission: 'dashboard'
    },
    {
      key: 'equipments',
      label: 'Equipamentos',
      icon: Package,
      permission: 'equipments'
    },
    {
      key: 'companies',
      label: 'Empresas',
      icon: Building,
      permission: 'companies'
    },
    {
      key: 'fleet-management',
      label: 'Frota',
      icon: Truck,
      permission: 'fleet'
    },
    {
      key: 'protocol',
      label: 'Protocolo',
      icon: ClipboardList,
      permission: 'protocol'
    }
  ];

  const reportItems = [
    {
      key: 'reports-inventory',
      label: 'Estoque',
      permission: 'reports'
    },
    {
      key: 'reports-movements',
      label: 'Movimentações',
      permission: 'reports'
    },
    {
      key: 'reports-equipment-history',
      label: 'Histórico Equipamentos',
      permission: 'reports'
    }
  ];

  const adminItems = [
    {
      key: 'users',
      label: 'Usuários',
      icon: Users,
      adminOnly: true
    },
    {
      key: 'permissions',
      label: 'Permissões',
      icon: Shield,
      adminOnly: true
    }
  ];

  const hasReportsAccess = checkPermission('reports', 'view');
  const isAdmin = user?.userType === 'administrador';

  const handleNavigate = (page: string) => {
    onNavigate(page);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="tacom-gradient text-white px-4 py-2 rounded-lg">
              <h1 className="text-xl font-bold">TACOM</h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {menuItems.map((item) => {
              if (!checkPermission(item.permission, 'view')) return null;
              
              const Icon = item.icon;
              return (
                <Button
                  key={item.key}
                  variant={currentPage === item.key ? "default" : "ghost"}
                  onClick={() => handleNavigate(item.key)}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}

            {/* Relatórios Dropdown */}
            {hasReportsAccess && (
              <div className="relative group">
                <Button
                  variant={currentPage.startsWith('reports-') ? "default" : "ghost"}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Relatórios
                </Button>
                <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-1">
                    {reportItems.map((item) => {
                      if (!checkPermission(item.permission, 'view')) return null;
                      
                      return (
                        <button
                          key={item.key}
                          onClick={() => handleNavigate(item.key)}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Admin Items */}
            {isAdmin && adminItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.key}
                  variant={currentPage === item.key ? "default" : "ghost"}
                  onClick={() => handleNavigate(item.key)}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}

            {/* Settings */}
            {checkPermission('settings', 'view') && (
              <Button
                variant={currentPage === 'settings' ? "default" : "ghost"}
                onClick={() => handleNavigate('settings')}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Configurações
              </Button>
            )}
          </nav>

          {/* User Info and Logout */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900">
                {user?.name} {user?.surname}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {user?.userType}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={logout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4">
            <div className="space-y-2">
              {menuItems.map((item) => {
                if (!checkPermission(item.permission, 'view')) return null;
                
                const Icon = item.icon;
                return (
                  <Button
                    key={item.key}
                    variant={currentPage === item.key ? "default" : "ghost"}
                    onClick={() => handleNavigate(item.key)}
                    className="w-full justify-start flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                );
              })}

              {/* Mobile Reports */}
              {hasReportsAccess && (
                <div className="space-y-1">
                  <div className="px-3 py-2 text-sm font-medium text-gray-900">Relatórios</div>
                  {reportItems.map((item) => {
                    if (!checkPermission(item.permission, 'view')) return null;
                    
                    return (
                      <Button
                        key={item.key}
                        variant={currentPage === item.key ? "default" : "ghost"}
                        onClick={() => handleNavigate(item.key)}
                        className="w-full justify-start pl-6"
                      >
                        {item.label}
                      </Button>
                    );
                  })}
                </div>
              )}

              {/* Mobile Admin Items */}
              {isAdmin && (
                <div className="space-y-1">
                  <div className="px-3 py-2 text-sm font-medium text-gray-900">Administração</div>
                  {adminItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Button
                        key={item.key}
                        variant={currentPage === item.key ? "default" : "ghost"}
                        onClick={() => handleNavigate(item.key)}
                        className="w-full justify-start flex items-center gap-2 pl-6"
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Button>
                    );
                  })}
                </div>
              )}

              {/* Mobile Settings */}
              {checkPermission('settings', 'view') && (
                <Button
                  variant={currentPage === 'settings' ? "default" : "ghost"}
                  onClick={() => handleNavigate('settings')}
                  className="w-full justify-start flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Configurações
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

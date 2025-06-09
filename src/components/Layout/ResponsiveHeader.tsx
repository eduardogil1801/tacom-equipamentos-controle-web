
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, User, Settings, FileText, Package, Truck, Menu, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface ResponsiveHeaderProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const ResponsiveHeader: React.FC<ResponsiveHeaderProps> = ({ currentPage, onPageChange }) => {
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Package, permission: 'dashboard' },
    { id: 'equipment', label: 'Equipamentos', icon: Package, permission: 'equipment' },
    { id: 'fleet', label: 'Frota', icon: Truck, permission: 'fleet' },
    { id: 'reports', label: 'Relatórios', icon: FileText, permission: 'reports' },
    { id: 'settings', label: 'Configurações', icon: Settings, permission: 'settings' }
  ];

  const handlePageChange = (page: string) => {
    onPageChange(page);
    setMobileMenuOpen(false);
  };

  const MobileMenu = () => (
    <div className="flex flex-col space-y-4 p-4">
      {menuItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => handlePageChange(item.id)}
            className={`flex items-center w-full px-4 py-3 rounded-lg text-left transition-colors ${
              currentPage === item.id
                ? 'bg-red-100 text-red-700 border border-red-200'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Icon className="h-5 w-5 mr-3" />
            {item.label}
          </button>
        );
      })}
      
      <div className="border-t pt-4 mt-4">
        <div className="flex items-center px-4 py-2 text-gray-600">
          <User className="h-5 w-5 mr-3" />
          <div>
            <p className="font-medium">{user?.name} {user?.surname}</p>
            <p className="text-sm text-gray-500">
              {user?.userType === 'administrador' ? 'Administrador' : 'Operacional'}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Sair
        </button>
      </div>
    </div>
  );

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="tacom-gradient text-white px-3 py-2 rounded-lg font-bold text-lg sm:text-xl">
              TACOM
            </div>
            <span className="ml-3 text-gray-600 text-xs sm:text-sm hidden sm:block">
              Controle de Equipamentos - Filial POA
            </span>
          </div>

          {/* Desktop Navigation */}
          {!isMobile && (
            <nav className="hidden md:flex space-x-8">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handlePageChange(item.id)}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentPage === item.id
                        ? 'bg-red-100 text-red-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          )}

          {/* User Menu - Desktop */}
          {!isMobile && (
            <div className="flex items-center space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {user?.name} {user?.surname}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled>
                    <User className="h-4 w-4 mr-2" />
                    {user?.name} {user?.surname}
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    <span className="text-xs text-gray-500">
                      {user?.userType === 'administrador' ? 'Administrador' : 'Operacional'}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Mobile Menu Button */}
          {isMobile && (
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex items-center justify-between mb-6">
                  <div className="tacom-gradient text-white px-3 py-2 rounded-lg font-bold text-lg">
                    TACOM
                  </div>
                </div>
                <MobileMenu />
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </header>
  );
};

export default ResponsiveHeader;

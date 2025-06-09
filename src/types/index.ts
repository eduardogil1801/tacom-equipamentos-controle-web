
export interface User {
  id: string;
  name: string;
  surname: string;
  email: string;
  username: string;
  userType?: 'administrador' | 'operacional';
  mustChangePassword?: boolean;
  isTempPassword?: boolean;
}

export interface UserProfile {
  id: string;
  user_id: string;
  user_type: 'administrador' | 'operacional';
  created_at: string;
  updated_at: string;
}

export interface UserPermission {
  id: string;
  user_id: string;
  module_name: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export interface Company {
  id: string;
  name: string;
  cnpj?: string;
  contact?: string;
}

export interface Equipment {
  id: string;
  type: string;
  serialNumber: string;
  entryDate: string;
  exitDate?: string;
  companyId: string;
  company?: Company;
}

export interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (name: string, surname: string, email: string, username: string, password: string, confirmPassword: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  changePassword: (newPassword: string, confirmPassword: string) => Promise<boolean>;
  checkPermission: (module: string, action: 'view' | 'create' | 'edit' | 'delete') => boolean;
  isAuthenticated: boolean;
}

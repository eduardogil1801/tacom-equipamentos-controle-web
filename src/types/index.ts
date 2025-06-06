
export interface User {
  id: string;
  name: string;
  surname: string;
  email: string;
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
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, surname: string, email: string, password: string, confirmPassword: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

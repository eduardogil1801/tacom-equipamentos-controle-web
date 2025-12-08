export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      categorias_manutencao: {
        Row: {
          ativo: boolean
          codigo: string
          cor: string | null
          created_at: string
          descricao: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          codigo: string
          cor?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          codigo?: string
          cor?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          user1_id?: string
          user2_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_conversations_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          receiver_id: string
          sender_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          receiver_id: string
          sender_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          receiver_id?: string
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes: {
        Row: {
          created_at: string
          dashboard_layout: Json | null
          id: string
          tema_cores: Json | null
          updated_at: string
          usuario_id: string | null
        }
        Insert: {
          created_at?: string
          dashboard_layout?: Json | null
          id?: string
          tema_cores?: Json | null
          updated_at?: string
          usuario_id?: string | null
        }
        Update: {
          created_at?: string
          dashboard_layout?: Json | null
          id?: string
          tema_cores?: Json | null
          updated_at?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      defeitos_reclamados: {
        Row: {
          categoria: string | null
          codigo: string
          created_at: string | null
          descricao: string
          id: number
          updated_at: string | null
        }
        Insert: {
          categoria?: string | null
          codigo: string
          created_at?: string | null
          descricao: string
          id?: number
          updated_at?: string | null
        }
        Update: {
          categoria?: string | null
          codigo?: string
          created_at?: string | null
          descricao?: string
          id?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      empresas: {
        Row: {
          cnpj: string | null
          cod_operadora: string | null
          contact: string | null
          cor_primaria: string | null
          cor_secundaria: string | null
          created_at: string
          estado: string | null
          estado_id: string | null
          id: string
          name: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          cnpj?: string | null
          cod_operadora?: string | null
          contact?: string | null
          cor_primaria?: string | null
          cor_secundaria?: string | null
          created_at?: string
          estado?: string | null
          estado_id?: string | null
          id?: string
          name: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          cnpj?: string | null
          cod_operadora?: string | null
          contact?: string | null
          cor_primaria?: string | null
          cor_secundaria?: string | null
          created_at?: string
          estado?: string | null
          estado_id?: string | null
          id?: string
          name?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "empresas_estado_id_fkey"
            columns: ["estado_id"]
            isOneToOne: false
            referencedRelation: "estados"
            referencedColumns: ["id"]
          },
        ]
      }
      equipamentos: {
        Row: {
          at_criado: string
          at_update: string
          data_entrada: string
          data_saida: string | null
          em_manutencao: boolean | null
          estado: string | null
          id: string
          id_empresa: string
          modelo: string | null
          numero_serie: string
          status: string | null
          tipo: string
        }
        Insert: {
          at_criado?: string
          at_update?: string
          data_entrada: string
          data_saida?: string | null
          em_manutencao?: boolean | null
          estado?: string | null
          id?: string
          id_empresa: string
          modelo?: string | null
          numero_serie: string
          status?: string | null
          tipo: string
        }
        Update: {
          at_criado?: string
          at_update?: string
          data_entrada?: string
          data_saida?: string | null
          em_manutencao?: boolean | null
          estado?: string | null
          id?: string
          id_empresa?: string
          modelo?: string | null
          numero_serie?: string
          status?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipamentos_id_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      estados: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      frota: {
        Row: {
          buszoom: number | null
          citgis: number | null
          cod_operadora: string
          created_at: string
          id: string
          mes_referencia: string
          nome_empresa: string
          nuvem: number | null
          secao: number | null
          simples_com_imagem: number | null
          simples_sem_imagem: number | null
          telemetria: number | null
          total: number | null
          updated_at: string
          usuario_responsavel: string | null
        }
        Insert: {
          buszoom?: number | null
          citgis?: number | null
          cod_operadora: string
          created_at?: string
          id?: string
          mes_referencia: string
          nome_empresa: string
          nuvem?: number | null
          secao?: number | null
          simples_com_imagem?: number | null
          simples_sem_imagem?: number | null
          telemetria?: number | null
          total?: number | null
          updated_at?: string
          usuario_responsavel?: string | null
        }
        Update: {
          buszoom?: number | null
          citgis?: number | null
          cod_operadora?: string
          created_at?: string
          id?: string
          mes_referencia?: string
          nome_empresa?: string
          nuvem?: number | null
          secao?: number | null
          simples_com_imagem?: number | null
          simples_sem_imagem?: number | null
          telemetria?: number | null
          total?: number | null
          updated_at?: string
          usuario_responsavel?: string | null
        }
        Relationships: []
      }
      login: {
        Row: {
          at_criado: string
          at_update: string
          email: string
          id: string
          nome: string
          sobrenome: string
        }
        Insert: {
          at_criado?: string
          at_update?: string
          email: string
          id: string
          nome: string
          sobrenome: string
        }
        Update: {
          at_criado?: string
          at_update?: string
          email?: string
          id?: string
          nome?: string
          sobrenome?: string
        }
        Relationships: []
      }
      maintenance_rules: {
        Row: {
          created_at: string
          id: string
          status_resultante: string
          tipo_manutencao_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          status_resultante: string
          tipo_manutencao_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          status_resultante?: string
          tipo_manutencao_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_rules_tipo_manutencao_id_fkey"
            columns: ["tipo_manutencao_id"]
            isOneToOne: false
            referencedRelation: "tipos_manutencao"
            referencedColumns: ["id"]
          },
        ]
      }
      movimentacoes: {
        Row: {
          data_criacao: string | null
          data_movimento: string
          defeito_encontrado_id: string | null
          defeito_reclamado_id: string | null
          detalhes_manutencao: string | null
          id: string
          id_equipamento: string | null
          observacoes: string | null
          tipo_manutencao_id: string | null
          tipo_movimento: string
          usuario_responsavel: string | null
        }
        Insert: {
          data_criacao?: string | null
          data_movimento: string
          defeito_encontrado_id?: string | null
          defeito_reclamado_id?: string | null
          detalhes_manutencao?: string | null
          id?: string
          id_equipamento?: string | null
          observacoes?: string | null
          tipo_manutencao_id?: string | null
          tipo_movimento: string
          usuario_responsavel?: string | null
        }
        Update: {
          data_criacao?: string | null
          data_movimento?: string
          defeito_encontrado_id?: string | null
          defeito_reclamado_id?: string | null
          detalhes_manutencao?: string | null
          id?: string
          id_equipamento?: string | null
          observacoes?: string | null
          tipo_manutencao_id?: string | null
          tipo_movimento?: string
          usuario_responsavel?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_defeito_encontrado_id_fkey"
            columns: ["defeito_encontrado_id"]
            isOneToOne: false
            referencedRelation: "tipos_manutencao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_defeito_reclamado_id_fkey"
            columns: ["defeito_reclamado_id"]
            isOneToOne: false
            referencedRelation: "tipos_manutencao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_id_equipamento_fkey"
            columns: ["id_equipamento"]
            isOneToOne: false
            referencedRelation: "equipamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_tipo_manutencao_id_fkey"
            columns: ["tipo_manutencao_id"]
            isOneToOne: false
            referencedRelation: "tipos_manutencao"
            referencedColumns: ["id"]
          },
        ]
      }
      tipos_equipamento: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      tipos_manutencao: {
        Row: {
          ativo: boolean | null
          categoria: string | null
          categoria_id: string | null
          codigo: string
          created_at: string
          descricao: string
          id: string
        }
        Insert: {
          ativo?: boolean | null
          categoria?: string | null
          categoria_id?: string | null
          codigo: string
          created_at?: string
          descricao: string
          id?: string
        }
        Update: {
          ativo?: boolean | null
          categoria?: string | null
          categoria_id?: string | null
          codigo?: string
          created_at?: string
          descricao?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tipos_manutencao_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_manutencao"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          can_create: boolean | null
          can_delete: boolean | null
          can_edit: boolean | null
          can_view: boolean | null
          created_at: string | null
          id: string
          module_name: string
          user_id: string | null
        }
        Insert: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          id?: string
          module_name: string
          user_id?: string | null
        }
        Update: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          id?: string
          module_name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string | null
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          ativo: boolean | null
          data_atualizacao: string | null
          data_criacao: string | null
          email: string
          id: string
          is_temp_password: boolean | null
          must_change_password: boolean | null
          nome: string
          senha: string
          sobrenome: string
          username: string
        }
        Insert: {
          ativo?: boolean | null
          data_atualizacao?: string | null
          data_criacao?: string | null
          email: string
          id?: string
          is_temp_password?: boolean | null
          must_change_password?: boolean | null
          nome: string
          senha: string
          sobrenome: string
          username: string
        }
        Update: {
          ativo?: boolean | null
          data_atualizacao?: string | null
          data_criacao?: string | null
          email?: string
          id?: string
          is_temp_password?: boolean | null
          must_change_password?: boolean | null
          nome?: string
          senha?: string
          sobrenome?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_id: { Args: never; Returns: string }
      get_user_full_name: { Args: { user_id: string }; Returns: string }
      get_user_full_name_improved: {
        Args: { user_id?: string }
        Returns: string
      }
    }
    Enums: {
      user_type: "administrador" | "operacional"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_type: ["administrador", "operacional"],
    },
  },
} as const

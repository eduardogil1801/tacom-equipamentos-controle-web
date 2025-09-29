// ADICIONE estas interfaces no seu arquivo src/integrations/supabase/types.ts

// Na seção Tables, adicione esta nova tabela:
categorias_manutencao: {
  Row: {
    id: string
    codigo: string
    nome: string
    descricao: string | null
    cor: string | null
    ativo: boolean
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    codigo: string
    nome: string
    descricao?: string | null
    cor?: string | null
    ativo?: boolean
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    codigo?: string
    nome?: string
    descricao?: string | null
    cor?: string | null
    ativo?: boolean
    created_at?: string
    updated_at?: string
  }
  Relationships: []
}

// Atualize a tabela tipos_manutencao para incluir categoria_id:
tipos_manutencao: {
  Row: {
    ativo: boolean | null
    codigo: string
    created_at: string
    descricao: string
    id: string
    categoria_id: string | null  // NOVO CAMPO
  }
  Insert: {
    ativo?: boolean | null
    codigo: string
    created_at?: string
    descricao: string
    id?: string
    categoria_id?: string | null  // NOVO CAMPO
  }
  Update: {
    ativo?: boolean | null
    codigo?: string
    created_at?: string
    descricao?: string
    id?: string
    categoria_id?: string | null  // NOVO CAMPO
  }
  Relationships: [
    {
      foreignKeyName: "tipos_manutencao_categoria_id_fkey"
      columns: ["categoria_id"]
      isOneToOne: false
      referencedRelation: "categorias_manutencao"
      referencedColumns: ["id"]
    }
  ]
}

// Atualize a tabela movimentacoes para incluir os novos campos:
movimentacoes: {
  Row: {
    data_criacao: string | null
    data_movimento: string
    detalhes_manutencao: string | null
    id: string
    id_equipamento: string | null
    observacoes: string | null
    tipo_manutencao_id: string | null
    defeito_reclamado_id: string | null    // NOVO CAMPO
    defeito_encontrado_id: string | null   // NOVO CAMPO
    tipo_movimento: string
    usuario_responsavel: string | null
  }
  Insert: {
    data_criacao?: string | null
    data_movimento: string
    detalhes_manutencao?: string | null
    id?: string
    id_equipamento?: string | null
    observacoes?: string | null
    tipo_manutencao_id?: string | null
    defeito_reclamado_id?: string | null   // NOVO CAMPO
    defeito_encontrado_id?: string | null  // NOVO CAMPO
    tipo_movimento: string
    usuario_responsavel?: string | null
  }
  Update: {
    data_criacao?: string | null
    data_movimento?: string
    detalhes_manutencao?: string | null
    id?: string
    id_equipamento?: string | null
    observacoes?: string | null
    tipo_manutencao_id?: string | null
    defeito_reclamado_id?: string | null   // NOVO CAMPO
    defeito_encontrado_id?: string | null  // NOVO CAMPO
    tipo_movimento?: string
    usuario_responsavel?: string | null
  }
  Relationships: [
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
    {
      foreignKeyName: "movimentacoes_defeito_reclamado_id_fkey"
      columns: ["defeito_reclamado_id"]
      isOneToOne: false
      referencedRelation: "tipos_manutencao"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "movimentacoes_defeito_encontrado_id_fkey"
      columns: ["defeito_encontrado_id"]
      isOneToOne: false
      referencedRelation: "tipos_manutencao"
      referencedColumns: ["id"]
    }
  ]
}
export interface Database {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string
          email: string
          nome: string
          role: 'admin' | 'manager' | 'member'
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          nome: string
          role?: 'admin' | 'manager' | 'member'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          nome?: string
          role?: 'admin' | 'manager' | 'member'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      projetos: {
        Row: {
          id: string
          nome: string
          descricao: string | null
          gerente_id: string | null
          data_inicio: string | null
          data_fim: string | null
          status: 'ativo' | 'pausado' | 'concluido' | 'cancelado'
          progresso: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          descricao?: string | null
          gerente_id?: string | null
          data_inicio?: string | null
          data_fim?: string | null
          status?: 'ativo' | 'pausado' | 'concluido' | 'cancelado'
          progresso?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          descricao?: string | null
          gerente_id?: string | null
          data_inicio?: string | null
          data_fim?: string | null
          status?: 'ativo' | 'pausado' | 'concluido' | 'cancelado'
          progresso?: number
          created_at?: string
          updated_at?: string
        }
      }
      tarefas: {
        Row: {
          id: string
          titulo: string
          descricao: string | null
          projeto_id: string
          responsavel_id: string | null
          status: 'todo' | 'in_progress' | 'done'
          prioridade: 'baixa' | 'media' | 'alta'
          prazo: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          titulo: string
          descricao?: string | null
          projeto_id: string
          responsavel_id?: string | null
          status?: 'todo' | 'in_progress' | 'done'
          prioridade?: 'baixa' | 'media' | 'alta'
          prazo?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          titulo?: string
          descricao?: string | null
          projeto_id?: string
          responsavel_id?: string | null
          status?: 'todo' | 'in_progress' | 'done'
          prioridade?: 'baixa' | 'media' | 'alta'
          prazo?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      equipe_projetos: {
        Row: {
          id: string
          usuario_id: string
          projeto_id: string
          papel: string
          created_at: string
        }
        Insert: {
          id?: string
          usuario_id: string
          projeto_id: string
          papel?: string
          created_at?: string
        }
        Update: {
          id?: string
          usuario_id?: string
          projeto_id?: string
          papel?: string
          created_at?: string
        }
      }
    }
  }
}
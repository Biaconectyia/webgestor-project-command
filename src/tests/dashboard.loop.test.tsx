import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import SupabaseDashboard from '@/components/SupabaseDashboard'

let projetosCalls = 0
let tarefasCalls = 0
let usuariosCalls = 0

vi.mock('@/hooks/useSupabaseData', () => ({
  useProjetos: () => {
    projetosCalls++
    return { data: [{ id: 'p1', nome: 'Projeto A', status: 'ativo', progresso: 25 }], isLoading: false }
  },
  useTarefas: () => {
    tarefasCalls++
    return { data: [{ id: 't1', titulo: 'Tarefa', status: 'todo' }], isLoading: false }
  },
  useUsuarios: () => {
    usuariosCalls++
    return { data: [{ id: 'u1', nome: 'User', email: 'u@a.com' }], isLoading: false }
  },
}))

describe('Dashboard render stability', () => {
  it('renderiza sem loops infinitos e usa dados memorizados', () => {
    render(<SupabaseDashboard />)
    expect(screen.getByText('Projetos Recentes')).toBeInTheDocument()
    expect(screen.getByText('Projeto A')).toBeInTheDocument()
    // Cada hook deve ter sido chamado apenas uma vez na renderização inicial
    expect(projetosCalls).toBe(1)
    expect(tarefasCalls).toBe(1)
    expect(usuariosCalls).toBe(1)
  })
})

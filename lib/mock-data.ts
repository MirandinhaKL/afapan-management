// ===== TYPES =====

export type UserRole = "admin" | "gestor" | "voluntario"

export interface User {
  id: string
  nome: string
  email: string
  role: UserRole
  ativo: boolean
  criadoEm: string
}

export interface Participante {
  id: string
  nome: string
  telefone: string
  email: string
  turma: string
  baldes: RegistroBalde[]
  ativo: boolean
}

export interface RegistroBalde {
  trimestre: string
  quantidade: number
  dataRegistro: string
}

export interface Turma {
  id: string
  nome: string
  semestre: string
  totalParticipantes: number
  ativa: boolean
}

export interface TurmaCompostagem {
  id: string
  nome: string
  descricao?: string
  ativo: boolean
  criado_em: string
}

export interface ParticipanteTurma {
  id: string
  participante_id: string
  turma_id: string
  criado_em: string
}

export interface DashboardStats {
  totalParticipantesAtivos: number
  totalBaldesTrimestre: number
  estimativaCO2Evitado: number
  totalAduboGerado: number
}

export interface BaldesTrimestral {
  trimestre: string
  baldes: number
}

// ===== MOCK DATA =====

export const mockUsers: User[] = [
  { id: "1", nome: "Carlos Silva", email: "carlos@afapan.org.br", role: "admin", ativo: true, criadoEm: "2024-01-15" },
  { id: "2", nome: "Maria Santos", email: "maria@afapan.org.br", role: "gestor", ativo: true, criadoEm: "2024-03-10" },
  { id: "3", nome: "Pedro Lovatto", email: "pedro@afapan.org.br", role: "admin", ativo: true, criadoEm: "2023-06-01" },
  { id: "4", nome: "Ana Becker", email: "ana@afapan.org.br", role: "voluntario", ativo: true, criadoEm: "2025-01-20" },
  { id: "5", nome: "Lucas Fontana", email: "lucas@afapan.org.br", role: "gestor", ativo: false, criadoEm: "2024-08-05" },
]

const gerarParticipantes = (turma: string, quantidade: number, startId: number): Participante[] => {
  const nomes = [
    "Joana Ferreira", "Roberto Zanella", "Claudia Moreira", "Fernando Lima",
    "Beatriz Costa", "Andre Ramos", "Patricia Oliveira", "Marcelo Torres",
    "Simone Almeida", "Rafael Nunes", "Camila Vieira", "Diego Cardoso",
    "Leticia Barbosa", "Gustavo Pinto", "Fernanda Machado", "Thiago Rocha",
    "Juliana Dias", "Eduardo Souza", "Vanessa Reis", "Bruno Goncalves",
    "Isabela Martins", "Ricardo Pereira", "Amanda Ribeiro", "Paulo Correia",
    "Larissa Azevedo", "Gabriel Teixeira", "Carolina Mendes", "Henrique Araujo",
    "Daniela Freitas", "Matheus Carvalho", "Natalia Nascimento", "Leonardo Monteiro",
    "Aline Gomes", "Rodrigo Lopes", "Renata Castro", "Felipe Duarte",
    "Mariana Xavier", "Victor Campos", "Bianca Miranda", "Leandro Cunha",
    "Priscila Moura", "Alexandre Fonseca", "Tatiana Borges", "Marcos Peixoto",
    "Bruna Tavares", "Jorge Bastos", "Sandra Caldas", "Fabio Menezes",
    "Monica Guedes", "Sergio Braga",
  ]

  return Array.from({ length: quantidade }, (_, i) => {
    const idx = (startId + i - 1) % nomes.length
    const temBaldes = Math.random() > 0.35
    const baldes: RegistroBalde[] = temBaldes
      ? [
          {
            trimestre: "2026-Q1",
            quantidade: Math.floor(Math.random() * 15) + 3,
            dataRegistro: "2026-02-15",
          },
        ]
      : []

    return {
      id: String(startId + i),
      nome: nomes[idx],
      telefone: `(54) 9${String(Math.floor(Math.random() * 9000 + 1000))}-${String(Math.floor(Math.random() * 9000 + 1000))}`,
      email: `${nomes[idx].toLowerCase().replace(/ /g, ".").normalize("NFD").replace(/[\u0300-\u036f]/g, "")}@email.com`,
      turma,
      baldes,
      ativo: true,
    }
  })
}

export const mockTurmas: Turma[] = [
  { id: "1", nome: "Turma 2025.1", semestre: "2025.1", totalParticipantes: 50, ativa: false },
  { id: "2", nome: "Turma 2025.2", semestre: "2025.2", totalParticipantes: 50, ativa: false },
  { id: "3", nome: "Turma 2026.1", semestre: "2026.1", totalParticipantes: 50, ativa: true },
]

export const mockParticipantes: Participante[] = [
  ...gerarParticipantes("2026.1", 50, 1),
]

export const mockDashboardStats: DashboardStats = {
  totalParticipantesAtivos: 50,
  totalBaldesTrimestre: mockParticipantes.reduce((acc, p) => {
    const baldeAtual = p.baldes.find(b => b.trimestre === "2026-Q1")
    return acc + (baldeAtual?.quantidade || 0)
  }, 0),
  estimativaCO2Evitado: 0,
  totalAduboGerado: 0,
}

// Calcula estimativas baseadas nos baldes (cada balde ~20L, ~10kg de residuos, ~2kg CO2 evitado, ~5kg adubo)
mockDashboardStats.estimativaCO2Evitado = Math.round(mockDashboardStats.totalBaldesTrimestre * 2)
mockDashboardStats.totalAduboGerado = Math.round(mockDashboardStats.totalBaldesTrimestre * 5)

export const mockBaldesTrimestral: BaldesTrimestral[] = [
  { trimestre: "2025-Q1", baldes: 280 },
  { trimestre: "2025-Q2", baldes: 320 },
  { trimestre: "2025-Q3", baldes: 350 },
  { trimestre: "2025-Q4", baldes: 310 },
  { trimestre: "2026-Q1", baldes: mockDashboardStats.totalBaldesTrimestre },
]

export const roleLabels: Record<UserRole, string> = {
  admin: "Administrador",
  gestor: "Gestor",
  voluntario: "Voluntario",
}

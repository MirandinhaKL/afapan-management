import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { RegisterBucketsDialog } from "@/components/dialogs/register-buckets-dialog"
import { type Participante } from "@/lib/mock-data"
import { type TurmaBucketPeriod } from "@/lib/supabase-queries"

const participante: Participante = {
  id: "participante-1",
  nome: "Participante",
  telefone: "54999999999",
  email: "participante@exemplo.com",
  turma: "2026",
  ativo: true,
  baldes: [1, 2, 3, 4].map((quantidade, index) => ({
    id: `balde-${index + 1}`,
    trimestre: `2026-Q1-R${index + 1}`,
    quantidade,
    dataRegistro: `2026-0${index + 1}-01`,
  })),
}

const periodos = [1, 2, 3, 4].map((numero, index) => ({
  id: `periodo-${numero}`,
  turma_id: "turma-1",
  periodo_numero: numero,
  periodo_label: `Registro ${numero}`,
  numero_periodo: numero,
  data_monitoramento: `2026-0${index + 1}-01`,
})) satisfies TurmaBucketPeriod[]

const propsBase = {
  open: true,
  onOpenChange: vi.fn(),
  participante,
  quantidade: "",
  onQuantidadeChange: vi.fn(),
  registroIndex: 0,
  onRegistroChange: vi.fn(),
  onRegister: vi.fn(),
  trimestre: "2026-Q1",
}

describe("RegisterBucketsDialog", () => {
  it("preserva o valor editado quando os períodos são carregados", async () => {
    const user = userEvent.setup()
    const onSalvarTodos = vi.fn().mockResolvedValue(undefined)
    const { rerender } = render(
      <RegisterBucketsDialog
        {...propsBase}
        turmaPeriodos={[]}
        onSalvarTodos={onSalvarTodos}
      />
    )

    const primeiroCampo = screen.getByLabelText("Baldes", { selector: "#quantidade-0" })
    await user.clear(primeiroCampo)
    await user.type(primeiroCampo, "9")

    rerender(
      <RegisterBucketsDialog
        {...propsBase}
        turmaPeriodos={periodos}
        onSalvarTodos={onSalvarTodos}
      />
    )

    expect(primeiroCampo).toHaveValue(9)

    await user.click(screen.getByRole("button", { name: "Salvar registros" }))

    expect(onSalvarTodos).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ index: 0, quantidade: "9" }),
      ])
    )
  })
})

import { useState, useEffect, useMemo } from "react"
import { type Participante, type Turma, type TurmaCompostagem } from "@/lib/mock-data"
import { type Balde, type TurmaBucketPeriod } from "@/lib/supabase-queries"
import {
  fetchParticipantesWithBaldes,
  fetchTurmas,
  fetchTurmasCompostagem,
  createTurmaCompostagem,
  updateTurmaCompostagem,
  deleteTurmaCompostagem,
  addParticipanteToTurma,
  removeParticipanteFromTurma,
  createParticipante,
   updateParticipante,
  fetchBaldesForParticipant,
  createBaldeRecord,
  updateBaldeRecord,
  deleteBaldeRecord,
  createParticipanteBucketLink,
  fetchTurmaBucketPeriods,
} from "@/lib/supabase-queries"
import { generateWhatsAppMessage } from "@/lib/whatsapp-utils"
import { toast } from "sonner"

const TRIMESTRE_ATUAL = "2026-Q1"
const TOTAL_REGISTROS_CAMPANHA = 4

const getRegistrosCampanhaSlots = (participante: Participante) => {
  const slots: Array<Participante["baldes"][number] | undefined> = Array.from(
    { length: TOTAL_REGISTROS_CAMPANHA },
    () => undefined
  )

  const registrosOrdenados = [...participante.baldes]
    .sort((a, b) => {
      const dataA = a.dataRegistro || a.trimestre
      const dataB = b.dataRegistro || b.trimestre
      return `${dataA}-${a.trimestre}`.localeCompare(`${dataB}-${b.trimestre}`)
    })

  const registrosSemSlot: Participante["baldes"] = []

  registrosOrdenados.forEach((registro) => {
    const slotMatch = registro.trimestre.match(/-R([1-4])$/)
    const slotIndex = slotMatch ? Number(slotMatch[1]) - 1 : -1

    if (slotIndex >= 0 && !slots[slotIndex]) {
      slots[slotIndex] = registro
    } else {
      registrosSemSlot.push(registro)
    }
  })

  registrosSemSlot.forEach((registro) => {
    const slotIndex = slots.findIndex((slot) => !slot)
    if (slotIndex >= 0) {
      slots[slotIndex] = registro
    }
  })

  return slots
}

const getRegistrosCampanha = (participante: Participante) => {
  return getRegistrosCampanhaSlots(participante).filter(Boolean) as Participante["baldes"]
}

export function useCompostagem() {
  // Participant states
  const [participantes, setParticipantes] = useState<Participante[]>([])
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"todos" | "preenchido" | "pendente">("todos")
  const [turmaFilter, setTurmaFilter] = useState<string>("")
  const [selectedParticipante, setSelectedParticipante] = useState<Participante | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [registerQuantidade, setRegisterQuantidade] = useState("")
  const [selectedRegistroIndex, setSelectedRegistroIndex] = useState(0)
  const [isCreateParticipanteOpen, setIsCreateParticipanteOpen] = useState(false)
  const [isEditParticipanteOpen, setIsEditParticipanteOpen] = useState(false)
  const [editingParticipante, setEditingParticipante] = useState<Participante | null>(null)

  // Turma management states
  const [turmasCompostagem, setTurmasCompostagem] = useState<(TurmaCompostagem & { participantes: Participante[]; totalParticipantes?: number })[]>([])
  const [isCreateTurmaOpen, setIsCreateTurmaOpen] = useState(false)
  const [isCreatingTurma, setIsCreatingTurma] = useState(false)
  const [newTurmaName, setNewTurmaName] = useState("")
  const [newTurmaDescription, setNewTurmaDescription] = useState("")
  const [newTurmaDatas, setNewTurmaDatas] = useState({
    data1: '',
    data2: '',
    data3: '',
    data4: ''
  })
  const [selectedTurma, setSelectedTurma] = useState<(TurmaCompostagem & { participantes: Participante[]; totalParticipantes?: number }) | null>(null)
  const [isTurmaDetailOpen, setIsTurmaDetailOpen] = useState(false)
  const [isAddParticipantOpen, setIsAddParticipantOpen] = useState(false)

  // Bucket records states
  const [baldes, setBaldes] = useState<Balde[]>([])
  const [isLoadingBaldes, setIsLoadingBaldes] = useState(false)
  const [turmaPeriodos, setTurmaPeriodos] = useState<TurmaBucketPeriod[]>([])

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [turmasData, turmasCompostagemData] = await Promise.all([
          fetchTurmas(),
          fetchTurmasCompostagem(),
        ])

        const ultimaTurma = turmasData[0]
        let participantesData: Participante[] = []

        if (ultimaTurma) {
          try {
            participantesData = await fetchParticipantesWithBaldes(ultimaTurma.id)
          } catch (participantesError) {
            console.error("Erro ao carregar participantes do último programa:", participantesError)
            toast.error("Turmas carregadas, mas não foi possível carregar os participantes do último programa")
          }
        }

        setParticipantes(participantesData)
        setTurmas(turmasData)
        setTurmasCompostagem(
          turmasCompostagemData.map((turma) => ({
            ...turma,
            participantes: turma.id === ultimaTurma?.id ? participantesData : [],
            totalParticipantes: turmasData.find((item) => item.id === turma.id)?.totalParticipantes || 0,
          }))
        )
        if (ultimaTurma) {
          setTurmaFilter(ultimaTurma.nome)
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
        toast.error("Erro ao carregar dados do Supabase")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Sincronizar selectedTurma com turmasCompostagem para manter dados atualizados
  useEffect(() => {
    if (selectedTurma) {
      const updatedTurma = turmasCompostagem.find((t) => t.id === selectedTurma.id)
      if (updatedTurma) {
        setSelectedTurma(updatedTurma)
      }
    }
  }, [turmasCompostagem])

  const filteredParticipantes = useMemo(() => {
    return participantes
      .filter((p) => p.turma === turmaFilter)
      .filter(
        (p) =>
          p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.telefone.includes(searchTerm)
      )
      .filter((p) => {
        if (statusFilter === "todos") return true
        const campanhaCompleta = getRegistrosCampanha(p).length >= TOTAL_REGISTROS_CAMPANHA
        return statusFilter === "preenchido" ? campanhaCompleta : !campanhaCompleta
      })
  }, [participantes, searchTerm, statusFilter, turmaFilter])

  const stats = useMemo(() => {
    const turmaParticipantes = participantes.filter((p) => p.turma === turmaFilter)
    const preenchidos = turmaParticipantes.filter(
      (p) => getRegistrosCampanha(p).length >= TOTAL_REGISTROS_CAMPANHA
    )
    const totalBaldes = turmaParticipantes.reduce((acc, p) => {
      return acc + getRegistrosCampanha(p).reduce((total, balde) => total + (balde.quantidade || 0), 0)
    }, 0)

    return {
      total: turmaParticipantes.length,
      preenchidos: preenchidos.length,
      pendentes: turmaParticipantes.length - preenchidos.length,
      totalBaldes,
    }
  }, [participantes, turmaFilter])

  const getStatus = (participante: Participante) =>
    getRegistrosCampanha(participante).length >= TOTAL_REGISTROS_CAMPANHA

  const loadParticipantesDaTurma = async (turmaId: string) => {
    const participantesData = await fetchParticipantesWithBaldes(turmaId)
    const turma = turmas.find((item) => item.id === turmaId)

    setTurmasCompostagem((prev) =>
      prev.map((item) =>
        item.id === turmaId
          ? {
              ...item,
              participantes: participantesData,
              totalParticipantes: turma?.totalParticipantes || participantesData.length,
            }
          : item
      )
    )

    return participantesData
  }

  const handleTurmaFilterChange = async (turmaNome: string) => {
    setTurmaFilter(turmaNome)
    const turma = turmas.find((item) => item.nome === turmaNome)

    if (!turma) {
      setParticipantes([])
      return
    }

    try {
      setLoading(true)
      const participantesData = await loadParticipantesDaTurma(turma.id)
      setParticipantes(participantesData)
    } catch (error) {
      console.error("Erro ao carregar participantes da turma:", error)
      toast.error("Erro ao carregar participantes da turma")
    } finally {
      setLoading(false)
    }
  }

  // Participant handlers
  const handleGerarLink = async (participante: Participante) => {
    const whatsappWindow = typeof window !== "undefined" ? window.open("", "_blank") : null

    try {
      // Buscar a turma do participante
      const turmaParticipante = turmasCompostagem.find(
        (t) => t.nome === participante.turma
      )

      if (!turmaParticipante) {
        whatsappWindow?.close()
        toast.error("Turma não encontrada")
        return
      }

      // Buscar os períodos da turma
      const periodos = await fetchTurmaBucketPeriods(turmaParticipante.id)

      if (periodos.length === 0) {
        whatsappWindow?.close()
        toast.error("Nenhum período configurado para esta turma")
        return
      }

      // Encontrar o período atual ou o primeiro período disponível
      const periodoAtual = periodos.find((p) => {
        const dataMonitoramento = new Date(p.data_monitoramento)
        return dataMonitoramento > new Date()
      }) || periodos[0]

      // Criar o link
      const linkData = await createParticipanteBucketLink(
        participante.id,
        periodoAtual.id
      )

      // Gerar a mensagem
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL ||
        (typeof window !== 'undefined' ? window.location.origin : undefined)
      const mensagem = generateWhatsAppMessage(
        linkData.token,
        participante.nome,
        periodoAtual.periodo_label,
        baseUrl
      )

      // Criar URL do WhatsApp com telefone do participante
      const telefoneClean = participante.telefone.replace(/\D/g, "")
      const telefoneWhatsApp = telefoneClean.startsWith("55") ? telefoneClean : `55${telefoneClean}`
      const whatsappUrl = `https://wa.me/${telefoneWhatsApp}?text=${encodeURIComponent(mensagem)}`

      if (whatsappWindow) {
        whatsappWindow.location.href = whatsappUrl
      } else {
        window.location.href = whatsappUrl
      }
      toast.success(`Link gerado para ${participante.nome}`, {
        description: "A janela do WhatsApp foi aberta.",
      })
    } catch (error) {
      whatsappWindow?.close()
      console.error("Erro ao gerar link:", error)
      toast.error("Erro ao gerar link", {
        description: error instanceof Error ? error.message : "Tente novamente",
      })
    }
  }

  const handleRegistrarManual = async () => {
    if (!selectedParticipante || !registerQuantidade) {
      toast.error("Informe a quantidade de baldes")
      return
    }

    const qtd = parseInt(registerQuantidade)
    if (isNaN(qtd) || qtd < 0) {
      toast.error("Quantidade inválida")
      return
    }

    try {
      const registrosCampanha = getRegistrosCampanhaSlots(selectedParticipante)
      const registroAtual = registrosCampanha[selectedRegistroIndex]
      const dataRegistro = registroAtual?.dataRegistro || new Date().toISOString().split("T")[0]
      let registroSalvoId = registroAtual?.id

      if (registroAtual?.id) {
        await updateBaldeRecord(registroAtual.id, {
          quantidade: qtd,
          data_registro: dataRegistro,
        })
      } else {
        const novoRegistro = await createBaldeRecord(
          selectedParticipante.id,
          qtd,
          dataRegistro,
          `${TRIMESTRE_ATUAL}-R${selectedRegistroIndex + 1}`
        )
        registroSalvoId = novoRegistro.id
      }

      let participanteAtualizado: Participante | null = null

      setParticipantes((prev) =>
        prev.map((p) => {
          if (p.id !== selectedParticipante.id) return p
          const baldesAtualizados = [...p.baldes]
          const registroAtualizado = {
            ...registroAtual,
            id: registroSalvoId,
            trimestre: registroAtual?.trimestre || `${TRIMESTRE_ATUAL}-R${selectedRegistroIndex + 1}`,
            quantidade: qtd,
            dataRegistro,
          }

          if (registroAtual) {
            const registroIndex = baldesAtualizados.findIndex((b) =>
              registroAtual.id ? b.id === registroAtual.id : b === registroAtual
            )

            if (registroIndex >= 0) {
              baldesAtualizados[registroIndex] = registroAtualizado
            } else {
              baldesAtualizados.push(registroAtualizado)
            }
          } else {
            baldesAtualizados.push(registroAtualizado)
          }

          participanteAtualizado = { ...p, baldes: baldesAtualizados }
          return participanteAtualizado
        })
      )

      if (participanteAtualizado) {
        setSelectedParticipante(participanteAtualizado)
      }

      toast.success(`Registro salvo para ${selectedParticipante.nome}`, {
        description: `${qtd} baldes salvos no registro ${selectedRegistroIndex + 1}.`,
      })
      setIsRegisterOpen(false)
      setRegisterQuantidade("")
    } catch (error) {
      console.error("Erro ao registrar baldes:", error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      toast.error("Erro ao salvar registro", {
        description: errorMessage
      })
    }
  }

  const openDetail = (participante: Participante) => {
    setSelectedParticipante(participante)
    setIsDetailOpen(true)
  }

  const openRegister = (participante: Participante) => {
    setSelectedParticipante(participante)
    const registrosCampanha = getRegistrosCampanhaSlots(participante)
    const primeiroRegistroPendente = Array.from(
      { length: TOTAL_REGISTROS_CAMPANHA },
      (_, index) => index
    ).find((index) => !registrosCampanha[index])
    const registroIndex = primeiroRegistroPendente ?? 0

    setSelectedRegistroIndex(registroIndex)
    setRegisterQuantidade(registrosCampanha[registroIndex] ? String(registrosCampanha[registroIndex].quantidade) : "")
    setTurmaPeriodos([])
    setIsRegisterOpen(true)

    const turmaAssociada =
      turmasCompostagem.find((t) => t.nome === participante.turma) ||
      turmasCompostagem.find((t) => t.participantes.some((p) => p.id === participante.id)) ||
      turmas.find((t) => t.nome === participante.turma) ||
      turmas.find((t) => t.nome === turmaFilter)

    if (!turmaAssociada) {
      return
    }

    fetchTurmaBucketPeriods(turmaAssociada.id)
      .then(setTurmaPeriodos)
      .catch((error) => {
        console.error("Erro ao buscar períodos da turma:", error)
        setTurmaPeriodos([])
      })
  }

  const handleSalvarTodosBuckets = async (
    registros: Array<{
      index: number
      quantidade: string
      data: string
      periodo?: TurmaBucketPeriod
    }>
  ) => {
    if (!selectedParticipante) {
      toast.error("Participante não selecionado")
      return
    }

    try {
      const baldesAtualizados = [...selectedParticipante.baldes]
      let savednCount = 0

      for (const registro of registros) {
        if (registro.quantidade.trim() === "") continue

        const qtd = parseInt(registro.quantidade)
        if (isNaN(qtd) || qtd < 0) {
          toast.error(`Quantidade inválida para o período ${registro.index + 1}`)
          return
        }

        const registrosCampanha = getRegistrosCampanhaSlots(selectedParticipante)
        const registroAtual = registrosCampanha[registro.index]
        const trimestre = `${TRIMESTRE_ATUAL}-R${registro.index + 1}`
        const dataRegistro = registro.data || new Date().toISOString().split("T")[0]

        const registroAtualizado = {
          ...registroAtual,
          id: registroAtual?.id,
          trimestre,
          quantidade: qtd,
          dataRegistro,
        }

        if (registroAtual?.id) {
          await updateBaldeRecord(registroAtual.id, {
            quantidade: qtd,
            data_registro: dataRegistro,
          })
        } else {
          const novoRegistro = await createBaldeRecord(
            selectedParticipante.id,
            qtd,
            dataRegistro,
            trimestre
          )
          registroAtualizado.id = novoRegistro.id
        }

        const registroIndex = baldesAtualizados.findIndex((b) =>
          registroAtual?.id ? b.id === registroAtual.id : b.trimestre === trimestre
        )
        if (registroIndex >= 0) {
          baldesAtualizados[registroIndex] = registroAtualizado
        } else {
          baldesAtualizados.push(registroAtualizado)
        }
        savednCount++
      }

      setParticipantes((prev) =>
        prev.map((p) =>
          p.id === selectedParticipante.id
            ? { ...p, baldes: baldesAtualizados }
            : p
        )
      )

      setSelectedParticipante({ ...selectedParticipante, baldes: baldesAtualizados })

      toast.success(`${savednCount} registro(s) salvo(s) com sucesso!`, {
        description: `Baldes registrados para ${selectedParticipante.nome}.`,
      })
      setIsRegisterOpen(false)
    } catch (error) {
      console.error("Erro ao salvar registros de baldes:", error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      toast.error("Erro ao salvar registros", {
        description: errorMessage
      })
    }
  }

  const handleCreateParticipante = async (data: {
    nome: string
    telefone: string
    email: string
    turma: string
    turmaCompostagem: string
    endereco?: string
    bairro?: string
    cidade?: string
    estado?: string
    cep?: string
  }) => {
    try {
      console.log("handleCreateParticipante chamado com:", data)
      
      const createdParticipante = await createParticipante({
        nome: data.nome,
        telefone: data.telefone,
        email: data.email,
        turma: data.turma,
        endereco: data.endereco,
        bairro: data.bairro,
        cidade: data.cidade,
        estado: data.estado,
        cep: data.cep,
        ativo: true,
      })

      console.log("Participante criado:", createdParticipante)

      // Convert to MockParticipante with baldes property
      const newParticipante: typeof participantes[0] = {
        ...createdParticipante,
        telefone: createdParticipante.telefone || '',
        baldes: [],
      }

      setParticipantes((prev) => [...prev, newParticipante])
      
      // Encontrar a turma de compostagem pelo nome e adicionar participante a ela
      const turmaCompostagemSelected = turmasCompostagem.find((t) => t.nome === data.turmaCompostagem)
      if (turmaCompostagemSelected) {
        console.log("Adicionando participante à turma:", turmaCompostagemSelected.id)
        
        try {
          // Salvar a relação no banco de dados
          await addParticipanteToTurma(createdParticipante.id, turmaCompostagemSelected.id)
          console.log("Relação criada no banco de dados")
        } catch (relationError) {
          console.error("Erro ao criar relação no banco:", relationError)
        }
        
        // Atualizar estado local
        setTurmasCompostagem((prev) =>
          prev.map((t) =>
            t.id === turmaCompostagemSelected.id
              ? {
                  ...t,
                  participantes: [...t.participantes, newParticipante],
                  totalParticipantes: (t.totalParticipantes || t.participantes.length) + 1,
                }
              : t
          )
        )
      }
      
      toast.success(`Participante "${newParticipante.nome}" criado com sucesso`)
      setIsCreateParticipanteOpen(false)
    } catch (error) {
      console.error("Erro ao criar participante:", error)
      toast.error("Erro ao criar participante")
    }
  }

  const handleEditParticipante = async (data: {
    nome: string
    telefone: string
    email: string
    turma: string
    endereco?: string
    bairro?: string
    cidade?: string
    estado?: string
    cep?: string
  }) => {
    if (!editingParticipante) {
      console.error("Nenhum participante em edição")
      return
    }

    try {
      console.log("Iniciando edição do participante:", editingParticipante.id)
      console.log("Dados a atualizar:", data)

      const updateData = {
        nome: data.nome,
        telefone: data.telefone,
        email: data.email,
        turma: data.turma,
        endereco: data.endereco,
        bairro: data.bairro,
        cidade: data.cidade,
        estado: data.estado,
        cep: data.cep,
      }

      console.log("Chamando updateParticipante com:", updateData)
      const updatedParticipante = await updateParticipante(editingParticipante.id, updateData)

      console.log("Resposta do updateParticipante:", updatedParticipante)

      if (!updatedParticipante) {
        console.error("updateParticipante retornou undefined/null")
        toast.error("Erro: resposta inválida do servidor")
        return
      }

      const participanteAtualizado = {
        ...editingParticipante,
        ...updatedParticipante,
        ...data,
        baldes: editingParticipante.baldes,
      }

      const turmaAlterada = data.turma !== editingParticipante.turma
      const oldTurma = turmas.find((t) => t.nome === editingParticipante.turma)
      const newTurma = turmas.find((t) => t.nome === data.turma)

      if (turmaAlterada && oldTurma && newTurma) {
        try {
          await removeParticipanteFromTurma(editingParticipante.id, oldTurma.id)
          await addParticipanteToTurma(editingParticipante.id, newTurma.id)

          setTurmas((prev) =>
            prev.map((t) => {
              if (t.id === oldTurma.id) {
                return {
                  ...t,
                  totalParticipantes: Math.max(0, (t.totalParticipantes || 0) - 1),
                }
              }
              if (t.id === newTurma.id) {
                return {
                  ...t,
                  totalParticipantes: (t.totalParticipantes || 0) + 1,
                }
              }
              return t
            })
          )

          setTurmasCompostagem((prev) =>
            prev.map((t) => {
              if (t.id === oldTurma.id) {
                return {
                  ...t,
                  participantes: t.participantes.filter((p) => p.id !== editingParticipante.id),
                  totalParticipantes: Math.max(0, (t.totalParticipantes || t.participantes.length) - 1),
                }
              }
              if (t.id === newTurma.id) {
                const alreadyInNew = t.participantes.some((p) => p.id === editingParticipante.id)
                return {
                  ...t,
                  participantes: alreadyInNew
                    ? t.participantes.map((p) =>
                        p.id === editingParticipante.id ? participanteAtualizado : p
                      )
                    : [...t.participantes, participanteAtualizado],
                  totalParticipantes: (t.totalParticipantes || t.participantes.length) + (alreadyInNew ? 0 : 1),
                }
              }
              return t
            })
          )
        } catch (relationError) {
          console.error("Erro ao atualizar relacionamento de turma:", relationError)
        }
      }

      setParticipantes((prev) =>
        prev.map((p) =>
          p.id === editingParticipante.id
            ? {
                ...p,
                ...updatedParticipante,
                ...data,
                baldes: p.baldes,
              }
            : p
        )
      )

      toast.success(`Participante "${data.nome}" atualizado com sucesso`)
      setIsEditParticipanteOpen(false)
      setEditingParticipante(null)
    } catch (error) {
      console.error("ERRO ao editar participante:", error)
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
      console.error("Detalhes do erro:", errorMessage)
      toast.error(`Erro ao editar participante: ${errorMessage}`)
    }
  }

  const openEditParticipante = (participante: Participante) => {
    setEditingParticipante(participante)
    setIsEditParticipanteOpen(true)
  }

  // Turma handlers
  const handleCreateTurma = async () => {
    if (isCreatingTurma) {
      return false
    }

    if (!newTurmaName.trim()) {
      toast.error("Nome da turma é obrigatório")
      return
    }

    // Validar que todas as 4 datas foram preenchidas
    const datasMonitoramento = Object.values(newTurmaDatas).map((data) => data.trim())
    const datasPreenchidas = datasMonitoramento.every((data) => data !== "")
    if (!datasPreenchidas) {
      toast.error("Todas as 4 datas de monitoramento são obrigatórias")
      return
    }

    try {
      setIsCreatingTurma(true)
      const newTurma = await createTurmaCompostagem({
        nome: newTurmaName.trim(),
        descricao: newTurmaDescription.trim() || undefined,
        ativo: true,
      }, datasMonitoramento)

      setTurmasCompostagem((prev) => [
        { ...newTurma, participantes: [], totalParticipantes: 0 },
        ...prev,
      ])
      setTurmas((prev) => [
        {
          id: newTurma.id,
          nome: newTurma.nome,
          semestre: newTurma.nome,
          totalParticipantes: 0,
          ativa: newTurma.ativo,
        },
        ...prev,
      ])
      setParticipantes([])
      setTurmaFilter(newTurma.nome)
      toast.success(`Turma "${newTurma.nome}" criada com sucesso com 4 períodos de monitoramento`)
      setIsCreateTurmaOpen(false)
      setNewTurmaName("")
      setNewTurmaDescription("")
      setNewTurmaDatas({ data1: '', data2: '', data3: '', data4: '' })
      return true
    } catch (error) {
      console.error("Erro ao criar turma:", error)
      toast.error("Erro ao criar turma", {
        description: error instanceof Error ? error.message : "Tente novamente",
      })
      return false
    } finally {
      setIsCreatingTurma(false)
    }
  }

  const handleDeleteTurma = async (turmaId: string) => {
    try {
      const turmaRemovida = turmas.find((turma) => turma.id === turmaId)

      await deleteTurmaCompostagem(turmaId)
      setTurmasCompostagem((prev) => prev.filter((t) => t.id !== turmaId))
      setTurmas((prev) => {
        const turmasAtualizadas = prev.filter((turma) => turma.id !== turmaId)

        if (turmaRemovida?.nome === turmaFilter) {
          const proximaTurma = turmasAtualizadas[0]
          setTurmaFilter(proximaTurma?.nome || "")
          setParticipantes([])

          if (proximaTurma) {
            loadParticipantesDaTurma(proximaTurma.id)
              .then(setParticipantes)
              .catch((error) => {
                console.error("Erro ao carregar próxima turma:", error)
              })
          }
        }

        return turmasAtualizadas
      })

      if (selectedTurma?.id === turmaId) {
        setSelectedTurma(null)
        setIsTurmaDetailOpen(false)
        setIsAddParticipantOpen(false)
      }

      toast.success("Turma excluída com sucesso")
    } catch (error) {
      console.error("Erro ao excluir turma:", error)
      toast.error("Erro ao excluir turma", {
        description: error instanceof Error ? error.message : "Tente novamente",
      })
    }
  }

  const handleAddParticipantToTurma = async (participanteId: string) => {
    if (!selectedTurma) return

    try {
      await addParticipanteToTurma(participanteId, selectedTurma.id)

      const participante = participantes.find((p) => p.id === participanteId)
      if (participante) {
        setTurmasCompostagem((prev) =>
          prev.map((t) =>
            t.id === selectedTurma.id
              ? {
                  ...t,
                  participantes: [...t.participantes, participante],
                  totalParticipantes: (t.totalParticipantes || t.participantes.length) + 1,
                }
              : t
          )
        )
        
        // Atualizar selectedTurma para refletir na modal
        setSelectedTurma((prev) =>
          prev
            ? {
                ...prev,
                participantes: [...prev.participantes, participante],
                totalParticipantes: (prev.totalParticipantes || prev.participantes.length) + 1,
              }
            : null
        )
        
        toast.success(`${participante.nome} adicionado à turma`)
      }
      setIsAddParticipantOpen(false)
    } catch (error) {
      console.error("Erro ao adicionar participante:", error)
      toast.error("Erro ao adicionar participante")
    }
  }

  const handleRemoveParticipantFromTurma = async (participanteId: string, turmaId: string) => {
    try {
      await removeParticipanteFromTurma(participanteId, turmaId)

      setTurmasCompostagem((prev) =>
        prev.map((t) =>
          t.id === turmaId
            ? {
                ...t,
                participantes: t.participantes.filter((p) => p.id !== participanteId),
                totalParticipantes: Math.max((t.totalParticipantes || t.participantes.length) - 1, 0),
              }
            : t
        )
      )
      
      // Atualizar selectedTurma se estiver visualizando esta turma
      if (selectedTurma && selectedTurma.id === turmaId) {
        setSelectedTurma({
          ...selectedTurma,
          participantes: selectedTurma.participantes.filter((p) => p.id !== participanteId),
          totalParticipantes: Math.max(
            (selectedTurma.totalParticipantes || selectedTurma.participantes.length) - 1,
            0
          ),
        })
      }
      
      toast.success("Participante removido da turma")
    } catch (error) {
      console.error("Erro ao remover participante:", error)
      toast.error("Erro ao remover participante")
    }
  }

  const openTurmaDetail = async (turma: TurmaCompostagem & { participantes: Participante[]; totalParticipantes?: number }) => {
    let turmaAtualizada = turma

    if (turma.participantes.length === 0 && (turma.totalParticipantes || 0) > 0) {
      try {
        const participantesData = await loadParticipantesDaTurma(turma.id)
        turmaAtualizada = { ...turma, participantes: participantesData }
      } catch (error) {
        console.error("Erro ao carregar participantes da turma:", error)
        toast.error("Erro ao carregar participantes da turma")
      }
    }

    setSelectedTurma(turmaAtualizada)
    setIsTurmaDetailOpen(true)
  }

  const openAddParticipant = async (turma: TurmaCompostagem & { participantes: Participante[]; totalParticipantes?: number }) => {
    let turmaAtualizada = turma

    if (turma.participantes.length === 0 && (turma.totalParticipantes || 0) > 0) {
      try {
        const participantesData = await loadParticipantesDaTurma(turma.id)
        turmaAtualizada = { ...turma, participantes: participantesData }
      } catch (error) {
        console.error("Erro ao carregar participantes da turma:", error)
        toast.error("Erro ao carregar participantes da turma")
      }
    }

    setSelectedTurma(turmaAtualizada)
    setIsAddParticipantOpen(true)
  }

  // Bucket records handlers
  const fetchBaldesForSelectedParticipant = async () => {
    if (!selectedParticipante) return
    
    try {
      setIsLoadingBaldes(true)
      const baldesData = await fetchBaldesForParticipant(selectedParticipante.id)
      setBaldes(baldesData)
    } catch (error) {
      console.error("Erro ao buscar baldes:", error)
      toast.error("Erro ao buscar registros de baldes")
    } finally {
      setIsLoadingBaldes(false)
    }
  }

  const handleAddBucketRecord = async (data: { quantidade: number; dataRegistro: string; trimestre?: string }) => {
    if (!selectedParticipante) {
      toast.error("Nenhum participante selecionado")
      return
    }

    try {
      setIsLoadingBaldes(true)
      const newBalde = await createBaldeRecord(
        selectedParticipante.id,
        data.quantidade,
        data.dataRegistro,
        data.trimestre
      )
      
      setBaldes((prev) => [newBalde, ...prev])
      
      // Refresh participant data
      await refreshParticipantsAndStats()
      
      toast.success(`Registro de ${data.quantidade} baldes adicionado com sucesso`)
    } catch (error) {
      console.error("Erro ao criar registro de balde:", error)
      toast.error("Erro ao criar registro de balde")
    } finally {
      setIsLoadingBaldes(false)
    }
  }

  const handleEditBucketRecord = async (baldeId: string, data: { quantidade: number; dataRegistro: string }) => {
    try {
      setIsLoadingBaldes(true)
      const updatedBalde = await updateBaldeRecord(baldeId, {
        quantidade: data.quantidade,
        data_registro: data.dataRegistro,
      })
      
      setBaldes((prev) =>
        prev.map((b) => (b.id === baldeId ? updatedBalde : b))
      )
      
      // Refresh participant data
      await refreshParticipantsAndStats()
      
      toast.success("Registro atualizado com sucesso")
    } catch (error) {
      console.error("Erro ao atualizar registro de balde:", error)
      toast.error("Erro ao atualizar registro de balde")
    } finally {
      setIsLoadingBaldes(false)
    }
  }

  const handleDeleteBucketRecord = async (baldeId: string) => {
    try {
      setIsLoadingBaldes(true)
      await deleteBaldeRecord(baldeId)
      
      setBaldes((prev) => prev.filter((b) => b.id !== baldeId))
      
      // Refresh participant data
      await refreshParticipantsAndStats()
      
      toast.success("Registro deletado com sucesso")
    } catch (error) {
      console.error("Erro ao deletar registro de balde:", error)
      toast.error("Erro ao deletar registro de balde")
    } finally {
      setIsLoadingBaldes(false)
    }
  }

  // Helper function to refresh participants data after bucket record changes
  const refreshParticipantsAndStats = async () => {
    try {
      const turma = turmas.find((item) => item.nome === turmaFilter)
      const participantesData = await fetchParticipantesWithBaldes(turma?.id)
      setParticipantes(participantesData)
      
      // Update selected participant if it exists
      if (selectedParticipante) {
        const updated = participantesData.find((p) => p.id === selectedParticipante.id)
        if (updated) {
          setSelectedParticipante(updated)
        }
      }
    } catch (error) {
      console.error("Erro ao atualizar dados:", error)
    }
  }

  return {
    // Participant states
    participantes,
    turmas,
    loading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    turmaFilter,
    setTurmaFilter: handleTurmaFilterChange,
    selectedParticipante,
    isDetailOpen,
    setIsDetailOpen,
    isRegisterOpen,
    setIsRegisterOpen,
    registerQuantidade,
    setRegisterQuantidade,
    selectedRegistroIndex,
    setSelectedRegistroIndex,
    filteredParticipantes,
    stats,
    isCreateParticipanteOpen,
    setIsCreateParticipanteOpen,
    isEditParticipanteOpen,
    setIsEditParticipanteOpen,
    editingParticipante,
    handleCreateParticipante,
    handleEditParticipante,
    openEditParticipante,

    // Turma states
    turmasCompostagem,
    isCreateTurmaOpen,
    isCreatingTurma,
    setIsCreateTurmaOpen,
    newTurmaName,
    setNewTurmaName,
    newTurmaDescription,
    setNewTurmaDescription,
    newTurmaDatas,
    setNewTurmaDatas,
    selectedTurma,
    isTurmaDetailOpen,
    setIsTurmaDetailOpen,
    isAddParticipantOpen,
    setIsAddParticipantOpen,

    // Constants
    TRIMESTRE_ATUAL,

    // Utility functions
    getStatus,
    handleGerarLink,
    handleRegistrarManual,
    openDetail,
    openRegister,
    handleCreateTurma,
    handleDeleteTurma,
    handleAddParticipantToTurma,
    handleRemoveParticipantFromTurma,
    openTurmaDetail,
    openAddParticipant,

    // Bucket records
    baldes,
    isLoadingBaldes,
    fetchBaldesForSelectedParticipant,
    handleAddBucketRecord,
    handleEditBucketRecord,
    handleDeleteBucketRecord,
    turmaPeriodos,
    handleSalvarTodosBuckets,
  }
}

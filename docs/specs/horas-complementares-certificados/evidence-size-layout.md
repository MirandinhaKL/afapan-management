# Tamanho e apresentação dos comprovantes — 2026-11-06

Solicitação da responsável: melhorar a separação entre “Escolher arquivos” e a indicação do arquivo, e bloquear conjuntos acima de 50 MB. Revisão autorizada diretamente na solicitação.

Comportamento: botão nativo de escolha com fundo, margens e preenchimento próprios, mantendo associação ao rótulo e seleção acessível. Novas solicitações e correções aceitam até cinco arquivos com soma até 50 MiB, usando a mesma unidade binária dos limites já existentes. Limites individuais permanecem imagem 10 MiB, PDF 15 MiB e vídeo 50 MiB. Esta regra substitui a proposta anterior de 100 MiB.

Plano: validar soma no schema compartilhado do formulário e da API de reserva, e também no manifesto conferido pela API de submissão. Atualizar mensagens dos dois formulários. Sem alterar banco, políticas, dados ou dependências.

Riscos: sessões antigas com mais de 50 MiB serão rejeitadas no novo envio; arquivos históricos permanecem preservados. A soma não inclui arquivos de outras solicitações ou revisões.

Critérios: exatamente 50 MiB aceitos, um byte adicional rejeitado antes do upload; conferência do manifesto também rejeita excesso. Separação visual entre botão e nome do arquivo. Testes de limite e formulário, TypeScript e build local.

# Plano resumido

Aplicar os três ajustes juntos no componente público. Copiar a imagem original enviada para `public/afapan-voluntarios-a.jpeg`, sem edição do bitmap. Usar contêiner 4:3 e object-contain para preservar toda a imagem. Remover o controle e a inicialização de expectations apenas no formulário público; manter contrato opcional, banco, dados históricos e administração. Atualizar testes existentes e verificar TypeScript.

Sem migração, alteração de RLS ou operação externa. Reversão: restaurar apresentação anterior, sem alteração dos registros.

Tooltip do botão Copiar link: reutilizar Tooltip/TooltipTrigger asChild/TooltipContent do projeto com o texto exato solicitado. Cobrir hover e foco, preservando testes de cópia. Ajuste exclusivamente de apresentação.

Gestão interna: retirar seção de endereço e estado/efeito registrationUrl. A cópia continua montando URL absoluta com a origem atual ao clicar; manter região status independente e corrigir mensagem de erro para não referenciar endereço removido. Cobrir ausência de endereço, cópia, teclado e falha em testes.

Pergunta unificada: remover controle e inicialização públicos de discoverySource; reutilizar afapanStory com o texto aprovado. Não concatenar nem reescrever dados históricos. Campos opcionais e administração permanecem compatíveis. Cobrir ausência das duas perguntas antigas e preenchimento da nova pergunta nos testes.

Revisão autorizada em 2026-10-12: usar object-cover e posição 50%/40% com proporção 16:7 a partir de sm; manter 4:3 no celular. Substitui object-contain e o enquadramento integral anterior. Não editar o bitmap nem retocar rostos.

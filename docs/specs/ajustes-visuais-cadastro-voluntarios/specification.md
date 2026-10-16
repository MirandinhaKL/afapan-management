# Ajustes do formulário público

Data: 2026-10-12. Escopo reunido e autorizado pela responsável com “Pode seguir”. Revisão resumida de apresentação, sem mudança de banco.

- RF-001 / CA-001: substituir “Cadastro de novos voluntários” por “Cadastro de voluntário”, mantendo a identificação institucional.
- RF-002 / CA-002: utilizar a foto enviada `afapan-voluntarios-a.jpeg`, com enquadramento 4:3 no celular e recorte horizontal 16:7 no computador, semelhante à primeira versão. Preservar proporções e o arquivo original, sem modificar ou retocar rostos. Revisão autorizada pela responsável em 2026-10-12.
- RF-003 / CA-003: remover o campo “O que você espera da AFAPAN?” do formulário público. Preservar dados existentes e fluxos administrativos.
- RF-004 / CA-004: reunir as perguntas de descoberta e história em um único campo público com o texto exato: “Como você conheceu a AFAPAN? Conte um pouco da sua história e da sua trajetória junto à associação. Fique à vontade para compartilhar suas experiências, lembranças e momentos marcantes! 💚🌱”. Registrar novos relatos em afapanStory; preservar respostas antigas e administração.
- RNF-001: preservar os demais campos, validações, consentimentos e envio.

- RF-006 / CA-006: botão Copiar link deve apresentar tooltip “Link público para cadastro de voluntários” ao passar o mouse e ao receber foco de teclado, sem mudar a ação de cópia.

- RF-005 / CA-005: remover da gestão de voluntários o bloco “Link do formulário” com endereço explícito. Preservar o botão Copiar link, seus avisos acessíveis e a independência da listagem. Falha orienta nova tentativa/permissões, sem mostrar endereço. Revisão autorizada pela responsável e substitui a exigência anterior de endereço sempre visível do cadastro permanente.

Riscos: recorte ou distorção da imagem e regressão no envio. Validação por testes do formulário e TypeScript; publicação e conferência remota permanecem separadas.

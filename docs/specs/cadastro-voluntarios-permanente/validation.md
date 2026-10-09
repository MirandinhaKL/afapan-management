# Validação local — 2026-10-09

Plano e implementação local aprovados. Nenhum SQL remoto nem publicação executados.

- Suíte completa: 22 arquivos, 131 testes aprovados (`npm.cmd test -- --maxWorkers=2`).
- Testes relevantes: 87 aprovados antes dos últimos ajustes; a suíte completa inclui os testes adicionais.
- TypeScript: `tsc --noEmit` aprovado após os ajustes finais.
- Build Next.js: aprovado. TypeScript conferido separadamente, pois o build utiliza configuração que ignora essa etapa.
- Uma execução de testes concorrente ao build excedeu o tempo de um teste de filtro; a repetição isolada passou integralmente, sem alteração de timeout ou retirada de teste.
- SQL: revisão e testes estáticos aprovados; execução PostgreSQL não realizada por ausência de ambiente local.
- Teclado: testes de interação e cópia aprovados; componentes mantêm controles nativos, rótulos e foco visível.
- Capturas headless da prévia local usam configuração simulada e bloqueiam chamadas de API externa. A ferramenta de navegador interativo falhou na inicialização do ambiente. Capturas com emulação real de viewport aprovadas em 390 px e 1440 px: formulário completo, textos legíveis e ausência de overflow horizontal (largura móvel 390/390 px). A confirmação em dispositivo real e fluxos administrativos autenticados permanece no roteiro de publicação.

| Critério | Evidência local | Verificação remota pendente |
| --- | --- | --- |
| CA-001 | Página/API/formulário sem consulta de campanha; preenchimento e envio simulados | Abrir e enviar no ambiente alvo |
| CA-002 | Nova RPC sem consulta de campanha, vínculo nulo e situação fixa | Conferir registro persistido com campanhas históricas |
| CA-003 | Link absoluto; cópia, falha e listagem indisponível testados | Confirmar origem pública publicada |
| CA-004 | Controles, diálogo e consultas de campanha removidos | Conferir versão publicada |
| CA-005 | Versões obrigatórias; SQL utiliza configuração canônica; rejeição de versão testada | Comparar aceites/textos/instantes gravados |
| CA-006 | Expiração sem efeitos e cancelamento de job conhecido revisados | Conferir jobs reais e definições aplicadas |
| CA-007 | Duplicidade, responsável, honeypot, HMAC e limite testados | Conferir permissões/RLS efetivas |
| CA-008 | Migração sem exclusão de dados pessoais nem reclassificação; histórico mantido | Comparar contagens, vínculos e situações |
| CA-009 | Filtros, detalhes, edição concorrente, arquivamento e restauração testados | Teste de fumaça assistido com papéis reais |
| CA-010 | Falha de rede/HTTP, falso sucesso e atualização de textos preservam campos | Conferir falhas no ambiente publicado |
| CA-011 | Interações por teclado testadas; capturas móveis/computador aprovadas sem overflow | Inspeção final móvel/computador e tecnologia assistiva |
| CA-012 | Testes, TypeScript e build aprovados; limitações registradas | T-007 e T-008; não declarar conclusão integral antes delas |

T-001 a T-006 estão concluídas no escopo local, com as limitações remotas explícitas acima. T-007 e T-008 continuam sem execução e dependem de autorização específica.

Revisão final: reparada duplicação no SQL gerado antes de qualquer execução. Teste adicional verifica delimitadores, ausência de corpo duplicado e validações completas de telefone/responsável. Não substitui validação transacional PostgreSQL.

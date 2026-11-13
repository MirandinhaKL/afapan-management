# Fila simulada de e-mail

A T-008 processa os eventos de certificado, correção e recusa já registrados. A simulação mantém estado próprio e grava tentativas identificadas. A fila de envio real e a lista de certificados enviados seguem os estados reais do provedor. O PDF de certificado é lido do armazenamento privado e seu hash é verificado. A mensagem usa o destinatário original e escapa os textos da solicitação. O link de autenticidade depende de T-009.

## Homologação local

1. Após a migração 012, aplicar o SQL 013 no Supabase de teste. A migração acrescenta estado de simulação e auditoria e mantém as permissões de acesso às tabelas. Nenhum agendamento é criado.
2. No servidor de teste, configurar CONECTA_EMAIL_MODE com o valor simulation, CONECTA_WORKER_SECRET com uma chave própria de pelo menos 32 caracteres e CONECTA_PUBLIC_ORIGIN com a origem do Conecta. Manter CONECTA_FORM_SECRET válido para os links de correção.
3. Confirmar um certificado assinado de teste. Enviar um POST JSON a /api/conecta/internal/email-worker com o cabeçalho Authorization Bearer usando o segredo do worker e corpo `{"action":"run"}`. A resposta indica o identificador e resultado do item, ou idle se a fila de simulação estiver vazia.
4. Conferir que a tentativa simulada está registrada e o item real continua na fila. Para uma tentativa incerta, o operador registra resultado aceito ou falha confirmada com `{"action":"reconcile","jobId":"UUID","result":"failed","note":"Resultado conferido no simulador"}`. A falha confirmada permite nova tentativa dentro do limite de quatro.

O teste SQL cobre reserva exclusiva, expiração, conferência manual, backoff, idempotência e isolamento do envio real. Os testes do worker cobrem hash, escape de HTML, invalidação antes do despacho e resultado incerto. A rota testa habilitação explícita, autenticação e justificativa.

A aplicação remota do SQL, o agendamento, a conta Gmail e a aceitação pelo provedor exigem homologação separada. Reverter usando a versão anterior da aplicação e preservando os dados e tentativas de simulação.

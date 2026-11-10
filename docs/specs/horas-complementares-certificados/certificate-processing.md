# Indicador de processamento do certificado

Solicitação aprovada em 2026-11-05. Objetivo: informar visualmente que a ação está em andamento.

Comportamento: durante geração, o botão mostra indicador animado e “Gerando certificado…”. Download usa “Preparando download…”. Os controles ficam bloqueados durante a requisição. A região usa aria-busy e uma mensagem role=status informa andamento. Preferência de movimento reduzido desativa a animação e mantém a mensagem.

Revisão posterior autorizada: aviso central com fundo escurecido durante geração e download. O estado ocupado acompanha também a transferência do PDF para o navegador, até iniciar a gravação. Arquivo salvo como certificado-conecta-afapan-NOME.pdf, com nome do participante normalizado sem acentos ou separadores de caminho. Os dois endpoints de geração e download retornam o nome. Sem alteração de banco.

Riscos: indicador permanecer após erro. A finalização da requisição remove o estado ocupado, preserva a mensagem de erro e permite retentativa.

Revisão após evidência visual: a captura mostrava download de um comprovante enviado pelo estudante. A interface diferencia “Comprovantes da atividade” e “Baixar certificado”; anexo único não tem numeração no botão. Download de evidência também acompanha transferência com aviso central. Arquivos de evidência mantêm identificação de comprovante. Certificados usam certificado-conecta-afapan-nome.pdf. Teste de download confirma que o aviso permanece até receber o PDF e que o nome personalizado é atribuído ao arquivo.

Validação: teste com geração pendente e falha simulada, TypeScript e build. Sem alterações de banco.

Revisão em 2026-11-06: personalizar também comprovantes enviados pelo estudante, no formato comprovante-conecta-afapan-nome.ext. A API confere que o arquivo pertence à solicitação antes de usar o nome do participante e inclui o nome tanto na URL assinada quanto na resposta. Certificados continuam usando certificado-conecta-afapan-nome.pdf. Testes cobrem o nome personalizado e rejeitam associação com outra solicitação.

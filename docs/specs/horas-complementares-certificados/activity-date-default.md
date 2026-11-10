# Datas iniciais da atividade — 2026-11-06

Solicitação autorizada: preencher início e fim da atividade com a data de hoje ao abrir o formulário, mantendo edição livre.

Plano: calcular a data no navegador ao montar o formulário, usando America/Sao_Paulo para Farroupilha. Usar valor inicial nos dois campos; data de nascimento permanece vazia. Recalcular ao registrar outra atividade, inclusive se o dia mudou. Sem migrações ou mudanças em dados históricos.

Risco: UTC pode avançar um dia em relação ao horário local. Teste fixa instante de madrugada UTC e verifica a data anterior em São Paulo, bem como alteração manual e payload enviado.

Validação: teste do formulário, TypeScript e build local. Data não é fixada na compilação.

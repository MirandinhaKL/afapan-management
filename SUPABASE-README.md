# 🚀 Guia de Integração Supabase - AFAPAN Gestão

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta no [Supabase](https://supabase.com)
- Projeto já configurado com `npm install`

## 🔧 Passo 1: Configurar Banco de Dados

### 1.1 Executar Script SQL

1. Acesse seu painel Supabase: https://supabase.com/dashboard
2. Selecione seu projeto (URL: `https://bvonqepecmgahaitcyfw.supabase.co`)
3. Vá para **SQL Editor**
4. Copie e cole todo o conteúdo do arquivo `supabase-setup.sql`
5. Clique em **Run** para executar

### 1.2 Verificar Tabelas Criadas

No painel lateral esquerdo, verifique se as tabelas foram criadas:
- ✅ `profiles` (perfis de usuários)
- ✅ `participantes` (participantes do programa)
- ✅ `baldes` (registros de baldes)

## 👤 Passo 2: Criar Usuário de Teste

### 📋 Via Painel Supabase (Recomendado)

1. Acesse seu painel Supabase: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá para **Authentication** → **Users**
4. Clique em **Add user**
5. Preencha:
   - **Email**: `admin@test.com` (ou qualquer email válido)
   - **Password**: `admin123`
   - **Auto confirm user**: ✅ Marcado
   - **User Metadata** (JSON):
     ```json
     {
       "nome": "Carlos Silva",
       "role": "admin"
     }
     ```
6. Clique em **Create user**

### 🔧 Via Script (Opcional - pode não funcionar devido a validações)

```bash
node scripts/create-test-user.js
```

**Nota**: Se o script falhar, use sempre o método manual do painel.

## 🧪 Passo 3: Testar a Aplicação

```bash
# Executar o servidor de desenvolvimento
npm run dev
```

Acesse `http://localhost:3000` e faça login com:
- **Email**: `admin@test.com`
- **Senha**: `admin123`

## 📊 Funcionalidades Integradas

### ✅ Autenticação Real
- Login/senha validados via Supabase Auth
- Sessão persistente
- Logout seguro

### ✅ Gestão de Usuários
- Listar usuários (apenas admins)
- Criar novos usuários
- Editar perfis
- Desativar usuários

### 🔄 Próximos Passos (Opcional)

Para integrar participantes e compostagem:

1. **Atualizar `CompostagemPage`** similar ao `UsersPage`
2. **Usar queries** de `supabase-queries.ts`:
   - `fetchParticipantes()`
   - `createParticipante()`
   - `fetchBaldes()`
   - `fetchDashboardStats()`

## 🔒 Segurança

- **Row Level Security (RLS)** habilitado
- Políticas configuradas para proteger dados
- Apenas usuários autenticados acessam dados sensíveis

## 🐛 Troubleshooting

### Erro: "Invalid login credentials"
- Verifique se o usuário foi criado corretamente
- Confirme email e senha

### Erro: "Table doesn't exist"
- Execute o script SQL novamente
- Verifique se está no projeto correto

### Erro: "Permission denied"
- Verifique se RLS está configurado
- Confirme se as políticas foram aplicadas

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do terminal/console
2. Confirme se as variáveis `.env.local` estão corretas
3. Teste a conexão com Supabase via painel

---

**🎉 Pronto!** Sua aplicação agora usa autenticação real e banco de dados Supabase.
# Como configurar os flows n8n

## Variáveis de ambiente necessárias no n8n

Configure em **Settings → Variables** no painel do n8n Cloud:

| Variável | Descrição | Onde obter |
|---|---|---|
| `SISTEMA_URL` | URL do sistema publicado | Ex: `https://sistema-sua-midia.vercel.app` |
| `N8N_WEBHOOK_SECRET` | Senha compartilhada entre sistema e n8n | Crie qualquer string forte, ex: `suamidia2026` |
| `ANTHROPIC_API_KEY` | Chave da API do Claude | console.anthropic.com |
| `ZAPI_INSTANCE` | ID da instância na Z-API | Painel da Z-API |
| `ZAPI_TOKEN` | Token da instância Z-API | Painel da Z-API |
| `ZAPI_CLIENT_TOKEN` | Client-Token da Z-API | Painel da Z-API |

## Ordem de configuração

### 1. Banco de dados — executar migration
No Supabase SQL Editor, execute:
```
supabase/migration_v3_whatsapp.sql
```

### 2. Cadastrar JID do grupo WhatsApp em cada cliente
Para cada cliente, descubra o JID do grupo do WhatsApp e salve no campo `whatsapp_group_jid` diretamente no Supabase.

**Como descobrir o JID do grupo:**
- Na Z-API, acesse: `GET /instances/{instance}/token/{token}/chats`
- Procure o grupo pelo nome e copie o `id` (ex: `5562999999999-1234567890@g.us`)

### 3. Importar os flows no n8n
1. No n8n, clique em **+ New Workflow → Import from File**
2. Importe cada arquivo JSON na ordem:
   - `flow1-agente-atendimento.json`
   - `flow2-disparar-aprovacao-semanal.json`
   - `flow3-processar-resposta-aprovacao.json`

### 4. Configurar webhooks na Z-API
Na Z-API, em **Configurações de Webhook**, aponte:
- **Webhook de mensagens recebidas** → URL do Webhook do flow 1 (copie do n8n)
- **Webhook de respostas de botão** → URL do Webhook do flow 3 (copie do n8n)

### 5. Adicionar `N8N_WEBHOOK_SECRET` no sistema
No `.env.local` e nas variáveis de ambiente da Vercel:
```
N8N_WEBHOOK_SECRET=suamidia2026
```

## Resumo dos flows

### Flow 1 — Agente de Atendimento
- Recebe mensagens de grupos via Z-API
- Identifica o cliente pelo JID do grupo
- Chama Claude com o perfil do cliente
- Responde humanizadamente no grupo
- Cria ticket de atendimento no sistema

### Flow 2 — Disparar Aprovação Semanal
- Acionado por botão no sistema (a implementar na UI)
- Busca conteúdos aprovados da semana
- Envia criativo + legenda + botões Aprovar/Corrigir no grupo
- Atualiza status para `sent_to_client`

### Flow 3 — Processar Resposta de Aprovação
- Recebe clique nos botões Aprovar ou Corrigir
- Aprovar → atualiza para `approved_by_client` + confirma no grupo
- Corrigir → pede descrição → registra revisão no sistema + agradece

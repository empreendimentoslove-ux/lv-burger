# Deploy no Render - Guia Completo

## ✅ Seu app estará SEMPRE online 24/7 (100% Gratuito)

### Passo 1: Criar conta no Render
1. Acesse [render.com](https://render.com)
2. Clique em "Sign up"
3. Use seu email: **empreendimentoslove@gmail.com**
4. Confirme o email

### Passo 2: Conectar GitHub
1. No Render, vá para **Settings** → **Connected Accounts**
2. Clique em "Connect GitHub"
3. Autorize o Render a acessar seu repositório
4. Selecione o repositório `lv-burger`

### Passo 3: Deploy Automático
1. No Render, clique em **New** → **Web Service**
2. Selecione seu repositório `lv-burger`
3. Configure:
   - **Name**: `lv-burger`
   - **Runtime**: Node
   - **Build Command**: `pnpm install && pnpm build`
   - **Start Command**: `pnpm start`
   - **Plan**: Free

### Passo 4: Variáveis de Ambiente
Copie as variáveis do seu projeto Manus e cole no Render:
- `DATABASE_URL` - Sua string de conexão TiDB
- `JWT_SECRET` - Gere uma nova: `openssl rand -hex 32`
- `VITE_APP_ID` - Do seu projeto Manus
- `VITE_OAUTH_PORTAL_URL` - https://portal.manus.im
- Todas as outras variáveis de API

### Passo 5: Banco de Dados
O Render criará um PostgreSQL gratuito automaticamente.

**IMPORTANTE**: Você precisa migrar seu banco de dados TiDB para PostgreSQL:
1. Exporte dados do TiDB
2. Importe no PostgreSQL do Render

Ou use o banco TiDB existente atualizando `DATABASE_URL`

### Passo 6: Deploy
1. Clique em **Create Web Service**
2. Render fará o deploy automaticamente
3. Seu app estará online em ~5 minutos

### Passo 7: Domínio Customizado (Opcional)
1. No Render, vá para **Settings** → **Custom Domain**
2. Adicione seu domínio
3. Configure DNS conforme instruções

---

## 🎉 Pronto!
Seu app agora está:
- ✅ Sempre online (sem hibernação)
- ✅ 100% Gratuito
- ✅ Deploy automático (push no GitHub = deploy)
- ✅ HTTPS/SSL incluído

## 📞 Suporte
Se tiver dúvidas, acesse [render.com/docs](https://render.com/docs)

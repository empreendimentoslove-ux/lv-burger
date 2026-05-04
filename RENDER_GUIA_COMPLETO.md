# 🚀 Guia Completo: Deploy no Render (100% Gratuito - Sempre Online)

## ✅ Seu app estará SEMPRE online 24/7 sem hibernar!

---

## 📋 Pré-requisitos
- ✅ Conta GitHub (você já tem!)
- ✅ Email: **empreendimentoslove@gmail.com**
- ✅ Variáveis de ambiente do seu projeto Manus

---

## 🎯 6 Passos Simples

### **PASSO 1: Criar Conta no Render**
1. Abra [render.com](https://render.com)
2. Clique em **"Sign Up"**
3. Escolha **"Sign up with GitHub"**
4. Autorize o Render a acessar sua conta GitHub
5. Confirme seu email: **empreendimentoslove@gmail.com**

✅ **Pronto! Você tem conta no Render**

---

### **PASSO 2: Conectar GitHub**
1. No Render, vá para **Settings** (canto inferior esquerdo)
2. Clique em **"Connected Accounts"**
3. Clique em **"Connect GitHub"**
4. Autorize novamente se necessário

✅ **GitHub conectado ao Render**

---

### **PASSO 3: Selecionar Repositório**
1. No Render, clique em **"New"** (botão azul, canto superior direito)
2. Escolha **"Web Service"**
3. Procure por **"lv-burger"** na lista
4. Clique em **"Connect"** ao lado do repositório

✅ **Repositório selecionado**

---

### **PASSO 4: Configurar Build**
Preencha os campos com:

| Campo | Valor |
|-------|-------|
| **Name** | `lv-burger` |
| **Environment** | `Node` |
| **Build Command** | `pnpm install && pnpm build` |
| **Start Command** | `pnpm start` |
| **Plan** | `Free` |

✅ **Build configurado**

---

### **PASSO 5: Adicionar Variáveis de Ambiente**

Clique em **"Advanced"** e adicione estas variáveis:

#### Variáveis Obrigatórias:
```
DATABASE_URL = sua_string_de_conexao_tidb
JWT_SECRET = gere_com: openssl rand -hex 32
NODE_ENV = production
```

#### Variáveis do Manus (copie do seu projeto):
```
VITE_APP_ID = seu_app_id
VITE_APP_TITLE = LV BURGER
VITE_APP_LOGO = sua_url_logo
OAUTH_SERVER_URL = https://api.manus.im
VITE_OAUTH_PORTAL_URL = https://portal.manus.im
OWNER_OPEN_ID = seu_owner_id
OWNER_NAME = seu_nome
BUILT_IN_FORGE_API_URL = https://api.manus.im
BUILT_IN_FORGE_API_KEY = sua_chave_api
VITE_FRONTEND_FORGE_API_KEY = sua_chave_frontend
VITE_FRONTEND_FORGE_API_URL = https://api.manus.im
VITE_ANALYTICS_ENDPOINT = seu_endpoint
VITE_ANALYTICS_WEBSITE_ID = seu_website_id
```

✅ **Variáveis adicionadas**

---

### **PASSO 6: Deploy!**
1. Clique em **"Create Web Service"** (botão roxo)
2. Aguarde 5-10 minutos
3. Quando aparecer a mensagem **"Your service is live"**, seu app está online!

✅ **App online 24/7!**

---

## 🎉 Pronto!

Seu app agora está:
- ✅ **Sempre online** (sem hibernação)
- ✅ **100% Gratuito** (plano free permanente)
- ✅ **Deploy automático** (push no GitHub = deploy)
- ✅ **HTTPS/SSL** incluído
- ✅ **URL**: `https://lv-burger.onrender.com`

---

## 🔗 Adicionar Domínio Customizado (Opcional)

Se quiser usar seu próprio domínio (ex: `lvburger.com.br`):

1. No Render, vá para **Settings** → **Custom Domain**
2. Digite seu domínio
3. Copie os registros DNS
4. Vá no seu provedor de domínio (GoDaddy, Namecheap, etc)
5. Adicione os registros DNS
6. Pronto! Seu domínio está conectado

---

## 📞 Dúvidas?

- **Documentação Render**: [render.com/docs](https://render.com/docs)
- **Status do Deploy**: Veja em tempo real no painel do Render
- **Logs**: Clique em "Logs" para ver erros e mensagens

---

## ⚠️ Importante: Banco de Dados

O Render oferece PostgreSQL gratuito, mas seu projeto usa TiDB.

**Opção 1 (Recomendado)**: Usar TiDB existente
- Mantenha a mesma `DATABASE_URL` do Manus
- Tudo funcionará igual

**Opção 2**: Migrar para PostgreSQL do Render
- Exporte dados do TiDB
- Importe no PostgreSQL do Render
- Mais complexo, mas totalmente gratuito

---

## 🎊 Sucesso!

Seu **LV BURGER** agora está:
- 🟢 Online 24/7
- 💰 100% Gratuito
- ⚡ Rápido e confiável
- 🔒 Seguro com HTTPS

**Obrigado por usar Manus! Boa sorte com seu negócio! 🍔**

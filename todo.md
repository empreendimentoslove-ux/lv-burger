# LV BURGER - TODO

## Banco de Dados & Backend
- [x] Schema: tabelas users (com role: cliente/motoboy/admin), categories, products, stock_items, product_stock, orders, order_items, deliveries
- [x] Migração do banco de dados aplicada
- [x] Rotas tRPC: auth (me, logout, updateProfile)
- [x] Rotas tRPC: products (list, getById, create, update, delete)
- [x] Rotas tRPC: categories (list, listAll, create, update, delete)
- [x] Rotas tRPC: cart (get, add, update, clear)
- [x] Rotas tRPC: orders (create, myOrders, getById, listAll, updateStatus)
- [x] Rotas tRPC: deliveries (available, myDeliveries, accept, startRoute, confirm)
- [x] Rotas tRPC: stock (list, update, create)
- [x] Rotas tRPC: team (list, listAll, updateRole)
- [x] Rotas tRPC: reports (daily, sales)
- [x] Geração de código de confirmação de entrega (6 dígitos)
- [x] Seed de categorias e produtos iniciais

## Design Global
- [x] Paleta dark: preto (#0a0a0a), vermelho (#c0392b), dourado (#d4af37)
- [x] Tipografia moderna (Inter + Playfair Display via Google Fonts)
- [x] index.css com variáveis CSS e tema dark
- [x] Layout mobile-first responsivo
- [x] Utilitários: pb-nav, font-display, scrollbar-hide, lv-shadow, gold-shadow

## Telas do Cliente
- [x] Splash screen com logo LV BURGER animado e redirecionamento por role
- [x] Tela inicial (home) com banner, categorias e chips informativos
- [x] Login via OAuth Manus
- [x] Perfil do cliente (nome, telefone, endereço)
- [x] Menu de produtos por categorias com busca
- [x] Tela de detalhes do produto
- [x] Carrinho flutuante (botão fixo com badge de quantidade)
- [x] Tela do carrinho com itens, quantidades e total
- [x] Checkout: endereço de entrega e forma de pagamento (Dinheiro/Pix)
- [x] Tela de confirmação do pedido
- [x] Acompanhamento do pedido em tempo real (status + código de entrega)
- [x] Histórico de pedidos do cliente
- [x] Navegação inferior (BottomNav) mobile-first

## Painel do Motoboy
- [x] Dashboard com entregas disponíveis e ativas
- [x] Aceite de pedido
- [x] Detalhes da entrega (endereço, itens, total)
- [x] Iniciar rota
- [x] Confirmação de entrega por código do cliente
- [x] Histórico de entregas realizadas

## Painel Administrativo
- [x] Dashboard com KPIs do dia (pedidos, faturamento, em preparo, entregues)
- [x] Navegação rápida para todos os módulos
- [x] Gestão de cardápio: listar, criar, editar, excluir, bloquear produtos
- [x] Gestão de categorias (CRUD completo)
- [x] Controle de estoque (insumos, quantidades, alertas de estoque baixo)
- [x] Gerenciamento de equipe (atribuição de roles: cliente/motoboy/admin)
- [x] Lista e gestão de pedidos com filtros por status
- [x] Atualização de status de pedidos
- [x] Relatórios: gráficos de vendas e pedidos por dia (30 dias)
- [x] Relatórios: produtos mais vendidos (gráfico de pizza)
- [x] Relatórios: KPIs de receita e ticket médio

## Testes
- [x] Testes vitest para rotas principais (auth, guards, status flow, pagamento)
- [x] Validação de geração de código de entrega
- [x] Validação de formatação de preços
- [x] 14 testes passando (2 arquivos)


## Novos Ajustes (v2)

- [x] Notificação sonora e visual de novo pedido no painel admin
- [x] Horário de funcionamento automático (17h-00h, terça-domingo)
- [x] Controle manual de abertura/fechamento da loja
- [x] Bloqueio de pedidos quando loja fechada
- [x] Localização automática no checkout
- [x] Comprovante de pagamento com upload de foto

## Correções de CRUD (v3)

- [x] Corrigido erro de duplicate 'useState' import em Products.tsx
- [x] Implementado endpoint `/api/upload` para upload de imagens em base64
- [x] Adicionado upload de foto direto da galeria no formulário de produtos
- [x] Corrigido retorno de dados nas operações de CREATE (categorias e produtos)
- [x] Corrigido retorno de dados nas operações de UPDATE (categorias e produtos)
- [x] Adicionado error handling em todas as mutações (create, update, delete)
- [x] Implementados 9 testes de CRUD para produtos e categorias
- [x] Todos os 29 testes passando (100% sucesso)

## Correções de DELETE (v4)

- [x] Corrigido getAllProducts() para filtrar por active=true
- [x] Corrigido getAllCategories() para filtrar por active=true
- [x] Botão de deletar agora remove itens da lista corretamente
- [x] Implementados 2 testes de delete (produtos e categorias)
- [x] Todos os 31 testes passando (100% sucesso)

## Melhorias de Estabilidade (v5)

- [x] Implementado sistema robusto de reconexão com banco de dados
- [x] Retry automático com 3 tentativas e delay progressivo (1s entre tentativas)
- [x] Health check endpoint aprimorado com status do banco de dados
- [x] Health check periódico no frontend (a cada 10 segundos)
- [x] Detecção automática de desconexões do servidor
- [x] Reconexão automática quando servidor volta online
- [x] Retry automático de queries (3 tentativas com backoff exponencial)
- [x] Retry automático de mutations (1 tentativa com delay 1s)
- [x] Listeners para eventos de rede (online/offline)
- [x] Invalidação de queries ao reconectar
- [x] Logs detalhados de conexão e desconexão
- [x] Todos os 31 testes passando (100% sucesso)

## Configurações da Empresa (v6)

- [x] Adicionar tabela de anúncios de promoções no banco de dados
- [x] Criar endpoints tRPC para CRUD de anúncios
- [x] Criar endpoints tRPC para gerenciar configurações da empresa
- [x] Implementar página de Configurações da Empresa no admin
- [x] Adicionar editor de logo da empresa
- [x] Adicionar editor de nome da empresa
- [x] Adicionar gerenciador de horários (aberto/fechado, horários de funcionamento)
- [x] Adicionar gerenciador de anúncios de promoções
- [x] Adicionar link de Configurações no dashboard admin
- [x] Executar migration para criar tabelas no banco de dados
- [x] Testar todas as funcionalidades (37 testes passando)
- [x] Adicionar widget de anúncios na tela principal do cliente (carousel com indicadores)

## Correção Crítica de Indisponibilidade (v7)

- [x] Implementar keep-alive no servidor Express (65s)
- [x] Adicionar timeout handling para requisições longas (30s)
- [x] Implementar graceful shutdown com cleanup de recursos
- [x] Adicionar monitoramento de memória e CPU
- [x] Adicionar health check com métricas detalhadas (/api/health)
- [x] Implementar tracking de requisições ativas
- [x] Adicionar handlers para SIGTERM e SIGINT
- [x] Adicionar handlers para uncaught exceptions
- [x] Testar estabilidade com 37 testes passando (100% sucesso)

## Status de Funcionamento e Responsividade (v8)

- [x] Adicionar componente de status de funcionamento na Home com horários
- [x] Implementar lógica de cálculo de abertura/fechamento baseado em horários
- [x] Adicionar gerenciador de horários no painel CompanySettings (por dia da semana)
- [x] Adicionar campo businessHours ao banco de dados
- [x] Melhorar responsividade de inputs e botões em mobile
- [x] Adicionar scroll em horários para melhor UX em mobile
- [x] Testar em diferentes resoluções
- [x] Todos os 37 testes passando (100% sucesso)

## Gerenciamento de Estoque (v9)

- [x] Adicionar tabela de estoque no banco de dados
- [x] Criar endpoints tRPC para CRUD de estoque (create, update, delete, getAll, getByProductId)
- [x] Implementar página de gerenciamento de estoque no admin (/admin/stock)
- [x] Adicionar indicador visual de estoque baixo (alerta amarelo)
- [x] Testar funcionalidades de estoque com testes automatizados (6 testes de estoque + 37 testes anteriores = 43 testes passando)
- [x] Estoque é APENAS para admin (não aparece na tela do cliente)
- [x] Rota /admin/stock registrada e link no dashboard admin
- [x] Corrigir getStockByProductId para retornar array

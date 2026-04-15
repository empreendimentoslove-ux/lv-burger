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

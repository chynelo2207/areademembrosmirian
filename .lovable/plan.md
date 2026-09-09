# Integração Wiapy — análise antes de qualquer mudança

Nada foi alterado ainda. Abaixo o retrato do que existe hoje e o que proponho.

## A) Como sua estrutura funciona hoje

- Login/senha e Google ficam no sistema de contas do próprio backend (Lovable Cloud). Senhas nunca ficam em tabela sua.
- Quem pode entrar é decidido pela lista de e-mails liberados: `access_grants` (e-mail + plano `classico` ou `completo`).
- Ao entrar, o app pergunta ao banco "qual é meu plano?" (função `my_plan()`), comparando o e-mail do login com `access_grants`. Sem registro lá, a pessoa vê a tela "Acesso não liberado".
- Módulos, aulas e materiais têm um campo "curso que libera" (`required_plan`). As regras de acesso do banco liberam:
  - `classico`: só o conteúdo marcado como clássico;
  - `completo`: tudo;
  - `admin`: tudo.
- `profiles` guarda nome/foto do próprio usuário. `user_roles` guarda apenas `admin`/`aluno` (nunca plano de compra).
- `offers` é vitrine de ofertas dentro da área de membros — não controla acesso.
- Já existem dois endpoints de compra: `/api/public/cakto` (webhook da Cakto) e `/api/public/liberar-acesso` (liberação manual/API). Não há Edge Function em uso: neste projeto os endpoints são rotas do próprio servidor do app, que é o formato correto e suportado aqui.

## B) Qual tabela recebe o acesso do aluno

`access_grants`. É a única fonte de verdade do acesso. Nada mais precisa ser tocado para liberar alguém.

## C) Campos existentes que reaproveitamos

Em `access_grants`: `email`, `plan` (`classico`/`completo`), `source` (marcaremos `"wiapy"`), `order_id` (id da transação), `note` (nome do comprador / id do checkout), `created_at`/`updated_at`.

Regra de upgrade já pronta: quem tem `classico` e compra o completo é **atualizado**, nunca duplicado.

## D) Endpoint que será criado

`POST /api/public/wiapy` (mesma tecnologia dos webhooks atuais; não é preciso — nem recomendado neste projeto — criar Edge Function separada).

O endpoint vai:
1. validar o token secreto (header ou `?secret=`);
2. ler status, e-mail, nome, id do checkout, id da transação;
3. ignorar tudo que não seja compra aprovada (e opcionalmente remover acesso em reembolso/chargeback, se você quiser);
4. decidir o plano **pelo ID do checkout**, comparando com `CHECKOUT_BASICO_ID` e `CHECKOUT_COMPLETO_ID`;
5. criar a conta do aluno se ainda não existir (com convite/definição de senha) e o perfil com o nome;
6. gravar/atualizar a liberação em `access_grants`;
7. registrar a compra em um histórico.

Idempotência: mesma transação repetida → resposta "já processado", sem criar conta, compra ou permissão duplicada.

## E) O que preciso do Wiapy

1. O **ID do checkout** de cada produto (Básico e Completo) — ou me diga que vai preencher depois nas configurações.
2. O **token/segredo do webhook** (se o Wiapy oferecer), para eu guardar no cofre de segredos.
3. Um **exemplo real do corpo (JSON) que o Wiapy envia** numa compra aprovada — é o que garante que eu leia os campos com os nomes certos.
4. Quais **eventos** você vai marcar no painel do Wiapy (só "compra aprovada", ou também reembolso/cancelamento).
5. Se, ao criar a conta, você prefere: enviar e-mail de definição de senha, ou criar com senha temporária que você informa ao aluno.

## F) Preciso criar tabela/coluna nova?

- **Nova tabela `purchases`** (histórico de compras): e-mail, plano, provedor, id do checkout, id da transação, status, nome do comprador, data. Com o id da transação único — é isso que garante a idempotência e o "registrar a compra" que você pediu.
- **Nenhuma mudança** em `access_grants`, `offers`, `profiles`, `modules`, `lessons`, `user_roles` ou nas regras de acesso atuais.
- Duas configurações novas (`CHECKOUT_BASICO_ID`, `CHECKOUT_COMPLETO_ID`) guardadas no cofre de segredos, mais o token do webhook. Nada disso aparece no site.

## Observação

"Curso Básico" corresponde ao plano `classico` que já existe; "Curso Completo" ao `completo`. Não vou renomear nada.

Confirme e eu implemento exatamente isso.

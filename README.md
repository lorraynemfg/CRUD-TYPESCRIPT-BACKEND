![](https://i.imgur.com/xG74tOh.png)

# Desafio Módulo 3 - Backend TypeScript

## Cubospay

Seu papel é construir uma RESTful API, para um gateway de pagamentos, usando typescript. A API deve ter as seguintes funcionalidades:

- Cadastro de conta
- Alteração de conta
- Saldo
- Saque
- Transferência
- Transações via cartão e boleto
- Cancelamento de Transações
- Detalhes de Transações
- Simulação de pagamento

**Importante: Lembre-se sempre que cada conta só pode ver e manipular suas próprias informações e suas próprias transações. Não atender a este pré-requisito é uma falha de segurança gravíssima!**

**Importante 2: Cada conta deverá receber uma chave secreta (Api Key) que servirá como identificação para as requisições.**

**Importante 3: Sempre que a validação de uma requisição falhar, responda com código de erro e mensagem adequada à situação, ok?**

**Exemplo:**

```typescript
// Quando é informado um id de transação que não existe:
// HTTP Status 404
{
    "mensagem": "Transação não encontrada!"
}
```

## **Banco de dados**

Você precisa criar um Banco de Dados PostgreSQL chamado `cubospay` e todas tabelas do banco de dados deverão ser geridas por migrations.

**ATENÇÃO! Os nomes das tabelas e das colunas a serem criados devem seguir exatamente os nomes listados abaixo.**

- accounts (Conta de usuário)
  - id
  - username
  - email (campo único)
  - api_secret (campo único)
  - balance
- withdrawals (Registros de saques)
  - id
  - account_id
  - amount
  - created_at
- transfers (Registro de transferências)
  - id
  - from_account_id (Conta de origem)
  - to_account_id (Conta de destino)
  - amount
  - created_at
- transactions (Registro de Transações)
  - id
  - account_id
  - amount
  - payment_method
  - status
  - bar_code
  - card_number
  - card_expiration_date
  - card_cvv
  - card_name
  - client_name
  - client_email
  - paid_at
  - created_at

## **Requisitos obrigatórios**

- A API a ser criada deverá acessar o banco de dados a ser criado "cubospay" para persistir e manipular os dados da aplicação utilizando o ORM `TypeORM` na versão mínima `0.3.6`.
- Seu código deverá estar organizado, delimitando as responsabilidades de cada arquivo adequadamente.
- Qualquer valor monetário deverá ser representado em centavos (Ex.: R$ 10,00 reais = 1000)

## **Status Codes**

Abaixo, listamos os possíveis **_status codes_** esperados como resposta da API.

```typescript
// 200 (OK) = requisição bem sucedida
// 201 (Created) = requisição bem sucedida e algo foi criado
// 204 (No Content) = requisição bem sucedida, sem conteúdo no corpo da resposta
// 400 (Bad Request) = o servidor não entendeu a requisição pois está com uma sintaxe/formato inválido
// 401 (Unauthorized) = o usuário não está autenticado (logado)
// 403 (Forbidden) = o usuário não tem permissão de acessar o recurso solicitado
// 404 (Not Found) = o servidor não pode encontrar o recurso solicitado
```

## **Endpoints**

### **Cadastrar conta de usuário**

#### `POST` `/account`

Essa é a rota que será utilizada para criar uma nova conta de usuario no sistema.

- **Requisição**  
  Sem parâmetros de rota ou de query.
  O corpo (body) deverá possuir um objeto com as seguintes propriedades (respeitando estes nomes):

  - username
  - email

- **Resposta**  
  Em caso de **sucesso**, deveremos enviar no corpo (body) da resposta o conteúdo do usuário cadastrado, incluindo seu respectivo `id` e a chave da api (api key) que será utilizada para identificação da conta.
  Em caso de **falha na validação**, a resposta deverá possuir **_status code_** apropriado, e em seu corpo (body) deverá possuir um objeto com uma propriedade **mensagem** que deverá possuir como valor um texto explicando o motivo da falha.

- **REQUISITOS OBRIGATÓRIOS**
  - Validar os campos obrigatórios:
    - username
    - email
  - Validar se o e-mail informado já existe
  - Criar uma chave de api única e segura
  - O saldo inicial da conta é sempre 0
  - Persistir os dados da conta no banco de dados

#### **Exemplo de requisição**

```typescript
// POST /account
{
	"username": "José",
	"email": "jose@email.com"
}
```

#### **Exemplos de resposta**

```typescript
// HTTP Status 200 / 201 / 204
{
	"id": 1,
	"username": "José",
	"email": "jose@email.com",
  "api_key": "key_a1b2c3d4e5f6..."
}
```

```typescript
//HTTP Status 400 / 401 / 403 / 404
{
	"mensagem": "Já existe conta cadastrada com o e-mail informado."
}
```

---

## **ATENÇÃO**: Todas as funcionalidades (endpoints) a seguir, a partir desse ponto, deverão exigir a api key da conta, recebendo na url (query param). Portanto, em cada funcionalidade será necessário validar a api key informada.

---

### **Atualizar conta de usuário**

#### `PUT` `/account`

Essa é a rota que será chamada quando o usuário quiser realizar alterações das informações de sua própria conta.
**Atenção!:** O usuário deverá ser identificado através da api key presente na url (query param).

- **Requisição**  
  Deverá ser enviado o parâmetro do tipo query com a api_key da conta.
  O corpo (body) deverá possuir um objeto com as seguintes propriedades (respeitando estes nomes):

  - username
  - email

- **Resposta**  
  Em caso de **sucesso**, não deveremos enviar conteúdo no corpo (body) da resposta.  
  Em caso de **falha na validação**, a resposta deverá possuir **_status code_** apropriado, e em seu corpo (body) deverá possuir um objeto com uma propriedade **mensagem** que deverá possuir como valor um texto explicando o motivo da falha.

- **REQUISITOS OBRIGATÓRIOS**
  - Validar os campos obrigatórios:
    - username
    - email
  - Validar se o e-mail já existe no banco de dados para outra conta
    - Caso já exista o novo e-mail fornecido para outra conta no banco de dados, a alteração não deve ser permitida (o campo de email deve ser sempre único no banco de dados)
  - Atualizar as informações da conta no banco de dados

#### **Exemplo de requisição**

```typescript
// PUT /account?api_key=key_a1b2c3d4e5f6...
{
    "username": "José de Abreu",
    "email": "jose_abreu@email.com"
}
```

#### **Exemplos de resposta**

```typescript
// HTTP Status 200 / 201 / 204
// Sem conteúdo no corpo (body) da resposta
```

```typescript
// HTTP Status 400 / 401 / 403 / 404
{
    "mensagem": "O e-mail informado já está sendo utilizado por outro usuário."
}
```

### **Consultar saldo da conta**

#### `GET` `/balance`

Essa é a rota que será chamada quando o usuario quiser consultar o saldo disponível na conta.

- **Requisição**  
  Deverá ser enviado o parâmetro do tipo query com a api_key da conta.  
  Não deverá possuir conteúdo no corpo (body) da requisição.

- **Resposta**  
  Em caso de **sucesso**, o corpo (body) da resposta deverá possuir o saldo da conta do usuário.  
  Em caso de **falha na validação**, a resposta deverá possuir **_status code_** apropriado, e em seu corpo (body) deverá possuir um objeto com uma propriedade **mensagem** que deverá possuir como valor um texto explicando o motivo da falha.

- **REQUISITOS OBRIGATÓRIOS**
  - O usuário deverá ser identificado através da api key presente na url (query param).
  - O endpoint deverá responder com o saldo atual da conta do usuário.

#### **Exemplo de requisição**

```typescript
// GET /balance?api_key=key_a1b2c3d4e5f6...
// Sem conteúdo no corpo (body) da requisição
```

#### **Exemplos de resposta**

```typescript
// HTTP Status 200 / 201 / 204
{
	"balance": 25000
}
```

### **Realizar saque da conta**

#### `POST` `/withdraw`

Essa é a rota que será chamada quando o usuario quiser sacar valores da sua conta.

- **Requisição**  
  Deverá ser enviado o parâmetro do tipo query com a api_key da conta.  
  O corpo (body) deverá possuir um objeto com a seguinte propriedade (respeitando este nome):

  - amount

- **Resposta**  
  Em caso de **sucesso**, não deveremos enviar conteúdo no corpo (body) da resposta.
  Em caso de **falha na validação**, a resposta deverá possuir **_status code_** apropriado, e em seu corpo (body) deverá possuir um objeto com uma propriedade **mensagem** que deverá possuir como valor um texto explicando o motivo da falha.

- **REQUISITOS OBRIGATÓRIOS**
  - O usuário deverá ser identificado através da api key presente na url (query param).
  - Validar se existe saldo disponível para saque
  - Atualizar o saldo da conta, subtraindo com o valor sacado
  - Criar um registro de saque para a conta com o valor, data e hora do saque.

#### **Exemplo de requisição**

```typescript
// POST /withdraw?api_key=key_a1b2c3d4e5f6...
{
	"amount": 23000
}
```

#### **Exemplos de resposta**

```typescript
// HTTP Status 200 / 201 / 204
// Sem conteúdo no corpo (body) da resposta
```

```typescript
// HTTP Status 400 / 401 / 403 / 404
{
    "mensagem": "Saldo insuficiente."
}
```

### **Realizar transferência entre contas**

#### `POST` `/transfer`

Essa é a rota que será chamada quando o usuario quiser transferir valores da sua conta para outra conta existente.

- **Requisição**  
  Deverá ser enviado o parâmetro do tipo query com a api_key da conta.  
  O corpo (body) deverá possuir um objeto com a seguinte propriedade (respeitando este nome):

  - amount
  - account_id (id da conta de destino)

- **Resposta**  
  Em caso de **sucesso**, não deveremos enviar conteúdo no corpo (body) da resposta.
  Em caso de **falha na validação**, a resposta deverá possuir **_status code_** apropriado, e em seu corpo (body) deverá possuir um objeto com uma propriedade **mensagem** que deverá possuir como valor um texto explicando o motivo da falha.

- **REQUISITOS OBRIGATÓRIOS**
  - O usuário deverá ser identificado através da api key presente na url (query param).
  - Validar se existe saldo disponível para ser transferido
  - Validar se a conta de destino existe para o id informado
  - Atualizar o saldo da conta, subtraindo com o valor transferido
  - Atualizar o saldo da conta de destino, somando com o valor recebido
  - Criar um registro de transferência com o id da conta de origem, id da conta de destino, valor, data e hora da transferência.

#### **Exemplo de requisição**

```typescript
// POST /transfer?api_key=key_a1b2c3d4e5f6...
{
	"amount": 23000,
  "account_id": 2
}
```

#### **Exemplos de resposta**

```typescript
// HTTP Status 200 / 201 / 204
// Sem conteúdo no corpo (body) da resposta
```

```typescript
// HTTP Status 400 / 401 / 403 / 404
{
    "mensagem": "Saldo insuficiente."
}
```

## **ATENÇÃO**: O status de cada transação deverá ser `pending` para pendente, `paid` para pago ou `canceled` para cancelada.

### **Realizar transação via cartão ou boleto**

#### `POST` `/transaction`

Essa é a rota que será chamada quando o usuario quiser realizar uma transação via cartão de crédito ou boleto bancário.

- **Requisição**  
  Deverá ser enviado o parâmetro do tipo query com a api_key da conta.  
  O corpo (body) deverá possuir um objeto com a seguinte propriedade (respeitando este nome):

  - amount
  - payment_method (`credit` para cartão de crédito ou `billet` para boleto bancário)
  - card_number (obrigatório quando o payment_method for `credit`)
  - card_expiration_date (obrigatório quando o payment_method for `credit`)
  - card_cvv (obrigatório quando o payment_method for `credit`)
  - card_name (obrigatório quando o payment_method for `credit`)
  - client_name (opcional)
  - client_email (opcional)

- **Resposta**  
  Em caso de **sucesso**, deveremos enviar no corpo (body) da resposta o conteúdo da transação realizada, incluindo seu respectivo `id`.
  Em caso de **falha na validação**, a resposta deverá possuir **_status code_** apropriado, e em seu corpo (body) deverá possuir um objeto com uma propriedade **mensagem** que deverá possuir como valor um texto explicando o motivo da falha.

- **REQUISITOS OBRIGATÓRIOS**
  - O usuário deverá ser identificado através da api key presente na url (query param).
  - Validar se o método de pagamento informado foi `credit` ou `billet`
  - Se o método de pagamento informado for `credit`, deverá:
    - Validar se os dados do cartão foram enviados no body
    - Salvar o status da transação como `paid`
    - Salvar a data e hora em created_at e paid_at
    - Salvar todas as outras informações referente a transação
    - Atualizar o saldo da conta com o valor da transação
  - Se o método de pagamento informado for `billet`, deverá:
    - Salvar o status da transação como `pending`
    - Salvar a data e hora da transação apenas em created_at
    - Informar o código de barra do boleto
      - O código de barra pode ser uma hash aleatória fictícia
    - Salvar todas as outras informações referente a transação

#### **Exemplo de requisição**

```typescript
// Transação via cartão de crédito
// POST /transaction?api_key=key_a1b2c3d4e5f6...
{
	"amount": 30000,
	"payment_method": "credit",
	"card_number": "1111222233334444",
	"card_expiration_date": "03/29",
	"card_cvv": "123",
	"card_name": "Guido Cerqueira",
	"client_name": "Guido",
	"client_email": "guido@email.com"
}
```

```typescript
// Transação via boleto
// POST /transaction?api_key=key_a1b2c3d4e5f6...
{
	"amount": 30000,
	"payment_method": "billet",
	"client_name": "Guido",
	"client_email": "guido@email.com"
}
```

#### **Exemplos de resposta**

```typescript
// Transação via cartão de crédito
// HTTP Status 200 / 201 / 204
{
	"id": 8,
	"amount": 30000,
	"payment_method": "credit",
	"status": "paid",
	"card_number": "1111222233334444",
	"card_name": "Guido Cerqueira",
	"card_expiration_date": "03/29",
	"card_cvv": "123",
	"client_name": "Guido",
	"client_email": "guido@email.com",
	"paid_at": "2022-06-10T12:28:01.483Z",
	"created_at": "2022-06-10T12:28:01.483Z",
	"bar_code": null
}
```

```typescript
// Transação via boleto
// HTTP Status 200 / 201 / 204
{
	"id": 200,
	"amount": 30000,
	"payment_method": "billet",
	"status": "pending",
	"card_number": null,
	"card_name": null,
	"card_expiration_date": null,
	"card_cvv": null,
	"client_name": "Guido",
	"client_email": "guido@email.com",
	"paid_at": null,
	"created_at": "2022-06-10T12:28:01.483Z",
	"bar_code": "abcdef123456..."
}
```

```typescript
// HTTP Status 400 / 401 / 403 / 404
{
    "mensagem": "Método de pagamento inválido"
}
```

### **Cancelar uma transação**

#### `PATCH` `/transaction/:id`

Essa é a rota que será chamada quando o usuário quiser cancelar uma transação existente.

- **Requisição**  
  Deverá ser enviado o parâmetro do tipo query com a api_key da conta.
  Deverá ser enviado o id da transação no parâmetro de rota do endpoint.
  Não deverá possuir conteúdo no corpo (body) da requisição.

- **Resposta**  
  Em caso de **sucesso**, não deveremos enviar conteúdo no corpo (body) da resposta.  
  Em caso de **falha na validação**, a resposta deverá possuir **_status code_** apropriado, e em seu corpo (body) deverá possuir um objeto com uma propriedade **mensagem** que deverá possuir como valor um texto explicando o motivo da falha.

- **REQUISITOS OBRIGATÓRIOS**
  - O usuário deverá ser identificado através da api key presente na url (query param).
  - Validar se a transação existe existe no banco de dados para a conta em questão
  - Validar se a transação já foi cancelada
  - Se o status da transação for `pending` deverá:
    - Alterar o status da transação para `canceled`
  - Se o status da transação for `paid` deverá:
    - Atualizar o saldo da conta, subtraindo o valor cancelado (estorno).
    - Alterar o status da transação para `canceled`

#### **Exemplo de requisição**

```typescript
// PATCH /transaction/8?api_key=key_a1b2c3d4e5f6...
// Sem conteúdo no corpo (body) da requisição
```

#### **Exemplos de resposta**

```typescript
// HTTP Status 200 / 201 / 204
// Sem conteúdo no corpo (body) da resposta
```

```typescript
// HTTP Status 400 / 401 / 403 / 404
{
    "mensagem": "Transação já está cancelada."
}
```

### **Detalhar uma transação**

#### `GET` `/transaction/:id`

Essa é a rota que será chamada quando o usuário quiser detalhar uma transação existente.

- **Requisição**  
  Deverá ser enviado o parâmetro do tipo query com a api_key da conta.
  Deverá ser enviado o id da transação no parâmetro de rota do endpoint.
  Não deverá possuir conteúdo no corpo (body) da requisição.

- **Resposta**  
  Em caso de **sucesso**, deveremos enviar no corpo (body) da resposta o conteúdo da transação realizada, incluindo seu respectivo `id`.
  Em caso de **falha na validação**, a resposta deverá possuir **_status code_** apropriado, e em seu corpo (body) deverá possuir um objeto com uma propriedade **mensagem** que deverá possuir como valor um texto explicando o motivo da falha.

- **REQUISITOS OBRIGATÓRIOS**
  - O usuário deverá ser identificado através da api key presente na url (query param).
  - Validar se a transação existe existe no banco de dados para a conta em questão

#### **Exemplo de requisição**

```typescript
// GET /transaction/8?api_key=key_a1b2c3d4e5f6...
// Sem conteúdo no corpo (body) da requisição
```

#### **Exemplos de resposta**

```typescript
// HTTP Status 200 / 201 / 204
{
	"id": 8,
	"amount": 30000,
	"payment_method": "credit",
	"status": "paid",
	"card_number": "1111222233334444",
	"card_name": "Guido Cerqueira",
	"card_expiration_date": "03/29",
	"card_cvv": "123",
	"client_name": "Guido",
	"client_email": "guido@email.com",
	"paid_at": "2022-06-10T12:28:01.483Z",
	"created_at": "2022-06-10T12:28:01.483Z",
	"bar_code": null
}
```

```typescript
// HTTP Status 400 / 401 / 403 / 404
{
    "mensagem": "Transação inexistente."
}
```

### **Simular pagamento de uma transação**

#### `PATCH` `/pay/:id`

Essa é a rota que será chamada quando o usuário quiser simular o pagamento uma transação existente. Geralmente os gateways de pagamento disponibiliza um endpoint como esse para que seja usado em ambiente de teste, quando o está implantando o gateway em algum outro sistema.

- **Requisição**  
  Deverá ser enviado o parâmetro do tipo query com a api_key da conta.
  Deverá ser enviado o id da transação no parâmetro de rota do endpoint.
  Não deverá possuir conteúdo no corpo (body) da requisição.

- **Resposta**  
  Em caso de **sucesso**, não deveremos enviar conteúdo no corpo (body) da resposta.
  Em caso de **falha na validação**, a resposta deverá possuir **_status code_** apropriado, e em seu corpo (body) deverá possuir um objeto com uma propriedade **mensagem** que deverá possuir como valor um texto explicando o motivo da falha.

- **REQUISITOS OBRIGATÓRIOS**
  - O usuário deverá ser identificado através da api key presente na url (query param).
  - Validar se a transação existe existe no banco de dados para a conta em questão
  - Validar se a transação já está paga
  - Validar se a transação está cancelada (não será possível pagar uma transação cancelada)
  - Alterar o status da transação para `paid`
  - Informar a data e hora do pagamento em paid_at
  - Atualizar o saldo da conta, somando o valor da transação

#### **Exemplo de requisição**

```typescript
// PATCH /pay/200?api_key=key_a1b2c3d4e5f6...
// Sem conteúdo no corpo (body) da requisição
```

#### **Exemplos de resposta**

```typescript
// HTTP Status 200 / 201 / 204
// Sem conteúdo no corpo (body) da resposta
```

```typescript
// HTTP Status 400 / 401 / 403 / 404
{
    "mensagem": "Transação está cancelada."
}
```

### **Transpilação do projeto**

Ao final do desenvolvimento da aplicação, deverá ser configurado o script no arquivo `package.json` de transpilação do código `typescript` para `javascript`.

O destino do código em `javascript` deverá ser uma pasta chamada `dist` no mesmo nível da pasta `src`.

O projeto deverá funcionar completamente em `javascript`, sendo assim, deverá ser criado um script no arquivo `package.json` para executar o projeto `javascript` com o `node`.

---

**LEMBRE-SE**: Feito é melhor que perfeito!!!

###### tags: `back-end` `módulo 3` `nodeJS` `PostgreSQL` `API REST` `desafio` `typescript`

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simulatePayment = exports.getTransaction = exports.cancelTransaction = exports.handleTransaction = exports.realizarTransferencia = exports.realizarSaque = exports.consultarSaldo = exports.atualizarConta = exports.cadastrarConta = void 0;
const conexao_1 = require("../DB/conexao");
async function cadastrarConta(req, res) {
    const { username, email } = req.body;
    if (!username || !email) {
        res.status(400).json({ mensagem: 'Os campos "username" e "email" são obrigatórios.' });
        return;
    }
    try {
        const existingAccount = await (0, conexao_1.knex)('accounts').where('email', email).first();
        if (existingAccount) {
            res.status(400).json({ mensagem: 'Já existe conta cadastrada com o e-mail informado.' });
            return;
        }
        const api_secret = generateApiKey();
        const newAccount = {
            username,
            email,
            api_secret,
            balance: 0,
        };
        await (0, conexao_1.knex)('accounts').insert(newAccount);
        const [createdAccount] = await (0, conexao_1.knex)('accounts').select('id', 'username', 'email', 'api_secret').returning('*');
        res.status(201).json({
            id: createdAccount.id,
            username: newAccount.username,
            email: newAccount.email,
            api_key: newAccount.api_secret,
        });
        return;
    }
    catch (error) {
        res.status(500).json({ mensagem: 'Erro interno do servidor.' });
    }
}
exports.cadastrarConta = cadastrarConta;
async function atualizarConta(req, res) {
    const apiKey = req.query.api_key;
    const { username, email } = req.body;
    if (!username || !email) {
        res.status(400).json({ mensagem: 'Os campos "username" e "email" são obrigatórios.' });
        return;
    }
    try {
        const account = await verificarUsuario(apiKey);
        if (!account) {
            res.status(404).json({ mensagem: "Conta não encontrada" });
            return;
        }
        const emailExists = await (0, conexao_1.knex)('accounts').where('email', email).whereNot({ api_secret: apiKey }).first();
        if (emailExists) {
            res.status(400).json({ mensagem: 'O e-mail informado já está sendo utilizado por outro usuário.' });
            return;
        }
        await (0, conexao_1.knex)('accounts').where({ api_secret: apiKey }).update({ username, email });
        res.sendStatus(204);
        return;
    }
    catch (error) {
        res.status(500).json({ mensagem: 'Erro interno do servidor.' });
    }
}
exports.atualizarConta = atualizarConta;
async function consultarSaldo(req, res) {
    const apiKey = req.query.api_key;
    try {
        const account = await verificarUsuario(apiKey);
        if (!account) {
            res.status(404).json({ mensagem: "Conta não encontrado" });
            return;
        }
        res.status(200).json({ balance: account.balance });
    }
    catch (error) {
        res.status(500).json({ mensagem: 'Erro interno do servidor.' });
    }
}
exports.consultarSaldo = consultarSaldo;
async function realizarSaque(req, res) {
    const apiKey = req.query.api_key;
    const { amount } = req.body;
    try {
        const account = await verificarUsuario(apiKey);
        if (!account) {
            res.status(404).json({ mensagem: "Conta não encontrada" });
            return;
        }
        if (account.balance < amount) {
            res.status(400).json({ mensagem: 'Saldo insuficiente.' });
            return;
        }
        await (0, conexao_1.knex)('accounts').where({ api_secret: apiKey }).update({ balance: account.balance - amount });
        const withdrawal = {
            account_id: account.id,
            amount,
            created_at: new Date(),
        };
        await (0, conexao_1.knex)('withdrawals').insert(withdrawal);
        res.sendStatus(204);
    }
    catch (error) {
        console.error('Erro ao realizar saque da conta:', error);
        res.status(500).json({ mensagem: 'Erro interno do servidor.' });
    }
}
exports.realizarSaque = realizarSaque;
async function realizarTransferencia(req, res) {
    const apiKey = req.query.api_key;
    const { amount, account_id } = req.body;
    try {
        const account = await verificarUsuario(apiKey);
        if (!account) {
            res.status(404).json({ mensagem: "Conta não encontrada" });
            return;
        }
        const destinationAccount = await (0, conexao_1.knex)('accounts').where('id', account_id).first();
        if (!destinationAccount) {
            res.status(404).json({ mensagem: 'Conta de destino não encontrada.' });
            return;
        }
        if (account.balance < amount) {
            res.status(400).json({ mensagem: 'Saldo insuficiente.' });
            return;
        }
        const updatedSourceBalance = account.balance - amount;
        const updatedDestinationBalance = Number(destinationAccount.balance) + amount;
        await (0, conexao_1.knex)('accounts').where({ api_secret: apiKey }).update({ balance: updatedSourceBalance });
        await (0, conexao_1.knex)('accounts').where('id', account_id).update({ balance: updatedDestinationBalance });
        const transfer = {
            from_account_id: account.id,
            to_account_id: account_id,
            amount,
            created_at: new Date(),
        };
        await (0, conexao_1.knex)('transfers').insert(transfer);
        res.status(200).json();
    }
    catch (error) {
        console.error('Erro ao realizar transferência:', error);
        res.status(500).json({ mensagem: 'Erro interno do servidor.' });
    }
}
exports.realizarTransferencia = realizarTransferencia;
async function handleTransaction(req, res) {
    const apiKey = req.query.api_key;
    const { amount, payment_method, card_number, card_expiration_date, card_cvv, card_name, client_name, client_email } = req.body;
    if (payment_method !== 'credit' && payment_method !== 'billet') {
        res.status(400).json({ mensagem: 'Método de pagamento inválido' });
        return;
    }
    if (payment_method === 'credit' && (!card_number || !card_expiration_date || !card_cvv || !card_name)) {
        res.status(400).json({ mensagem: 'Dados do cartão inválidos' });
        return;
    }
    try {
        const account = await verificarUsuario(apiKey);
        if (!account) {
            res.status(404).json({ mensagem: "Conta não encontrada" });
            return;
        }
        let transaction;
        if (payment_method === 'credit') {
            if (account.balance < amount) {
                res.status(400).json({ mensagem: 'Saldo insuficiente.' });
                return;
            }
            transaction = {
                account_id: account.id,
                amount,
                payment_method,
                status: 'paid',
                card_number,
                card_name,
                card_expiration_date,
                card_cvv,
                client_name,
                client_email,
                paid_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
                bar_code: null
            };
            await (0, conexao_1.knex)('accounts').where({ api_secret: apiKey }).update({ balance: (account.balance - amount) });
        }
        else {
            transaction = {
                account_id: account.id,
                amount,
                payment_method,
                status: 'pending',
                card_number: null,
                card_name: null,
                card_expiration_date: null,
                card_cvv: null,
                client_name,
                client_email,
                paid_at: null,
                created_at: new Date().toISOString(),
                bar_code: generateApiKey()
            };
        }
        await (0, conexao_1.knex)('transactions').insert(transaction);
        res.status(200).json(transaction);
    }
    catch (error) {
        console.error('Erro ao realizar a transação:', error);
        res.status(500).json({ mensagem: 'Erro interno do servidor.' });
    }
}
exports.handleTransaction = handleTransaction;
async function cancelTransaction(req, res) {
    const apiKey = req.query.api_key;
    const transactionId = req.params.id;
    try {
        const account = await verificarUsuario(apiKey);
        if (!account) {
            res.status(404).json({ mensagem: "Conta não encontrada" });
            return;
        }
        const transaction = await (0, conexao_1.knex)('transactions').where({ id: transactionId, account_id: account.id }).first();
        if (!transaction) {
            res.status(404).json({ mensagem: 'Transação não encontrada.' });
            return;
        }
        if (transaction.status === 'canceled') {
            res.status(400).json({ mensagem: 'Transação já está cancelada.' });
            return;
        }
        if (transaction.status === 'pending') {
            await (0, conexao_1.knex)('transactions').where({ id: transactionId }).update({ status: 'canceled' });
        }
        if (transaction.status === 'paid') {
            const updatedBalance = Number(account.balance) + Number(transaction.amount);
            await conexao_1.knex.transaction(async (trx) => {
                await trx('accounts').where({ id: account.id }).update({ balance: updatedBalance });
                await trx('transactions').where({ id: transactionId }).update({ status: 'canceled' });
            });
        }
        res.status(204).json();
    }
    catch (error) {
        console.error('Erro ao cancelar a transação:', error);
        res.status(500).json({ mensagem: 'Erro interno do servidor.' });
    }
}
exports.cancelTransaction = cancelTransaction;
async function getTransaction(req, res) {
    const apiKey = req.query.api_key;
    const transactionId = req.params.id;
    try {
        const account = await verificarUsuario(apiKey);
        if (!account) {
            res.status(404).json({ mensagem: "Conta não encontrada" });
            return;
        }
        const transaction = await (0, conexao_1.knex)('transactions').where({ id: transactionId, account_id: account.id }).first();
        if (!transaction) {
            res.status(404).json({ mensagem: 'Transação inexistente.' });
            return;
        }
        res.status(200).json(transaction);
    }
    catch (error) {
        console.error('Erro ao obter detalhes da transação:', error);
        res.status(500).json({ mensagem: 'Erro interno do servidor.' });
    }
}
exports.getTransaction = getTransaction;
async function simulatePayment(req, res) {
    const apiKey = req.query.api_key;
    const transactionId = req.params.id;
    try {
        const account = await verificarUsuario(apiKey);
        if (!account) {
            res.status(404).json({ mensagem: "Usuario não encontrado" });
            return;
        }
        const transaction = await (0, conexao_1.knex)('transactions').where({ id: transactionId, account_id: account.id }).first();
        if (!transaction) {
            res.status(404).json({ mensagem: 'Transação inexistente.' });
            return;
        }
        if (transaction.status === 'canceled') {
            res.status(400).json({ mensagem: 'Transação está cancelada.' });
            return;
        }
        if (transaction.status === 'paid') {
            res.status(400).json({ mensagem: 'Transação já está paga.' });
            return;
        }
        if (Number(account.balance) < Number(transaction.amount)) {
            res.status(400).json({ mensagem: 'Saldo insuficiente.' });
            return;
        }
        await (0, conexao_1.knex)('transactions')
            .where({ id: transactionId })
            .update({ status: 'paid', paid_at: new Date() });
        await (0, conexao_1.knex)('accounts')
            .where({ id: account.id })
            .update({ balance: Number(account.balance) - Number(transaction.amount) });
        res.status(200).json();
    }
    catch (error) {
        console.error('Erro ao simular pagamento da transação:', error);
        res.status(500).json({ mensagem: 'Erro interno do servidor.' });
    }
}
exports.simulatePayment = simulatePayment;
async function verificarUsuario(apiKey) {
    const account = await (0, conexao_1.knex)('accounts').where({ api_secret: apiKey }).first();
    if (!account) {
        return false;
    }
    return account;
}
function generateApiKey() {
    const apiKeyLength = 16;
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let apiKey = '';
    for (let i = 0; i < apiKeyLength; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        apiKey += chars[randomIndex];
    }
    return apiKey;
}

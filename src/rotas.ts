import { Router } from "express"
import { atualizarConta, cadastrarConta, cancelTransaction, consultarSaldo, getTransaction, handleTransaction, realizarSaque, realizarTransferencia, simulatePayment } from './controladores/index'

const rotas = Router()

rotas.post('/account', cadastrarConta);
rotas.put('/account', atualizarConta);
rotas.get('/balance', consultarSaldo);
rotas.post('/withdraw', realizarSaque);
rotas.post('/transfer', realizarTransferencia);
rotas.post('/transaction', handleTransaction);
rotas.patch('/transaction/:id', cancelTransaction);
rotas.patch('/pay/:id', simulatePayment);
rotas.get('/transaction/:id', getTransaction);

export default rotas
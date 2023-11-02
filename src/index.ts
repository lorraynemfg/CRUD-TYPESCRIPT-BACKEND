import express from 'express'
import rotas from './rotas'
import dotenv from 'dotenv';
dotenv.config();


const app = express()

app.use(express.json())
app.use(rotas)

app.listen(process.env.PORT)
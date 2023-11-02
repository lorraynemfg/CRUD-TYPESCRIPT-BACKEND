import conexao from 'knex'
import dotenv from 'dotenv';
dotenv.config();
export const knex = conexao({
    client: 'pg',
    connection: {
        host: process.env.HOST,
        port: Number(process.env.PORT_BANCO_DADOS),
        user: process.env.USER,
        password: process.env.PASS,
        database: process.env.DATABASE
    }
})
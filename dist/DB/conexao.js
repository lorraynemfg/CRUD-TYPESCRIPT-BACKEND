"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.knex = void 0;
const knex_1 = __importDefault(require("knex"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.knex = (0, knex_1.default)({
    client: 'pg',
    connection: {
        host: process.env.HOST,
        port: Number(process.env.PORT_BANCO_DADOS),
        user: process.env.USER,
        password: process.env.PASS,
        database: process.env.DATABASE
    }
});

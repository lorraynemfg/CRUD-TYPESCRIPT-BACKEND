create database dindin 

CREATE TABLE usuarios (
    id serial primary key,
    nome VARCHAR(50) NOT NULL,
    email VARCHAR(50) NOT NULL UNIQUE,
    senha VARCHAR(1000) NOT NULL
);

CREATE TABLE categoria (
    id serial primary key,
     descricao VARCHAR(50) NOT NULL
);

CREATE TABLE transacoes (
    id serial primary key,
    descricao VARCHAR(50) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    data DATE NOT NULL,
    categoria_id INT NOT NULL,
    usuario_id INT NOT NULL,
    tipo varchar(50) NOT NULL,
    FOREIGN KEY (categoria_id) REFERENCES categoria(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

------------------------------------------------------------------------------------------------------------------------------>

INSERT INTO categoria (descricao) VALUES
('Alimentação'),
('Assinaturas e Serviços'),
('Casa'),
('Mercado'),
('Cuidados Pessoais'),
('Educação'),
('Família'),
('Lazer'),
('Pets'),
('Presentes'),
('Roupas'),
('Saúde'),
('Transporte'),
('Salário'),
('Vendas'),
('Outras receitas'),
('Outras despesas');

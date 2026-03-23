#!/bin/bash

# Identifica o diretório onde este script está localizado
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Acessa a pasta do projeto
cd "$DIR"

echo "Iniciando Servidor Local da Holding Patrimonial..."
echo "O seu navegador (padrão) vai abrir automaticamente em alguns instantes."

# Executa o Vite com o comando --open (já configurado no package.json)
npm run dev

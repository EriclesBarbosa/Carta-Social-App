const express = require('express');
const path = require('path');
const app = express();

// Serve os arquivos estáticos da pasta 'build' do React
app.use(express.static(path.join(__dirname, 'build')));

// Para qualquer outra requisição (GET), envia o 'index.html'
// Isso é necessário para que o roteamento do lado do cliente (client-side routing) do React funcione
app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
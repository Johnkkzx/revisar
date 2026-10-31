'use strict';

const { registrarComandos } = require('./index.js');
if (require.main === module) {
  registrarComandos(process.env.TOKEN?.trim())
    .then(id => console.log(`✅ /revisar registrado no servidor para o aplicativo ${id}.`))
    .catch(error => {
      console.error('Erro ao registrar o comando:', error.message);
      process.exitCode = 1;
    });
}
module.exports = { registrarComandos };

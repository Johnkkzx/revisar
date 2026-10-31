'use strict';

const bot = require('../index.js');
if (require.main === module) {
  bot.iniciar().catch(error => {
    console.error('Não foi possível iniciar o bot:', error.message);
    process.exitCode = 1;
  });
}
module.exports = bot;

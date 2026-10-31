# Bot Cidadão — entrada e revisão

Configurado para o mesmo servidor do primeiro bot: **1360772568436576536**.

## Funções mantidas

- Ao entrar um membro humano, atribui o cargo de entrada e o apelido `Cidadão. Nome`.
- Usa o nome de exibição do usuário, ou o username quando não há nome de exibição, com limite de 32 caracteres.
- O comando `/revisar` mantém o funcionamento do código original: **remove os cargos atuais dos membros e deixa o cargo Cidadão**, além de corrigir o apelido.
- Bots e o dono do servidor são ignorados na revisão. Membros que o bot não pode gerenciar são contabilizados como falhas/hierarquia alta.

**O `/revisar` também remove patentes e companhias atribuídas pelo primeiro bot. Execute apenas quando quiser fazer essa limpeza geral.** Ele não é executado automaticamente ao ligar. A atribuição na entrada adiciona o cargo de Cidadão, sem fazer limpeza geral.

O comando está registrado somente para administradores e também verifica a permissão na execução.

## Cargo Cidadão configurado

O cargo Cidadão já está definido diretamente em `index.js`: **1566176493967777913**. Não é necessário preencher uma variável de cargo no painel.

Configure apenas esta variável no painel da hospedagem:

| Nome | Valor |
| --- | --- |
| `TOKEN` | Token da aplicação deste segundo bot |

O ID do servidor já está preenchido em `index.js`. O ID do aplicativo é identificado pelo token. Não é necessário configurar `CLIENT_ID` ou `GUILD_ID`.

## Hospedar no Bot-Hosting.net

1. Crie/selecione o aplicativo deste bot em [Bot-Hosting.net](https://bot-hosting.net/).
2. Selecione **Node.js 24**, versão a partir de 24.17.0.
3. Envie e extraia este ZIP. Os arquivos `index.js` e `package.json` devem ficar juntos na raiz. O ZIP já foi organizado assim; extraia o pacote inteiro no gerenciador de arquivos da hospedagem. Não envie `node_modules` nem um `.env` com token dentro do pacote.
4. No campo do arquivo principal, se solicitado, informe **`index.js`**.
5. Em **Environment/variáveis de ambiente**, preencha somente `TOKEN`, sem aspas.
6. Configure o comando de inicialização:

```bash
npm ci && npm start
```

7. Inicie e confira a mensagem de bot online e `/revisar` registrado. Não é preciso executar `npm run deploy` separadamente.

Este bot usa seu próprio token e processo. Conforme a oferta gratuita anunciada pelo provedor, há limite de um deploy e renovação manual a cada quatro dias; confira a capacidade disponível antes de tentar manter os dois bots simultaneamente.

Ele não usa banco ou arquivo de fichas: as mudanças são feitas no Discord.

## Preparar o bot no Discord

1. No [Discord Developer Portal](https://discord.com/developers/applications), selecione a aplicação deste segundo bot e obtenha seu token.
2. Em **Bot → Privileged Gateway Intents**, ative **Server Members Intent**. Message Content Intent não é necessário.
3. Convide o bot para o servidor com os escopos `bot` e `applications.commands` e permissões para **Gerenciar cargos**, **Gerenciar apelidos**, ver canais, enviar mensagens e enviar embeds.
4. Coloque o cargo do bot acima do cargo Cidadão e dos membros/cargos que ele precisará limpar e renomear.
5. Use `/revisar` com um administrador apenas quando desejar limpar os cargos dos membros do servidor.

## Rodar no PC

Copie `.env.example` para `.env` e preencha somente `TOKEN`. Depois, na pasta que contém `package.json`:

```bash
npm ci
npm start
```

O comando `npm test` verifica as regras sem conectar o bot ao Discord ou alterar membros. O comando opcional `npm run deploy` registra `/revisar` usando o mesmo token e servidor; normalmente a inicialização já faz isso.

## Referências

- [Node.js no Bot-Hosting.net](https://bot-hosting.net/nodejs-hosting)
- [Permissões e hierarquia do Discord](https://docs.discord.com/developers/topics/permissions)
- [Gateway Intents do Discord](https://docs.discord.com/developers/events/gateway)

## Organização desta versão

O código principal está completo em **`index.js`**, na raiz. Não precisa de uma pasta `commands` ou `events` para iniciar. O pequeno arquivo `src/index.js` foi mantido para funcionar também com a configuração de entrada do pacote anterior.

Se estiver corrigindo o erro `Cannot find module ./commands/revisar`, pare o aplicativo, envie e extraia este ZIP na raiz e substitua os arquivos correspondentes. Preserve o `.env` se seu token estiver nele. Depois confira `package.json` e `index.js` lado a lado, selecione `index.js` como arquivo inicial e inicie com `npm ci && npm start`. O console identifica esta versão como **Bot Cidadão 1.0.2**.

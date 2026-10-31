'use strict';

// Implementação completa na raiz para facilitar o envio à hospedagem.
require('dotenv').config({ path: require('node:path').join(__dirname, '.env') });
const {
  Client, GatewayIntentBits, Events, MessageFlags, REST, Routes,
  SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder
} = require('discord.js');

const CONFIG_BOT = {
  ID_SERVIDOR: '1360772568436576536',
  ID_CARGO_CIDADAO: '1566176493967777913',
  PREFIXO_NOME: 'Cidadão. '
};

function validarAmbiente() {
  if (!process.env.TOKEN?.trim()) {
    throw new Error('Defina TOKEN nas variáveis de ambiente com o token deste segundo bot.');
  }
}

function nomeCidadao(member) {
  const nomeBase = member.user.globalName || member.user.username;
  return `${CONFIG_BOT.PREFIXO_NOME}${nomeBase}`.substring(0, 32);
}

const revisoesAtivas = new Set();

const revisar = {data: new SlashCommandBuilder().setName('revisar')
    .setDescription('Remove cargos dos membros e aplica o cargo e apelido de Cidadão.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (interaction.guildId !== CONFIG_BOT.ID_SERVIDOR) {
      return interaction.reply({ content: 'Este bot atende somente ao servidor configurado.', flags: MessageFlags.Ephemeral });
    }
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'Apenas administradores podem executar /revisar.', flags: MessageFlags.Ephemeral });
    }
    if (revisoesAtivas.has(interaction.guildId)) {
      return interaction.reply({ content: 'Já há uma revisão em andamento. Aguarde a conclusão.', flags: MessageFlags.Ephemeral });
    }
    revisoesAtivas.add(interaction.guildId);
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const cargo = await interaction.guild.roles.fetch(CONFIG_BOT.ID_CARGO_CIDADAO);
      if (!cargo) throw new Error('O cargo Cidadão configurado no código não foi encontrado neste servidor.');
      if (!cargo.editable) throw new Error('Coloque o cargo do bot acima do cargo Cidadão e permita Gerenciar cargos.');
      const bot = await interaction.guild.members.fetchMe();
      if (!bot.permissions.has([PermissionFlagsBits.ManageRoles, PermissionFlagsBits.ManageNicknames])) {
        throw new Error('O bot precisa das permissões Gerenciar cargos e Gerenciar apelidos.');
      }
      const members = await interaction.guild.members.fetch();
      let alterados = 0;
      let erros = 0;
      for (const member of members.values()) {
        if (member.user.bot || member.id === interaction.guild.ownerId) continue;
        if (!member.manageable) { erros++; continue; }
        try {
          let modificou = false;
          const cargosAtuais = member.roles.cache.filter(role => role.id !== interaction.guild.id);
          const temApenasOCargoAlvo = cargosAtuais.size === 1 && cargosAtuais.has(cargo.id);
          if (!temApenasOCargoAlvo) {
            // Mantém o comportamento original: limpa cargos e deixa Cidadão.
            await member.roles.set([cargo.id], `Revisão solicitada por ${interaction.user.tag}`);
            modificou = true;
          }
          const novoNome = nomeCidadao(member);
          if (member.nickname !== novoNome) {
            await member.setNickname(novoNome, `Revisão solicitada por ${interaction.user.tag}`);
            modificou = true;
          }
          if (modificou) alterados++;
        } catch (error) {
          erros++;
          console.error(`Não foi possível concluir a revisão do membro ${member.id}:`, error.message);
        }
      }
      const embed = new EmbedBuilder().setColor('#00FF00')
        .setTitle('🛠️ Revisão de Membros Concluída')
        .setDescription('O processo de formatação automatizada de quem já estava no servidor foi terminado.')
        .addFields(
          { name: '✅ Membros Atualizados/Limpos', value: `${alterados}`, inline: true },
          { name: '⚠️ Falhas ou Hierarquia Alta', value: `${erros}`, inline: true }
        ).setTimestamp().setFooter({ text: `Solicitado por: ${interaction.user.tag}` });
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Erro durante a revisão:', error.message);
      const resposta = { content: `❌ ${error.message}`, allowedMentions: { parse: [] } };
      if (interaction.deferred) await interaction.editReply(resposta);
      else await interaction.reply({ ...resposta, flags: MessageFlags.Ephemeral });
    } finally {
      revisoesAtivas.delete(interaction.guildId);
    }
  }
};

function registrarEntrada(client) {client.on(Events.GuildMemberAdd, async member => {
    if (member.guild.id !== CONFIG_BOT.ID_SERVIDOR || member.user.bot || member.id === member.guild.ownerId) return;
    try {
      const cargo = await member.guild.roles.fetch(CONFIG_BOT.ID_CARGO_CIDADAO);
      if (!cargo) throw new Error('O cargo Cidadão configurado no código não foi encontrado.');
      await member.roles.add(cargo.id);
      await member.setNickname(nomeCidadao(member));
      console.log(`✅ Cargo e nome de entrada configurados para ${member.user.tag}.`);
    } catch (error) {
      console.error(`Erro ao configurar a entrada de ${member.user.tag}:`, error.message);
    }
  });
}

async function registrarComandos(token, clientId) {
  if (!token) throw new Error('Defina TOKEN nas variáveis de ambiente com o token deste segundo bot.');
  const rest = new REST({ version: '10' }).setToken(token);
  if (!clientId) {
    const aplicativo = await rest.get(Routes.oauth2CurrentApplication());
    clientId = aplicativo.id;
  }
  await rest.put(Routes.applicationGuildCommands(clientId, CONFIG_BOT.ID_SERVIDOR), {
    body: [revisar.data.toJSON()]
  });
  return clientId;
}

async function iniciar() {
  validarAmbiente();
  const token = process.env.TOKEN.trim();
  console.log(`Iniciando Bot Cidadão 1.0.2 | Node ${process.versions.node} | servidor ${CONFIG_BOT.ID_SERVIDOR}`);
  const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });
  registrarEntrada(client);
  client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand() || interaction.commandName !== 'revisar') return;
    try {
      await revisar.execute(interaction);
    } catch (error) {
      console.error('Erro ao responder ao comando:', error.message);
      try {
        const resposta = { content: '❌ Não foi possível concluir o comando. Confira os logs do bot.', flags: MessageFlags.Ephemeral };
        if (interaction.deferred || interaction.replied) await interaction.followUp(resposta);
        else await interaction.reply(resposta);
      } catch (falha) { console.error('Não foi possível enviar a resposta:', falha.message); }
    }
  });
  client.on(Events.Error, error => console.error('Erro do Discord:', error.message));
  client.once(Events.ClientReady, () => {
    (async () => {
      const guild = await client.guilds.fetch(CONFIG_BOT.ID_SERVIDOR);
      const cargo = await guild.roles.fetch(CONFIG_BOT.ID_CARGO_CIDADAO);
      if (!cargo) throw new Error('O cargo Cidadão configurado no código não existe no servidor.');
      if (!cargo.editable) throw new Error('O bot precisa de Gerenciar cargos e ficar acima do cargo Cidadão.');
      await registrarComandos(token, client.application.id);
      console.log(`✅ ${client.user.tag} online em ${guild.name}. /revisar registrado.`);
    })().catch(error => {
      console.error('Falha na inicialização:', error.message);
      client.destroy();
      process.exitCode = 1;
    });
  });
  for (const sinal of ['SIGINT', 'SIGTERM']) {
    process.once(sinal, () => { client.destroy(); process.exit(0); });
  }
  try { await client.login(token); }
  catch (error) { client.destroy(); throw error; }
}

if (require.main === module) {
  iniciar().catch(error => {
    console.error('Não foi possível iniciar o bot:', error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  CONFIG_BOT, validarAmbiente, nomeCidadao, revisar,
  registrarEntrada, registrarComandos, iniciar
};

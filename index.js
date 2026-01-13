const { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  PermissionFlagsBits 
} = require('discord.js');
const axios = require('axios');

// ==================== CONFIG ====================
const CONFIG = {
  DISCORD_TOKEN: process.env.DISCORD_TOKEN,
  JELLYSEERR_URL: process.env.JELLYSEERR_URL,
  JELLYSEERR_API_KEY: process.env.JELLYSEERR_API_KEY,
  CHANNEL_ID: process.env.CHANNEL_ID,
  CHECK_INTERVAL: Number(process.env.CHECK_INTERVAL) || 10000
};

if (
  !CONFIG.DISCORD_TOKEN ||
  !CONFIG.JELLYSEERR_URL ||
  !CONFIG.JELLYSEERR_API_KEY ||
  !CONFIG.CHANNEL_ID
) {
  console.error('❌ Variables d’environnement manquantes');
  process.exit(1);
}

// ==================== CLIENT DISCORD ====================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent
  ]
});

// Requêtes en attente
const pendingRequests = new Map();

// ==================== API JELLYSEERR ====================
const jellyseerrAPI = axios.create({
  baseURL: CONFIG.JELLYSEERR_URL,
  headers: {
    'X-Api-Key': CONFIG.JELLYSEERR_API_KEY,
    'Content-Type': 'application/json'
  }
});

// ==================== JELLYSEERR FUNCTIONS ====================
async function getMediaDetails(mediaType, tmdbId) {
  try {
    const res = await jellyseerrAPI.get(`/api/v1/${mediaType}/${tmdbId}`);
    return res.data;
  } catch (err) {
    console.error(`❌ Média ${tmdbId} :`, err.message);
    return null;
  }
}

async function getPendingRequests() {
  try {
    const res = await jellyseerrAPI.get('/api/v1/request', {
      params: { take: 20, skip: 0, filter: 'pending' }
    });
    return res.data.results || [];
  } catch (err) {
    console.error('❌ Requêtes :', err.message);
    return [];
  }
}

async function approveRequest(id) {
  try {
    await jellyseerrAPI.post(`/api/v1/request/${id}/approve`);
    return true;
  } catch (err) {
    console.error(`❌ Approve ${id} :`, err.message);
    return false;
  }
}

async function declineRequest(id) {
  try {
    await jellyseerrAPI.post(`/api/v1/request/${id}/decline`);
    return true;
  } catch (err) {
    console.error(`❌ Decline ${id} :`, err.message);
    return false;
  }
}

// ==================== EMBED ====================
function createRequestEmbed(request, media) {
  const title = media?.title || media?.name || 'Titre inconnu';
  const overview = media?.overview || 'Aucune description';
  const mediaType = request.type;
  const poster = media?.posterPath;
  const release = media?.releaseDate || media?.firstAirDate;

  const user =
    request.requestedBy?.displayName ||
    request.requestedBy?.jellyfinUsername ||
    request.requestedBy?.plexUsername ||
    request.requestedBy?.email ||
    'Utilisateur inconnu';

  const embed = new EmbedBuilder()
    .setColor(mediaType === 'movie' ? 0x3498db : 0x9b59b6)
    .setTitle(`📺 Nouvelle requête : ${title}`)
    .setDescription(
      overview.length > 200 ? overview.slice(0, 200) + '…' : overview
    )
    .addFields(
      { name: '🎬 Type', value: mediaType === 'movie' ? 'Film' : 'Série', inline: true },
      { name: '👤 Demandé par', value: user, inline: true },
      { name: '📅 Date', value: new Date(request.createdAt).toLocaleDateString('fr-FR'), inline: true }
    )
    .setFooter({ text: `ID: ${request.id}` })
    .setTimestamp();

  if (release) {
    embed.addFields({
      name: '📆 Année',
      value: new Date(release).getFullYear().toString(),
      inline: true
    });
  }

  if (poster) {
    embed.setThumbnail(`https://image.tmdb.org/t/p/w200${poster}`);
  }

  return embed;
}

// ==================== CHECK REQUESTS ====================
async function checkForNewRequests() {
  try {
    const channel = await client.channels.fetch(CONFIG.CHANNEL_ID);
    if (!channel) return;

    const requests = await getPendingRequests();

    for (const req of requests) {
      if (pendingRequests.has(req.id)) continue;

      const tmdbId = req.media?.tmdbId;
      if (!tmdbId) continue;

      const media = await getMediaDetails(req.type, tmdbId);
      if (!media) continue;

      const embed = createRequestEmbed(req, media);
      const message = await channel.send({
        content: '🔔 **Nouvelle requête en attente**',
        embeds: [embed]
      });

      await message.react('✅');
      await message.react('❌');

      pendingRequests.set(req.id, {
        messageId: message.id,
        request: req
      });

      console.log(`📥 Requête publiée : ${media.title || media.name}`);
    }
  } catch (err) {
    console.error('❌ Check error :', err.message);
  }
}

// ==================== REACTIONS ====================
client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot) return;

  if (reaction.partial) await reaction.fetch();

  const entry = [...pendingRequests.entries()].find(
    ([, v]) => v.messageId === reaction.message.id
  );
  if (!entry) return;

  const [requestId] = entry;
  const member = await reaction.message.guild.members.fetch(user.id);

  if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
    await reaction.users.remove(user.id);
    return;
  }

  let success = false;
  let action = '';

  if (reaction.emoji.name === '✅') {
    success = await approveRequest(requestId);
    action = 'approuvée';
  }
  if (reaction.emoji.name === '❌') {
    success = await declineRequest(requestId);
    action = 'rejetée';
  }

  if (!success) return;

  const embed = EmbedBuilder.from(reaction.message.embeds[0])
    .setColor(reaction.emoji.name === '✅' ? 0x2ecc71 : 0xe74c3c)
    .setFooter({
      text: `ID: ${requestId} • ${action} par ${user.tag}`
    });

  await reaction.message.edit({
    content: `${reaction.emoji.name} **Requête ${action}**`,
    embeds: [embed]
  });

  await reaction.message.reactions.removeAll();
  pendingRequests.delete(requestId);
});

// ==================== COMMANDES ====================
client.on('messageCreate', async message => {
  if (message.author.bot || !message.content.startsWith('!')) return;

  if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return message.reply('❌ Permissions insuffisantes');
  }

  const [cmd, arg] = message.content.slice(1).split(' ');

  if (cmd === 'jellyseerr' && arg === 'check') {
    await message.reply('🔄 Vérification...');
    await checkForNewRequests();
  }

  if (cmd === 'jellyseerr' && arg === 'stats') {
    const reqs = await getPendingRequests();
    const embed = new EmbedBuilder()
      .setColor(0x1abc9c)
      .setTitle('📊 Jellyseerr')
      .addFields(
        { name: 'Requêtes en attente', value: `${reqs.length}`, inline: true },
        { name: 'Messages actifs', value: `${pendingRequests.size}`, inline: true }
      );

    message.reply({ embeds: [embed] });
  }
});

// ==================== READY ====================
client.once('ready', () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);
  checkForNewRequests();
  setInterval(checkForNewRequests, CONFIG.CHECK_INTERVAL);
});

client.login(CONFIG.DISCORD_TOKEN);
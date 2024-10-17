const { Client, Collection, GatewayIntentBits, PermissionsBitField, Partials, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, ButtonStyle, ButtonBuilder } = require("discord.js");
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildEmojisAndStickers, GatewayIntentBits.GuildIntegrations, GatewayIntentBits.GuildWebhooks, GatewayIntentBits.GuildInvites, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildMessageTyping, GatewayIntentBits.DirectMessages, GatewayIntentBits.DirectMessageReactions, GatewayIntentBits.DirectMessageTyping, GatewayIntentBits.MessageContent], shards: "auto", partials: [Partials.Message, Partials.Channel, Partials.GuildMember, Partials.Reaction, Partials.GuildScheduledEvent, Partials.User, Partials.ThreadMember] });
const { token } = require("./config.js");
const { readdirSync } = require("fs")
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const commands = [];
const fdb = require("croxydb");
client.commands = new Collection()

const rest = new REST({ version: '10' }).setToken(token);

const commandFiles = readdirSync('./src/commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./src/commands/${file}`);
    commands.push(command.data.toJSON());
    client.commands.set(command.data.name, command);
}
//Fr3zy Youtube
client.on("ready", async () => {
    try {
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands },
        );
    } catch (error) {
        console.error(error);
    }
    console.log(`${client.user.username} aktif :)`);
    console.log(`Bu altyapı youtube.com/@Fr3zy tarafından yapılmıştır. İzinsiz paylaşılması durumunda gerekli işlemler yapılır.`);
})

const eventFiles = readdirSync('./src/events').filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const event = require(`./src/events/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;
    if (interaction.customId === `basvuru-${interaction.guild.id}`) {
        const data = fdb.has(`basvuru_sistem.server_${interaction.guild.id}`);
        if (!data) return;
        const modal = new ModalBuilder()
            .setCustomId('basvuru_modal')
            .setTitle('Başvuru');//Fr3zy Youtube

        const isimInput = new TextInputBuilder()
            .setCustomId('isim')
            .setLabel("Adın nedir?")
            .setStyle(TextInputStyle.Short)

        const yasInput = new TextInputBuilder()
            .setCustomId('yas')
            .setLabel("Yaşın kaç?")
            .setStyle(TextInputStyle.Short)

        const nedenInput = new TextInputBuilder()
            .setCustomId('nedenbiz')
            .setLabel("Neden biz?")
            .setStyle(TextInputStyle.Short)

        const kacsaatInput = new TextInputBuilder()
            .setCustomId('kacsaat')
            .setLabel("Sunucumuzda kaç saat aktif olabilirsin?")
            .setStyle(TextInputStyle.Short)

        const row1 = new ActionRowBuilder().addComponents(isimInput);
        const row2 = new ActionRowBuilder().addComponents(yasInput);
        const row3 = new ActionRowBuilder().addComponents(nedenInput);
        const row4 = new ActionRowBuilder().addComponents(kacsaatInput);

        modal.addComponents(row1, row2, row3, row4);

        await interaction.showModal(modal);
    }
});
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isModalSubmit()) return;//Fr3zy Youtube
    if (interaction.customId === `basvuru_modal`) {
        const chechData = fdb.has(`basvuru_sistem.server_${interaction.guild.id}`);
        if (!chechData) return;
        const data = fdb.get(`basvuru_sistem.server_${interaction.guild.id}`);
        const ad = interaction.fields.getTextInputValue('isim');
        const yas = interaction.fields.getTextInputValue('yas');
        const nedenbiz = interaction.fields.getTextInputValue('nedenbiz');
        const kacsaat = interaction.fields.getTextInputValue('kacsaat');

        const logChannel = interaction.guild.channels.cache.get(data.basvuru_log);


        const row = new ActionRowBuilder()//Fr3zy Youtube
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`onayla-basvuru`)
                    .setLabel(`Onayla`)
                    .setEmoji(`✅`)
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`reddet-basvuru`)
                    .setLabel(`Reddet`)
                    .setEmoji(`❎`)
                    .setStyle(ButtonStyle.Danger)
            )

        const embed = new EmbedBuilder()
            .setAuthor({ name: `Yeni bir başvuru geldi!`, iconURL: interaction.guild.iconURL() })
            .setThumbnail(interaction.guild.iconURL())
            .addFields(
                { name: `İsim`, value: ad || "Belirtilmemiş", inline: true },
                { name: `Yaş`, value: yas || "Belirtilmemiş", inline: true },
                { name: `Neden Biz`, value: nedenbiz || "Belirtilmemiş", inline: true },
                { name: `Kaç Saat Aktif`, value: kacsaat || "Belirtilmemiş", inline: true },
                { name: `Etiket`, value: interaction.user.toString(), inline: true },
                { name: `Kullanıcı ID`, value: interaction.user.id, inline: true },
            )
            .setFooter({ text: `Başvuruları sadece 'Yönetici' kabul edebilir!` });
        logChannel.send({
            embeds: [embed],
            components: [row]
        }).then(msg => {
            fdb.set(`basvuru_sistem.server_${interaction.guild.id}.basvuranlar.basvuru-${msg.id}`, {//Fr3zy Youtube
                user: interaction.user.id,
                message: msg.id
            })

        })
        interaction.reply({ content: `✅ Başvurunuz başarıyla yetkili ekibine gönderildi.`, ephemeral: true });
    }
});
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;
    if (interaction.customId === `onayla-basvuru`) {
        const chechData = fdb.has(`basvuru_sistem.server_${interaction.guild.id}`);
        if (!chechData) return;
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return
        const data = fdb.get(`basvuru_sistem.server_${interaction.guild.id}`);
        const basvuranKullanici = fdb.get(`basvuru_sistem.server_${interaction.guild.id}.basvuranlar.basvuru-${interaction.message.id}.user`);
        const user = interaction.guild.members.cache.get(basvuranKullanici);
        const getDbRole = fdb.get(`basvuru_sistem.server_${interaction.guild.id}.yetkili_rol`);
        const role = interaction.guild.roles.cache.get(getDbRole);
        const msgID = fdb.get(`basvuru_sistem.server_${interaction.guild.id}.basvuranlar.basvuru-${interaction.message.id}.message`);
        const msg = await interaction.guild.channels.cache.get(data.basvuru_log)?.messages.fetch(msgID);
        //Fr3zy Youtube
        user.send(`
**${interaction.guild.name}** - Yetkili Başvuru

Selam ${user.toString()}, Başarıyla **${interaction.guild.name}** adlı sunucuya atmış oldugun yetkili başvurusu onaylandı.

${client.user.username} - Başvuru Sistemi`);

        user.roles.add(role).then(() => {
            interaction.channel.send({ content: `✅ Başvuru başarıyla onaylandı! ${user}'a \`@${role.name}\` yetkisi verildi! ${user.toString()}'a DM'den onaylandı mesajı gönderildi.`, ephemeral: false });
            msg.delete();
            fdb.delete(`basvuru_sistem.server_${interaction.guild.id}.basvuranlar.basvuru-${interaction.message.id}`);
        }).catch(() => {
            return
        })

    }
    if (interaction.customId === `reddet-basvuru`) {//Fr3zy Youtube
        const chechData = fdb.has(`basvuru_sistem.server_${interaction.guild.id}`);
        if (!chechData) return;
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return
        const data = fdb.get(`basvuru_sistem.server_${interaction.guild.id}`);
        const basvuranKullanici = fdb.get(`basvuru_sistem.server_${interaction.guild.id}.basvuranlar.basvuru-${interaction.message.id}.user`);
        const user = interaction.guild.members.cache.get(basvuranKullanici);
        const msgID = fdb.get(`basvuru_sistem.server_${interaction.guild.id}.basvuranlar.basvuru-${interaction.message.id}.message`);
        const msg = await interaction.guild.channels.cache.get(data.basvuru_log)?.messages.fetch(msgID);

        user.send(`
**${interaction.guild.name}** - Yetkili Başvuru

Selam ${user.toString()}, Maalesef **${interaction.guild.name}** adlı sunucuya atmış oldugun yetkili başvurusu reddedildi.

${client.user.username}
`);

        interaction.channel.send({ content: `❎ Başvuru reddedildi!, ${user.toString()}'a DM'den reddedildi mesajı gönderildi.`, ephemeral: false });//Fr3zy Youtube
        msg.delete();
        fdb.delete(`basvuru_sistem.server_${interaction.guild.id}.basvuranlar.basvuru-${interaction.message.id}`);

    }
});
client.login(token)
//Fr3zy Youtube



// Anti Crash:
process.on("uncaughtException", (err, origin) => {
    console.log(err.message);
});
process.on("uncaughtExceptionMonitor", (err, origin) => {
    console.log(err.message);
});
process.on("warning", (warn) => {
    console.log(warn.message);
});
process.on("unhandledRejection", (reason, promise) => {
    console.log(reason);
});
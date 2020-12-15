const { Client, Collection } = require("discord.js");
const Discord = require("discord.js");
const db = require("quick.db");
require("dotenv").config();
const { default_prefix } = require("./config.json");
const client = new Client({
  disableEveryone: true,
  partials: ["MESSAGE", "REACTION"]
});

client.commands = new Collection();
client.aliases = new Collection();
client.queue = new Map();
["commands"].forEach(handler => {
  require(`./handlers/${handler}`)(client);
});
/*******/ /*******/ /*******/ /*******/

/*******/ /*Message Event*//*******/ 

/*******/ /*******/ /*******/ /*******/
client.on("message", async message => {
  if (message.author.bot) return;
  if (!message.guild) return;
  let prefix = db.get(`prefix_${message.guild.id}`);
  if (prefix === null) prefix = default_prefix;
  if (!message.content.startsWith(prefix)) return;
  if (!message.member)
    message.member = await message.guild.fetchMember(message);
  const args = message.content
    .slice(prefix.length)
    .trim()
    .split(/ +/g);
  const cmd = args.shift().toLowerCase();
  if (cmd.length === 0) return;
  let command = client.commands.get(cmd);
  if (!command) command = client.commands.get(client.aliases.get(cmd));
  if (command) command.run(client, message, args);
});
/*******/ /*******/ /*******/ /*******/

/*******/ /*Reaction Add*//*******/ 

/*******/ /*******/ /*******/ /*******/
client.on("messageReactionAdd", async (reaction, user) => {
  if (user.bot) return
  let message = await reaction.message;
  if (
    message.reactions.cache.forEach(reaction =>
      reaction.users.cache.has(user.id)
    )
  ) {
    console.log("yes");
  }
  let menus = db.get(`rr_${message.guild.id}`);
  let menu;
  let menuIndex;
  if (!menus) return;
  for (let i = 0; i < menus.length; i++) {
    if (menus[i].ChannelID == message.channel.id && menus[i].ID == message.id) {
      menuIndex = i;
      menu = menus[i];
    }
  }
  if (!menu) return;
  let role;
  for (let i = 0; i < menu.roles.length; i++) {
    let type = reaction.emoji.id ? reaction.emoji.id : reaction.emoji.name;
    if (type == menu.roles[i].reaction) {
      role = menu.roles[i].role;
    }
  }
  if (menu.type != "single") {
    role = message.guild.roles.cache.find(x => x.id == role);
    if (!role) return;
    let member = message.guild.members.cache.find(x => x.id == user.id);
    if (!member) return;
    if (member.roles.cache.has(role.id)) return;
    member.roles.add(role.id);
    return;
  } else {
    console.log(menu.usersReacted)
    if (menu.usersReacted.includes(user.id)){
      await reaction.users.remove(user.id);
      return user
        .send(
          "You have already took role from this reaction set and you cannot take another!"
        )
        .catch(e => {
          return;
        });
    }
    role = message.guild.roles.cache.find(x => x.id == role);
    if (!role) return;
    let member = message.guild.members.cache.find(x => x.id == user.id);
    if (!member) return;
    if (member.roles.cache.has(role.id)) return;
    member.roles.add(role.id);
    menu.usersReacted.push(user.id);
    menus[menuIndex] = menu;
    db.set(`rr_${message.guild.id}`, menus);
    return;
  }
}); 
/*******/ /*******/ /*******/ /*******/

/*******/ /*Reaction Remove*//*******/ 

/*******/ /*******/ /*******/ /*******/
client.on("messageReactionRemove", async (reaction, user) => {
  if (user.bot) return
  let message = await reaction.message;
  let menus = db.get(`rr_${message.guild.id}`);
  let menu;
  let menuIndex;
  if (!menus) return;
  for (let i = 0; i < menus.length; i++) {
    if (menus[i].ChannelID == message.channel.id && menus[i].ID == message.id) {
      menu = menus[i];
      menuIndex = i;
    }
  }
  if (!menu) return;
  let role;
  for (let i = 0; i < menu.roles.length; i++) {
    let type = reaction.emoji.id ? reaction.emoji.id : reaction.emoji.name;
    if (type == menu.roles[i].reaction) {
      role = menu.roles[i].role;
    }
  }
  if (menu.type != "single") {
    role = message.guild.roles.cache.find(x => x.id == role);
    if (!role) return;
    let member = message.guild.members.cache.find(x => x.id == user.id);
    if (!member) return;
    if (!member.roles.cache.has(role.id)) return;
    member.roles.remove(role.id);
    return;
  } else {
    role = message.guild.roles.cache.find(x => x.id == role);
    if (!role) return;
    let member = message.guild.members.cache.find(x => x.id == user.id);
    if (!member) return;
    if (!member.roles.cache.has(role.id)) return;
    console.log(menu.usersReacted)
    if (menu.usersReacted.includes(user.id)) {
      let index;
      for (let i = 0; i < menu.usersReacted.length; i++) {
        if (menu.usersReacted[i] == user.id) {
          index = i;
        }
      }
      if (index != -1) {
        menu.usersReacted.splice(index, 1);
        console.log(menu.usersReacted)
        menus[menuIndex] = menu;
        db.set(`rr_${message.guild.id}`, menus);
      }
    }
    member.roles.remove(role.id);
    return;
  }
});
/*******/ /*******/ /*******/ /*******/

/*******/ /*Login to API*//*******/ 

/*******/ /*******/ /*******/ /*******/
client.login(process.env.token);

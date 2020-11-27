const discord = require("discord.js");
const db = require("quick.db");
module.exports = {
  name: "reactionrole",
  aliases: ["rr"],
  category: "Utility",
  description: "just reaction role",
  usage: "rr <create || add || remove> <name> <role> <emoji>",
  run: async (client, message, args) => {
    if (!message.member.hasPermission("MANAGE_ROLES")) {
      let embed = new discord.MessageEmbed()
        .setTitle(`Missing Permission`)
        .setDescription("You don't have MANAGE_ROLES permission in this guild")
        .setColor("RED");
      let msg = await message.channel.send(embed);
      msg.delete({ timeout: 5000 });
      return;
    }
    if (!message.guild.me.hasPermission("MANAGE_ROLES")) {
      let embed = new discord.MessageEmbed()
        .setTitle(`Missing Permission`)
        .setDescription("I don't have MANAGE_ROLES permission in this guild")
        .setColor("RED");
      let msg = await message.channel.send(embed);
      msg.delete({ timeout: 5000 });
      return;
    }
    if (!args[0]) {
      let embed = new discord.MessageEmbed()
        .setTitle(`Wrong Usage`)
        .setDescription("Please provide what you want to do")
        .setColor("RED");
      let msg = await message.channel.send(embed);
      msg.delete({ timeout: 5000 });
      return;
    }
    if (args[0] == "create") {
      if (!args[1]) {
        let embed = new discord.MessageEmbed()
          .setTitle(` Wrong Usage`)
          .setDescription("Please provide name")
          .setColor("RED");
        let msg = await message.channel.send(embed);
        msg.delete({ timeout: 5000 });
        return;
      }
      let menus = db.get(`rr_${message.guild.id}`);
      if(!menus) menus = []
      for (let i = 0; i < menus.length; i++) {
        if (menus[i].Name == args[1]) {
          return message.channel.send(
            `Reaction Role menu with that name exists already`
          );
        }
      }
      if (!args[2]) {
        let embed = new discord.MessageEmbed()
          .setTitle(` Wrong Usage`)
          .setDescription("Provide type of reaction menu (multi, single)")
          .setColor("RED");
        let msg = await message.channel.send(embed);
        msg.delete({ timeout: 5000 });
        return;
      }
      let type;
      if (args[2].toLowerCase() == `single` || args[2].toLowerCase() == `multi`) type = args[2];
      else type = "multi"
      let reactionEmbed = new discord.MessageEmbed()
        .setTitle(args[1])
        .setTimestamp(Date.now())
        .setColor("RANDOM");
      let msg = await message.channel.send(reactionEmbed);
      let MenuObject = {
        ChannelID: msg.channel.id,
        ID: msg.id,
        type: type,
        Name: args[1],
        color: "RANDOM",
        roles: [],
        usersReacted: []
      };
      db.push(`rr_${message.guild.id}`, MenuObject);

      let embed = new discord.MessageEmbed()
        .setAuthor(
          message.author.username,
          message.author.avatarURL({ dynamic: true })
        )
        .setTitle(` Role menu created`)
        .setDescription(
          `Menu ID: ${MenuObject.ID}\nMenu Name: ${MenuObject.Name}\n to add reactions use <prefix>rr add ${MenuObject.Name} <role>`
        );
      let resmsg = await message.channel.send(embed);
      resmsg.delete({ timeout: 5000 });
      message.delete();
      return;
    }
    if (args[0] == "add") {
      let menus = db.get(`rr_${message.guild.id}`);
      if(!menus) {
        let embed = new discord.MessageEmbed()
          .setTitle(` Wrong Usage`)
          .setDescription("There's no menus created!")
          .setColor("RED");
        let msg = await message.channel.send(embed);
        msg.delete({ timeout: 5000 });
        return;
      }
      if (!args[1]) {
        let embed = new discord.MessageEmbed()
          .setTitle(` Wrong Usage`)
          .setDescription("Please provide name")
          .setColor("RED");
        let msg = await message.channel.send(embed);
        msg.delete({ timeout: 5000 });
        return;
      }
      let menu;
      let index;
      for (let i = 0; i < menus.length; i++) {
        if (menus[i].Name.toLowerCase() == args[1].toLowerCase()) {
          menu = menus[i];
          index = i;
        }
      }
      if (!menu) {
        let embed = new discord.MessageEmbed()
          .setTitle(` Wrong Usage`)
          .setDescription("Role menu wasn't found!")
          .setColor("RED");
        let msg = await message.channel.send(embed);
        msg.delete({ timeout: 5000 });
        return;
      }
      if (menu.roles.length > 20) {
        let embed = new discord.MessageEmbed()
          .setTitle(` Wrong Usage`)
          .setDescription(
            "There's already 20 reactions under this reaction menu!"
          )
          .setColor("RED");
        let msg = await message.channel.send(embed);
        msg.delete({ timeout: 5000 });
        return;
      }
      let role =
        message.mentions.roles.first() ||
        message.guild.roles.cache.find(x => x.id == args[2]);
      if (!role) {
        let embed = new discord.MessageEmbed()
          .setTitle(` Wrong Usage`)
          .setDescription("Role wasn't found!")
          .setColor("RED");
        let msg = await message.channel.send(embed);
        msg.delete({ timeout: 5000 });
        return;
      }
      for(let i =0; i < menu.roles.lenght; i++ ) {
        if(menu.roles[i].role == role.id) {
          return message.channel.send("Reaction with this role is already in this menu!")
        }
      }
      let embed = new discord.MessageEmbed()
        .setTitle("Please react with emoji you want to set under this message")
        .setDescription("Warning! Bot need access to emoji to use it!");
      let msg = await message.channel.send(embed);
      let reaction = await msg
        .awaitReactions((reaction, user) => user.id == message.author.id, {
          max: 1,
          time: 60000,
          errors: ["time"]
        })
        .catch(async time => {
          let embed1 = new discord.MessageEmbed()
            .setTitle(` Wrong Usage`)
            .setDescription("Timeout")
            .setColor("RED");
          msg.edit(embed1);
          msg.delete({ timeout: 5000 });
          return;
        });
      reaction = await reaction.first();
      let checkReaction =
        client.emojis.cache.find(x => x.id == reaction.emoji.id) ||
        client.emojis.cache.find(x => x.name == reaction.emoji.name);
      let check = false;
      check = reaction.emoji.id ? checkReaction : true;
      if (!check) {
        let embed = new discord.MessageEmbed()
          .setTitle(` Wrong Usage`)
          .setDescription("Emoji wasn't found in bot emojies list!")
          .setColor("RED");
        let msg = await message.channel.send(embed);
        msg.delete({ timeout: 5000 });
        return;
      }
      let chl = message.guild.channels.cache.find(x => x.id == menu.ChannelID);
      if (!chl) {
        let embed = new discord.MessageEmbed()
          .setTitle(` Wrong Usage`)
          .setDescription(
            "Channel with this menu wasn't found, did you delete it?"
          )
          .setColor("RED");
        let msg = await message.channel.send(embed);
        msg.delete({ timeout: 5000 });
        return;
      }
      let rmsg = await chl.messages.fetch(menu.ID);
      if (!rmsg) {
        let embed = new discord.MessageEmbed()
          .setTitle(` Wrong Usage`)
          .setDescription(
            "Message with this menu wasn't found, did you delete it?"
          )
          .setColor("RED");
        let msg = await message.channel.send(embed);
        msg.delete({ timeout: 5000 });
        return;
      }

      let reactionRole = {
        role: role.id,
        custom: reaction.emoji.id ? true : false,
        reaction: reaction.emoji.id ? reaction.emoji.id : reaction.emoji.name,
        emoji: reaction.emoji.animated
          ? `<a:${reaction.emoji.name}:${reaction.emoji.id}>`
          : `<:${reaction.emoji.name}:${reaction.emoji.id}>`
      };

      rmsg.react(reactionRole.reaction);
      menu.roles.push(reactionRole);
      menus[index] = menu;
      let desc = [];
      for (let i = 0; i < menu.roles.length; i++) {
        menu.roles[i].custom
          ? desc.push(`${menu.roles[i].emoji} <@&${menu.roles[i].role}>`)
          : desc.push(`${menu.roles[i].reaction} <@&${menu.roles[i].role}>`);
      }
      embed = new discord.MessageEmbed()
        .setTitle(menu.Name)
        .setDescription(desc.join("\n"))
        .setColor(menu.color)
      rmsg.edit(embed);
      db.set(`rr_${message.guild.id}`, menus);
      embed = new discord.MessageEmbed()
        .setTitle("Done!")
        .setDescription("Added role to reaction menu!");
      msg.edit(embed);
      msg.delete({ timeout: 5000 });
      message.delete();
    }
    if (args[0] == "color") {
      if (!args[1])
        return message.channel.send(`Please provide reaction menu name`);
      let menus = db.get(`rr_${message.guild.id}`);
      if(!menus) {
        let embed = new discord.MessageEmbed()
          .setTitle(` Wrong Usage`)
          .setDescription("There's no menus created!")
          .setColor("RED");
        let msg = await message.channel.send(embed);
        msg.delete({ timeout: 5000 });
        return;
      }
      let menu;
      let index;
      for (let i = 0; i < menus.length; i++) {
        if (menus[i].Name == args[1]) {
          menu = menus[i];
          index = i;
        }
      }
      if (!menu) {
        let embed = new discord.MessageEmbed()
          .setTitle(` Wrong Usage`)
          .setDescription("Couldn't find Role menu with that name")
          .setColor("RED");
        let msg = await message.channel.send(embed);
        msg.delete({ timeout: 5000 });
        return;
      }
      let rchl = await message.guild.channels.cache.find(
        x => x.id == menu.ChannelID
      );
      if (!rchl) {
        let embed = new discord.MessageEmbed()
          .setTitle(` Wrong Usage`)
          .setDescription(
            "Channel with this menu wasn't found, did you delete it?"
          )
          .setColor("RED");
        let msg = await message.channel.send(embed);
        msg.delete({ timeout: 5000 });
        return;
      }
      let rmsg = await rchl.messages.fetch(menu.ID);
      if (!rmsg) {
        let embed = new discord.MessageEmbed()
          .setTitle(` Wrong Usage`)
          .setDescription(
            "Message with this menu wasn't found, did you delete it?"
          )
          .setColor("RED");
        let msg = await message.channel.send(embed);
        msg.delete({ timeout: 5000 });
        return;
      }
      if (!args[2])
        return message.channel.send(`Please provide hex color to set`);
      let hex = /^#[0-9A-F]{6}$/i;
      if (hex.test(args[2])) {
        let desc = [];
        for(let i = 0; i < menu.roles.length; i++) {
          menu.roles[i].custom
            ? desc.push(`${menu.roles[i].emoji} <@&${menu.roles[i].role}>`)
            : desc.push(`${menu.roles[i].reaction} <@&${menu.roles[i].role}>`);
        }
        menu.color = args[2];
        menus[index] = menu;
        db.set(`rr_${message.guild.id}`, menus);
        let embed = new discord.MessageEmbed()
          .setTitle(menu.Name)
          .setDescription(desc.join("\n"))
          .setColor(args[2]);
        rmsg.edit(embed);
        let resmsg = await message.channel.send(`Changed color to ${args[2]}`);
        resmsg.delete({ timeout: 5000 });
        message.delete();
      } else {
        return message.channel.send(`Provided argument wasn't hex`);
      }
    }
    if (args[0] == "remove") {
      let menus = db.get(`rr_${message.guild.id}`);
      if(!menus) {
        let embed = new discord.MessageEmbed()
          .setTitle(` Wrong Usage`)
          .setDescription("There's no menus created!")
          .setColor("RED");
        let msg = await message.channel.send(embed);
        msg.delete({ timeout: 5000 });
        return;
      }
      if (!args[1]) {
        let embed = new discord.MessageEmbed()
          .setTitle(` Wrong Usage`)
          .setDescription("Please provide name")
          .setColor("RED");
        let msg = await message.channel.send(embed);
        msg.delete({ timeout: 5000 });
        return;
      }
      let menu;
      let index;
      for (let i = 0; i < menus.length; i++) {
        if (menus[i].Name == args[1]) {
          menu = menus[i];
          index = i;
        }
      }
      if (!menu) {
        let embed = new discord.MessageEmbed()
          .setTitle(` Wrong Usage`)
          .setDescription("Role menu wasn't found!")
          .setColor("RED");
        let msg = await message.channel.send(embed);
        msg.delete({ timeout: 5000 });
        return;
      }
      let role = message.mentions.roles.first() || message.guild.roles.cache.find(x => x.id == args[2])
      if(!role){
        let embed = new discord.MessageEmbed()
          .setTitle(` Wrong Usage`)
          .setDescription("Please provide role ID or mention role")
          .setColor("RED");
        let msg = await message.channel.send(embed);
        msg.delete({ timeout: 5000 });
        return;
      }
      
      let rchl = await message.guild.channels.cache.find(
        x => x.id == menu.ChannelID
      );
      if (!rchl) {
        let embed = new discord.MessageEmbed()
          .setTitle(` Wrong Usage`)
          .setDescription(
            "Channel with this menu wasn't found, did you delete it?"
          )
          .setColor("RED");
        let msg = await message.channel.send(embed);
        msg.delete({ timeout: 5000 });
        return;
      }
      let rmsg = await rchl.messages.fetch(menu.ID);
      if (!rmsg) {
        let embed = new discord.MessageEmbed()
          .setTitle(` Wrong Usage`)
          .setDescription(
            "Message with this menu wasn't found, did you delete it?"
          )
          .setColor("RED");
        let msg = await message.channel.send(embed);
        msg.delete({ timeout: 5000 });
        return;
      }
      let roleCheck = false;
      let roleIndex;
      for(let i = 0; i < menu.roles.length; i++) {
        if(menu.roles[i].role == role.id) {
          roleCheck = true;
          roleIndex = i;
        }
      }
      if(roleCheck) {
        rmsg.reactions.cache.get(menu.roles[roleIndex].reaction).remove()
        menu.roles.splice(roleIndex, 1)
        menus[index] = menu
        db.set(`rr_${message.guild.id}`, menus)
        let desc = [];
        for (let i = 0; i < menu.roles.length; i++) {
          menu.roles[i].custom
            ? desc.push(`${menu.roles[i].emoji} <@&${menu.roles[i].role}>`)
            : desc.push(`${menu.roles[i].reaction} <@&${menu.roles[i].role}>`);
        } 
      let embed = new discord.MessageEmbed()
          .setTitle(menu.Name)
          .setDescription(desc.join("\n"))
          .setColor(menu.color);
        rmsg.edit(embed);
        
        let resmsg = await message.channel.send(`Deleted a reactionrole`);
        resmsg.delete({ timeout: 5000 });
        message.delete();
      } else {
        message.channel.send(`This role in this menu doesn't exist!`)
      }
    }
  }
};

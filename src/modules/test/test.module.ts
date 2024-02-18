import { GatewayIntentBits, SlashCommandBuilder } from "discord.js";
import { Module } from "../..";

export const testModule: Module = {
  name: "Test module",
  intents: [GatewayIntentBits.GuildMessages],
  async run(client) {
    console.log(client.emojis.cache);
  },
  commands: [
    {
      data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("ping pong"),
      async execute(interaction) {
        await interaction.reply("pong");
      },
    },
  ],
};

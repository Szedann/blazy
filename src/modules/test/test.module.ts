import { GatewayIntentBits, SlashCommandBuilder } from "discord.js";
import { Module } from "../../handlers/module.handler";

export const testModule: Module = {
  name: "Test module",
  id: "test",
  intents: [GatewayIntentBits.GuildMessages],
  async load() {},
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

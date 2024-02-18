import {
  Client,
  Awaitable,
  BitFieldResolvable,
  GatewayIntentsString,
  PermissionFlagsBits,
  SlashCommandBuilder,
  Events,
} from "discord.js";
import { Command, commands, reloadGuildSlashCommands } from "./command.handler";
import { modules } from "../modules/_modules";
import { Handler } from "..";

/**
 * an interface for creating modules
 */
export interface Module {
  name: string;
  id: string;
  run: (client: Client) => Awaitable<void>;
  commands?: Command[];
  enabledByDefault?: boolean;
  intents?: BitFieldResolvable<GatewayIntentsString, number>[];
}

export const moduleIntents =
  modules
    .map((module) => module.intents)
    .reduce((i1, i2) => [...(i1 ?? []), ...(i2 ?? [])]) || [];

export const configCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("config")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDescription("Configure the bot")
    .addStringOption((option) =>
      option
        .setName("module")
        .setDescription("select the module")
        .setChoices(
          ...modules
            .filter((module) => module.id != "base")
            .map((module) => ({ name: module.name, value: module.id })),
        )
        .setRequired(true),
    )
    .addBooleanOption((config) =>
      config
        .setName("enabled")
        .setDescription(
          "Set whether the module should be enabled for this guild",
        ),
    ),
  async execute(interaction) {
    await interaction.reply("bu");
  },
};

export const moduleCommands =
  modules
    .map((module) => module.commands)
    .reduce((commands1, commands2) => [
      ...(commands1 ?? []),
      ...(commands2 ?? []),
    ]) ?? [];

export const moduleHandler: Handler = (client) => {
  client.once(Events.ClientReady, async (client) => {
    for (const guild of await client.guilds.fetch())
      reloadGuildSlashCommands(guild[1].id, commands);
  });
};

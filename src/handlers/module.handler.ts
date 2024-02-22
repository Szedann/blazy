import {
  Client,
  Awaitable,
  BitFieldResolvable,
  GatewayIntentsString,
  PermissionFlagsBits,
  SlashCommandBuilder,
  Events,
  EmbedBuilder,
} from "discord.js";
import { Command, reloadGuildSlashCommands } from "./command.handler";
import { modules } from "../modules/_modules";
import { Handler, prisma } from "..";

/**
 * an interface for creating modules
 */
export interface Module {
  name: string;
  id: string;
  load: (client: Client) => Awaitable<void>;
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
    .addStringOption(
      (option) =>
        option
          .setName("module")
          .setDescription("select the module")
          .setChoices(
            ...modules
              .filter((module) => module.id != "base")
              .map((module) => ({ name: module.name, value: module.id })),
          ),
      // .setRequired(true),
    )
    .addBooleanOption((config) =>
      config
        .setName("enabled")
        .setDescription(
          "Set whether the module should be enabled for this guild",
        ),
    ),
  async execute(interaction) {
    if (!interaction.inGuild()) return;
    const module = interaction.options.get("module")?.value as
      | string
      | undefined;
    const enabled = interaction.options.get("enabled")?.value as
      | boolean
      | undefined;

    const selectedModules = module
      ? [modules.find((mdl) => mdl.id == module)!]
      : modules;

    if (enabled != undefined && module != undefined) {
      await setModuleEnabledForGuild(interaction.guildId, module, enabled);
      reloadGuildCommands(interaction.guildId);
    }

    const configRes = await prisma.guild.findUnique({
      where: {
        id: interaction.guildId,
      },
    });

    const config =
      configRes?.config &&
      typeof configRes.config === "object" &&
      !Array.isArray(configRes.config)
        ? configRes.config
        : {};

    const embeds: EmbedBuilder[] = [];

    for (const module of selectedModules) {
      embeds.push(
        new EmbedBuilder()
          .setTitle(module.name)
          .setDescription(
            `\`${module.id}\`\nEnabled: ${config[module.id] ?? module.enabledByDefault ?? false}`,
          ),
      );
    }

    await interaction.reply({
      embeds,
    });
  },
};

export const moduleCommands =
  modules
    .map((module) => module.commands)
    .reduce((commands1, commands2) => [
      ...(commands1 ?? []),
      ...(commands2 ?? []),
    ]) ?? [];

const reloadGuildCommands = async (guildId: string) => {
  const configRes = await prisma.guild.findUnique({
    where: {
      id: guildId,
    },
  });

  const config =
    configRes?.config &&
    typeof configRes.config === "object" &&
    !Array.isArray(configRes.config)
      ? configRes.config
      : {};

  const enabledModules = modules.filter(
    (module) => config[module.id] ?? module.enabledByDefault ?? false,
  );

  reloadGuildSlashCommands(guildId, [
    ...(enabledModules.filter((module) => module.commands).length > 0
      ? enabledModules
          .map((module) => module.commands)
          .filter((commands) => commands)
          .reduce((commands1, commands2) => [...commands1!, ...commands2!]) ??
        []
      : []),
    configCommand,
  ]);
};

export const isModuleEnabledForGuild = async (
  guildId: string,
  moduleId: string,
) => {
  const configRes = await prisma.guild.findUnique({
    where: {
      id: guildId,
    },
  });

  const config =
    configRes?.config &&
    typeof configRes.config === "object" &&
    !Array.isArray(configRes.config)
      ? configRes.config
      : {};
  return !!(
    config[moduleId] ??
    modules.find((module) => module.id == moduleId)?.enabledByDefault ??
    false
  );
};

export const setModuleEnabledForGuild = async (
  guildId: string,
  moduleId: string,
  enabled: boolean,
) => {
  const configRes = await prisma.guild.findUnique({ where: { id: guildId } });
  const config =
    configRes?.config &&
    typeof configRes.config === "object" &&
    !Array.isArray(configRes.config)
      ? configRes.config
      : {};
  config[moduleId] = enabled;
  if (configRes) {
    await prisma.guild.update({
      where: { id: guildId },
      data: { config },
    });
  } else {
    await prisma.guild.create({
      data: {
        id: guildId,
        config,
      },
    });
  }
};

export const moduleHandler: Handler = (client) => {
  client.once(Events.ClientReady, async (client) => {
    for (const guild of await client.guilds.fetch()) {
      reloadGuildCommands(guild[1].id);
    }
  });
};

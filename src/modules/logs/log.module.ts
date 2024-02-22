import { GatewayIntentBits, SlashCommandBuilder } from "discord.js";
import { Module } from "../../handlers/module.handler";
import { Log } from "./log";
import semver from "semver";
import { checkLogForIssues, issues } from "./logIssues";

export const logModule: Module = {
  name: "Log module",
  id: "logs",
  intents: [GatewayIntentBits.GuildMessages],
  async run(client) {
    console.log(client.emojis.cache);
  },
  commands: [
    {
      data: new SlashCommandBuilder()
        .setName("parselog")
        .setDescription("parse minecraft logs and detect issues")
        .addAttachmentOption((option) =>
          option.setName("log").setDescription("log file").setRequired(true),
        ),
      async execute(interaction) {
        const attachment = interaction.options.get("log")?.attachment;
        if (
          !attachment ||
          attachment?.contentType != "text/plain; charset=utf-8"
        )
          return;
        const log = new Log(await (await fetch(attachment.url)).text());
        issues;
        console.table(
          [...log.mods!.entries()].map((mod) => ({
            id: mod[0],
            version: mod[1],
            cleanVersion:
              semver.valid(semver.coerce(mod[1], { rtl: false })) || "none",
          })),
        );
        console.table(checkLogForIssues(log));
      },
    },
  ],
};

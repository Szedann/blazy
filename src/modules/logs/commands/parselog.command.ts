import { SlashCommandBuilder } from "discord.js";
import { Command } from "../../../handlers/command.handler";
import { getTextFromAttachment, getLogEmbeds } from "../log.module";
import { checkLogForIssues } from "../logIssues";
import { Log } from "../log";

export const parseLogCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("parselog")
    .setDescription(
      "parse minecraft logs and detect issues, also uploads to mclo.gs",
    )
    .addAttachmentOption(option =>
      option.setName("log").setDescription("log file").setRequired(true),
    ),
  async execute(interaction) {
    const attachment = interaction.options.get("log", true)?.attachment;
    if (!attachment) return;
    const logText = await getTextFromAttachment(attachment);
    if (!logText) return;

    const log = new Log(logText);
    const issues = checkLogForIssues(log);
    interaction.reply({ embeds: getLogEmbeds(log, issues) });
  },
};

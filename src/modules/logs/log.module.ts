import {
  Attachment,
  Colors,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
} from "discord.js";
import { Module } from "../../handlers/module.handler";
import { Log } from "./log";
import { checkLogForIssues } from "./logIssues";
import { parseLogCommand } from "./commands/parselog.command";
import logProviders from "./providers/_logProviders";

export interface LogProvider {
  hostnames: string[];
  parse: (url: string) => Promise<void | string>;
}

const hostnameMap = new Map<string, (text: string) => Promise<void | string>>();

for (const provider of logProviders) {
  provider.hostnames.forEach(hostname =>
    hostnameMap.set(hostname, provider.parse),
  );
}

async function readWebLog(text: string): Promise<string | void> {
  const reg = text.match(
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/,
  );
  if (!reg) return;
  const url = reg[0];
  const hostname = url.split("/")[2];
  if (!hostnameMap.has(hostname)) return;
  return hostnameMap.get(hostname)!(url);
}

export const logModule: Module = {
  name: "Log module",
  id: "logs",
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  async load(client) {
    console.log("log module");
    client.on(Events.MessageCreate, async message => {
      try {
        if (message.channel.partial) await message.channel.fetch();
        if (message.author.partial) await message.author.fetch();

        const attachment = message.attachments.find(
          attachment => attachment.contentType == "text/plain; charset=utf-8",
        );

        if (!message.content && !attachment) return;
        if (!message.channel.isTextBased()) return;

        if (message.author === client.user) return;

        const logText = attachment
          ? await getTextFromAttachment(attachment)
          : await readWebLog(message.content);

        if (!logText) return;

        const regexPasses = [
          /---- Minecraft Crash Report ----/, // Forge Crash report
          /\n\\|[\\s\\d]+\\| Minecraft\\s+\\| minecraft\\s+\\| (\\S+).+\n/, // Quilt mod table
          /: Loading Minecraft (\\S+)/, // Fabric, Quilt
          /--fml.mcVersion, ([^\\s,]+)/, // Forge
          /--version, ([^,]+),/, // ATLauncher
          / --version (\\S+) /, // MMC, Prism, PolyMC
        ];

        if (!regexPasses.find(reg => logText.match(reg))) return;

        const log = new Log(logText);
        const issues = checkLogForIssues(log);
        message.reply({ embeds: getLogEmbeds(log, issues) });
      } catch (error) {
        console.error("Unhandled exception on MessageCreate", error);
      }
    });
  },
  commands: [parseLogCommand],
};

export async function getTextFromAttachment(attachment: Attachment) {
  if (!attachment || attachment?.contentType != "text/plain; charset=utf-8")
    return;
  return await (await fetch(attachment.url)).text();
}

export function getLogEmbeds(
  log: Log,
  issues: ReturnType<typeof checkLogForIssues>,
) {
  const embeds = [
    new EmbedBuilder({
      title: "Log Parsed",
      fields: [
        {
          name: "Minecraft version",
          value: log.gameVersion ?? "not found",
          inline: true,
        },
        {
          name: `${log.loader?.name ?? "not fond"} version`,
          value: log.loader?.version ?? "not found",
          inline: true,
        },
        {
          name: "Java version",
          value: log.javaVersion ?? "not found",
          inline: true,
        },
      ],
    }),
  ];
  if (issues)
    embeds.push(
      new EmbedBuilder({
        title: `${issues.length} issue${issues.length != 1 ? "s" : ""} found`,
        color: Colors.Red,
        fields: issues,
      }),
    );
  return embeds;
}

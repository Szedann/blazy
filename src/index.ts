import {
  BitFieldResolvable,
  Client,
  Events,
  GatewayIntentsString,
} from "discord.js";
import { cyan } from "colorette";
import { modules } from "./modules/_modules";
import commandHandler, { Command } from "./handlers/command.handler";

export interface Module {
  name: string;
  run: (client: Client) => unknown;
  commands?: Command[];
  intents?: BitFieldResolvable<GatewayIntentsString, number>[];
}

export type Handler = (client: Client) => unknown;

const handlers = [commandHandler];

const client = new Client({
  intents:
    modules
      .map((module) => module.intents)
      .reduce((i1, i2) => [...(i1 ?? []), ...(i2 ?? [])]) || [],
});

modules.forEach((module) => module.run(client));

handlers.forEach((handler) => handler(client));

client.once(Events.ClientReady, async (client) => {
  console.info(
    cyan(
      `Logged in as ${
        client.user.discriminator == "0"
          ? client.user.username
          : client.user.tag
      }`,
    ),
  );
});

client.login(process.env.DISCORD_TOKEN);

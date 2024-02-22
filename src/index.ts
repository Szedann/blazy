import { Client, Events } from "discord.js";
import { cyan } from "colorette";
import { modules } from "./modules/_modules";
import commandHandler from "./handlers/command.handler";
import { buttonHandler } from "./handlers/button.handler";
import { moduleHandler, moduleIntents } from "./handlers/module.handler";
import { PrismaClient } from "@prisma/client";

export type Handler = (client: Client) => unknown;

const handlers = [commandHandler, buttonHandler, moduleHandler];

export const prisma = new PrismaClient({});

const client = new Client({
  intents: moduleIntents,
});

modules.forEach((module) => module.load(client));

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

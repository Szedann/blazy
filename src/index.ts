import { Client, IntentsBitField, InteractionType } from "discord.js";
import { cyan } from "colorette";

const client = new Client({
  intents: [IntentsBitField.Flags.GuildMessages],
});

client.once("ready", async (client) => {
  console.info(
    cyan(
      `Logged in as ${
        client.user.discriminator == "0"
          ? client.user.username
          : client.user.tag
      }`
    )
  );
});

client.login(process.env.DISCORD_TOKEN);

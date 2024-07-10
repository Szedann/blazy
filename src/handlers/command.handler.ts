import { Handler } from "..";
import {
  REST,
  Routes,
  CommandInteraction,
  Collection,
  EmbedBuilder,
  RESTGetAPIOAuth2CurrentApplicationResult,
  Events,
  SlashCommandBuilder,
} from "discord.js";
import * as color from "colorette";
import { configCommand, moduleCommands } from "./module.handler";

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);

// LOAD COMMANDS AND UPLOAD TO DISCORD //

/**
 * an interface for creating commands
 */
export interface Command {
  /**
   * SlashCommandBuilder for setting command data
   */
  data: Pick<SlashCommandBuilder, "toJSON" | "name" | "description">;
  /**
   * callback that will be ran, after the command is executed.
   * make sure to await every message send otherwise you'll encounter issues
   */
  execute: (interaction: CommandInteraction) => Promise<unknown>;
}

export const commands = [...moduleCommands, configCommand];

const commandCollection = new Collection<string, Command>(
  commands.map(command => [command.data.name, command]),
);

console.log(); // prints an empty line

console.log(
  color.blueBright(
    `Loaded ${commands.length} command${commands.length == 1 ? "" : "s"}:`,
  ),
);

for (const index in commands) {
  const command = commands[index];
  console.log(
    `|| ${color.whiteBright(
      parseInt(index) + 1 + ". " + command.data.name,
    )}:\n||     → ${command.data.description}`,
  );
}

console.log(); // prints an empty line

// taken from discord.js docs and transformed a bit
export async function reloadGlobalSlashCommands() {
  try {
    console.log(
      color.bgYellowBright(
        `Started refreshing ${commands.length} application (/) commands.`,
      ),
    );
    console.time(color.yellowBright("Reloading global commands"));

    // The put method is used to fully refresh all commands with the current set

    const { id: appId } = (await rest.get(
      Routes.oauth2CurrentApplication(),
    )) as RESTGetAPIOAuth2CurrentApplicationResult;

    await rest.put(Routes.applicationCommands(appId), {
      body: commands.map(commandList => commandList.data.toJSON()),
    });

    console.log(`Successfully reloaded global application (/) commands.`);
    console.timeEnd(color.yellowBright("Reloading global commands"));
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
  }
}

export async function reloadGuildSlashCommands(
  guildId: string,
  commands: Command[],
) {
  try {
    console.log(
      color.bgYellowBright(
        `Started refreshing ${commands.length} application (/) commands for guild ${guildId}.`,
      ),
    );
    console.time(color.yellowBright(`Reloading commands for guild ${guildId}`));

    // The put method is used to fully refresh all commands with the current set

    const { id: appId } = (await rest.get(
      Routes.oauth2CurrentApplication(),
    )) as RESTGetAPIOAuth2CurrentApplicationResult;

    await rest.put(Routes.applicationGuildCommands(appId, guildId), {
      body: commands.map(commandList => commandList.data.toJSON()),
    });

    console.log(
      `Successfully reloaded application (/) commands for guild ${guildId}.`,
    );
    console.timeEnd(
      color.yellowBright(`Reloading commands for guild ${guildId}`),
    );
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
  }
}

const commandHandler: Handler = client => {
  client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isCommand()) return; // make sure that the interaction came from a command
    if (!commandCollection.has(interaction.commandName)) return; // and that the command exist on this app

    try {
      await commandCollection
        .get(interaction.commandName)!
        .execute(interaction); // try execute the command
      if (!interaction.replied)
        interaction.reply({
          embeds: [
            new EmbedBuilder({
              color: 0x22ffff,
              title: "Command executed with no output.",
            }),
          ],
          ephemeral: true,
        });
    } catch (error) {
      // in case of an error

      if (interaction.isRepliable())
        await interaction.reply({
          embeds: [
            new EmbedBuilder({
              color: 0xff2222,
              title: "Command couldn't get executed",
            }),
          ],
          ephemeral: true,
        });
      return;
    }
  });
};

export default commandHandler;

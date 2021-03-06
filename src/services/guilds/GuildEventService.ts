import { Guild, GuildMember } from "discord.js";
import { CommandManager } from "../../lib/command/CommandManager";
import { GowonClient } from "../../lib/GowonClient";
import { Logger } from "../../lib/Logger";
import { displayNumber } from "../../lib/views/displays";
import { BaseService } from "../BaseService";
import { AdminService } from "../dbservices/AdminService";
import { GowonService } from "../GowonService";
import { MirrorballService } from "../mirrorball/MirrorballService";

export class GuildEventService extends BaseService {
  gowonService = GowonService.getInstance();
  adminService = new AdminService(this.gowonClient);
  commandManager = new CommandManager();
  mirrorballService = new MirrorballService();

  constructor(private gowonClient: GowonClient, logger?: Logger) {
    super(logger);
  }

  async init() {
    await this.commandManager.init();
  }

  public async handleNewGuild(guild: Guild) {
    this.log(`setting up Gowon for ${guild.name}`);

    await this.setupPermissions(guild);
    await this.pingDeveloper(guild);
  }

  public async handleGuildLeave(guild: Guild) {
    await this.pingDeveloper(guild, true);
  }

  public async handleNewUser(guildMember: GuildMember) {
    this.log("Handling new user");
    try {
      await this.mirrorballService.quietAddUserToGuild(
        guildMember.user.id,
        guildMember.guild.id
      );
    } catch (e) {
      this.log(
        `Failed to log in guildMember ${guildMember.user.id} in ${guildMember.guild.id} (${e})`
      );
    }
  }

  public async handleUserLeave(guildMember: GuildMember) {
    this.log("Handling user leave");
    try {
      await this.mirrorballService.quietRemoveUserFromGuild(
        guildMember.user.id,
        guildMember.guild.id
      );
    } catch (e) {
      this.log(
        `Failed to log out guildMember ${guildMember.user.id} in ${guildMember.guild.id} (${e})`
      );
    }
  }

  private async setupPermissions(guild: Guild) {
    let commands = [
      { command: "permissions", dev: false },
      { command: "crowns kill", dev: false },
      { command: "crowns ban", dev: false },
      { command: "crowns banartist", dev: false },
      { command: "crowns unban", dev: false },
      { command: "crowns unbanartist", dev: false },
      { command: "scraperlastscrobbled", dev: true },
      { command: "scraperartisttoptracks", dev: true },
      { command: "scraperartisttopalbums", dev: true },
      { command: "scraperalbumtoptracks", dev: true },
    ];

    for (let commandName of commands) {
      const { command, runAs } = await this.commandManager.find(
        commandName.command,
        guild.id
      );

      if (command) {
        try {
          await this.adminService.disableCommand(
            command.id,
            guild.id,
            runAs.toCommandFriendlyName(),
            commandName.dev
          );
        } catch (e) {
          this.log(
            `Error while setting up permissions for ${guild.name}:${e.message}`
          );
        }
      }
    }
  }

  private async pingDeveloper(guild: Guild, leave = false) {
    const developerID = this.gowonClient.specialUsers.developers[0].id;

    await this.gowonClient.client.users
      .resolve(developerID)
      ?.send(
        `Gowon just ${leave ? "left" : "joined"} ${guild.name} (${displayNumber(
          guild.memberCount,
          "member"
        )})`
      );
  }
}

import { LogicError } from "../../../errors";
import { Arguments } from "../../../lib/arguments/arguments";
import { Logger } from "../../../lib/Logger";
import { CrownsChildCommand } from "./CrownsChildCommand";

export class Unban extends CrownsChildCommand {
  description = "Unbans a user from the crowns game";
  usage = "@user";
  arguments: Arguments = {
    mentions: {
      user: { index: 0, description: "The user to unban from the crowns game" },
    },
  };

  async run() {
    let { dbUser, senderUser } = await this.parseMentionedUsername();

    if (!dbUser || dbUser.discordID === senderUser?.discordID) {
      this.logger.log("dbuser", Logger.formatObject(dbUser))
      this.logger.log("senderUser", Logger.formatObject(senderUser))
      throw new LogicError(`please mention a valid user`);
    }

    await this.crownsService.unbanUser(dbUser);
    this.crownsService.scribe.unban(dbUser, this.message.author, this.message.mentions.members!.array()[0].user)

    await this.reply(
      `successfully unbanned ${
        (await dbUser.toDiscordUser(this.message))!.username
      }`
    );
  }
}
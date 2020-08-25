import { CrownsChildCommand } from "./CrownsChildCommand";
import { Message, MessageEmbed, User } from "discord.js";
import { numberDisplay, getOrdinal, ucFirst } from "../../../helpers";
import { Arguments } from "../../../lib/arguments/arguments";

export class Rank extends CrownsChildCommand {
  aliases = ["r"];
  description = "Ranks a user based on their crown count";
  usage = ["", "@user"];

  arguments: Arguments = {
    mentions: {
      user: { index: 0 },
    },
  };

  async run(message: Message) {
    let user = this.parsedArguments.user as User;

    let discordID = user?.id || message.author.id;

    let perspective = this.usersService.discordPerspective(
      message.author,
      user
    );

    let rank = await this.crownsService.getRank(discordID, message.guild?.id!);

    let embed = new MessageEmbed()
      .setAuthor(
        ucFirst(perspective.possessive) + " crowns rank",
        perspective.discordUser?.displayAvatarURL()
      )
      .setDescription(
        `${ucFirst(perspective.possessive)} ${numberDisplay(
          rank.count,
          "crown"
        ).bold()} rank ${perspective.objectPronoun} ${getOrdinal(
          rank.rank.toInt()
        ).bold()} in ${message.guild?.name}`
      );

    await this.send(embed);
  }
}

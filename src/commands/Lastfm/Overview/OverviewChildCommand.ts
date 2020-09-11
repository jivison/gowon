import { LastFMBaseChildCommand } from "../LastFMBaseCommand";
import { OverviewStatsCalculator } from "../../../lib/calculators/OverviewStatsCalculator";
import { Message } from "discord.js";
import { Arguments } from "../../../lib/arguments/arguments";
import { ucFirst } from "../../../helpers";

export abstract class OverviewChildCommand extends LastFMBaseChildCommand {
  parentName = "overview";
  subcategory = "overview";
  usage = ["", "@user or lfm:username"];

  arguments: Arguments = {
    mentions: {
      user: { index: 0, nonDiscordMentionParsing: this.ndmp },
    },
  };

  calculator!: OverviewStatsCalculator;
  username!: string;
  senderUsername!: string;

  async getAuthorDetails(): Promise<{
    badge: string;
    colour: string;
    image: string;
  }> {
    let image = (await this.calculator.userInfo()).image.find(
      (i) => i.size === "large"
    )?.["#text"]!;

    let userType = (await this.calculator.userInfo()).type;
    let badge =
      userType !== "user"
        ? userType === "subscriber"
          ? " [Pro]"
          : ` [${ucFirst(userType)}]`
        : "";

    let colour =
      userType === "alum"
        ? "#9804fe"
        : userType === "mod"
        ? "#fb9904"
        : userType === "staff"
        ? "#b90100"
        : userType === "subscriber"
        ? "black"
        : "#ffffff";

    return { colour, badge, image };
  }

  async prerun(message: Message) {
    let user: { id?: string } = {},
      username: string;

    if (typeof this.parsedArguments.user === "string") {
      username = this.parsedArguments.user as string;
      let [dbUser, senderUsername] = await Promise.all([
        this.usersService.getUserFromLastFMUsername(username),
        this.usersService.getUsername(message.author.id),
      ]);

      if (dbUser) user = await message.guild!.members.fetch(dbUser?.discordID!);
      this.senderUsername = senderUsername;
    } else {
      let {
        dbUser,
        username: parsedUsername,
        senderUsername,
      } = await this.parseMentionedUsername();

      user = dbUser ? { id: dbUser.discordID } : user;
      username = parsedUsername;
      this.senderUsername = senderUsername;
    }

    this.username = username;

    this.calculator = new OverviewStatsCalculator(
      username,
      message.guild?.id!,
      user.id,
      this.logger
    );
  }
}

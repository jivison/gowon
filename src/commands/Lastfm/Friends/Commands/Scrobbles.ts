import { FriendsChildCommand } from "../FriendsChildCommand";
import { MessageEmbed } from "discord.js";
import { MultiRequster } from "../../../../lib/MultiRequester";
import { numberDisplay } from "../../../../helpers";
import { Arguments } from "../../../../lib/arguments/arguments";
import {
  generateHumanTimeRange,
  generateTimeRange,
  TimeRange,
} from "../../../../helpers/date";

export class Scrobbles extends FriendsChildCommand {
  description = "View how many scrobbles your friends have";
  aliases = ["s"];
  usage = ["", "time period"];

  arguments: Arguments = {
    inputs: {
      timeRange: {
        custom: (messageString: string) => generateTimeRange(messageString),
        index: -1,
      },
      humanReadableTimeRange: {
        custom: (messageString: string) =>
          generateHumanTimeRange(messageString),
        index: -1,
      },
    },
  };

  throwIfNoFriends = true;

  async run() {
    let timeRange = this.parsedArguments.timeRange as TimeRange,
      humanTimeRange = this.parsedArguments.humanReadableTimeRange as string;

    let scrobbles = await new MultiRequster([
      ...this.friendUsernames,
      this.senderUsername,
    ]).fetch(this.lastFMService.getNumberScrobbles.bind(this.lastFMService), [
      timeRange.from,
      timeRange.to,
    ]);

    let embed = new MessageEmbed()
      .setTitle(`Your friends scrobbles ${humanTimeRange}`)
      .setDescription(
        Object.keys(scrobbles)
          .sort((a, b) => scrobbles[b] - scrobbles[a])
          .map((username) => {
            let s = scrobbles[username];

            return `${username.code()} - **${numberDisplay(s, "**scrobble")}`;
          })
      );

    await this.send(embed);
  }
}
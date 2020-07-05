import { CrownCheck } from "../../services/dbservices/CrownsService";
import { User as DiscordUser, MessageEmbed, Message, User } from "discord.js";
import { numberDisplay } from "..";
import { ArtistInfo } from "../../services/LastFMService.types";

export class CrownEmbeds {
  private constructor() {}

  static newCrown(crownCheck: CrownCheck, user: DiscordUser): MessageEmbed {
    return new MessageEmbed()
      .setTitle(`Crown for ${crownCheck.crown!.artistName}`)
      .setDescription(
        `:crown: → \`${user.username}\` - ${numberDisplay(
          crownCheck.crown!.plays,
          "play"
        )}
      
      You've created a crown for **${
        crownCheck.crown!.artistName
      }** with **${numberDisplay(crownCheck.crown!.plays, "play")}**`
      );
  }

  static updatedCrown(crownCheck: CrownCheck): MessageEmbed {
    return new MessageEmbed()
      .setTitle(`Crown for ${crownCheck.crown!.artistName}`)
      .setDescription(
        `You already have the crown **${
          crownCheck.crown!.artistName
        }**, but it's been updated from ${numberDisplay(
          crownCheck.oldCrown!.plays,
          "play"
        )} to **${numberDisplay(crownCheck.crown!.plays, "play")}**`
      );
  }

  static async snatchedCrown(
    crownCheck: CrownCheck,
    user: User,
    message: Message
  ): Promise<MessageEmbed> {
    let holderUsername = await crownCheck.crown?.user!.toDiscordUser(message);

    return new MessageEmbed()
      .setTitle(`Crown for ${crownCheck.crown!.artistName}`)
      .setDescription(
        `
:crown: → \`${user.username}\` - ${numberDisplay(
          crownCheck.crown!.plays,
          "play"
        )}

:pensive: → \`${holderUsername}\` - ${numberDisplay(
          crownCheck.oldCrown?.plays!,
          "play"
        )}

        Yoink! The crown for **${
          crownCheck.crown!.artistName
        }** was stolen from ${holderUsername} and is now at **${numberDisplay(
          crownCheck.crown!.plays,
          "play"
        )}**!`
      );
  }

  static async fail(
    crownCheck: CrownCheck,
    artistDetails: ArtistInfo,
    message: Message,
    user: User
  ): Promise<MessageEmbed> {
    let holderUsername = await crownCheck.crown?.user!.toDiscordUser(message);

    let difference =
      crownCheck.crown!.plays - parseInt(artistDetails.stats.userplaycount, 10);

    return new MessageEmbed()
      .setTitle(`Crown for ${crownCheck.crown!.artistName}`)
      .setDescription(
        `
:crown: → \`${holderUsername}\` - ${numberDisplay(
          crownCheck.oldCrown?.plays!,
          "play"
        )}

:pensive: → \`${user.username}\` - ${numberDisplay(
          artistDetails.stats.userplaycount,
          "play"
        )}

${holderUsername} will keep the crown for ${
          crownCheck.crown!.artistName
        }, leading ${user.username} by ${numberDisplay(difference, "play")}.
`
      );
  }

  static async tooLow(
    artistName: string,
    threshold: number,
    user: User,
    plays: number | string
  ) {
    return new MessageEmbed()
      .setTitle(`Crown for ${artistName}`)
      .setDescription(
        `:pensive: → \`${user.username}\` - ${numberDisplay(plays, "play")}

You must have at least ${numberDisplay(threshold, "play")} to create a crown.
      `
      );
  }

  static async tie(
    crownCheck: CrownCheck,
    artistDetails: ArtistInfo,
    message: Message,
    user: User
  ): Promise<MessageEmbed> {
    let holderUsername = await crownCheck.crown?.user!.toDiscordUser(message);

    return new MessageEmbed()
      .setTitle(`Crown for ${crownCheck.crown!.artistName}`)
      .setDescription(
        `
:crown: → \`${holderUsername}\` - ${numberDisplay(
          crownCheck.oldCrown?.plays!,
          "play"
        )}

:eyes: → \`${user.username}\` - ${numberDisplay(
          artistDetails.stats.userplaycount,
          "play"
        )}

It's a tie! ${holderUsername} will keep the crown for ${
          crownCheck.crown!.artistName
        }.
`
      );
  }
}
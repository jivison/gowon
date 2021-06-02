import { mean } from "mathjs";
import { UnknownIndexerError } from "../../../../errors";
import { toInt } from "../../../../helpers/lastFM";
import { Arguments } from "../../../../lib/arguments/arguments";
import { standardMentions } from "../../../../lib/arguments/mentions/mentions";
import { displayNumber, displayRating } from "../../../../lib/views/displays";
import { IndexerRateYourMusicAlbum } from "../../../../services/indexing/IndexingTypes";
import { StatsConnector, StatsParams, StatsResponse } from "./connectors";
import { RateYourMusicIndexingChildCommand } from "./RateYourMusicChildCommand";

const args = {
  mentions: standardMentions,
} as const;

interface Curve {
  [rating: number]: number;
}

export class Stats extends RateYourMusicIndexingChildCommand<
  StatsResponse,
  StatsParams,
  typeof args
> {
  connector = new StatsConnector();

  idSeed = "shasha hakyung";
  description = "Shows what you've rated an artists albums";

  rollout = {
    guilds: this.indexerGuilds,
  };

  arguments: Arguments = args;

  async run() {
    const { dbUser, senderUser, username, discordUser } =
      await this.parseMentions({ fetchDiscordUser: true });

    const user = (dbUser || senderUser)!;

    const perspective = this.usersService.discordPerspective(
      this.author,
      discordUser
    );

    const response = await this.query({
      user: { discordID: user.discordID, lastFMUsername: username },
    });

    const errors = this.parseErrors(response);

    if (errors) {
      throw new UnknownIndexerError();
    }

    const ratingsCounts = this.getRatingsCounts(response.ratings);

    const embed = this.newEmbed()
      .setTitle(`${perspective.upper.possessive} RateYourMusic statistics`)
      .setDescription(
        `_${displayNumber(
          response.ratings.length,

          "total rating"
        )}, Average rating: ${displayNumber(
          (mean(response.ratings.map((r) => r.rating)) / 2).toPrecision(3)
        )}_
        
${Object.entries(ratingsCounts)
  .sort((a, b) => toInt(b) - toInt(a))
  .map(
    ([rating, count]) =>
      `${displayRating(toInt(rating))} ${displayNumber(count)}`
  )
  .join("\n")}`
      );

    await this.send(embed);
  }

  private getRatingsCounts(
    ratings: {
      rating: number;
      rateYourMusicAlbum: IndexerRateYourMusicAlbum;
    }[]
  ): Curve {
    const curve = {} as Curve;

    for (const rating of ratings) {
      curve[rating.rating] = ~~curve[rating.rating] + 1;
    }

    return curve;
  }
}

// ${calculatePercent(count, response.ratings.length, 0)}%
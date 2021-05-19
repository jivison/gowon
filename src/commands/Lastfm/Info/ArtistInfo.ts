import { Arguments } from "../../../lib/arguments/arguments";
import { InfoCommand } from "./InfoCommand";
import { numberDisplay } from "../../../helpers";
import { calculatePercent } from "../../../helpers/stats";
import { CrownsService } from "../../../services/dbservices/CrownsService";
import { LinkConsolidator } from "../../../helpers/lastFM";
import { LineConsolidator } from "../../../lib/LineConsolidator";
import { standardMentions } from "../../../lib/arguments/mentions/mentions";

const args = {
  inputs: {
    artist: { index: { start: 0 } },
  },
  mentions: standardMentions,
} as const;

export default class ArtistInfo extends InfoCommand<typeof args> {
  idSeed = "csvc lovey";
  shouldBeIndexed = true;

  aliases = ["ai", "as"];
  description = "Displays some information about an artist";
  usage = ["", "artist"];

  arguments: Arguments = args;

  crownsService = new CrownsService();
  lineConsolidator = new LineConsolidator();

  async run() {
    let artist = this.parsedArguments.artist;

    let { senderUsername, username, perspective } = await this.parseMentions({
      senderRequired: !artist,
    });

    if (!artist) {
      artist = (await this.lastFMService.nowPlayingParsed(senderUsername))
        .artist;
    }

    let [artistInfo, userInfo, spotifyArtist] = await Promise.all([
      this.lastFMConverter.artistInfo({ artist, username }),
      this.lastFMService.userInfo({ username }),
      this.spotifyService.searchArtist(artist),
    ]);

    let crown = await this.crownsService.getCrownDisplay(
      artistInfo.name,
      this.guild
    );

    this.tagConsolidator.addTags(artistInfo.tags);

    let linkConsolidator = new LinkConsolidator([
      LinkConsolidator.spotify(spotifyArtist?.external_urls?.spotify),
      LinkConsolidator.lastfm(artistInfo.url),
    ]);

    this.lineConsolidator.addLines(
      {
        shouldDisplay: !!artistInfo.wiki.summary,
        string: this.scrubReadMore(artistInfo.wiki.summary.trimRight())!,
      },
      {
        shouldDisplay: !!artistInfo.wiki.summary.trim(),
        string: "",
      },
      {
        shouldDisplay: !!artistInfo.similarArtists.length,
        string: `**Similar artists:** ${artistInfo.similarArtists
          .map((t) => t.name)
          .join(" ‧ ")}`,
      },
      {
        shouldDisplay: this.tagConsolidator.hasAnyTags(),
        string: `**Tags:** ${this.tagConsolidator.consolidate().join(" ‧ ")}`,
      },
      {
        shouldDisplay: linkConsolidator.hasLinks(),
        string: `**Links**: ${linkConsolidator.consolidate()}`,
      },
      `**Listeners**: ${numberDisplay(artistInfo.listeners)}`,
      `**Playcount**: ${numberDisplay(artistInfo.globalPlaycount)}`,
      {
        shouldDisplay: crown?.user?.username !== undefined,
        string: `**Crown**: ${crown?.user?.username} (${numberDisplay(
          crown?.crown.plays!
        )})`,
      }
    );

    let percentage = calculatePercent(
      artistInfo.userPlaycount,
      artistInfo.globalPlaycount,
      4
    );

    let embed = this.newEmbed()
      .setTitle(artistInfo.name)
      .setURL(artistInfo.url)
      .setDescription(this.lineConsolidator.consolidate())
      .addField(
        `${perspective.upper.possessive} stats`,
        `\`${numberDisplay(artistInfo.userPlaycount, "` play", true)} by ${
          perspective.objectPronoun
        } (${calculatePercent(
          artistInfo.userPlaycount,
          userInfo.playcount
        ).strong()}% of ${perspective.possessivePronoun} total scrobbles)
${
  parseFloat(percentage) > 0
    ? `${perspective.upper.regularVerb(
        "account"
      )} for ${percentage.strong()}% of all ${artistInfo.name} scrobbles!`
    : ""
}
        `
      );

    if (spotifyArtist) {
      embed.setThumbnail(
        this.spotifyService.getImageFromSearchItem(spotifyArtist)
      );
      embed.setFooter("Image source: Spotify");
    }

    this.send(embed);
  }
}

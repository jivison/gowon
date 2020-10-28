import { sub } from "date-fns";
import { MessageEmbed } from "discord.js";
import { LogicError } from "../../../errors";
import { dateDisplay, numberDisplay } from "../../../helpers";
import { Arguments } from "../../../lib/arguments/arguments";
import { standardMentions } from "../../../lib/arguments/mentions/mentions";
import { WeekCalculator } from "../../../lib/calculators/WeekCalculator";
import { Paginator } from "../../../lib/Paginator";
import { Validation } from "../../../lib/validation/ValidationChecker";
import { validators } from "../../../lib/validation/validators";
import { RedirectsService } from "../../../services/dbservices/RedirectsService";
import { LastFMBaseCommand } from "../LastFMBaseCommand";

export default class Week extends LastFMBaseCommand {
  description = "Shows an overview of your week";
  category = "reports";
  usage = ["", "weekly @user"];

  arguments: Arguments = {
    mentions: standardMentions,
  };

  validation: Validation = {
    amount: new validators.Range({ min: 1, max: 15 }),
  };

  redirectsService = new RedirectsService(this.logger);

  async run() {
    let { username, perspective } = await this.parseMentions();

    let paginator = new Paginator(
      this.lastFMService.recentTracks.bind(this.lastFMService),
      4,
      {
        from: ~~(sub(new Date(), { weeks: 1 }).getTime() / 1000),
        to: ~~(new Date().getTime() / 1000),
        username,
        limit: 1000,
      }
    );

    let firstPage = await paginator.getNext();

    if (firstPage!["@attr"].totalPages.toInt() > 4)
      throw new LogicError(
        `${perspective.plusToHave} too many scrobbles this week to see an overview!`
      );

    paginator.maxPages = firstPage!["@attr"].totalPages.toInt();

    let restPages = await paginator.getAll({ concatTo: "track" });

    restPages.track = [...firstPage!.track, ...restPages.track];

    let weekCalculator = new WeekCalculator(this.redirectsService, restPages);

    let week = await weekCalculator.calculate();

    let topTracks = Object.keys(week.top.tracks).sort(
      (a, b) => week.top.tracks[b] - week.top.tracks[a]
    );

    let topAlbums = Object.keys(week.top.albums).sort(
      (a, b) => week.top.albums[b] - week.top.albums[a]
    );

    let topArtists = Object.keys(week.top.artists).sort(
      (a, b) => week.top.artists[b] - week.top.artists[a]
    );

    let embed = new MessageEmbed().setTitle(`${username.code()}'s week`)
      .setDescription(`
      _${dateDisplay(sub(new Date(), { weeks: 1 }))} - ${dateDisplay(
      new Date()
    )}_
    _${numberDisplay(restPages.track.length, "scrobble")}, ${numberDisplay(
      week.total.artists,
      "artist"
    )}, ${numberDisplay(week.total.albums, "album")}, ${numberDisplay(
      week.total.tracks,
      "track"
    )}_
  
**Top Tracks**:
 • ${topTracks
      .slice(0, 3)
      .map((t) => `${t} (${numberDisplay(week.top.tracks[t], "play")})`)
      // These are special spaces
      .join("\n​ • ")}

**Top Albums**:
 • ${topAlbums
      .slice(0, 3)
      .map((t) => `${t} (${numberDisplay(week.top.albums[t], "play")})`)
      // These are special spaces
      .join("\n​ • ")}

**Top Artists**:
 • ${topArtists
      .slice(0, 3)
      .map((t) => `${t} (${numberDisplay(week.top.artists[t], "play")})`)
      // These are special spaces
      .join("\n​ • ")}
    `);

    await this.send(embed);
  }
}
import { CrownsService } from "../../../services/dbservices/CrownsService";
import { LineConsolidator } from "../../../lib/LineConsolidator";
import { NowPlayingBaseCommand } from "./NowPlayingBaseCommand";
import { promiseAllSettled } from "../../../helpers";

export default class NowPlayingAlbum extends NowPlayingBaseCommand {
  idSeed = "fx amber";

  aliases = ["fml", "npl", "fma"];
  description =
    "Displays the now playing or last played track from Last.fm, including some album information";

  crownsService = new CrownsService(this.logger);

  async run() {
    let { username, requestable, discordUser } =
      await this.nowPlayingMentions();

    let nowPlaying = await this.lastFMService.nowPlaying(requestable);

    if (nowPlaying.isNowPlaying) this.scrobble(nowPlaying);

    this.tagConsolidator.blacklistTags(nowPlaying.artist, nowPlaying.name);

    let [artistInfo, albumInfo, crown] = await promiseAllSettled([
      this.lastFMService.artistInfo({
        artist: nowPlaying.artist,
        username: requestable,
      }),
      this.lastFMService.albumInfo({
        artist: nowPlaying.artist,
        album: nowPlaying.album,
        username: requestable,
      }),
      this.crownsService.getCrownDisplay(nowPlaying.artist, this.guild),
    ]);

    let { crownString, isCrownHolder } = await this.crownDetails(
      crown,
      discordUser
    );

    if (albumInfo.value)
      this.tagConsolidator.addTags(albumInfo.value?.tags || []);
    if (artistInfo.value)
      this.tagConsolidator.addTags(artistInfo.value?.tags || []);

    let artistPlays = this.artistPlays(artistInfo, nowPlaying, isCrownHolder);
    let noArtistData = this.noArtistData(nowPlaying);
    let albumPlays = this.albumPlays(albumInfo);
    let tags = this.tagConsolidator.consolidate(Infinity).join(" ‧ ");

    let lineConsolidator = new LineConsolidator();
    lineConsolidator.addLines(
      // Top line
      {
        shouldDisplay: !!artistPlays && !!albumPlays && !!crownString,
        string: `${artistPlays} • ${albumPlays} • ${crownString}`,
      },
      {
        shouldDisplay: !!artistPlays && !!albumPlays && !crownString,
        string: `${artistPlays} • ${albumPlays}`,
      },
      {
        shouldDisplay: !!artistPlays && !albumPlays && !!crownString,
        string: `${artistPlays} • ${crownString}`,
      },
      {
        shouldDisplay: !artistPlays && !!albumPlays && !!crownString,
        string: `${noArtistData} • ${albumPlays} • ${crownString}`,
      },
      {
        shouldDisplay: !artistPlays && !albumPlays && !!crownString,
        string: `${noArtistData} • ${crownString}`,
      },
      {
        shouldDisplay: !artistPlays && !!albumPlays && !crownString,
        string: `${noArtistData} • ${albumPlays}`,
      },
      {
        shouldDisplay: !!artistPlays && !albumPlays && !crownString,
        string: `${artistPlays}`,
      },
      {
        shouldDisplay: !artistPlays && !albumPlays && !crownString,
        string: `${noArtistData}`,
      },
      // Second line
      {
        shouldDisplay: this.tagConsolidator.hasAnyTags(),
        string: tags,
      }
    );

    let nowPlayingEmbed = this.nowPlayingEmbed(nowPlaying, username).setFooter(
      lineConsolidator.consolidate()
    );

    let sentMessage = await this.send(nowPlayingEmbed);

    await this.customReactions(sentMessage);
    await this.easterEggs(sentMessage, nowPlaying);
  }
}

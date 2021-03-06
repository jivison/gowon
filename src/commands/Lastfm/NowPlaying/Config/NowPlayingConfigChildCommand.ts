import { flatDeep } from "../../../../helpers";
import { Arguments } from "../../../../lib/arguments/arguments";
import { mirrorballGuilds } from "../../../../lib/indexing/MirrorballCommands";
import { ConfigService } from "../../../../services/dbservices/NowPlayingService";
import { LastFMBaseChildCommand } from "../../LastFMBaseCommand";

export abstract class NowPlayingConfigChildCommand<
  T extends Arguments = Arguments
> extends LastFMBaseChildCommand<T> {
  parentName = "nowplayingconfig";
  subcategory = "nowplaying";

  rollout = {
    guilds: mirrorballGuilds,
  };

  configService = new ConfigService();

  readonly presets = {
    blank: [],
    default: ["artist-plays", "artist-tags", "scrobbles", "artist-crown"],
    verbose: [
      "artist-plays",
      "track-plays",
      "artist-tags",
      "track-tags",
      "artist-crown",
      "loved",
    ],
  };

  protected notAnOptionError(option: string): string {
    return `${option.code()} isn't a valid option. See \`${
      this.prefix
    }npc help\` for a list of available options`;
  }

  protected parseConfig(config: string[]): string[] {
    return flatDeep([...config.map((c) => c.split(/,\s*/))]).filter((c) => !!c);
  }
}

import { CommandManager } from "../../../lib/command/CommandManager";
import { LastFMBaseParentCommand } from "../LastFMBaseCommand";
import { Me } from "./Me";
import { Guess } from "./Guess";
import { Hint } from "./Hint";
import { Quit } from "./Quit";

export interface JumbledArtist {
  jumbled: string;
  unjumbled: string;
  currenthint: string;
}

export const jumbleRedisKey = "jumbledArtist";

export default class JumbleParentCommand extends LastFMBaseParentCommand {
  friendlyName = "jumble";
  description = "Jumbles an artist from your library for you to guess. Run jumble me to generate an artist\nSee `!jumblegame` for more info";
  subcategory = "games";

  prefixes = ["jumble", "j"];
  default = () => new Guess();

  children: CommandManager = new CommandManager({
    me: () => new Me(),
    hint: () => new Hint(),
    guess: () => new Guess(),
    giveup: () => new Quit(),
  });
}

import { FriendsChildCommand } from "./FriendsChildCommand";
import { Arguments } from "../../../lib/arguments/arguments";
import { LogicError, AlreadyFriendsError } from "../../../errors";
import { Validation } from "../../../lib/validation/ValidationChecker";
import { validators } from "../../../lib/validation/validators";
import { standardMentions } from "../../../lib/arguments/mentions/mentions";

const args = {
  inputs: {
    friendUsername: { index: 0 },
  },
  mentions: standardMentions,
} as const;

export class Add extends FriendsChildCommand<typeof args> {
  idSeed = "nature aurora";

  description = "Adds a friend";
  usage = ["lfm_username", "@user"];

  arguments: Arguments = args;

  validation: Validation = {
    user: {
      validator: new validators.Required({
        message: "please specify a friend to add!",
      }),
      dependsOn: ["friendUsername", "userID", "lfmUser"],
    },
  };

  async prerun() {}

  async run() {
    const { username, senderUsername, senderUser, dbUser } =
      await this.parseMentions({
        inputArgumentName: "friendUsername",
        senderRequired: true,
      });

    if (username.toLowerCase() === senderUsername.toLowerCase()) {
      throw new LogicError("you can't add yourself as a friend!");
    }

    if (
      await this.friendsService.isAlreadyFriends(senderUser!, username, dbUser)
    ) {
      throw new AlreadyFriendsError();
    }

    const friend = await this.friendsService.addFriend(
      senderUser!,
      dbUser || username
    );

    await this.send(
      this.newEmbed().setDescription(
        `Successfully added ${(friend.friendUsername ||
          friend.friend?.lastFMUsername)!.code()} as a friend!`
      )
    );
  }
}

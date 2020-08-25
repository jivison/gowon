import regexEscape from "escape-string-regexp";
import { RunAs } from "../lib/AliasChecker";
import { Setting } from "../database/entity/Setting";
import { Guild } from "discord.js";
import { Settings } from "../lib/Settings";
import config from "../../config.json";

export class GowonService {
  // Static methods/properties
  private static instance: GowonService;

  private constructor() {}

  static getInstance(): GowonService {
    if (!this.instance) {
      this.instance = new GowonService();
    }
    return this.instance;
  }

  // Instance methods/properties
  prefix: string = config.prefix;
  customPrefixes = {
    lastfm: "lfm:",
  };
  inactiveRole: { [serverID: string]: string | undefined } = {};
  purgatoryRole: { [serverID: string]: string | undefined } = {};

  contants = {
    hardPageLimit: 5,
    crownThreshold: 30,
  };

  get regexSafePrefix(): string {
    return regexEscape(this.prefix);
  }

  removeCommandName(string: string, runAs: RunAs): string {
    return string.replace(
      new RegExp(`${this.regexSafePrefix}${runAs.toRegexString()}`, "i"),
      ""
    );
  }

  async getInactiveRole(guild: Guild): Promise<string | undefined> {
    if (!this.inactiveRole[guild.id])
      this.inactiveRole[guild.id] = (
        await Setting.getByName(Settings.InactiveRole, guild.id)
      )?.value;

    if (!this.inactiveRole[guild.id]) {
      delete this.inactiveRole[guild.id];
      return undefined;
    }

    return this.inactiveRole[guild.id]!;
  }

  async getPurgatoryRole(guild: Guild): Promise<string | undefined> {
    if (!this.purgatoryRole[guild.id])
      this.purgatoryRole[guild.id] = (
        await Setting.getByName(Settings.PurgatoryRole, guild.id)
      )?.value;

    if (!this.purgatoryRole[guild.id]) {
      delete this.purgatoryRole[guild.id];
      return undefined;
    }

    return this.purgatoryRole[guild.id]!;
  }
}
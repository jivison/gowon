import { PM2ConnectionError } from "../../errors";
import { BaseCommand } from "../../lib/command/BaseCommand";
import { PM2Service } from "../../services/PM2Service";

export default class Restart extends BaseCommand {
  description = "Restart the bot";
  secretCommand = true;
  devCommand = true;

  pm2Service = new PM2Service(this.logger);

  async run() {
    if (!this.gowonClient.hasPM2) throw new PM2ConnectionError();

    await this.reply("restarting...");
    this.pm2Service.restart();
  }
}
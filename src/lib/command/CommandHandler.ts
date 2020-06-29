import { CommandManager } from "./CommandManager";
import { Command, NoCommand } from "./BaseCommand";
import { Message } from "discord.js";
import { BotMomentService } from "../../services/BotMomentService";
import { Logger } from "../Logger";

export class CommandHandler {
  botMomentService = BotMomentService.getInstance();
  commandManager = new CommandManager();
  private logger = new Logger();

  constructor() {}

  async init() {
    await this.commandManager.init();
  }

  private extractCommandName(message: Message): string {
    let extractionRegex = new RegExp(
      `(?<=${this.botMomentService.regexSafePrefix})[^ ]*`,
      "i"
    );

    let matches = message.content.match(extractionRegex) ?? [];

    let command = matches[0];

    return command;
  }

  private extractCommand(message: Message): Command {
    let command = this.extractCommandName(message);

    this.logger.logCommandHandlerSearch(command);

    if (command) {
      return this.commandManager.find(command);
    } else return new NoCommand();
  }

  async handle(message: Message): Promise<void> {
    if (message.content.startsWith(this.botMomentService.prefix)) {
      let command = this.extractCommand(message);
      let runAs = this.extractCommandName(message);

      this.logger.logCommandHandle(command);

      await command.execute(message, runAs);
    }
  }
}

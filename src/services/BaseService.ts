import { Logger } from "../lib/Logger";
import chalk from "chalk";
import { GowonService } from "./GowonService";

export class BaseService {
  gowonService = GowonService.getInstance();

  constructor(public logger?: Logger) {}

  protected log(msg: string): void {
    Logger.log(this.constructor.name, chalk`{grey ${msg}}`, this.logger);
  }
}

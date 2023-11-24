import { ModelLoader } from "@mml-io/3d-web-avatar";
import { TimeManager } from "@mml-io/3d-web-client-core";
import { Group } from "three";

import { Logger } from "./logger/Logger";
import { NEQuadrant } from "./scene/NEQuadrant";
import { NWQuadrant } from "./scene/NWQuadrant";
import { SEQuadrant } from "./scene/SEQuadrant";

class App {
  private readonly timeManager = new TimeManager();

  private modelLoader: ModelLoader = new ModelLoader();
  private logger: Logger = new Logger();

  private nwQuadrant: NWQuadrant;
  private neQuadrant: NEQuadrant;
  private seQuadrant: SEQuadrant;
  // private neQuadrant = document.getElementById("neQuadrant")!;
  // private seQuadrant = document.getElementById("seQuadrant")!;

  constructor() {
    this.update = this.update.bind(this);
    this.afterLoadCB = this.afterLoadCB.bind(this);
    this.nwQuadrant = new NWQuadrant(this.logger, this.modelLoader, this.afterLoadCB);
    this.neQuadrant = new NEQuadrant();
    this.seQuadrant = new SEQuadrant();
  }

  private afterLoadCB(model: Group): void {
    console.log(model);
  }

  public update(): void {
    this.timeManager.update();
    this.nwQuadrant.update();
    this.neQuadrant.update();
    this.seQuadrant.update();
    requestAnimationFrame(() => {
      this.update();
    });
  }
}

const app = new App();
app.update();

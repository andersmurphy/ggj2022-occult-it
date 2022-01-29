export class OccultIt {
    engine
    gameContainer
    pipe

    constructor(engine) {
        this.engine = engine
    }

    create() {
        this.gameContainer = this.engine.makeContainer()
        this.positionContainers()

    }

    update() {
        
    }

    positionContainers() {
        this.gameContainer.x = 0;
        this.gameContainer.y = 0;
    }
}

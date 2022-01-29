import * as PIXI from 'pixi.js'
import { Player } from './player.js'
import {makePipes, debugPipes, pipesGridWidth, pipesGridHeight, addPipeAssets} from './pipes.js'
import state from './state.js'
import { Vector2 } from './vector2.js'


export class OccultIt {
    engine
    gameContainer
    pipe

    constructor(engine) {
        this.engine = engine
    }

    loadAssets() {
        const loader = PIXI.Loader.shared
        Player.addAssets(loader)
        addPipeAssets(loader)
        return loader
    }

    create() {
        state.pipes = makePipes()
        state.players.push(new Player(new Vector2(0, 0), true))
        debugPipes()
        this.gameContainer = this.engine.makeContainer()
        this.engine.stage.addChild(this.gameContainer)

        for (let player of state.players) {
            this.gameContainer.addChild(player.sprite)
        }
    }

    update() {
        for (let player of state.players) {
            player.update()
        }
    }
}

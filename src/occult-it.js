import * as PIXI from 'pixi.js'
import { Player } from './player.js'
import {makePipes, addPipes, debugPipes, pipesGridWidth, pipesGridHeight, addPipeAssets, Type, breakPipe} from './pipes.js'
import state from './state.js'
import { Vector2 } from './vector2.js'
import renderState from './render-state.js'
import { Console } from './console.js'

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
        Console.addAssets(loader)
        addPipeAssets(loader)
        return loader
    }

    create(destinationTileSize) {
        state.pipes = makePipes()
        renderState.pipes = Array(pipesGridWidth).fill(null).map(
            () => Array(pipesGridHeight).fill(null).map(() => ({pipeSprite: null, breakSprite: null})))
        //debugPipes()
        state.console = new Console(new Vector2(pipesGridWidth /2 - 1, pipesGridHeight / 2 - 1))

        this.gameContainer = this.engine.makeContainer()
        this.gameContainer.scale.set(destinationTileSize.width, destinationTileSize.height)
        this.engine.stage.addChild(this.gameContainer)
        state.players.push(Player.spawn(this.gameContainer))

        addPipes(this.gameContainer)

        for (let player of state.players) {
            this.gameContainer.addChild(player.sprite)
        }

        this.gameContainer.addChild(state.console.sprite)
    }

    update() {
        for (let player of state.players) {
            player.update()
        }

        if (Math.random() < 0.1) {
            // Break a random pipe
            const breakPos = new Vector2(Math.random() * (pipesGridWidth - 1), Math.random() * (pipesGridHeight - 1))
            breakPos.set(Math.floor(breakPos.x), Math.floor(breakPos.y))
            const pipeToBreak = state.pipes[breakPos.x][breakPos.y]
            if (pipeToBreak.type === Type.pipe) {
                breakPipe(breakPos, this.gameContainer)
            }
        }
    }
}
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
    players

    constructor(engine) {
        this.engine = engine
        this.players = []
    }

    loadAssets() {
        const loader = PIXI.Loader.shared
        Player.addAssets(loader)
        Console.addAssets(loader)
        addPipeAssets(loader)
        return loader
    }

    create(destinationTileSize) {
        state.tiles = makePipes()
        renderState.pipes = Array(pipesGridWidth).fill(null).map(
            () => Array(pipesGridHeight).fill(null).map(() => ({pipeSprite: null, breakSprite: null})))
        //debugPipes()
        state.console = new Console(new Vector2(pipesGridWidth /2 - 1, pipesGridHeight / 2 - 1))

        this.gameContainer = this.engine.makeContainer()
        this.gameContainer.scale.set(destinationTileSize.width, destinationTileSize.height)
        this.engine.stage.addChild(this.gameContainer)
        this.players.push(Player.spawn(this.gameContainer))
        state.players.push(this.players[this.players.length - 1])

        addPipes(this.gameContainer)

        for (let player of this.players) {
            this.gameContainer.addChild(player.sprite)
        }

        this.gameContainer.addChild(state.console.sprite)
        this.gameContainer.addChild(state.console.progressBar)
    }

    update(timeDelta) {
        for (let player of this.players) {
            player.update(timeDelta, this.gameContainer)
        }

        state.console.update()

        if (Math.random() < 0.1) {
            // Break a random pipe
            const breakPos = new Vector2(Math.random() * (pipesGridWidth - 1), Math.random() * (pipesGridHeight - 1))
            breakPos.set(Math.floor(breakPos.x), Math.floor(breakPos.y))
            const pipeToBreak = state.tiles[breakPos.x][breakPos.y]
            if (pipeToBreak.type === Type.pipe) {
                breakPipe(breakPos, this.gameContainer)
            }
        }
    }
}

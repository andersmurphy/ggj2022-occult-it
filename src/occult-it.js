import * as PIXI from 'pixi.js'
import { Player } from './player.js'
import {makePipes, addPipes, debugPipes, pipesGridWidth, pipesGridHeight, addPipeAssets, Type, breakPipe, checkFlooding} from './pipes.js'
import state from './state.js'
import { Vector2 } from './vector2.js'
import renderState from './render-state.js'
import { Console } from './console.js'
import { getNetworkId, inState, isHost, NetCommandId, setOutState } from './network.js'
import { sleep } from './sleep.js'

export class OccultIt {
    engine
    gameContainer
    pipe
    players
    console

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
        renderState.pipes = Array(pipesGridWidth).fill(null).map(
            () => Array(pipesGridHeight).fill(null).map(() => ({pipeSprite: null, breakSprite: null, floodGraphic: null})))

        this.gameContainer = this.engine.makeContainer()
        this.gameContainer.scale.set(destinationTileSize.width, destinationTileSize.height)
        this.engine.stage.addChild(this.gameContainer)

        this.console = new Console(new Vector2(pipesGridWidth /2 - 1, pipesGridHeight / 2 - 1))
        state.console = this.console.state


        let networkId = getNetworkId()
        while (!networkId) {
            console.log("Waiting 250ms for networkId")
            sleep(250)
            networkId = getNetworkId()
        }

        if (isHost()) {
            state.tiles = makePipes()
            //debugPipes()
    
            this.spawnSelf()
            this.addSprites()

            setOutState({
                command: NetCommandId.game,
                state: state
              })
        }
    }

    addSprites() {
        this.gameContainer.addChild(this.console.sprite)
        this.gameContainer.addChild(this.console.progressBar)

        addPipes(this.gameContainer)

        for (let player of this.players) {
            this.gameContainer.addChild(player.sprite)
        }
    }

    update(timeDelta) {
        this.updateNetworkInput()
        if (!state.tiles) {
            return
        }

        for (let player of this.players) {
            player.update(timeDelta, this.gameContainer)
        }

        this.console.update()

        if (Math.random() < 0.01) {
            // Break a random pipe
            const breakPos = new Vector2(Math.random() * (pipesGridWidth - 1), Math.random() * (pipesGridHeight - 1))
            breakPos.set(Math.floor(breakPos.x), Math.floor(breakPos.y))
            const pipeToBreak = state.tiles[breakPos.x][breakPos.y]
            if (pipeToBreak.type === Type.pipe) {
                breakPipe(breakPos, this.gameContainer)
            }
        }

        checkFlooding()
    }

    updateNetworkInput() {
        if (inState.length > 0) {
            const aNewState = inState[0]

            if (aNewState.command == NetCommandId.game) {
                while (this.gameContainer.children.length > 0) {
                    this.gameContainer.removeChild(this.gameContainer.children[0])
                }
                this.players = []
                this.spawnSelf()
                state.tiles = aNewState.state.tiles
                state.players = aNewState.state.players
                state.console = aNewState.state.console
                this.console.setState(state.console)

                state.players.forEach(playerState => {
                    this.players.push(Player.spawn(this.gameContainer, this.engine.audio, playerState.id))
                });

                this.addSprites()
                setOutState({
                    command: NetCommandId.player,
                    movement: this.player.movement
                })
            } else if (this.tiles) {
                if (aNewState.command == NetCommandId.player) {
                    const updatePlayer = this.players.find(p => p.movement.id == aNewState.player.id)
                }
            }
            inState.shift()
        }
    }

    spawnSelf() {
        this.players.push(Player.spawn(this.gameContainer, this.engine.audio, getNetworkId()))
        state.players.push(this.players[this.players.length - 1])
    }
}

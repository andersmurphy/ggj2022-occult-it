import * as PIXI from 'pixi.js'
import { Player } from './player.js'
import {makePipes, addPipes, debugPipes, pipesGridWidth, pipesGridHeight, addPipeAssets, Type, breakPipe, checkFlooding, updatePipeState} from './pipes.js'
import state from './state.js'
import { Vector2 } from './vector2.js'
import renderState from './render-state.js'
import { Console } from './console.js'
import { getNetworkId, inState, isHost, NetCommandId, setOutState } from './network.js'
import { addWalls, loadWWallSprites } from './walls.js'

export class OccultIt {
    engine
    gameContainer
    pipe
    players
    theConsole

    constructor(engine) {
        this.engine = engine
        this.players = []
        this.madeText = false
    }

    loadAssets() {
        const loader = PIXI.Loader.shared
        Player.addAssets(loader)
        Console.addAssets(loader)
        addPipeAssets(loader)
        loadWWallSprites(loader)
        return loader
    }

    create(destinationTileSize) {
        window.gamestate = state

        renderState.pipes = Array(pipesGridWidth).fill(null).map(
            () => Array(pipesGridHeight).fill(null).map(() => ({pipeSprite: null, breakSprite: null, floodGraphic: null})))

        this.gameContainer = this.engine.makeContainer()
        this.gameContainer.scale.set(destinationTileSize.width, destinationTileSize.height)
        this.engine.stage.addChild(this.gameContainer)

        this.theConsole = new Console(new Vector2(pipesGridWidth /2 - 1, pipesGridHeight / 2 - 1))
        state.console = this.theConsole.state

        this.continueCreate(250)
    }

    continueCreate(timeout) {
        let networkId = getNetworkId()

        if (!networkId) {
            console.log(`Waiting ${timeout}ms for networkId`)
            setTimeout(() => {
                networkId = getNetworkId()
                if (networkId) {
                    this.finishCreate()
                } else {
                    this.continueCreate(timeout * 2)
                }
            }, timeout)
        } else {
            this.finishCreate()
        }
    }

    finishCreate() {
        if (isHost()) {
            console.log("I am the host")
            state.tiles = makePipes()
            //debugPipes()
    
            this.spawnSelf()
            this.addSprites()

            setOutState({
                command: NetCommandId.game,
                state: state
              })
        }
        console.log("Player count: ", this.players.length)
    }

    addSprites() {
        this.gameContainer.addChild(this.theConsole.sprite)
        this.gameContainer.addChild(this.theConsole.progressBar)

        addPipes(this.gameContainer)

        for (let player of this.players) {
            console.log('Creating sprite for player ', player.movement.id)
            this.gameContainer.addChild(player.sprite)
        }
        addWalls(this.gameContainer)
    }

    update(timeDelta) {
        this.updateNetworkInput()
        if (!state.tiles) {
            return
        }

        for (let player of this.players) {
            if (!this.madeText) {
                player.update(timeDelta, this.gameContainer)
            }
        }

        this.theConsole.update()

        if (this.theConsole.won && !this.madeText) {
            this.madeText = true
            let text = new PIXI.Text('THANKYOU HUMANS COMPUTATION COMPLETE');
            this.gameContainer.addChild(text)
            text.scale.set(0.08, 0.08)
            text.position.set(5, 10)
        } else if (this.theConsole.lost && !this.madeText) {
            this.madeText = true
            let text = new PIXI.Text('ERROR COMPUTATION FAILED: NOT ENOUGH FLUID');
            text.scale.set(0.08, 0.08)
            text.position.set(5, 10)
            this.gameContainer.addChild(text)
        }

        if (isHost() 
            && Math.random() < 0.015) {
            // Break a random pipe
            const breakPos = new Vector2(1 + Math.random() * (pipesGridWidth - 3), 1 + Math.random() * (pipesGridHeight - 3))
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
            const aNewState = inState.shift()

            console.log("Got state", aNewState)
            if (aNewState.command == NetCommandId.game) {
                while (this.gameContainer.children.length > 0) {
                    this.gameContainer.removeChild(this.gameContainer.children[0])
                }
                console.log("Cleared container")
                this.players = []
                state.tiles = aNewState.state.tiles
                state.players = aNewState.state.players
                console.log("Players: ", state.players)
                state.console = aNewState.state.console
                this.theConsole.setState(state.console)

                state.players.forEach(playerState => {
                    playerState.pos = new Vector2(playerState.pos.x, playerState.pos.y)
                    playerState.vel = new Vector2(playerState.vel.x, playerState.vel.y)
                    const player = new Player(playerState, false, this.gameContainer, this.engine.audio)
                    this.players.push(player)
                });
                const localPlayer = this.spawnSelf()

                window.players = this.players

                this.addSprites()
                setOutState({
                    command: NetCommandId.player,
                    movement: localPlayer.movement
                })
            } else if (state.tiles) {
                if (aNewState.command == NetCommandId.player) {
                    console.log(aNewState.movement.id)
                    const updatePlayer = this.players.find(p => p.movement.id == aNewState.movement.id)

                    if (updatePlayer) {
                        console.log("Updating player", updatePlayer)
                        const updateStateIndex = state.players.findIndex(ps => ps.id == aNewState.movement.id)
                        
                        aNewState.movement.pos = new Vector2(aNewState.movement.pos.x, aNewState.movement.pos.y)
                        aNewState.movement.vel = new Vector2(aNewState.movement.vel.x, aNewState.movement.vel.y)
    
                        updatePlayer.movement = aNewState.movement
    
                        if (updateStateIndex >= 0
                            && updateStateIndex < state.players.length) {
                                state.players[updateStateIndex] = aNewState.movement
                            }
                    } else {
                        // a new player 
                        const playerState = {
                            id: aNewState.movement.id,
                            pos: new Vector2(aNewState.movement.pos.x, aNewState.movement.pos.y),
                            vel: new Vector2(aNewState.movement.vel.x, aNewState.movement.vel.y),
                        }
                        const player = new Player(playerState, false, this.gameContainer, this.engine.audio)
                        this.players.push(player)
                        state.players.push(playerState)
                        this.gameContainer.addChild(player.sprite)
                    }
                } else if (aNewState.command == NetCommandId.pipe) {
                    updatePipeState(aNewState.pipe, this.gameContainer)
                }
            }
        }
    }

    spawnSelf() {
        console.log('Spawning self')
        const newPlayer = Player.spawn(this.gameContainer, this.engine.audio, getNetworkId())
        this.players.push(newPlayer)
        state.players.push(newPlayer.movement)
        return newPlayer
    }
}

import * as PIXI from 'pixi.js'
import { Player } from './player.js'
import {makePipes, addPipes, debugPipes, pipesGridWidth, pipesGridHeight, addPipeAssets, Type, breakPipe, checkFlooding, updatePipeState} from './pipes.js'
import state from './state.js'
import { Vector2 } from './vector2.js'
import renderState from './render-state.js'
import { Console } from './console.js'
import { getNetworkId, inState, singlePlayer, isConnected, isHost, NetCommandId, setOutState } from './network.js'
import { addWalls, loadWWallSprites } from './walls.js'
import { addFloorAssets, addFloorSprites } from './floor.js'

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
        addFloorAssets(loader)
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

        let spText = new PIXI.Text('Solo', { fill: 0xffaaaa })
        spText.scale.set(0.08, 0.08)
        spText.position.set(pipesGridWidth / 2, pipesGridHeight / 4)
        spText.anchor.set(0.5, 0.5)
        spText.interactive = true
        this.gameContainer.addChild(spText)

        let mpText = new PIXI.Text('Multiplayer', { fill: 0xffaaaa })
        mpText.scale.set(0.08, 0.08)
        mpText.position.set(pipesGridWidth / 2, 3 * pipesGridHeight / 4)
        mpText.anchor.set(0.5, 0.5)
        mpText.interactive = true
        this.gameContainer.addChild(mpText)

        spText.on('mousedown', (event) => {
            this.gameContainer.removeChild(spText)
            this.gameContainer.removeChild(mpText)
            this.finishCreate()
        })

        mpText.on('mousedown', () => {
            this.gameContainer.removeChild(spText)
            this.gameContainer.removeChild(mpText)
            this.connectingText = new PIXI.Text('Connecting...', { fill: 0xffaaaa })
            this.connectingText.scale.set(0.08, 0.08)
            this.connectingText.position.set(pipesGridWidth / 2, pipesGridHeight / 2)
            this.connectingText.anchor.set(0.5, 0.5)
            this.gameContainer.addChild(this.connectingText)
            connect()
            this.continueCreate(250)
        })

        /*if (singlePlayer()) {
            this.finishCreate()
        } else {
            this.continueCreate(250)
        }*/
    }

    continueCreate(timeout) {
        if (!isConnected()) {
            console.log(`Waiting ${timeout}ms for networkId`)
            setTimeout(() => this.continueCreate(timeout * 1.3), timeout)
        } else {
            this.gameContainer.removeChild(this.connectingText)
            if (isHost()) {
                console.log('Is host, creating own world')
                this.finishCreate()
            }
        }
    }

    finishCreate() {
        if (singlePlayer()) {
            console.log("Single player game")
            state.tiles = makePipes()
            this.spawnSelf()
            this.addSprites()
        } else if (isHost()) {
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
        addFloorSprites(this.gameContainer)
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
            let text = new PIXI.Text('THANKYOU HUMANS COMPUTATION COMPLETE', { fill: 0xffaaaa })
            text.alpha = 0.8
            text.scale.set(0.08, 0.08)
            text.position.set(5, 10)
            this.gameContainer.addChild(text)
        } else if (this.theConsole.lost && !this.madeText) {
            this.madeText = true
            let text = new PIXI.Text('ERROR COMPUTATION FAILED: NOT ENOUGH FLUID', { fill: 0xffaaaa })
            text.alpha = 0.8
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

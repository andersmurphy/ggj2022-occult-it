import * as PIXI from 'pixi.js'
import {Vector2} from './vector2.js'
import state from './state.js'
import renderState from './render-state.js'
import { getNetworkId, isHost, NetCommandId, setOutState } from './network.js'

export const pipesGridWidth = 64
export const pipesGridHeight = 40

const PipeNS = require('../images/PipeNS.png')
const PipeEW = require('../images/PipeEW.png')
const PipeNE = require('../images/PipeNE.png')
const PipeNSEW = require('../images/PipeNSEW.png')
const PipeNW = require('../images/PipeNW.png')
const PipeSE = require('../images/PipeSE.png')
const PipeSW = require('../images/PipeSW.png')
const PipeBreakNS = require('../images/PipeBreakNS.png')
const PipeBreakEW = require('../images/PipeBreakEW.png')
const PipeBreakNE = require('../images/PipeBreakNE.png')
const PipeBreakNSEW = require('../images/PipeBreakNSEW.png')
const PipeBreakNW = require('../images/PipeBreakNW.png')
const PipeBreakSE = require('../images/PipeBreakSE.png')
const PipeBreakSW = require('../images/PipeBreakSW.png')


// Tile types
export class Type {
    static empty = 'empty'
    static pipe = 'pipe'
    static goal = 'goal'
}

// Pipe directions
export class PipeDir {
    static leftRight = 0
    static leftUp = 1
    static leftDown = 2
    static upDown = 3
    static upRight = 4
    static rightDown = 5
    static bridge = 6
}

export function addPipeAssets(loader) {
    loader.add('PipeNS.png', PipeNS)
    loader.add('PipeEW.png', PipeEW)
    loader.add('PipeNE.png', PipeNE)
    loader.add('PipeNSEW.png', PipeNSEW)
    loader.add('PipeNW.png', PipeNW)
    loader.add('PipeSE.png', PipeSE)
    loader.add('PipeSW.png', PipeSW)

    loader.add('PipeBreakNS.png', PipeBreakNS)
    loader.add('PipeBreakEW.png', PipeBreakEW)
    loader.add('PipeBreakNE.png', PipeBreakNE)
    loader.add('PipeBreakNSEW.png', PipeBreakNSEW)
    loader.add('PipeBreakNW.png', PipeBreakNW)
    loader.add('PipeBreakSE.png', PipeBreakSE)
    loader.add('PipeBreakSW.png', PipeBreakSW)
}

export function makePipes() {
    const pipes = Array(pipesGridWidth).fill(null).map(
        () => Array(pipesGridHeight).fill(null).map(() => ({type: Type.empty, pipe: null, flooding: 0, evaporation: 0}))
    )

    const numPipes = 100
    
    const goal = new Vector2(Math.floor(pipesGridWidth / 2), Math.floor(pipesGridHeight / 2))
    
    for (let pipeId = 0; pipeId < numPipes; pipeId++) {
        // Start a pipe at the edge
        const edge = Math.floor(Math.random() * 4)
        let xFirst = false

        let start;
        if (edge == 0) {
            // Top
            start = new Vector2(Math.floor(Math.random() * pipesGridWidth), pipesGridHeight - 1)
            xFirst = false
        } else if (edge === 1) {
            // Right
            start = new Vector2(pipesGridWidth - 1, Math.floor(Math.random() * pipesGridHeight))
            xFirst = true
        } else if (edge === 2) {
            // Bottom
            start = new Vector2(Math.floor(Math.random() * pipesGridWidth), 0)
            xFirst = false
        } else if (edge === 3) {
            // Left
            start = new Vector2(0,  Math.floor(Math.random() * pipesGridHeight))
            xFirst = true
        }

        const maxTries = 100
        let tries = maxTries

        if (pipes[start.x][start.y].type !== Type.empty) {
            // If we start on top of an existing pipe, immediately fail
            tries = 0
            continue
        }
 
        const path = [start]
        let current = start.clone()
        let next

        for (let x = goal.x - 1; x <= goal.x + 1; x++) {
            for (let y = goal.y - 1; y <= goal.y + 1; y++) {
                pipes[x][y].type = Type.goal
            }
        }

        while (tries > 0) {
            tries--
            next = current.clone()

            if (Math.random() < 0.05) {
                // Occasionally randomly swap direction
                xFirst = !xFirst
            }

            if (tries < maxTries / 2) {
                // We're running low on tries, move towards the goal
                if (xFirst) {
                    if (next.x < goal.x) {
                        next.x += 1
                    } else if (next.x > goal.x) {
                        next.x -= 1
                    } else if (next.y < goal.y) {
                        next.y += 1
                    } else if (next.y > goal.y) {
                        next.y -= 1
                    }
                } else {
                    if (next.y < goal.y) {
                        next.y += 1
                    } else if (next.y > goal.y) {
                        next.y -= 1
                    } else if (next.x < goal.x) {
                        next.x += 1
                    } else if (next.x > goal.x) {
                        next.x -= 1
                    }
                }
            } else {
                // Randomly wander a bit
                if (xFirst) {
                    next.x += Math.random() < 0.5 ? -1 : 1
                } else {
                    next.y += Math.random() < 0.5 ? -1 : 1
                }
            }

            if (next.x < 0 || next.x >= pipesGridWidth || next.y < 0 || next.y >= pipesGridHeight) {
                continue
            }

            let nextPipe = pipes[next.x][next.y]
            const currentPipe = pipes[current.x][current.y]

            let inPath = false
            for (let p of path) {
                if (p.x === next.x && p.y === next.y) {
                    inPath = true
                }
            }
            if (inPath) continue

            if (nextPipe.type === Type.pipe) {
                if (nextPipe.pipe.dir !== PipeDir.upDown && nextPipe.dir !== PipeDir.leftRight) {
                    xFirst != xFirst
                    continue
                }

                let failed = false

                // There's an existing pipe here, see if we can bridge it
                while (nextPipe.type === Type.pipe && nextPipe.pipe.dir === PipeDir.upDown) {
                    if (next.x > current.x && current.x > 1) {
                        path.push(next.clone())
                        next.x++
                    } else if (next.x < current.x && current.x < pipesGridWidth - 2) {
                        path.push(next.clone())
                        next.x--
                    } else {
                        failed = true
                        break
                    }
                    if (next.x < 0 || next.x >= pipesGridWidth || next.y < 0 || next.y >= pipesGridHeight) {
                        failed = true
                        break
                    }
                    nextPipe = pipes[next.x][next.y]
                }

                if (failed) continue
                
                while (nextPipe.type === Type.pipe && nextPipe.pipe.dir === PipeDir.leftRight) {
                    if (next.y > current.y && current.y > 1) {
                        path.push(next.clone())
                        next.y++
                    } else if (next.y < current.y && current.y < pipesGridHeight - 2) {
                        path.push(next.clone())
                        next.y--
                    } else {
                        failed = true
                        break
                    }
                    if (next.x < 0 || next.x >= pipesGridWidth || next.y < 0 || next.y >= pipesGridHeight) {
                        failed = true
                        break
                    }
                    nextPipe = pipes[next.x][next.y]
                }

                if (failed) continue
            }

            if (nextPipe.type === Type.goal) {
                path.push(next.clone())
                break
            }

            current = next

            path.push(current.clone())
        }


        if (tries > 0) {
            // Fill in grid if pipe managed to path to exit
            for (let i = 0; i < path.length; i++) {
                const current = path[i]
                const last = path[i-1]
                const next = path[i+1]

                let tile = pipes[current.x][current.y]
                if (tile.type === Type.pipe) {
                    // Make a bridge if possible
                    tile.pipe.dir = PipeDir.bridge
                    tile.pipe.ids = [tile.pipe.id, pipeId]
                } else if (tile.type === Type.empty) {
                    tile.type = Type.pipe
                    tile.pipe = {ids: [pipeId]}

                    if (last && next) {
                        if (last.x === next.x) tile.pipe.dir = PipeDir.upDown
                        else if (last.y === next.y) tile.pipe.dir = PipeDir.leftRight

                        else if (last.x < next.x && last.y < next.y && current.x == next.x) tile.pipe.dir = PipeDir.leftDown
                        else if (last.x < next.x && last.y < next.y && current.y == next.y) tile.pipe.dir = PipeDir.upRight

                        else if (last.x < next.x && last.y > next.y && current.x == next.x) tile.pipe.dir = PipeDir.leftUp
                        else if (last.x < next.x && last.y > next.y && current.y == next.y) tile.pipe.dir = PipeDir.rightDown

                        else if (last.x > next.x && last.y < next.y && current.x == next.x) tile.pipe.dir = PipeDir.rightDown
                        else if (last.x > next.x && last.y < next.y && current.y == next.y) tile.pipe.dir = PipeDir.leftUp

                        else if (last.x > next.x && last.y > next.y && current.x == next.x) tile.pipe.dir = PipeDir.upRight
                        else if (last.x > next.x && last.y > next.y && current.y == next.y) tile.pipe.dir = PipeDir.leftDown

                    } else if (next) {
                        // Get direction for edge pipes
                        if (current.x === 0) {
                            if (next.x > current.x)      tile.pipe.dir = PipeDir.leftRight
                            else if (next.y > current.y) tile.pipe.dir = PipeDir.leftDown
                            else if (next.y < current.y) tile.pipe.dir = PipeDir.leftUp
                        } else if (current.x === pipesGridWidth - 1) {
                            if (next.x < current.x)      tile.pipe.dir = PipeDir.leftRight
                            else if (next.y > current.y) tile.pipe.dir = PipeDir.rightDown
                            else if (next.y < current.y) tile.pipe.dir = PipeDir.upRight
                        } else if (current.y === 0) {
                            if (next.x < current.x)      tile.pipe.dir = PipeDir.leftUp
                            else if (next.x > current.x) tile.pipe.dir = PipeDir.upRight
                            else if (next.y > current.y) tile.pipe.dir = PipeDir.upDown
                        } else if (current.y === pipesGridHeight - 1) {
                            if (next.x < current.x)      tile.pipe.dir = PipeDir.leftDown
                            else if (next.x > current.x) tile.pipe.dir = PipeDir.rightDown
                            else if (next.y < current.y) tile.pipe.dir = PipeDir.upDown
                        }
                    }
                }
            }
        }
    }
    window.pipes = pipes
    return pipes
}

export function debugPipes() {
    let pre = document.createElement('pre')
    for (let y = 0; y < pipesGridHeight; y++) {
        for (let x = 0; x < pipesGridWidth; x++) {
            const tile = state.tiles[x][y]

            if (tile.type === Type.empty) pre.append(' ')
            else if (tile.type === Type.pipe) {
                if (tile.pipe.dir === PipeDir.leftRight) pre.append('═')
                else if (tile.pipe.dir === PipeDir.upDown) pre.append('║')
                else if (tile.pipe.dir === PipeDir.leftUp) pre.append('╝')
                else if (tile.pipe.dir === PipeDir.leftDown) pre.append('╗')
                else if (tile.pipe.dir === PipeDir.upRight) pre.append('╚')
                else if (tile.pipe.dir === PipeDir.rightDown) pre.append('╔')
                else if (tile.pipe.dir === PipeDir.bridge) pre.append('╬')
                else pre.append('+')
            }
            else if (tile.type === Type.goal) pre.append('*')
        }
        pre.append('\n')
    }
    document.body.append(pre)
}

export function addPipes(container) {
    for (let y = 0; y < pipesGridHeight; y++) {
        for (let x = 0; x < pipesGridWidth; x++) {
            const tile = state.tiles[x][y]
            let sprite = undefined

            if (tile.type === Type.pipe) {
                sprite = new PIXI.Sprite()
                sprite.texture = updatePipeTexture(tile.pipe)
            }

            const floodGraphic = new PIXI.Graphics()
            // floodGraphic.cacheAsBitmap = true
            floodGraphic.x = x
            floodGraphic.y = y
            floodGraphic.scale.set(1/50, 1/50)
            floodGraphic.cacheAsBitmap = true
            floodGraphic.clear()
            floodGraphic.beginFill(0x990000, 1)
            floodGraphic.alpha = 0
            floodGraphic.drawRect(0, 0, 50, 50)
            // floodGraphic.drawRoundedRect(0, 0, 20, 20, 4)
            renderState.pipes[x][y].floodGraphic = floodGraphic
            container.addChild(floodGraphic)

            if (sprite) {
                container.addChild(sprite)
                sprite.x = x
                sprite.y = y
                sprite.scale.set(1 / 80, 1 / 80)
                renderState.pipes[x][y].pipeSprite = sprite
            }
        }
    }
}

export function updatePipeState(netPipeState, container) {
    const point = netPipeState.point
    const pipeRenderState = renderState.pipes[point.x][point.y]
    
    state.tiles[point.x][point.y].pipe = netPipeState.state
    pipeRenderState.pipeSprite.texture = updatePipeTexture(netPipeState.state)
}

export function breakPipe(point, container) {
    const pipeState = state.tiles[point.x][point.y].pipe
    const pipeRenderState = renderState.pipes[point.x][point.y]

    pipeState.isBroken = true
    pipeRenderState.pipeSprite.texture = updatePipeTexture(pipeState)

    setOutState({
        command: NetCommandId.pipe,
        pipe: {
            point,
            state: pipeState
        }
    })
}

function updatePipeTexture(pipeState) {
    let texture = undefined

    const broken = pipeState.isBroken
    const pipeDir = pipeState.dir

    if (broken) {
        if (pipeDir === PipeDir.leftRight) texture = PIXI.Texture.from('PipeBreakEW.png')
        else if (pipeDir === PipeDir.upDown) texture = PIXI.Texture.from('PipeBreakNS.png')
        else if (pipeDir === PipeDir.leftUp) texture = PIXI.Texture.from('PipeBreakNW.png')
        else if (pipeDir === PipeDir.leftDown) texture = PIXI.Texture.from('PipeBreakSW.png')
        else if (pipeDir === PipeDir.upRight) texture = PIXI.Texture.from('PipeBreakNE.png')
        else if (pipeDir === PipeDir.rightDown) texture = PIXI.Texture.from('PipeBreakSE.png')
        else if (pipeDir === PipeDir.bridge) texture = PIXI.Texture.from('PipeBreakNSEW.png')
    } else {
        if (pipeDir === PipeDir.leftRight) texture = PIXI.Texture.from('PipeEW.png')
        else if (pipeDir === PipeDir.upDown) texture = PIXI.Texture.from('PipeNS.png')
        else if (pipeDir === PipeDir.leftUp) texture = PIXI.Texture.from('PipeNW.png')
        else if (pipeDir === PipeDir.leftDown) texture = PIXI.Texture.from('PipeSW.png')
        else if (pipeDir === PipeDir.upRight) texture = PIXI.Texture.from('PipeNE.png')
        else if (pipeDir === PipeDir.rightDown) texture = PIXI.Texture.from('PipeSE.png')
        else if (pipeDir === PipeDir.bridge) texture = PIXI.Texture.from('PipeNSEW.png')
    }
    return texture
}

export function fixPipe(point, container) {
    const pipeState = state.tiles[point.x][point.y].pipe
    const pipeRenderState = renderState.pipes[point.x][point.y]

    pipeState.isBroken = false
    pipeRenderState.pipeSprite.texture = updatePipeTexture(pipeState)

    setOutState({
        command: NetCommandId.pipe,
        pipe: {
            point,
            state: state.tiles[point.x][point.y].pipe
        }
    })
}

const maxFlooding = 16

function renderFlood(x, y) {
    const tile = state.tiles[x][y]
    const floodGraphic = renderState.pipes[x][y].floodGraphic
    floodGraphic.alpha = tile.flooding / maxFlooding
}

export function pipeStatus() {
    const broken = new Set()
    const all = new Set()

    for (let x = 0; x < pipesGridWidth; x++) {
        for (let y = 0; y < pipesGridHeight; y++) {
            const tile = state.tiles[x][y]
            if (tile.type === Type.pipe) {
                for (let id of tile.pipe.ids) {
                    if (tile.pipe.isBroken) broken.add(id)
                    else all.add(id)
                }
            }
        }
    }
    return {broken, all}
}


const floodChance = 0.03
const evaporationTime = 1000

export function checkFlooding() {
    let updatesLeft = 20

    for (let x = 0; x < pipesGridWidth; x++) {
        for (let y = 0; y < pipesGridHeight; y++) {
            if (updatesLeft == 0) {
                return
            }

            const tile = state.tiles[x][y]
            if (tile.type === Type.pipe) {
                if (tile.pipe.isBroken) {
                    tile.evaporation = evaporationTime
                    if (tile.flooding <= maxFlooding) { // Intentionally overflood broken pipes
                        tile.flooding++
                        renderFlood(x, y)
                        updatesLeft--
                    }
                } else {
                    // tile.flooding = Math.max(tile.flooding - 1, 0)
                }
            }

            if (Math.random() < floodChance) {
                if ((x > 0 && state.tiles[x-1][y].flooding > tile.flooding + 1)) {
                    state.tiles[x-1][y].flooding -= 1
                    tile.flooding += 1
                    tile.evaporation = evaporationTime
                    renderFlood(x, y)
                    renderFlood(x-1, y, tile)
                    updatesLeft--
                } else if (x < pipesGridWidth - 1 && state.tiles[x+1][y].flooding > tile.flooding + 1) {
                    state.tiles[x+1][y].flooding -= 1
                    tile.flooding += 1
                    tile.evaporation = evaporationTime
                    renderFlood(x, y)
                    renderFlood(x+1, y, tile)
                    updatesLeft--
                } else if (y > 0 && state.tiles[x][y-1].flooding > tile.flooding + 1) {
                    state.tiles[x][y-1].flooding -= 1
                    tile.flooding += 1
                    tile.evaporation = evaporationTime
                    renderFlood(x, y)
                    renderFlood(x, y-1, tile)
                    updatesLeft--
                } else if (y < pipesGridHeight - 1 && state.tiles[x][y+1].flooding > tile.flooding + 1) {
                    state.tiles[x][y+1].flooding -= 1
                    tile.flooding += 1
                    tile.evaporation = evaporationTime
                    renderFlood(x, y)
                    renderFlood(x, y+1, tile)
                    updatesLeft--
                }
            }
            if ((x > 0 && state.tiles[x-1][y].flooding <= tile.flooding) ||
                       (x < pipesGridWidth - 1 && state.tiles[x+1][y].flooding <= tile.flooding) ||
                       (y > 0 && state.tiles[x][y-1].flooding <= tile.flooding) ||
                       (y < pipesGridHeight - 1 && state.tiles[x][y+1].flooding <= tile.flooding)) {
                tile.evaporation--
                if (tile.flooding > 0 && tile.evaporation == 0) {
                    tile.flooding--
                    tile.evaporation = evaporationTime
                    renderFlood(x, y, tile)
                    updatesLeft--
                }
            }
        }
    }
}
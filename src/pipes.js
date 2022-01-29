import * as PIXI from 'pixi.js'
import {Vector2} from './vector2.js'
import state from './state.js'
import renderState from './render-state.js'

export const pipesGridWidth = 64
export const pipesGridHeight = 40

const PipeNS = require('../images/PipeNS.png')
const PipeEW = require('../images/PipeEW.png')
const PipeNE = require('../images/PipeNE.png')
const PipeNSEW = require('../images/PipeNSEW.png')
const PipeNW = require('../images/PipeNW.png')
const PipeSE = require('../images/PipeSE.png')
const PipeSW = require('../images/PipeSW.png')
const BrokenPipeOverlay = require('../images/BrokenPipeOverlay.png')

// Tile types
export class Type {
    static empty = new Type('empty')
    static pipe = new Type('pipe')
    static goal = new Type('goal')

    constructor(name) {
        this.name = name
    }
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
    loader.add('BrokenPipeOverlay.png', BrokenPipeOverlay)
}

export function makePipes() {
    const pipes = Array(pipesGridWidth).fill(null).map(
        () => Array(pipesGridHeight).fill(null).map(() => ({type: Type.empty, pipe: null, flooding: 0, evaporation: 0}))
    )

    const numPipes = 100
    
    const goal = new Vector2(Math.floor(pipesGridWidth / 2), Math.floor(pipesGridHeight / 2))
    
    for (let i = 0; i < numPipes; i++) {
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
                if (tile.type === Type.pipe) {  // TODO: Properly implement bridge making
                    // Make a bridge if possible
                    tile.pipe.dir = PipeDir.bridge
                    tile.pipe.ids = [tile.pipe.id, i]
                } else if (tile.type === Type.empty) {
                    tile.type = Type.pipe
                    tile.pipe = {ids: [i]}

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

            if (tile.type === Type.empty) { 
            } else if (tile.type === Type.pipe) {
                if (tile.pipe.dir === PipeDir.leftRight) sprite = PIXI.Sprite.from('PipeEW.png')
                else if (tile.pipe.dir === PipeDir.upDown) sprite = PIXI.Sprite.from('PipeNS.png')
                else if (tile.pipe.dir === PipeDir.leftUp) sprite = PIXI.Sprite.from('PipeNW.png')
                else if (tile.pipe.dir === PipeDir.leftDown) sprite = PIXI.Sprite.from('PipeSW.png')
                else if (tile.pipe.dir === PipeDir.upRight) sprite = PIXI.Sprite.from('PipeNE.png')
                else if (tile.pipe.dir === PipeDir.rightDown) sprite = PIXI.Sprite.from('PipeSE.png')
                else if (tile.pipe.dir === PipeDir.bridge) sprite = PIXI.Sprite.from('PipeNSEW.png')
                else { }
            }
            else if (tile.type === Type.goal) { /* pre.append('*') */ }

            const floodGraphic = new PIXI.Graphics()
            // floodGraphic.cacheAsBitmap = true
            floodGraphic.x = x
            floodGraphic.y = y
            floodGraphic.scale.set(1/50, 1/50)
            floodGraphic.cacheAsBitmap = true
            floodGraphic.beginFill(0x0000ff, 0.2)
            // floodGraphic.drawRoundedRect(0, 0, 20, 20, 4)
            renderState.pipes[x][y].floodGraphic = floodGraphic
            container.addChild(floodGraphic)

            // const floodTex = renderer.
            // const floodSprite = 


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

export function breakPipe(point, container) {
    const sprite = PIXI.Sprite.from('BrokenPipeOverlay.png')
    renderState.pipes[point.x][point.y].breakSprite = sprite

    state.tiles[point.x][point.y].pipe.isBroken = true

    container.addChild(sprite)
    sprite.x = point.x
    sprite.y = point.y
    sprite.scale.set(1 / 80, 1 / 80)
}

export function fixPipe(point, container) {
    const sprite = renderState.pipes[point.x][point.y].breakSprite

    container.removeChild(sprite)

    renderState.pipes[point.x][point.y].breakSprite = null
    state.tiles[point.x][point.y].pipe.isBroken = false
}

const maxFlooding = 30
const floodChance = 0.03

function renderFlood(x, y, tile) {
    const floodGraphic = renderState.pipes[x][y].floodGraphic
    floodGraphic.cacheAsBitmap = false
    floodGraphic.clear()
    floodGraphic.beginFill(0x8888ee)
    floodGraphic.drawRect(
        25 - 25 * tile.flooding / maxFlooding, 25 - 25 * tile.flooding / maxFlooding,
        50 * tile.flooding / maxFlooding, 50 * tile.flooding / maxFlooding, 4)
    floodGraphic.cacheAsBitmap = true
}

export function checkFlooding() {
    for (let x = 0; x < pipesGridWidth; x++) {
        for (let y = 0; y < pipesGridHeight; y++) {
            const tile = state.tiles[x][y]
            if (tile.type === Type.pipe) {
                if (tile.pipe.isBroken) {
                    tile.flooding = Math.min(tile.flooding + 1, maxFlooding)
                } else {
                    tile.flooding = Math.max(tile.flooding - 1, 0)
                }
            }

            if ((x > 1 && state.tiles[x-1][y].flooding >= maxFlooding) ||
                (x < pipesGridWidth - 2 && state.tiles[x+1][y].flooding >= maxFlooding) ||
                (y > 1 && state.tiles[x][y-1].flooding >= maxFlooding) ||
                (y < pipesGridHeight - 2 && state.tiles[x][y+1].flooding >= maxFlooding)) {
                    tile.evaporation = 20
                    if (tile.flooding < maxFlooding) {
                        if (Math.random() < floodChance) {
                            tile.flooding = Math.min(tile.flooding + 1, maxFlooding)
                            renderFlood(x, y, tile)
                        }
                    }
                }

            tile.evaporation--

            if (tile.flooding > 0 && tile.evaporation == 0) {
                console.log('Evaporating')
                tile.flooding--
                tile.evaporation = 20
                renderFlood(x, y, tile)
            }
        }
    }
}
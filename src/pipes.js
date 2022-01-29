import {Vector2} from './vector2.js'
import state from './state.js'

export const width = 64
export const height = 40

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

export function makePipes() {
    const pipes = Array(width).fill(null).map(
        () => Array(height).fill(null).map(() => ({type: Type.empty, pipe: null}))
    )

    const numPipes = 100
    
    const goal = new Vector2(Math.floor(width / 2), Math.floor(height / 2))
    
    for (let i = 0; i < numPipes; i++) {
        // Start a pipe at the edge
        const edge = Math.floor(Math.random() * 4)
        let xFirst = false

        let start;
        if (edge == 0) {
            // Top
            start = new Vector2(Math.floor(Math.random() * width), height - 1)
            xFirst = false
        } else if (edge === 1) {
            // Right
            start = new Vector2(width - 1, Math.floor(Math.random() * height))
            xFirst = true
        } else if (edge === 2) {
            // Bottom
            start = new Vector2(Math.floor(Math.random() * width), 0)
            xFirst = false
        } else if (edge === 3) {
            // Left
            start = new Vector2(0,  Math.floor(Math.random() * height))
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

            if (next.x < 0 || next.x >= width || next.y < 0 || next.y >= height) {
                continue
            }

            const nextPipe = pipes[next.x][next.y]


            if (nextPipe.type === Type.goal) {
                break
            }

            let inPath = false
            for (let p of path) {
                if (p.x === next.x && p.y === next.y) {
                    inPath = true
                }
            }
            if (inPath) continue

            if (nextPipe.type === Type.pipe) {
                // There's an existin pipe here, see if we can bridge it
                if (nextPipe.pipe.dir === PipeDir.upDown) {
                    if (next.x > current.x && current.x > 1) {
                        path.push(next.clone())
                        next.x++
                    } else if (next.x < current.x && current.x < width - 2) {
                        path.push(next.clone())
                        next.x--
                    } else {
                        continue
                    }
                } else if (nextPipe.pipe.dir === PipeDir.leftRight) {
                    if (next.y > current.y && current.y > 1) {
                        path.push(next.clone())
                        next.y++
                    } else if (next.y < current.y && current.y < height - 2) {
                        path.push(next.clone())
                        next.y--
                    } else {
                        continue
                    }
                } else {
                    xFirst = !xFirst
                    continue
                }
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
                } else {
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
                        } else if (current.x === width - 1) {
                            if (next.x < current.x)      tile.pipe.dir = PipeDir.leftRight
                            else if (next.y > current.y) tile.pipe.dir = PipeDir.rightDown
                            else if (next.y < current.y) tile.pipe.dir = PipeDir.upRight
                        } else if (current.y === 0) {
                            if (next.x < current.x)      tile.pipe.dir = PipeDir.leftUp
                            else if (next.x > current.x) tile.pipe.dir = PipeDir.upRight
                            else if (next.y > current.y) tile.pipe.dir = PipeDir.upDown
                        } else if (current.y === height - 1) {
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
    for (let y = 0; y < 40; y++) {
        for (let x = 0; x < 64; x++) {
            const tile = state.pipes[x][y]

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
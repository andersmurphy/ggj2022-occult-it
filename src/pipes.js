import {Vector2} from './vector2.js'

// Tile types
export class Tile {
    static empty = new Tile('empty')
    static pipe = new Tile('pipe')
    static goal = new Tile('goal')

    constructor(name) {
        this.name = name
    }
}

// Pipe directions
export class PipeDir {
    static leftRight = 0
    static leftUp = 1
    static leftDown = 2
    static upDown = 2
    static upLeft = 3
    static upRight = 4
    static rightUp = 5
    static rightDown = 6
    static downLeft = 7
    static downRight = 8
    static bridge = 9
}


export function makePipes() {
    const width = 64
    const height = 40
    
    const pipes = Array(width).fill(null).map(
        () => Array(height).fill(null).map(() => ({tile: Tile.empty, pipe: null}))
    )

    const numPipes = 10
    
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

        const maxTries = 200
        let tries = maxTries

        if (pipes[start.x][start.y].tile !== Tile.empty) {
            // If we start on top of an existing pipe, immediately fail
            tries = 0
            break
        }
 
        const path = [start]
        let current = start.clone()
        let next

        for (let x = goal.x - 1; x <= goal.x + 1; x++) {
            for (let y = goal.y - 1; y <= goal.y + 1; y++) {
                pipes[x][y].tile = Tile.goal
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

            if (pipes[next.x][next.y].tile === Tile.goal) {
                break
            }

            let inPath = false
            for (let p of path) {
                if (p.x === next.x && p.y === next.y) {
                    inPath = true
                }
            }

            if (inPath) {
                continue
            }


            if (pipes[next.x][next.y].tile !== Tile.empty) {
                xFirst = !xFirst
                continue
            }

            current = next

            path.push(current.clone())
        }

        if (tries > 0) {
            for (let pathElement of path) {
                if (pipes[pathElement.x][pathElement.y].tile === `${i}`) {
                    pipes[pathElement.x][pathElement.y].tile = Tile.pipe
                } else {
                    pipes[pathElement.x][pathElement.y].tile = Tile.pipe
                    pipes[pathElement.x][pathElement.y].pipe = {dir: PipeDir.upDown, id: i}  // TODO: Calculate direction properly
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
            const tile = pipes[x][y].tile

            if (tile === Tile.empty) pre.append(' ')
            else if (tile === Tile.pipe) pre.append('#')
            else if (tile === Tile.goal) pre.append('*')
        }
        pre.append('\n')
    }
    document.body.append(pre)
}
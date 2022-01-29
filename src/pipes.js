import {Vector2} from './vector2.js'

export function makePipes() {
    const width = 64
    const height = 40
    
    const pipes = Array(width).fill(null).map(
        () => Array(height).fill(null).map(() => ({tile: ' '}))
    )
    console.log(pipes)
    
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

        if (pipes[start.x][start.y].tile !== ' ') {
            // Immediately fail
            tries = 0
            break
        }
 
        const path = [start]
        let current = start.clone()
        let next

        for (let x = goal.x - 1; x <= goal.x + 1; x++) {
            for (let y = goal.y - 1; y <= goal.y + 1; y++) {
                pipes[x][y].tile = '*'
            }
        }

        while (tries > 0) {
            tries--
            next = current.clone()

            if (Math.random() < 0.05) {
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

            if (pipes[next.x][next.y].tile === '*') {
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


            if (pipes[next.x][next.y].tile !== ' ') {
                xFirst = !xFirst
                continue
            }

            current = next

            path.push(current.clone())
        }

        if (tries > 0) {
            for (let pathElement of path) {
                if (pipes[pathElement.x][pathElement.y].tile === `${i}`) {
                    pipes[pathElement.x][pathElement.y].tile === '+'
                } else {
                    pipes[pathElement.x][pathElement.y].tile = `${i}`
                }
            }
        }

    }
    return pipes
}


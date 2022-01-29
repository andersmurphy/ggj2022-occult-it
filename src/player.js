import * as PIXI from 'pixi.js'
import {Vector2} from './vector2'
import keyboard from './keyboard'
import { pipesGridWidth, pipesGridHeight, Type, breakPipe, fixPipe } from './pipes'
import state from './state'
import renderState from './render-state'

const texture = require('../assets/Player.png')
const timerSprites = [
    require('../images/Timer0.png'),
    require('../images/Timer1.png'),
    require('../images/Timer2.png'),
    require('../images/Timer3.png'),
    require('../images/Timer4.png'),
] 
const breakDuration = 1200  // milliseconds
const fixDuration = 2400  // milliseconds
const speed = 0.2 // In tiles per frame

export class Player {
    interacting
    breaking
    fixing

    constructor(pos, isLocal, container) {
        this.pos = pos
        this.vel = new Vector2()
        this.isLocal = isLocal
        this.sprite = PIXI.Sprite.from('player.png')
        this.sprite.anchor.set(0.5, 0.5)
        this.scale = 2
        this.sprite.scale.set(this.scale / 64, this.scale / 64) // Scale the player to be ~2 tiles wide
        this.up = false
        this.down = false
        this.left = false
        this.right = false
        this.interacting = null
        this.breaking = null
        this.fixing = null

        const wKey = keyboard(['w', 'W', 'ArrowUp'])
        wKey.press = () =>  this.up = true
        wKey.release = () => this.up = false

        const sKey = keyboard(['s', 'S', 'ArrowDown'])
        sKey.press = () =>  this.down = true
        sKey.release = () => this.down = false

        const aKey = keyboard(['a', 'A', 'ArrowLeft'])
        aKey.press = () =>  this.left = true
        aKey.release = () => this.left = false

        const dKey = keyboard(['d', 'D', 'ArrowRight'])
        dKey.press = () =>  this.right = true
        dKey.release = () => this.right = false

        const rKey = keyboard(['r', 'R', ' ', 'p', 'P'])
        rKey.press = () => this.attemptToBreak(container)

        const fKey = keyboard(['f', 'F', 'l', 'L'])
        fKey.press = () => this.attemptToFix(container)
    }

    update(timeDelta, container) {
        if (this.isLocal) {
            if (this.breaking) {
                this.updateBreaking(timeDelta, container)
            } else if (this.fixing) {
                this.updateFixing(timeDelta, container)
            } else {
                this.updateInput()
            }
        }
    }

    updateInput() {
        this.vel.set(0, 0)
        if (this.up) {
            this.vel.y -= speed
        }
        if (this.down) {
            this.vel.y += speed
        }
        if (this.left) {
            this.vel.x -= speed
        }
        if (this.right) {
            this.vel.x += speed
        }

        const nextPos = this.pos.clone()

        nextPos.x += this.vel.x
        nextPos.y += this.vel.y

        // Check collisions with pipes/edge
        if (nextPos.x < this.scale / 2 || nextPos.x > pipesGridWidth - this.scale / 2) {
            nextPos.x -= this.vel.x
        }

        if (nextPos.y < this.scale / 2 || nextPos.y > pipesGridHeight - this.scale / 2 ) {
            nextPos.y -= this.vel.y
        }

        let collisionPoint = new Vector2(Math.floor(nextPos.x), Math.floor(nextPos.y))
        let tile = state.tiles[collisionPoint.x][collisionPoint.y]

        if (tile.type !== Type.empty) {
            if (tile.type == Type.pipe) {
                this.startInteracting(tile, collisionPoint)
            } else if (this.isInteracting()) {
                this.stopInteracting()
            }
            if (tile.type !== Type.pipe || !tile.pipe.isBroken) {
                // Try without x motion
                nextPos.x -= this.vel.x
                collisionPoint = new Vector2(Math.floor(nextPos.x), Math.floor(nextPos.y))
                tile = state.tiles[collisionPoint.x][collisionPoint.y]
                if (tile.type !== Type.empty && (tile.type !== Type.pipe || !tile.pipe.isBroken)) {
                    // Otherwise try without y motion
                    nextPos.x += this.vel.x
                    nextPos.y -= this.vel.y
                    collisionPoint = new Vector2(Math.floor(nextPos.x), Math.floor(nextPos.y))
                    tile = state.tiles[collisionPoint.x][collisionPoint.y]
                    if (tile.type !== Type.empty && (tile.type !== Type.pipe || !tile.pipe.isBroken)) {
                        return
                    }
                }
            }
        } else if (this.isInteracting()) {
            this.stopInteracting()
        }
        if (tile.type == Type.pipe && !tile.pipe.isBroken) {
            return
        }
        
        this.pos = nextPos

        // Update sprite 
        this.sprite.position.set(this.pos.x, this.pos.y)

        if (this.vel.magnitudeSqr() > 0.001) {
            const targetRotation = Math.atan2(this.vel.x, -this.vel.y)

            if (Math.abs(this.sprite.rotation - targetRotation) < Math.PI) {
                this.sprite.rotation = (this.sprite.rotation + targetRotation) / 2
            } else {
                this.sprite.rotation = (this.sprite.rotation + Math.PI * 2 + targetRotation) / 2
            }
        }
    }

    updateBreaking(timeDelta, container) {
        const quarterDuration = Math.floor(breakDuration / 4)
        const currentQuarter = Math.floor(this.breaking.time / quarterDuration)

        this.breaking.time += timeDelta
        if (this.breaking.time >= breakDuration) {
            this.finishBreakPipe(container)
        } else {
            const newQuarter = Math.floor(this.breaking.time / quarterDuration)

            if (newQuarter != currentQuarter) {
                const name = `Timer${4 - newQuarter}.png`
                console.log(name)
                const sprite = this.createTimerSprite(name, this.breaking.point)

                container.removeChild(this.breaking.sprite)
                this.breaking.sprite = sprite
                container.addChild(sprite)
            }
        }
    }

    

    static spawn(container) {
        let tries = 1000

        while (tries > 0) {
            tries--

            const spawnPos = new Vector2(Math.random() * (pipesGridWidth - 1), Math.random() * (pipesGridHeight - 1))
            if (state.tiles[Math.floor(spawnPos.x)][Math.floor(spawnPos.y)].type === Type.empty) {
                return new Player(spawnPos, true, container)
            }
        }
    }

    static addAssets(loader) {
        loader.add('player.png', texture)
        for (let i = 0; i < timerSprites.length; i++) {
            const timerSprite = timerSprites[i];
            const name = `Timer${i}.png`

            loader.add(name, timerSprite)
        }
    }

    startInteracting(tile, point) {
        if (this.interacting) {
            this.stopInteracting()
        }
        this.interacting = { 
            tile,
            point
        }
        const sprite = renderState.pipes[point.x][point.y].pipeSprite
        sprite.tint = 0xff00ff
    }

    isInteracting() {
        return this.interacting && !(this.vel.x == 0 && this.vel.y == 0)
    }

    stopInteracting() {
        const point = this.interacting.point
        const sprite = renderState.pipes[point.x][point.y].pipeSprite

        sprite.tint = 0xffffff
        this.interacting = null
    }

    attemptToBreak(container) {
        if (this.interacting
            && this.interacting.tile.type == Type.pipe
            && !this.interacting.tile.pipe.isBroken) {
                const point = this.interacting.point

                this.startBreakPipe(point, container)
                this.stopInteracting()
            }
    }

    startBreakPipe(point, container) {
        const sprite = this.createTimerSprite('Timer4.png', point)

        this.breaking = {
            point,
            time: 0,
            sprite,
        }
        container.addChild(sprite)
    }

    finishBreakPipe(container) {
        const point = this.breaking.point

        container.removeChild(this.breaking.sprite)
        breakPipe(point, container)
        this.breaking = null
    }

    attemptToFix(container) {
        if (this.interacting
            && this.interacting.tile.type == Type.pipe
            && this.interacting.tile.pipe.isBroken) {
                const point = this.interacting.point

                this.startFixPipe(point, container)
                this.stopInteracting()
            }
    }

    startFixPipe(point, container) {
        const sprite = this.createTimerSprite('Timer4.png', point)

        this.fixing = {
            point,
            time: 0,
            sprite,
        }
        container.addChild(sprite)
    }

    updateFixing(timeDelta, container) {
        const quarterDuration = Math.floor(fixDuration / 4)
        const currentQuarter = Math.floor(this.fixing.time / quarterDuration)

        this.fixing.time += timeDelta
        if (this.fixing.time >= fixDuration) {
            this.finishFixPipe(container)
        } else {
            const newQuarter = Math.floor(this.fixing.time / quarterDuration)

            if (newQuarter != currentQuarter) {
                const name = `Timer${4 - newQuarter}.png`
                console.log(name)
                const sprite = this.createTimerSprite(name, this.fixing.point)

                container.removeChild(this.fixing.sprite)
                this.fixing.sprite = sprite
                container.addChild(sprite)
            }
        }
    }

    finishFixPipe(container) {
        const point = this.fixing.point

        container.removeChild(this.fixing.sprite)
        fixPipe(point, container)
        this.fixing = null
    }

    createTimerSprite(name, point, scale = 20) {
        const sprite = PIXI.Sprite.from(name)

        sprite.x = point.x
        sprite.y = point.y
        sprite.scale.set(1 / scale, 1 / scale)

        return sprite
    }
}

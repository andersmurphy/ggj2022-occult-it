import * as PIXI from 'pixi.js'
import {Vector2} from './vector2'
import keyboard from './keyboard'
import { pipesGridWidth, pipesGridHeight, Type, breakPipe, fixPipe } from './pipes'
import state from './state'
import renderState from './render-state'
import { setOutState, NetCommandId, getNetworkId } from './network'

const texture = require('../assets/Player.png')
const fixTimerSprites = [
    require('../images/FixTimer0.png'),
    require('../images/FixTimer1.png'),
    require('../images/FixTimer2.png'),
    require('../images/FixTimer3.png'),
    require('../images/FixTimer4.png'),
] 
const breakTimerSprites = [
    require('../images/BreakTimer0.png'),
    require('../images/BreakTimer1.png'),
    require('../images/BreakTimer2.png'),
    require('../images/BreakTimer3.png'),
    require('../images/BreakTimer4.png'),
] 
const interactBreakTexture = require('../images/InteractBreak.png')
const interactFixTexture = require('../images/InteractFix.png')
const breakDuration = 500  // milliseconds
const fixDuration = 1000  // milliseconds
const speed = 0.2 // In tiles per frame

export class Player {
    interacting
    breaking
    fixing
    movement
    audio
    interactBreakSprite
    interactFixSprite

    constructor(movement, isLocal, container, audio) {
        this.audio = audio
        this.movement = movement
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

        if (this.isLocal) {
            this.interactBreakSprite = PIXI.Sprite.from('InteractBreak.png')
            this.interactBreakSprite.scale.set(1 / 80, 1 / 80)
            this.interactFixSprite = PIXI.Sprite.from('InteractFix.png')
            this.interactFixSprite.scale.set(1 / 80, 1 / 80)

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

            const fKey = keyboard(['f', 'F', 'l', 'L', 'Control'])
            fKey.press = () => this.attemptToFix(container)
        }
    }

    update(timeDelta, container) {
        if (this.isLocal) {
            if (this.breaking) {
                this.updateBreaking(timeDelta, container)
            } else if (this.fixing) {
                this.updateFixing(timeDelta, container)
            } else {
                this.updateInput(container)
            }
        }
        this.updateSprite()
    }

    updateSprite() {
        // Update sprite 
        this.sprite.position.set(this.movement.pos.x, this.movement.pos.y)

        if (this.movement.vel.magnitudeSqr() > 0.001) {
            const targetRotation = Math.atan2(this.movement.vel.x, -this.movement.vel.y)

            if (Math.abs(this.sprite.rotation - targetRotation) < Math.PI) {
                this.sprite.rotation = (this.sprite.rotation + targetRotation) / 2
            } else {
                this.sprite.rotation = (this.sprite.rotation + Math.PI * 2 + targetRotation) / 2
            }
        }
    }

    updateInput(container) {
        this.movement.vel.set(0, 0)
        if (this.up) {
            this.movement.vel.y -= speed
        }
        if (this.down) {
            this.movement.vel.y += speed
        }
        if (this.left) {
            this.movement.vel.x -= speed
        }
        if (this.right) {
            this.movement.vel.x += speed
        }

        this.updateInteracting(container)

        const nextPos = this.movement.pos.clone()

        nextPos.x += this.movement.vel.x
        nextPos.y += this.movement.vel.y

        // Check collisions with pipes/edge
        if (nextPos.x < this.scale / 2 || nextPos.x > pipesGridWidth - this.scale / 2) {
            nextPos.x -= this.movement.vel.x
        }

        if (nextPos.y < this.scale / 2 || nextPos.y > pipesGridHeight - this.scale / 2 ) {
            nextPos.y -= this.movement.vel.y
        }

        let collisionPoint = new Vector2(Math.floor(nextPos.x), Math.floor(nextPos.y))
        let tile = state.tiles[collisionPoint.x][collisionPoint.y]

        if (tile.type !== Type.empty) {
            if (tile.type !== Type.pipe || !tile.pipe.isBroken) {
                // Try without x motion
                nextPos.x -= this.movement.vel.x
                collisionPoint = new Vector2(Math.floor(nextPos.x), Math.floor(nextPos.y))
                tile = state.tiles[collisionPoint.x][collisionPoint.y]
                if (tile.type !== Type.empty && (tile.type !== Type.pipe || !tile.pipe.isBroken)) {
                    // Otherwise try without y motion
                    nextPos.x += this.movement.vel.x
                    nextPos.y -= this.movement.vel.y
                    collisionPoint = new Vector2(Math.floor(nextPos.x), Math.floor(nextPos.y))
                    tile = state.tiles[collisionPoint.x][collisionPoint.y]
                    if (tile.type !== Type.empty && (tile.type !== Type.pipe || !tile.pipe.isBroken)) {
                        return
                    }
                }
            }
        }
        if (tile.type == Type.pipe && !tile.pipe.isBroken) {
            return
        }
        
        this.movement.pos = nextPos

        if (this.isLocal) {
            if (this.movement.vel.x != 0 
                || this.movement.vel.y != 0) {
                setOutState({
                    command: NetCommandId.player,
                    movement: this.movement,
                })
            }
        }
    }

    updateInteracting(container) {
        if (this.movement.vel.x == 0 && this.movement.vel.y == 0) {
            return
        }
        const rayEnd = this.movement.pos.clone()
        const normal = this.movement.vel.normalize()

        rayEnd.x += normal.x
        rayEnd.y += normal.y

        let interactionPoint = new Vector2(Math.floor(rayEnd.x), Math.floor(rayEnd.y))
        let tile = state.tiles[interactionPoint.x][interactionPoint.y]

        if (tile.type == Type.pipe) {
            this.startInteracting(tile, interactionPoint, container)
        } else {
            this.stopInteracting(container)
        }
    }

    updateBreaking(timeDelta, container) {
        const timerPartCount = 5
        const partDuration = Math.floor(breakDuration / timerPartCount)
        const currentPart = Math.floor(this.breaking.time / partDuration)

        this.breaking.time += timeDelta
        if (this.breaking.time >= breakDuration) {
            this.finishBreakPipe(container)
        } else {
            const newPart = Math.floor(this.breaking.time / partDuration)

            if (newPart != currentPart) {
                const name = `BreakTimer${timerPartCount - newPart}.png`
                const sprite = this.createTimerSprite(name, this.breaking.point)
                
                container.removeChild(this.breaking.sprite)
                this.breaking.sprite = sprite
                container.addChild(sprite)

                if (newPart >= 0) {
                    const audioName = `break${newPart}`
                    this.audio.play(audioName)
                }
            }
        }
    }

    static spawn(container, audio, id) {
        let tries = 1000

        while (tries > 0) {
            tries--

            const spawnPos = new Vector2(1 + Math.random() * (pipesGridWidth - 3), 1 + Math.random() * (pipesGridHeight - 3))
            if (state.tiles[Math.floor(spawnPos.x)][Math.floor(spawnPos.y)].type === Type.empty) {
                const movement = {
                    id,
                    pos: spawnPos,
                    vel: new Vector2(),
                }
                console.log('Is local: ', id == getNetworkId())
                return new Player(movement, id == getNetworkId(), container, audio)
            }
        }
        console.log("Failed to spawn")
    }

    static addAssets(loader) {
        loader.add('player.png', texture)
        for (let i = 0; i < fixTimerSprites.length; i++) {
            const timerSprite = fixTimerSprites[i];
            const name = `FixTimer${i}.png`

            loader.add(name, timerSprite)
        }
        for (let i = 0; i < breakTimerSprites.length; i++) {
            const timerSprite = breakTimerSprites[i];
            const name = `BreakTimer${i}.png`

            loader.add(name, timerSprite)
        }
        loader.add('InteractBreak.png', interactBreakTexture)
        loader.add('InteractFix.png', interactFixTexture)
    }

    startInteracting(tile, point, container) {
        this.stopInteracting(container)
        this.interacting = { 
            tile,
            point
        }
        let interactSprite
        if (tile.pipe.isBroken) {
            interactSprite = this.interactFixSprite
        } else {
            interactSprite = this.interactBreakSprite
        }
        container.addChild(interactSprite)
        interactSprite.anchor.set(0.5, 0.5)
        interactSprite.x = point.x + 0.5
        interactSprite.y = point.y + 0.5
    }

    isInteracting() {
        return this.interacting && !(this.movement.vel.x == 0 && this.movement.vel.y == 0)
    }

    stopInteracting(container) {
        if (this.interacting) {
            container.removeChild(this.interactBreakSprite)
            container.removeChild(this.interactFixSprite)
            this.interacting = null
        }
    }

    attemptToBreak(container) {
        if (this.interacting
            && this.interacting.tile.type == Type.pipe
            && !this.interacting.tile.pipe.isBroken) {
                const point = this.interacting.point

                this.startBreakPipe(point, container)
            }
    }

    startBreakPipe(point, container) {
        if (this.breaking || this.fixing) {
            return
        }

        const sprite = this.createTimerSprite('BreakTimer4.png', point)

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
        this.startInteracting(state.tiles[point.x][point.y], point, container)
    }

    attemptToFix(container) {
        if (this.interacting
            && this.interacting.tile.type == Type.pipe
            && this.interacting.tile.pipe.isBroken) {
                const point = this.interacting.point

                this.startFixPipe(point, container)
            }
    }

    startFixPipe(point, container) {
        if (this.breaking || this.fixing) {
            return
        }

        const sprite = this.createTimerSprite('FixTimer0.png', point)

        this.fixing = {
            point,
            time: 0,
            sprite,
        }
        container.addChild(sprite)
    }

    updateFixing(timeDelta, container) {
        const timerPartCount = 5
        const partDuration = Math.floor(fixDuration / timerPartCount)
        const currentPart = Math.floor(this.fixing.time / partDuration)

        this.fixing.time += timeDelta
        if (this.fixing.time >= fixDuration) {
            this.finishFixPipe(container)
        } else {
            const newPart = Math.floor(this.fixing.time / partDuration)

            if (newPart != currentPart) {
                const name = `FixTimer${newPart}.png`
                const sprite = this.createTimerSprite(name, this.fixing.point)

                container.removeChild(this.fixing.sprite)
                this.fixing.sprite = sprite
                container.addChild(sprite)

                if (newPart >= 0) {
                    const audioName = `fix${newPart}`
                    this.audio.play(audioName)
                }
            }
        }
    }

    finishFixPipe(container) {
        const point = this.fixing.point

        container.removeChild(this.fixing.sprite)
        fixPipe(point, container)
        this.fixing = null
        this.startInteracting(state.tiles[point.x][point.y], point, container)
    }

    createTimerSprite(name, point, scale = 40) {
        const sprite = PIXI.Sprite.from(name)

        sprite.position.set(point.x + 0.5, point.y + 0.5)
        sprite.anchor.set(0.5, 0.5)
        sprite.scale.set(1 / scale, 1 / scale)

        return sprite
    }
}

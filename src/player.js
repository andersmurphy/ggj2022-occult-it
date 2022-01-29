import * as PIXI from 'pixi.js'
import {Vector2} from './vector2'
import keyboard from './keyboard'
import { pipesGridWidth, pipesGridHeight, Type } from './pipes'
import state from './state'

const texture = require('../assets/Player.png')
const speed = 0.3 // In tiles per frame

export class Player {
    interactingTile

    constructor(pos, isLocal) {
        this.pos = pos
        this.vel = new Vector2()
        this.isLocal = isLocal
        this.sprite = new PIXI.Sprite.from('player.png')
        this.sprite.anchor.set(0.5, 0.5)
        this.scale = 2
        this.sprite.scale.set(this.scale / 64, this.scale / 64) // Scale the player to be ~2 tiles wide
        this.up = false
        this.down = false
        this.left = false
        this.right = false

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
    }

    update() {
        if (this.isLocal) {

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
            if (nextPos.x < this.scale / 2 || nextPos.x > pipesGridWidth - this.scale / 2 || 
                nextPos.y < this.scale / 2 || nextPos.y > pipesGridHeight - this.scale / 2 ) {
                return
            }

            let tile = state.pipes[Math.floor(nextPos.x)][Math.floor(nextPos.y)]
            if (tile.type !== Type.empty) {
                if (tile.type == Type.pipe) {
                    this.startInteracting(tile)
                } else if (this.isInteracting()) {
                    this.stopInteracting()
                }
                return
            } else if (this.isInteracting()) {
                this.stopInteracting()
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
    }

    static addAssets(loader) {
        loader.add('player.png', texture)
    }

    startInteracting(tile) {
        if (this.interactingTile) {
            this.stopInteracting()
        }
        this.interactingTile = tile
        this.interactingTile.sprite.tint = 0xff00ff
    }

    isInteracting() {
        return this.interactingTile && !(this.vel.x == 0 && this.vel.y == 0)
    }

    stopInteracting() {
        this.interactingTile.sprite.tint = 0xffffff
        this.interactingTile = undefined
    }
}
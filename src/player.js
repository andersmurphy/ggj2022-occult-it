import * as PIXI from 'pixi.js'
import {Vector2} from './vector2'
import keyboard from './keyboard'

const texture = require('../assets/Player.png')
const speed = 5

export class Player {
    constructor(pos, isLocal) {
        this.pos = pos
        this.vel = new Vector2()
        this.isLocal = isLocal
        this.sprite = new PIXI.Sprite.from('player.png')
        this.sprite.anchor.set(0.5, 0.5)
        this.up = false
        this.down = false
        this.left = false
        this.right = false

        const wKey = keyboard('w')
        wKey.press = () =>  this.up = true
        wKey.release = () => this.up = false

        const sKey = keyboard('s')
        sKey.press = () =>  this.down = true
        sKey.release = () => this.down = false

        const aKey = keyboard('a')
        aKey.press = () =>  this.left = true
        aKey.release = () => this.left = false

        const dKey = keyboard('d')
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

            this.pos.x += this.vel.x
            this.pos.y += this.vel.y
            this.sprite.position.set(this.pos.x, this.pos.y)

            if (this.vel.magnitudeSqr() > 0.1) {
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
}
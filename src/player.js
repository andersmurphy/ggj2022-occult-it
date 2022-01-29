import * as PIXI from 'pixi.js'
import {Vector2} from './vector2'

const texture = require('../assets/Player.png')

export class Player {
    constructor(pos) {
        this.pos = pos
        this.vel = new Vector2()
        this.sprite = new PIXI.Sprite.from('player.png')
    }

    static addAssets(loader) {
        loader.add('player.png', texture)
    }
}
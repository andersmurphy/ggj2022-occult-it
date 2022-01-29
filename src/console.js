import * as PIXI from 'pixi.js'
const texture = require('../assets/Console.png')

export class Console {
    constructor(pos) {
        this.pos = pos
        this.sprite = new PIXI.Sprite.from('Console.png')
        this.sprite.scale.set(3 / 240, 3 / 240)
        this.sprite.position.set(pos.x, pos.y)
    }

    static addAssets(loader) {
        loader.add('Console.png', texture)
    }
}
import * as PIXI from 'pixi.js'
const texture = require('../assets/Console.png')

export class Console {
    constructor(pos) {
        this.pos = pos
        this.progress = 0
        this.progressRate = 0.0002

        this.sprite = new PIXI.Sprite.from('Console.png')
        this.sprite.anchor.set(0, 0)
        this.sprite.scale.set(3 / 240, 3 / 240)
        this.sprite.position.set(pos.x, pos.y)

        this.progressBar = new PIXI.Graphics()
        this.progressBar.position.set(pos.x, pos.y)
    }

    update() {
        this.progress = Math.min(this.progress + this.progressRate, 1)
        this.progressBar.clear()
        this.progressBar.lineStyle(0.4, 0x55ff55, 0.7)
        this.progressBar.arc(1.5, 1.5, 1, 0, Math.PI * 2 * this.progress);
    }

    static addAssets(loader) {
        loader.add('Console.png', texture)
    }
}
import * as PIXI from 'pixi.js'
const texture = require('../assets/Console.png')

export class Console {
    state

    constructor(pos) {
        this.state = {
            pos,
            progress: 0,
            progressRate: 0.0002,
        }

        this.createSprites()
    }

    update() {
        this.state.progress = Math.min(this.state.progress + this.state.progressRate, 1)
        this.progressBar.clear()
        this.progressBar.lineStyle(0.4, 0x55ff55, 0.7)
        this.progressBar.arc(1.5, 1.5, 1, 0, Math.PI * 2 * this.state.progress);
    }

    setState(newState) {
        this.state = newState
        this.sprite.position.set(this.state.pos.x, this.state.pos.y)
        this.progressBar.position.set(this.state.pos.x, this.state.pos.y)
    }

    createSprites() {
        this.sprite = new PIXI.Sprite.from('Console.png')
        this.sprite.anchor.set(0, 0)
        this.sprite.scale.set(3 / 240, 3 / 240)
        this.sprite.position.set(this.state.pos.x, this.state.pos.y)

        this.progressBar = new PIXI.Graphics()
        this.progressBar.position.set(this.state.pos.x, this.state.pos.y)
    }

    static addAssets(loader) {
        loader.add('Console.png', texture)
    }
}

import * as PIXI from 'pixi.js'
import { pipeStatus } from './pipes'
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
        this.won = false
        this.lost = false
    }

    update() {
        const pipeStat = pipeStatus()
        // console.log(pipeStat)
        const broken = pipeStat.broken.size
        const total = pipeStat.all.size
        const nonBroken = total - broken
        
        if (broken >  3 * total / 4 && !this.won) {
            this.lost = true
        }

        // console.log(broken, total)

        let progressMult = 1

        if (broken > nonBroken) {
            progressMult *= -1
        } else {
            progressMult = (nonBroken - broken) / total
        }

        // console.log(progressMult)
        this.state.progress = Math.min(this.state.progress + this.state.progressRate * progressMult, 1)
        this.state.progress = Math.max(this.state.progress, 0)
        this.progressBar.clear()
        this.progressBar.lineStyle(0.4, 0x55ff55, 0.7)
        this.progressBar.arc(1.5, 1.5, 1, 0, Math.PI * 2 * this.state.progress);

        if (this.state.progress == 1 && !this.lost) {
            this.won = true
        }
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

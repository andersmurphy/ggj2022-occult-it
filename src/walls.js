import * as PIXI from 'pixi.js'
import { Vector2 } from './vector2'
import { pipesGridWidth, pipesGridHeight } from './pipes'

const WallN = require('../images/WallN.png')
const WallNE = require('../images/WallNE.png')
const WallE = require('../images/WallE.png')
const WallSE = require('../images/WallSE.png')
const WallS = require('../images/WallS.png')
const WallSW = require('../images/WallSW.png')
const WallW = require('../images/WallW.png')
const WallNW = require('../images/WallNW.png')

function createWallSprite(name, point, scale = 80) {
    const sprite = PIXI.Sprite.from(name)

    sprite.x = point.x
    sprite.y = point.y
    sprite.scale.set(1 / scale, 1 / scale)

    return sprite
}

function addSprite(name, point, container) {
    const sprite = createWallSprite(name, point)
    container.addChild(sprite)
}

export function loadWWallSprites(loader) {
    loader.add('WallN.png', WallN)
    loader.add('WallNE.png', WallNE)
    loader.add('WallE.png', WallE)
    loader.add('WallSE.png', WallSE)
    loader.add('WallS.png', WallS)
    loader.add('WallSW.png', WallSW)
    loader.add('WallW.png', WallW)
    loader.add('WallNW.png', WallNW)
}

export function addWalls(container) {

    for (let x = 0; x < pipesGridWidth; x++) {
        addSprite('WallN.png', new Vector2(x, 0), container)
        addSprite('WallS.png', new Vector2(x, pipesGridHeight - 0.3), container)
    }


    for (let y = 0; y < pipesGridHeight; y++) {
        addSprite('WallW.png', new Vector2(0, y), container)
        addSprite('WallE.png', new Vector2(pipesGridWidth - 0.3, y), container)
    }

    addSprite('WallNW.png', new Vector2(0, 0), container)
    addSprite('WallNE.png', new Vector2(pipesGridWidth - 0.3, 0), container)
    addSprite('WallSE.png', new Vector2(pipesGridWidth - 0.3, pipesGridHeight - 0.3), container)
    addSprite('WallSW.png', new Vector2(0, pipesGridHeight - 0.3), container)
}

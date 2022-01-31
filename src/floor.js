import * as PIXI from 'pixi.js'

const FloorImageReference = require('../images/Floor.png')

export function addFloorAssets(loader) {
    loader.add('Floor.png', FloorImageReference)
}

export function addFloorSprites(container) {
    const floorTexture = PIXI.Texture.from('Floor.png')
    const tiledFloor = PIXI.TilingSprite.from(floorTexture, container.width, container.height)

    container.addChild(tiledFloor)
    tiledFloor.tileScale.x = 1 / floorTexture.width * 2
    tiledFloor.tileScale.y = 1 / floorTexture.height * 2
}

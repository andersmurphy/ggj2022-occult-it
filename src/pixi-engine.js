import * as PIXI from 'pixi.js'
import { Howl, Howler } from 'howler'
// import { Containing, EngineParams, GameDriving, Spritelike, Textlike, AnimatedSpritelike, Graphical, HttpResponse, HttpHeader } from './game-engine'
// import { Size } from './types'
// import { Unit } from './calculate-board-size'

export class PixiEngine {
    htmlContainer//: HTMLElement
    loader//: PIXI.Loader
    renderer//: PIXI.Renderer
    stage//: PIXI.Container
    graphics//: PIXI.Graphics
    fpsMax//: number
    spriteSheet//!: PIXI.Spritesheet | undefined
    isTouchScreen//: boolean
    audio//?: Howl

    constructor(params/*: EngineParams*/) {
        this.loader = PIXI.Loader.shared
        this.renderer = PIXI.autoDetectRenderer({
            width: params.canvasW,
            height: params.canvasH,
            antialias: false
        })
        this.stage = new PIXI.Container()
        this.graphics = new PIXI.Graphics()
        this.fpsMax = params.fpsMax
        this.isTouchScreen = params.isTouchScreen

        this.htmlContainer = params.containerId ? document.getElementById(params.containerId) || document.body : document.body
        this.htmlContainer.appendChild(this.renderer.view)
    }

    onResize(newSize/*: Size*/) {
        this.renderer.resize(newSize.width, newSize.height)
    }

    loadSpriteSheet(callback/*: () => void*/) {
        this
        .loader
        .add("images/spritesheet.json")
        .load((_, __) => {
            this.onSpritesLoaded(this)
            callback()
        })
    }

    loadAudio(
        src/*: string | string[]*/,
        sprite/*: { [name: string]: [number, number] | [number, number, boolean] }*/,
        callback/*: () => void*/)/*: void */ {
        Howler.volume(0.25)
        this.audio = new Howl({ src, sprite })
        this.audio.on("load", callback)
    }

    onSpritesLoaded(engine/*: PixiEngine*/) {
        engine.spriteSheet = engine.loader.resources["images/spritesheet.json"].spritesheet
    }

    addEventListener(eventName/*: string*/, handler/*: (event: any) => void*/, options/*: boolean*/) /*: void*/ {
        this.htmlContainer.addEventListener(eventName, handler, options)
    }

    makeContainer()/*: Containing */ {
        return new PIXI.Container()
    }
    
    makeGraphical()/*: Graphical*/ {
        return new PIXI.Graphics()
    }
    
    makeSprite(name/*: string*/)/* : Spritelike*/ {
        return new PIXI.Sprite(this.spriteSheet.textures[name])
    }

    makeAnimatedSprite(name/*: string*/)/* : AnimatedSpritelike */ {
        const animatedSprite = new PIXI.AnimatedSprite(this.spriteSheet.animations[name])
        animatedSprite.autoUpdate = false
        animatedSprite.stop()
        return animatedSprite
    }

    loadFont(name/*: string*/, style/*?: {
        fill?: string | string[] | number | number[] | CanvasGradient | CanvasPattern
        fontFamily?: string | string[]
        fontSize?: number | string
        strokeThickness?: number
    }*/, options/*?: {
        chars?: string | string[] | string[][]
        resolution?: number
        textureWidth?: number
        textureHeight?: number
        padding?: number
    }*/)/*: void*/ {
        try {
            PIXI.BitmapFont.uninstall(name)
        } catch(err) {
        }
        PIXI.BitmapFont.from(name, style, options)
    }

    makeText(text/*: string*/, style/*: {
        fontName: string
        fontSize?: number
        align?: string
        tint?: number
        letterSpacing?: number
        maxWidth?: number
    }*/)/*: Textlike */ {
        return new PIXI.BitmapText(text, style)
    }

    makeButton(
        foreground/*: Containing*/,
        width/*: number*/,
        height/*: number*/,
        nineSliceSize/*: number*/,
        backgroundNormal/*: string*/,
        backgroundActive/*: string*/,
        backgroundSelected/*: string*/,
        onPressed/*: () => void*/)/*: Containing*/ {
        let button = new PIXI.Container()
        let buttonNormal = new PIXI.NineSlicePlane(this.spriteSheet.textures[backgroundNormal], nineSliceSize, nineSliceSize, nineSliceSize, nineSliceSize)
        let buttonActive = new PIXI.NineSlicePlane(this.spriteSheet.textures[backgroundActive], nineSliceSize, nineSliceSize, nineSliceSize, nineSliceSize)
        let buttonSelected = new PIXI.NineSlicePlane(this.spriteSheet.textures[backgroundSelected], nineSliceSize, nineSliceSize, nineSliceSize, nineSliceSize)
        const _foreground = foreground/* as PIXI.Container*/

        _foreground.x = (width / 2) - (_foreground.width / 2)
        _foreground.y = (height / 2) - (_foreground.height / 2) - Unit

        buttonNormal.width = width
        buttonNormal.height = height

        buttonActive.width = width
        buttonActive.height = height

        buttonSelected.width = width
        buttonSelected.height = height

        button.addChild(buttonNormal)
        button.addChild(_foreground)

        button.interactive = true
        button.on('mouseover', (_/*: any*/) => {
            button.removeChildren()
            button.addChild(buttonActive)
            button.addChild(_foreground)
        })
        button.on('mouseout', (_/*: any*/) => {
            button.removeChildren()
            button.addChild(buttonNormal)
            button.addChild(_foreground)
        })
        button.on('mousedown', (_/*: any*/) => {
            button.removeChildren()
            button.addChild(buttonSelected)
            button.addChild(_foreground)
        })
        button.on('touchstart', (_/*: any*/) => {
            button.removeChildren()
            button.addChild(buttonSelected)
            button.addChild(_foreground)
        })
        button.on('touchendoutside', (_/*: any*/) => {
            button.removeChildren()
            button.addChild(buttonNormal)
            button.addChild(_foreground)
        })
        button.on('touchcancel', (_/*: any*/) => {
            button.removeChildren()
            button.addChild(buttonNormal)
            button.addChild(_foreground)
        })
        button.on('mouseup', (_/*: any*/) => {
            button.removeChildren()
            button.addChild(buttonNormal)
            button.addChild(_foreground)
            onPressed()
        })
        button.on('tap', (_/*: any*/) => {
            button.removeChildren()
            button.addChild(buttonNormal)
            button.addChild(_foreground)
            onPressed()
        })

        return button
    }

    prompt(message/*: string*/, _default/*?: string | undefined*/)/*: string | null */{
        return window.prompt(message, _default)
    }

    addChild(child/*: any*/)/*: any*/ {
        return this.stage.addChild(child)
    }

    save(key/*: string*/, value/*: string*/)/*: void*/ {
        localStorage.setItem(key, value)
    }

    load(key/*: string*/)/*: string | null */{
        return localStorage.getItem(key)
    }

    extractPixels(displayable/*: any*/)/*: Uint8Array*/ {
        const extract = this.renderer.plugins.extract// as PIXI.Extract
        return extract.pixels(displayable)
    }
}

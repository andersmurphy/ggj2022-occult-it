import * as PIXI from 'pixi.js'
import { PixiEngine } from './pixi-engine.js'
import { OccultIt } from './occult-it.js'
import { pipesGridWidth, pipesGridHeight } from './pipes.js'

const spriteSheetPng = require('../images/spritesheet.png')

//const audioSprites = require('../audio/output.json')

PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST
PIXI.settings.ROUND_PIXELS = true
PIXI.settings.RENDER_OPTIONS.antialias = false

const gameContainerId = 'game'

const isTouchScreen = (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
                   || (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1)
let isLandscape = false
let engine
let game
let boardSize = { width: 0, height: 0 }
let destinationTileSize = { width: 0, height: 0 }

window.document.addEventListener('DOMContentLoaded', load)

function load() {
    // portraitControls.className = 'portrait-controls-container'
    // portraitControls.id = 'mobile-portrait-controls'
    //window.localStorage.clear();
    setup()
    window.onresize = handleResize
    window.document.onfullscreenchange = handleResize
    create()
}

function setup() {
    const boardSize = calculateSize();

    engine = new PixiEngine({
        containerId: gameContainerId,
        canvasW: boardSize.width,
        canvasH: boardSize.height,
        fpsMax: 60,
        isTouchScreen
    })
    game = new OccultIt(engine)
}

function calculateSize() {
    const sourceTileWidth = 80
    const sourceTileHeight = 80
    const boardTilesHorizontal = pipesGridWidth
    const boardTilesVertical = pipesGridHeight
    const isStandalone = ((window.navigator)['standalone']) == true
    const width = isStandalone ? document.documentElement.clientWidth : window.innerWidth 
    const height = isStandalone ? document.documentElement.clientHeight : window.innerHeight

    isLandscape = width > height

    const availableSize = {
        width,
        height,
    };
    console.log("availableSize: " + availableSize.width + " x " + availableSize.height)

    var destinationTileWidth = Math.floor(width / boardTilesHorizontal)
    var destinationTileHeight = Math.floor(height / boardTilesVertical)
    var minTileDimension = Math.min(destinationTileWidth, destinationTileHeight)

    destinationTileWidth = minTileDimension
    destinationTileHeight = minTileDimension

    destinationTileSize = {
        width: destinationTileWidth,
        height: destinationTileHeight,
    }
    console.log("destinationTileSize: " + destinationTileSize.width + " x " + destinationTileSize.height)
    boardSize = {
        width: destinationTileWidth * boardTilesHorizontal,
        height: destinationTileHeight * boardTilesVertical,
    }
    console.log("BoardSize: " + boardSize.width + " x " + boardSize.height)
    return boardSize
    //return calculateBoardSize({ width: 224, height: 260 })
}

function create() {
    const htmlContainer = document.getElementById(gameContainerId)
    //const pixelFont = new FontFace("ScoreFont", "url(fonts/slkscr-webfont.woff) format('woff')");

    // Prevent scrolling on Apple mobile devices
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        window.document.addEventListener('touchmove', (e) => {
            if (e.scale !== 1) {
                e.preventDefault();
            }
        }, { capture: true, passive: false });
        window.addEventListener("scroll", (e) => {
            e.preventDefault();
            window.scrollTo(0, 0);
        }, { capture: true, passive: false });
        var lastTouchEnd = 0;
        window.document.addEventListener('touchend', function (event) {
            var now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, { capture: true, passive: false });
    }

    if (!isTouchScreen) {
        htmlContainer.focus();
    }
    
    // Promise.all([
    //     pixelFont.load(),
    // ]).then(function(_) {
    
    const loader = game.loadAssets()

    loader.load((loader, resources) => {
        //engine.loadAudio(audioSprites.urls, audioSprites.sprite, () => {
        game.create(destinationTileSize);
        //createFramerateCounter(htmlContainer);
        // if (isTouchScreen) {
        //     setupOnScreenControls()
        // }
        setInterval(update, 1000.0 / engine.fpsMax);
        
        // let sheet = resources[spriteSheetJson].spritesheet;

        render();
    });
}

function handleResize() {
}

function update() {
    //fpsMeter.updateTime();
    game.update()
}

function render() {

    requestAnimationFrame(render);
    engine.renderer.render(engine.stage);
    //fpsMeter.tick();
}

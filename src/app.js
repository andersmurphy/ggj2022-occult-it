import {makePipes} from './pipes.js'


console.log('Hello world!')
window.pipes = makePipes()

let pre = document.createElement('pre')
for (let y = 0; y < 40; y++) {
    for (let x = 0; x < 64; x++) {
        pre.append(pipes[x][y].tile)
    }
    pre.append('\n')
}
document.body.append(pre)
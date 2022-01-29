import state from './state.js'
import {makePipes, debugPipes} from './pipes.js'
import { Vector2 } from './vector2.js'

state.pipes = makePipes()
debugPipes()

state.players.push(new Player(new Vector2(width / 2, height / 2 - 5)))
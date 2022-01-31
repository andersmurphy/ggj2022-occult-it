# Occult.it

<img src="https://ggj.s3.amazonaws.com/styles/game_sidebar__wide/featured_image/2022/01/127813/header_0.png?itok=Ylv520Ov&timestamp=1643557075" width="600" />


## Project & Team

This was a project for the 2022 Global Game Jam. Project and Team can be found [here](https://globalgamejam.org/2022/games/occult-it-9).

## Play

https://andersmurphy.github.io/ggj2022-occult-it/

## Setup

```
yarn install
```

## Dev server

```
yarn parcel src/index.html
```

## Deploy

```
bash build.sh
```

## Data structure

- 64x40 grid
- Player-state:
-- x
-- y
-- dx
-- dy
- Pipe
-- x
-- y
-- facing
-- isBroken
-- leakRate

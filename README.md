# Occult.it

## Play

https://andersmurphy.github.io/ggj2022-occult-it/

## Setup

```
yarn add --dev parcel
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

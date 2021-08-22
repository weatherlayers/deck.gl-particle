# deck.gl-particle

[![](https://img.shields.io/npm/dm/deck.gl-particle)](https://www.npmjs.com/package/deck.gl-particle)
[![](https://img.shields.io/david/zakjan/deck.gl-particle)](https://www.npmjs.com/package/deck.gl-particle)
[![](https://img.shields.io/bundlephobia/min/deck.gl-particle)](https://www.npmjs.com/package/deck.gl-particle)

Particle simulation layer for deck.gl

[Demo](https://kamzek.github.io/deck.gl-particle/)

<img src="docs/screenshot@2x.png" alt="Screenshot" width="640" height="320">

## Usage

Image contains particle speeds in [deck.gl COORDINATE_SYSTEM.LNGLAT](https://deck.gl/docs/developer-guide/coordinate-systems#supported-coordinate-systems), u component encoded into R channel, v component encoded into G channel. See [sample image](docs/wind_data.png).

```
import { Deck } from '@deck.gl/core';
import { ParticleLayer } from 'deck.gl-particle';

const deckgl = new Deck({
  layers: [
    new ParticleLayer({
      id: 'particle',
      image: ..., // see deck.gl BitmapLayer image property
      numParticles: ..., // number
      maxAge: ..., // number
      speedFactor: ..., // number
      color: ..., // [number, number, number]
      width: ..., // number
      opacity: ..., // number
    });
  ],
  _animate: true,
});
```

## Inspired by

- [Nicolas Belmonte: Wind Map](https://medium.com/vis-gl/wind-map-a58575f87fe3)
- [Vladimir Agafonkin: How I built a wind map with WebGL](https://blog.mapbox.com/how-i-built-a-wind-map-with-webgl-b63022b5537f)

## Weather layers as a service

[WeatherLayers.com](https://weatherlayers.com/)

# deck.gl-particle

[![](https://img.shields.io/npm/dm/deck.gl-particle)](https://www.npmjs.com/package/deck.gl-particle)
[![](https://img.shields.io/david/zakjan/deck.gl-particle)](https://www.npmjs.com/package/deck.gl-particle)
[![](https://img.shields.io/bundlephobia/min/deck.gl-particle)](https://www.npmjs.com/package/deck.gl-particle)

Particle simulation layer for deck.gl

**⚠️ This is a pre-release.**

[Demo](https://zakjan.github.io/deck.gl-particle/)

<img src="docs/screenshot@2x.jpg" alt="Screenshot" width="640" height="320">

## Usage

```
import { Deck } from '@deck.gl/core';
import { ParticleLayer } from 'deck.gl-particle';

const particleUrl = ...; // string

const deckgl = new Deck({
  layers: [
    new ParticleLayer({
      id: 'particle',
      image: particleUrl,
      numParticles: ..., // number
      maxAge: ..., // number
      speedFactor: ..., // number
      getColor: ..., // [number, number, number]
      getWidth: ..., // number
      opacity: ..., // number
    });
  ],
  _animate: true,
});
```

## Weather layers as a service

Interested in integrating weather layers into your existing map application? <a href="mailto:zj@zakjan.cz">Get in touch for a private beta!</a>
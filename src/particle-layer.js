/*
 * Copyright (c) 2021 Kamzek s.r.o.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {COORDINATE_SYSTEM} from '@deck.gl/core';
import {LineLayer} from '@deck.gl/layers';
import {Buffer, Transform} from '@luma.gl/core';
import GL from '@luma.gl/constants';

import { distance } from './geodesy';
import updateTransformVs from './particle-layer-update-transform.vs.glsl';

const DEFAULT_TEXTURE_PARAMETERS = {
  [GL.TEXTURE_WRAP_S]: GL.REPEAT,
};

const defaultProps = {
  ...LineLayer.defaultProps,

  image: {type: 'image', value: null, async: true},
  bounds: {type: 'array', value: [-180, -90, 180, 90], compare: true},
  _imageCoordinateSystem: COORDINATE_SYSTEM.LNGLAT,
  textureParameters: DEFAULT_TEXTURE_PARAMETERS,

  numParticles: {type: 'number', min: 1, max: 1000000, value: 5000},
  maxAge: {type: 'number', min: 1, max: 255, value: 100},
  speedFactor: {type: 'number', min: 0, max: 1, value: 1},
  animate: true,
};

export default class ParticleLayer extends LineLayer {
  getShaders() {
    return {
      ...super.getShaders(),
      inject: {
        'vs:#decl': `
          attribute float instanceIndex;
          uniform float numParticles;
          uniform float maxAge;
          varying float drop;
          const vec2 DROP_POSITION = vec2(0);
        `,
        'vs:#main-start': `
          drop = float(instanceSourcePositions.xy == DROP_POSITION || instanceTargetPositions.xy == DROP_POSITION);
        `,
        'vs:DECKGL_FILTER_COLOR': `
          float age = floor(instanceIndex / numParticles);
          color = vec4(color.rgb, color.a * (1. - age / maxAge));
        `,
        'fs:#decl': `
          varying float drop;
        `,
        'fs:#main-start': `
          if (drop > 0.5) discard;
        `,
      },
    };
  }

  initializeState() {
    super.initializeState({});

    this._setupTransformFeedback();

    const attributeManager = this.getAttributeManager();
    attributeManager.remove(['instanceSourcePositions', 'instanceTargetPositions']);
    attributeManager.addInstanced({
      instanceSourcePositions: {
        size: 3,
        type: GL.DOUBLE,
        fp64: false,
        transition: true,
        accessor: 'getSourcePosition'
      },
      instanceTargetPositions: {
        size: 3,
        type: GL.DOUBLE,
        fp64: false,
        transition: true,
        accessor: 'getTargetPosition'
      },
    });
  }

  updateState({props, oldProps, changeFlags}) {
    super.updateState({props, oldProps, changeFlags});

    if (props.numParticles !== oldProps.numParticles || props.maxAge !== oldProps.maxAge) {
      this._setupTransformFeedback();
    }
  }

  finalizeState() {
    this._deleteTransformFeedback();

    super.finalizeState();
  }

  draw({uniforms}) {
    const {numParticles, maxAge, animate} = this.props;
    const {sourcePositions, targetPositions, indexes, model} = this.state;

    if (animate) {
      this._runTransformFeedback();
    }

    model.setAttributes({
      instanceSourcePositions: sourcePositions,
      instanceTargetPositions: targetPositions,
      instanceIndex: indexes,
    });
    model.setUniforms({
      numParticles,
      maxAge,
    });

    super.draw({uniforms});
  }

  _setupTransformFeedback() {
    const {gl} = this.context;
    const {numParticles, maxAge} = this.props;
    const {initialized} = this.state;
    
    if (initialized) {
      this._deleteTransformFeedback();
    }

    // sourcePositions/targetPositions buffer layout:
    // |          age0         |          age1         |          age2         |...|          ageN         |
    // |pos1,pos2,pos3,...,posN|pos1,pos2,pos3,...,posN|pos1,pos2,pos3,...,posN|...|pos1,pos2,pos3,...,posN|
    const numInstances = numParticles * maxAge;
    const numAgedInstances = numParticles * (maxAge - 1);
    const sourcePositions = new Buffer(gl, new Float32Array(numInstances * 3));
    const targetPositions = new Buffer(gl, new Float32Array(numInstances * 3));
    const indexes = new Buffer(gl, new Float32Array(new Array(numInstances).fill(undefined).map((_, i) => i)));

    const transform = new Transform(gl, {
      sourceBuffers: {
        sourcePosition: sourcePositions,
      },
      feedbackBuffers: {
        targetPosition: targetPositions,
      },
      feedbackMap: {
        sourcePosition: 'targetPosition',
      },
      vs: updateTransformVs,
      elementCount: numInstances,
    });

    this.setState({
      initialized: true,
      numInstances,
      numAgedInstances,
      sourcePositions,
      targetPositions,
      indexes,
      transform,
    });
  }

  _runTransformFeedback() {
    const {gl, viewport, timeline} = this.context;
    const {image, bounds, numParticles, speedFactor, maxAge} = this.props;
    const {numAgedInstances, transform} = this.state;

    if (!image) {
      return;
    }

    const viewportSphere = viewport.resolution ? 1 : 0; // globe
    const viewportSphereCenter = [viewport.longitude, viewport.latitude];
    const viewportSphereRadius = Math.max(
      distance(viewportSphereCenter, viewport.unproject([0, 0])),
      distance(viewportSphereCenter, viewport.unproject([viewport.width / 2, 0])),
      distance(viewportSphereCenter, viewport.unproject([0, viewport.height / 2])),
    );
    const viewportBounds = viewport.getBounds();
    // viewportBounds[0] = Math.max(viewportBounds[0], -180);
    viewportBounds[1] = Math.max(viewportBounds[1], -85.051129);
    // viewportBounds[2] = Math.min(viewportBounds[2], 180);
    viewportBounds[3] = Math.min(viewportBounds[3], 85.051129);

    // speed factor for current zoom level
    const devicePixelRatio = gl.luma.canvasSizeInfo.devicePixelRatio;
    const viewportSpeedFactor = speedFactor * devicePixelRatio / 2 ** viewport.zoom;

    // age particles
    // copy age0-age(N-1) targetPositions to age1-ageN sourcePositions
    const sourcePositions = transform.bufferTransform.bindings[transform.bufferTransform.currentIndex].sourceBuffers.sourcePosition;
    const targetPositions = transform.bufferTransform.bindings[transform.bufferTransform.currentIndex].feedbackBuffers.targetPosition;
    sourcePositions.copyData({
      sourceBuffer: targetPositions,
      readOffset: 0,
      writeOffset: numParticles * 4 * 3,
      size: numAgedInstances * 4 * 3,
    });

    // update particles
    const uniforms = {
      speedTexture: image,
      bounds,
      numParticles,
      maxAge,

      viewportSphere,
      viewportSphereCenter,
      viewportSphereRadius,
      viewportBounds,
      viewportSpeedFactor,

      time: timeline.getTime(),
      seed: Math.random(),
    };
    transform.run({uniforms});
    transform.swap();

    // const {sourcePositions, targetPositions} = this.state;
    // console.log(uniforms, sourcePositions.getData().slice(0, 6), targetPositions.getData().slice(0, 6));
  }

  _deleteTransformFeedback() {
    const {initialized, sourcePositions, targetPositions, indexes, transform} = this.state;

    if (!initialized) {
      return;
    }

    sourcePositions.delete();
    targetPositions.delete();
    indexes.delete();
    transform.delete();

    this.setState({
      initialized: true,
      sourcePositions: undefined,
      targetPositions: undefined,
      indexes: undefined,
      transform: undefined,
    });
  }

  step() {
    this._runTransformFeedback();

    this.setNeedsRedraw();
  }

  clear() {
    const {numInstances, sourcePositions, targetPositions} = this.state;

    sourcePositions.subData({data: new Float32Array(numInstances * 3)});
    targetPositions.subData({data: new Float32Array(numInstances * 3)});

    this.setNeedsRedraw();
  }
}

ParticleLayer.layerName = 'ParticleLayer';
ParticleLayer.defaultProps = defaultProps;

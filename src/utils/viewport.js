/*
 * Copyright (c) 2021-2023 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {distance} from './geodesy.js';
import {wrapBounds} from './bounds.js';

/** @typedef {any} Viewport */

/**
 * @param {Viewport} viewport 
 * @returns {boolean}
 */
export function isViewportGlobe(viewport) {
  return !!viewport.resolution;
}

/**
 * @param {Viewport} viewport 
 * @returns {GeoJSON.Position | null}
 */
export function getViewportGlobeCenter(viewport) {
  if (!isViewportGlobe(viewport)) {
    return null;
  }

  return [viewport.longitude, viewport.latitude];
}

/**
 * @param {Viewport} viewport 
 * @returns {number | null}
 */
export function getViewportGlobeRadius(viewport) {
  if (!isViewportGlobe(viewport)) {
    return null;
  }

  const viewportGlobeCenter = /** @type {GeoJSON.Position} */ (getViewportGlobeCenter(viewport));
  const viewportGlobeRadius = Math.max(
    distance(viewportGlobeCenter, viewport.unproject([viewport.width / 2, 0])),
    distance(viewportGlobeCenter, viewport.unproject([0, viewport.height / 2])),
    ...(viewport.width > viewport.height ? [
      distance(viewportGlobeCenter, viewport.unproject([viewport.width / 2 - viewport.height / 4 * 1, viewport.height / 2])),
      distance(viewportGlobeCenter, viewport.unproject([viewport.width / 2 - viewport.height / 2 * 1, viewport.height / 2])),
      distance(viewportGlobeCenter, viewport.unproject([viewport.width / 2 - viewport.height / 4 * 3, viewport.height / 2])),
      distance(viewportGlobeCenter, viewport.unproject([viewport.width / 2 - viewport.height, viewport.height / 2])),
    ] : [
      distance(viewportGlobeCenter, viewport.unproject([viewport.width / 2, viewport.height / 2 - viewport.width / 4 * 1])),
      distance(viewportGlobeCenter, viewport.unproject([viewport.width / 2, viewport.height / 2 - viewport.width / 2 * 1])),
      distance(viewportGlobeCenter, viewport.unproject([viewport.width / 2, viewport.height / 2 - viewport.width / 4 * 3])),
      distance(viewportGlobeCenter, viewport.unproject([viewport.width / 2, viewport.height / 2 - viewport.width])),
    ])
  );
  return viewportGlobeRadius;
}

/**
 * @param {Viewport} viewport 
 * @returns {GeoJSON.BBox | null}
 */
export function getViewportBounds(viewport) {
  return !isViewportGlobe(viewport) ? wrapBounds(viewport.getBounds()) : null;
}
/*
 * Copyright (c) 2021-2023 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
/**
 * see https://stackoverflow.com/a/4467559/1823988
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
function mod(x, y) {
  return ((x % y) + y) % y;
}

/**
 * @param {number} lng
 * @param {number} [minLng]
 * @returns {number}
 */
export function wrapLongitude(lng, minLng = undefined) {
  let wrappedLng = mod(lng + 180, 360) - 180;
  if (typeof minLng === 'number' && wrappedLng < minLng) {
    wrappedLng += 360;
  }
  return wrappedLng;
}

/**
 * @param {GeoJSON.BBox} bounds
 * @returns {GeoJSON.BBox}
 */
export function wrapBounds(bounds) {
  // wrap longitude
  const minLng = bounds[2] - bounds[0] < 360 ? wrapLongitude(bounds[0]) : -180;
  const maxLng = bounds[2] - bounds[0] < 360 ? wrapLongitude(bounds[2], minLng) : 180;
  // clip latitude
  const minLat = Math.max(bounds[1], -85.051129);
  const maxLat = Math.min(bounds[3], 85.051129);

  const mercatorBounds = /** @type {GeoJSON.BBox} */ ([minLng, minLat, maxLng, maxLat]);
  return mercatorBounds;
}
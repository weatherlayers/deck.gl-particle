import pkg from './package.json';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';
import visualizer from 'rollup-plugin-visualizer';

function bundle(filename, options = {}) {
  return {
    input: 'src/index.js',
    output: {
      file: filename,
      format: 'umd',
      name: 'DeckGlParticle',
      sourcemap: true,
      globals: {
        '@deck.gl/core': 'deck',
        '@deck.gl/layers': 'deck',
        '@luma.gl/core': 'luma',
        '@luma.gl/constants': 'luma.GL',
      },
      banner: `/*!
* Copyright (c) 2021 WeatherLayers.com
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/`,
    },
    external: [
      ...Object.keys(pkg.peerDependencies),
    ],
    plugins: [
      resolve(),
      commonjs(),
      babel({ babelHelpers: 'runtime' }),
      options.minimize ? terser() : false,
      options.stats ? visualizer({
        filename: filename + '.stats.html',
      }) : false,
    ],
  };
}

export default [
  bundle(pkg.browser.replace('.min', ''), { stats: true }),
  bundle(pkg.browser, { minimize: true }),
];

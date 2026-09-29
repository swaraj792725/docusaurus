/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {describe, expect, it} from 'vitest';
import {isAssetUrl} from '../serve';

describe('serve isAssetUrl', () => {
  it('identifies standard short asset extensions', () => {
    expect(isAssetUrl('/mysite/logo.png')).toBe(true);
    expect(isAssetUrl('/mysite/styles.css')).toBe(true);
    expect(isAssetUrl('/mysite/app.js')).toBe(true);
  });

  it('identifies long asset extensions (>4 chars)', () => {
    expect(isAssetUrl('/mysite/custom-font.woff2')).toBe(true);
    expect(isAssetUrl('/mysite/site.webmanifest')).toBe(true);
    expect(isAssetUrl('/mysite/data.geojson')).toBe(true);
  });

  it('identifies asset URLs with query strings or hashes', () => {
    expect(isAssetUrl('/mysite/logo.png?v=1')).toBe(true);
    expect(isAssetUrl('/mysite/custom-font.woff2?v=2.0#hash')).toBe(true);
  });

  it('identifies non-asset page paths', () => {
    expect(isAssetUrl('/mysite/docs/intro')).toBe(false);
    expect(isAssetUrl('/mysite/blog/post-1')).toBe(false);
  });
});

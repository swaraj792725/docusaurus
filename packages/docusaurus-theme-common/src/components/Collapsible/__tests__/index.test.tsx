/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// @vitest-environment jsdom
import {describe, expect, it, vi} from 'vitest';
import React from 'react';
import {render, act} from '@testing-library/react';
import {Collapsible} from '../index';

describe('Collapsible', () => {
  vi.stubGlobal('matchMedia', () => {
    return {matches: true};
  });

  it('renders collapsed state with display none', () => {
    const {container} = render(
      <Collapsible lazy={false} collapsed>
        <div>Content</div>
      </Collapsible>,
    );
    const element = container.firstChild as HTMLElement;
    expect(element.style.display).toBe('none');
    expect(element.style.height).toBe('0px');
  });

  it('renders expanded state with height auto and overflow visible', () => {
    const {container} = render(
      <Collapsible lazy={false} collapsed={false}>
        <div>Content</div>
      </Collapsible>,
    );
    const element = container.firstChild as HTMLElement;
    expect(element.style.display).toBe('block');
    expect(element.style.height).toBe('auto');
    expect(element.style.overflow).toBe('visible');
  });

  it('finalizes state when transition duration is 0ms', async () => {
    const onEnd = vi.fn();
    const {container, rerender} = render(
      <Collapsible
        lazy={false}
        collapsed
        animation={{duration: 0}}
        onCollapseTransitionEnd={onEnd}>
        <div>Content</div>
      </Collapsible>,
    );

    const element = container.firstChild as HTMLElement;
    expect(element.style.display).toBe('none');

    act(() => {
      rerender(
        <Collapsible
          lazy={false}
          collapsed={false}
          animation={{duration: 0}}
          onCollapseTransitionEnd={onEnd}>
          <div>Content</div>
        </Collapsible>,
      );
    });

    // Wait for rAF tick
    await act(async () => {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });

    expect(element.style.display).toBe('block');
    expect(element.style.height).toBe('auto');
    expect(element.style.overflow).toBe('visible');
    expect(onEnd).toHaveBeenCalledWith(false);
  });
});

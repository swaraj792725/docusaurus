/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {describe, expect, it, beforeEach, afterEach, vi} from 'vitest';
import path from 'path';
import fs from 'fs-extra';
import logger from '@docusaurus/logger';
import {lockStartProcess} from '../lock';

describe('lockStartProcess', () => {
  const tempDir = path.join(__dirname, '__temp_lock_test__');
  const lockFile = path.join(
    tempDir,
    'node_modules',
    '.cache',
    '.docusaurus',
    'dev-server.lock',
  );

  beforeEach(async () => {
    delete process.env.DOCUSAURUS_NO_PERSISTENT_CACHE;
    await fs.remove(tempDir);
  });

  afterEach(async () => {
    delete process.env.DOCUSAURUS_NO_PERSISTENT_CACHE;
    await fs.remove(tempDir);
    vi.restoreAllMocks();
  });

  it('creates lock file when no lock exists', async () => {
    await lockStartProcess(tempDir);

    await expect(fs.pathExists(lockFile)).resolves.toBe(true);
    const content = JSON.parse(await fs.readFile(lockFile, 'utf8')) as {
      pid: number;
    };
    expect(content.pid).toBe(process.pid);
    expect(process.env.DOCUSAURUS_NO_PERSISTENT_CACHE).toBeUndefined();
  });

  it('disables persistent cache when another server holds lock', async () => {
    await fs.mkdirp(path.dirname(lockFile));
    // Simulate another running dev server (using current PID for live process)
    const fakeOtherPid = process.pid;
    await fs.writeFile(
      lockFile,
      JSON.stringify({pid: fakeOtherPid, time: Date.now()}),
    );

    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});

    // Spy on process.pid to simulate a different process trying to start
    const originalPid = process.pid;
    Object.defineProperty(process, 'pid', {
      value: originalPid + 1000,
      configurable: true,
    });

    try {
      await lockStartProcess(tempDir);

      expect(process.env.DOCUSAURUS_NO_PERSISTENT_CACHE).toBe('true');
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Disabling persistent cache for this session'),
      );
    } finally {
      Object.defineProperty(process, 'pid', {
        value: originalPid,
        configurable: true,
      });
    }
  });

  it('overwrites stale lock file when previous process is dead', async () => {
    await fs.mkdirp(path.dirname(lockFile));
    // Dead PID unlikely to exist
    const deadPid = 999999;
    await fs.writeFile(
      lockFile,
      JSON.stringify({pid: deadPid, time: Date.now()}),
    );

    await lockStartProcess(tempDir);

    await expect(fs.pathExists(lockFile)).resolves.toBe(true);
    const content = JSON.parse(await fs.readFile(lockFile, 'utf8')) as {
      pid: number;
    };
    expect(content.pid).toBe(process.pid);
    expect(process.env.DOCUSAURUS_NO_PERSISTENT_CACHE).toBeUndefined();
  });
});

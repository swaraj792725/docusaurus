/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import path from 'path';
import fs from 'fs-extra';
import logger from '@docusaurus/logger';

function isProcessAlive(pid: number): boolean {
  try {
    return process.kill(pid, 0);
  } catch (err: unknown) {
    return (err as {code?: string})?.code === 'EPERM';
  }
}

/**
 * Attempts to acquire a dev server lock for the site. If another dev server
 * process is currently running, disables persistent cache for the current
 * process to prevent cache corruption (Issue #12517).
 */
export async function lockStartProcess(siteDirParam: string): Promise<void> {
  const siteDir = path.resolve(siteDirParam);
  const lockDir = path.join(siteDir, 'node_modules', '.cache', '.docusaurus');
  const lockFile = path.join(lockDir, 'dev-server.lock');

  try {
    await fs.mkdirp(lockDir);
  } catch {
    // Ignore directory creation error
  }

  if (await fs.pathExists(lockFile)) {
    try {
      const content = await fs.readFile(lockFile, 'utf8');
      const data = JSON.parse(content) as {pid?: number};
      if (typeof data.pid === 'number' && data.pid !== process.pid) {
        if (isProcessAlive(data.pid)) {
          logger.warn(
            `Another Docusaurus dev server (PID ${data.pid}) is already running. Disabling persistent cache for this session to prevent cache corruption.`,
          );
          process.env.DOCUSAURUS_NO_PERSISTENT_CACHE = 'true';
          return;
        }
      }
    } catch {
      // Ignore reading / parsing errors on corrupted lock files
    }
  }

  try {
    await fs.writeFile(
      lockFile,
      JSON.stringify({pid: process.pid, time: Date.now()}),
    );

    const cleanup = () => {
      /* eslint-disable no-restricted-properties */
      try {
        if (fs.existsSync(lockFile)) {
          const content = fs.readFileSync(lockFile, 'utf8');
          const data = JSON.parse(content) as {pid?: number};
          if (data.pid === process.pid) {
            fs.unlinkSync(lockFile);
          }
        }
      } catch {
        // Ignore error on cleanup
      }
      /* eslint-enable no-restricted-properties */
    };

    process.once('exit', cleanup);
  } catch {
    // Ignore error if lock file cannot be written
  }
}

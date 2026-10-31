#!/usr/bin/env node
import { parseArgs, runCli } from './cli.js';

async function main(): Promise<void> {
  try {
    const options = parseArgs(process.argv);
    process.exitCode = await runCli(options);
  } catch (error) {
    console.error(
      `BanglaA11y audit failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 2;
  }
}

void main();

import { spawn } from 'node:child_process';
import path from 'node:path';
import type { ToolContext } from '../types';

function resolveSwiftScript(context: ToolContext): string {
  const sourceRoot = context.sourceRoot || path.resolve(__dirname, '..', '..');
  return path.join(
    sourceRoot,
    'weekly-financial-event-report',
    'scripts',
    'extract_pdf_text_pdfkit.swift',
  );
}

export async function extractPdfTextHandler(args: string[], context: ToolContext): Promise<number> {
  const stdout = context.stdout || process.stdout;
  const stderr = context.stderr || process.stderr;

  // Find positional pdfPath arg
  let pdfPath = '';
  let showHelp = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      showHelp = true;
      break;
    }
    if (!arg.startsWith('-')) {
      pdfPath = arg;
    }
  }

  if (showHelp || !pdfPath) {
    stdout.write(`Usage: apltk extract-pdf-text-pdfkit <path>

Extract per-page text from a PDF through macOS PDFKit.

Arguments:
  path  Absolute path to the source PDF file

Output format:
  PDF_PATH=<path>
  PAGE_COUNT=<N>
  === PAGE 1 ===
  <page text>
  === PAGE 2 ===
  ...
`);
    return pdfPath ? 1 : 0;
  }

  const resolvedPath = path.resolve(pdfPath);
  const swiftScript = resolveSwiftScript(context);

  return new Promise((resolve) => {
    const child = spawn('swift', [swiftScript, resolvedPath], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: context.env || process.env,
    });

    let stdoutText = '';
    let stderrText = '';

    child.stdout.on('data', (chunk: Buffer) => {
      stdoutText += String(chunk);
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderrText += String(chunk);
    });

    child.on('error', (err: Error) => {
      stderr.write(`Failed to start swift: ${err.message}\n`);
      resolve(1);
    });

    child.on('close', (code: number | null) => {
      if (stdoutText) {
        stdout.write(stdoutText);
      }
      if (stderrText) {
        stderr.write(stderrText);
      }
      resolve(typeof code === 'number' ? code : 1);
    });
  });
}

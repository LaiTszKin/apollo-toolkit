import { getCodeGraphModule, closeIndex } from './cg-instance.js';
import { formatOutput, formatSummary } from './formatter.js';

export interface IndexOptions {
  json?: boolean;
}

export async function handleIndex(projectRoot: string, options: IndexOptions = {}): Promise<number> {
  const { CodeGraph } = getCodeGraphModule();
  if (!CodeGraph.isInitialized(projectRoot)) {
    process.stderr.write('CodeGraph is not initialized. Run `apltk codegraph init` first.\n');
    return 1;
  }

  const progress: Array<{ phase: string; current: number; total: number; currentFile?: string }> = [];
  const cg = await CodeGraph.open(projectRoot, { sync: false, readOnly: false });
  const result = await cg.indexAll({
    onProgress: (p: any) => {
      progress.push({
        phase: p.phase,
        current: p.current,
        total: p.total,
        currentFile: p.currentFile,
      });
      if (process.stdout.isTTY) {
        process.stdout.write(`\r  Indexing: ${p.phase} ${p.current}/${p.total}${p.currentFile ? `  ${p.currentFile}` : ''}`);
      }
    },
  });
  const stats = cg.getStats();
  closeIndex(cg);

  if (process.stdout.isTTY) process.stdout.write('\n');

  const output = {
    projectRoot,
    result,
    stats: {
      fileCount: stats.fileCount,
      nodeCount: stats.nodeCount,
      edgeCount: stats.edgeCount,
    },
    progress: progress.length > 0 ? progress : undefined,
  };

  if (options.json) {
    process.stdout.write(formatOutput(output, { json: true }) + '\n');
    return 0;
  }

  process.stdout.write(formatSummary([
    ['Project:', projectRoot],
    ['Files:', stats.fileCount],
    ['Nodes:', stats.nodeCount],
    ['Edges:', stats.edgeCount],
  ]) + '\n');
  return 0;
}


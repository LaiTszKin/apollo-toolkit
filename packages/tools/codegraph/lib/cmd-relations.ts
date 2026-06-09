import { getCodeGraphModule, closeIndex } from './cg-instance.js';
import { formatOutput } from './formatter.js';
import { serializeNode, serializeEdge } from './graph-output.js';

export interface RelationsOptions {
  limit?: number;
  json?: boolean;
}

export async function handleRelations(
  projectRoot: string,
  direction: 'callers' | 'callees',
  symbol: string,
  options: RelationsOptions = {},
): Promise<number> {
  const { CodeGraph } = getCodeGraphModule();
  if (!CodeGraph.isInitialized(projectRoot)) {
    process.stderr.write('CodeGraph is not initialized. Run `apltk codegraph init` first.\n');
    return 1;
  }

  const cg = await CodeGraph.open(projectRoot, { sync: false, readOnly: true });
  const matches = cg.searchNodes(symbol, { limit: 5 }).map((result: any) => result.node);
  const reports = matches.map((node: any) => {
    const relationRows = direction === 'callers' ? cg.getCallers(node.id) : cg.getCallees(node.id);
    return {
      symbol: serializeNode(node),
      [direction]: relationRows.slice(0, options.limit ?? 20).map((row: any) => ({
        node: serializeNode(row.node),
        edge: serializeEdge(row.edge),
      })),
    };
  });
  closeIndex(cg);

  if (options.json) {
    process.stdout.write(formatOutput(reports, { json: true }) + '\n');
    return 0;
  }

  if (reports.length === 0) {
    process.stdout.write('No matching symbols found.\n');
    return 0;
  }

  for (const report of reports) {
    const source = report.symbol as any;
    const rows = (report as any)[direction] as any[];
    process.stdout.write(`\n${source.name} [${source.kind}] ${source.filePath}:${source.startLine}\n`);
    if (rows.length === 0) {
      process.stdout.write(`  No ${direction} found.\n`);
      continue;
    }
    for (const row of rows) {
      process.stdout.write(`  ${row.node.name} [${row.node.kind}] ${row.node.filePath}:${row.node.startLine}\n`);
    }
  }
  return 0;
}


import { getCodeGraphModule, closeIndex } from './cg-instance.js';
import { formatOutput } from './formatter.js';
import { serializeNode } from './graph-output.js';

export interface NodeOptions {
  json?: boolean;
}

export async function handleNode(projectRoot: string, symbolOrId: string, options: NodeOptions = {}): Promise<number> {
  const { CodeGraph } = getCodeGraphModule();
  if (!CodeGraph.isInitialized(projectRoot)) {
    process.stderr.write('CodeGraph is not initialized. Run `apltk codegraph init` first.\n');
    return 1;
  }

  const cg = await CodeGraph.open(projectRoot, { sync: false, readOnly: true });
  let nodes = [];
  const direct = cg.getNode(symbolOrId);
  if (direct) {
    nodes = [direct];
  } else {
    nodes = cg.getNodesByName(symbolOrId);
    if (nodes.length === 0) {
      nodes = cg.searchNodes(symbolOrId, { limit: 5 }).map((result: any) => result.node);
    }
  }

  const reports = [];
  for (const node of nodes) {
    reports.push({
      node: serializeNode(node),
      code: await cg.getCode(node.id),
    });
  }
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
    const node = report.node as any;
    process.stdout.write(`\n${node.name} [${node.kind}] ${node.filePath}:${node.startLine}-${node.endLine}\n`);
    if (node.signature) process.stdout.write(`Signature: ${node.signature}\n`);
    if (report.code) process.stdout.write(`\n${report.code}\n`);
  }
  return 0;
}


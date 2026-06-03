declare module '@colbymchenry/codegraph' {
  export interface NodeResult {
    node: {
      id: string;
      name: string;
      kind: string;
      filePath: string;
      startLine: number;
      endLine: number;
      qualifiedName: string;
      signature?: string;
      isExported?: boolean;
    };
    score: number;
  }

  export interface CalleeResult {
    node: {
      id: string;
      name: string;
    };
  }

  export interface FileEntry {
    path: string;
  }

  export interface SearchOptions {
    limit?: number;
  }

  export interface CodeGraphStats {
    fileCount: number;
    nodeCount: number;
    edgeCount: number;
    dbSizeBytes: number;
    lastUpdated: string;
    nodesByKind: Record<string, number>;
    edgesByKind: Record<string, number>;
    filesByLanguage: Record<string, number>;
  }

  export class CodeGraph {
    static isInitialized(projectRoot: string): boolean;
    static open(projectRoot: string): Promise<CodeGraph>;
    close(): void;
    getStats(): CodeGraphStats;
    searchNodes(query: string, options?: SearchOptions): NodeResult[];
    getNodesByKind(kind: string): NodeResult['node'][];
    getCallers(nodeId: string): CalleeResult[];
    getCallees(nodeId: string, depth?: number): CalleeResult[];
    getFiles(): FileEntry[];
  }

  export function findNearestCodeGraphRoot(startDir: string): string | null;
}

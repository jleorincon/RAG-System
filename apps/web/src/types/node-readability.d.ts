declare module 'node-readability' {
  export class Readability {
    constructor(document: Document, options?: {
      debug?: boolean;
      maxElemsToParse?: number;
      nbTopCandidates?: number;
      charThreshold?: number;
      classesToPreserve?: string[];
    });
    parse(): { textContent?: string; title?: string; content?: string } | null;
  }
} 
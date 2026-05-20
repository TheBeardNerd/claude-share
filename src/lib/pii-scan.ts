import type { PiiFlag, PiiScanResult } from './types';

interface Pattern {
  name: string;
  regex: RegExp;
}

const PATTERNS: Pattern[] = [
  { name: 'email',        regex: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g },
  { name: 'phone',        regex: /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/g },
  { name: 'openai-key',   regex: /sk-[A-Za-z0-9]{20,}/g },
  { name: 'anthropic-key',regex: /sk-ant-[A-Za-z0-9\-]{20,}/g },
  { name: 'bearer-token', regex: /Bearer\s+[A-Za-z0-9\-._~+/]+=*/g },
  { name: 'aws-key',      regex: /AKIA[0-9A-Z]{16}/g },
];

export function scanForPii(content: string): PiiScanResult {
  const flags: PiiFlag[] = [];

  for (const { name, regex } of PATTERNS) {
    const re = new RegExp(regex.source, 'g');
    let match: RegExpExecArray | null;
    while ((match = re.exec(content)) !== null) {
      flags.push({ pattern: name, match: match[0], index: match.index });
    }
  }

  return { flagged: flags.length > 0, flags };
}

#!/usr/bin/env node
/**
 * Prints contact-form leads captured by the local inbox fallback.
 * Usage: npm run leads
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const directory = process.env.CONTACT_STORE_DIR || path.join(process.cwd(), '.data');
const file = path.join(directory, 'leads.jsonl');

let raw = '';
try {
  raw = await readFile(file, 'utf8');
} catch {
  console.log(`No leads yet (${file} does not exist).`);
  process.exit(0);
}

const rows = raw
  .split('\n')
  .filter(Boolean)
  .map((line) => {
    try {
      return JSON.parse(line);
    } catch {
      return null;
    }
  })
  .filter(Boolean);

if (rows.length === 0) {
  console.log(`Inbox is empty (${file}).`);
  process.exit(0);
}

console.log(`${rows.length} lead${rows.length === 1 ? '' : 's'} in ${file}\n`);
rows.forEach((lead, index) => {
  console.log(`#${index + 1}  ${lead.submittedAt}`);
  console.log(`    ${lead.name} <${lead.email}>${lead.company ? ` · ${lead.company}` : ''}`);
  console.log(
    `    ${String(lead.message).replace(/\s+/g, ' ').slice(0, 400)}` +
      (String(lead.message).length > 400 ? '…' : '')
  );
  console.log('');
});

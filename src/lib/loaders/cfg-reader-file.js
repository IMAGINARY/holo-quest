import { promises as fs } from 'fs';

export default function CfgReaderFile(filename) {
  return fs.readFile(filename);
}

import { promises as fs } from 'fs';

before(() => fs.mkdir('tmp', { recursive: true }).catch(() => undefined));
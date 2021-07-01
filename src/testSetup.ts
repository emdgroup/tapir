import { promises as fs } from 'fs';

process.env.NODE_TESTING = "1";

before(() => fs.mkdir('tmp', { recursive: true }).catch(() => undefined));
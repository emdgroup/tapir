import { promises as fs } from 'fs';

before(() => fs.mkdir('tmp').catch(() => undefined));
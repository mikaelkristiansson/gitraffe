import type { ChangedFile } from './models/status';

export type SetSelected = (file: ChangedFile | undefined) => void;

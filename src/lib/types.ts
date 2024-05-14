import type { Writable } from 'svelte/store';
import type { IStatusResult } from './git/status';
import type { Repository } from './models/repository';
import type { ChangedFile } from './models/status';

export type SetSelected = (file: ChangedFile | undefined) => void;

export type CommitDialogProps = {
	repositoryId: Repository['id'];
	branch: IStatusResult;
	selectedFiles: Writable<ChangedFile[]>;
	expanded: Writable<boolean>;
	setSelected: SetSelected;
};

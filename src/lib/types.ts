// import { hashCode } from '$lib/utils/string';

// export interface DefaultBranch {
// 	branchName: string;
// 	remoteUrl: string;
// 	behind: number;
// 	ahead: number;
// 	lastFetched: string;
// }

// export interface Branch {
// 	current: boolean;
// 	name: string;
// 	sha: string;
// 	commit: string;
// 	ahead: number;
// 	behind: number;
// 	//new
// 	files?: LocalFile[];
// 	conflicted?: boolean;
// 	commits?: Commit[];
// }

// export interface Author {
// 	email?: string;
// 	name?: string;
// 	gravatarUrl?: URL;
// 	isBot?: boolean;
// }

// // export class Commit {
// // 	id!: string;
// // 	author!: Author;
// // 	description!: string;
// // 	// @Transform((obj) => new Date(obj.value))
// // 	createdAt!: Date;
// // 	isRemote!: boolean;
// // 	isIntegrated!: boolean;
// // 	// @Type(() => LocalFile)
// // 	files!: LocalFile[];
// // 	parentIds!: string[];
// // 	branchId!: string;

// // 	get isLocal() {
// // 		return !this.isRemote && !this.isIntegrated;
// // 	}

// // 	get status() {
// // 		if (!this.isIntegrated && !this.isRemote) {
// // 			return 'local';
// // 		} else if (!this.isIntegrated && this.isRemote) {
// // 			return 'remote';
// // 		} else if (this.isIntegrated) {
// // 			return 'integrated';
// // 		}
// // 	}

// // 	get descriptionTitle(): string | undefined {
// // 		return this.descriptionLines[0];
// // 	}

// // 	get descriptionBody(): string | undefined {
// // 		let sliceCount = 1;

// // 		// Remove a blank first line
// // 		if (this.descriptionLines[1] == '') {
// // 			sliceCount = 2;
// // 		}

// // 		return this.descriptionLines.slice(sliceCount).join('\n');
// // 	}

// // 	isParentOf(possibleChild: Commit) {
// // 		return possibleChild.parentIds.includes(this.id);
// // 	}

// // 	private get descriptionLines() {
// // 		return this.description.split('\n');
// // 	}
// // }

// export type ChangeType =
// 	/// Entry does not exist in old version
// 	| 'added'
// 	/// Entry does not exist in new version
// 	| 'deleted'
// 	/// Entry content changed between old and new
// 	| 'modified';

// export interface Hunk {
// 	id: string;
// 	diff: string;
// 	// @Transform((obj) => {
// 	// 	return new Date(obj.value);
// 	// })
// 	modifiedAt: Date;
// 	filePath: string;
// 	locked: boolean;
// 	lockedTo: string | undefined;
// 	changeType: ChangeType;
// }

// export interface LocalFile {
// 	id: string;
// 	path: string;
// 	filename: string;
// 	hunks: Hunk[];
// 	expanded?: boolean;
// 	// @Transform((obj) => new Date(obj.value))
// 	modifiedAt: Date;
// 	// This indicates if a file has merge conflict markers generated and not yet resolved.
// 	// This is true for files after a branch which does not apply cleanly (Branch.isMergeable == false) is applied.
// 	// (therefore this field is applicable only for the workspace, i.e. active == true)
// 	conflicted: boolean;
// 	content: string;
// 	binary: boolean;
// 	large: boolean;
// }

// export class RemoteHunk {
// 	diff!: string;

// 	get id(): string {
// 		return hashCode(this.diff);
// 	}

// 	get locked() {
// 		return false;
// 	}
// }

// export class RemoteFile {
// 	path!: string;
// 	// @Type(() => RemoteHunk)
// 	hunks!: RemoteHunk[];
// 	binary!: boolean;

// 	get id(): string {
// 		return this.path;
// 	}

// 	get filename(): string {
// 		return this.path.replace(/^.*[\\/]/, '');
// 	}

// 	get justpath() {
// 		return this.path.split('/').slice(0, -1).join('/');
// 	}

// 	get large() {
// 		return false;
// 	}

// 	get conflicted() {
// 		return false;
// 	}

// 	get hunkIds() {
// 		return this.hunks.map((h) => h.id);
// 	}
// }

// export type AnyFile = LocalFile | RemoteFile;

// export type CommitStatus = 'local' | 'remote' | 'integrated' | 'upstream';

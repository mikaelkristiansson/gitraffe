import type { Branch } from '$lib/types';
import { invoke } from '@tauri-apps/api/tauri';
import { getStatus, type IStatusResult } from './status';
import type { GitResponse } from './type';

export async function git(path: string, args: string[]): Promise<GitResponse> {
	return await invoke('git', { path, args });
}

export async function fetchAll(path: string): Promise<string> {
	const args = ['fetch', '--all'];
	const { stderr, stdout } = await git(path, args);
	if (stderr) {
		throw new Error(stderr);
	}
	return stdout;
}

export async function checkout(path: string, branch: string): Promise<string> {
	const args = ['checkout', branch];
	const { stderr, stdout } = await git(path, args);
	if (stderr) {
		throw new Error(stderr);
	}
	return stdout;
}

export async function pullOrigin(path: string, branchName: Branch['name']): Promise<string> {
	const args = ['pull', 'origin', branchName];
	const { stderr, stdout } = await git(path, args);
	if (stderr) {
		throw new Error(stderr);
	}
	return stdout;
}

export async function push(path: string): Promise<string> {
	return await invoke('git_push', { path });
}

export async function getBranchStatus(path: string): Promise<IStatusResult | null> {
	const args = [
		'--no-optional-locks',
		'status',
		'--untracked-files=all',
		'--branch',
		'--porcelain=2',
		'-z'
	];
	const { stdout, stderr } = await git(path, args);
	if (stderr) {
		throw new Error(stderr);
	}
	const data = await getStatus(stdout, path);
	return data;
}

export async function getCurrentBranchName(path: string): Promise<string> {
	const { stdout }: GitResponse = await invoke('git', {
		path,
		args: ['symbolic-ref', '--short', 'HEAD']
	});
	return stdout.trim();
}

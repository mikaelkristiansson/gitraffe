import type { Branch, DefaultBranch } from '$lib/types';
import { invoke } from '@tauri-apps/api/tauri';
import { getStatus, type IStatusResult } from './status';

export async function getDefaultBranch(path: string): Promise<DefaultBranch> {
	return await invoke('git_default_branch', { path });
}

export async function getBranches(path: string): Promise<string[]> {
	// await fetch(path);
	return await invoke('git_branches', { path });
}

export async function fetch(path: string): Promise<string> {
	return await invoke('git_fetch', { path });
}

export async function checkout(path: string, branch: string): Promise<void> {
	return await invoke('git_checkout', { path, branch });
}

export async function pull(path: string): Promise<string> {
	return await invoke('git_pull', { path });
}

export async function pullOrigin(path: string, branchName: Branch['name']): Promise<string> {
	return await invoke('git_pull_origin', { path, branch: branchName });
}

export async function push(path: string): Promise<string> {
	return await invoke('git_push', { path });
}

export async function getBranchStatus(path: string): Promise<IStatusResult | null> {
	const stdout: string = await invoke('git_get_changes', { path });
	const data = await getStatus(stdout, path);
	return data;
}

export async function getCurrentBranchName(path: string): Promise<string> {
	const stdout: string = await invoke('git', { path, args: ['symbolic-ref', '--short', 'HEAD'] });
	return stdout.trim();
}

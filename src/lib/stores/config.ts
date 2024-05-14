import { persisted, type Persisted } from '$lib/persisted';

export function projectLaneCollapsed(repositoryId: string): Persisted<boolean> {
	const key = 'projectLaneCollapsed_';
	return persisted(false, key + repositoryId);
}

export function persistedCommitMessage(repositoryId: string, branchId: string): Persisted<string> {
	return persisted('', 'projectCurrentCommitMessage_' + repositoryId + '_' + branchId);
}

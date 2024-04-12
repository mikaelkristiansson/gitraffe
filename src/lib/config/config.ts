import { persisted, type Persisted } from '$lib/persisted';

export function projectHttpsWarningBannerDismissed(repositoryId: string): Persisted<boolean> {
	const key = 'projectHttpsWarningBannerDismissed_';
	return persisted(false, key + repositoryId);
}

export function projectMergeUpstreamWarningDismissed(repositoryId: string): Persisted<boolean> {
	const key = 'projectMergeUpstreamWarningDismissed_';
	return persisted(false, key + repositoryId);
}

export function projectCommitGenerationExtraConcise(repositoryId: string): Persisted<boolean> {
	const key = 'projectCommitGenerationExtraConcise_';
	return persisted(false, key + repositoryId);
}

export function projectCommitGenerationUseEmojis(repositoryId: string): Persisted<boolean> {
	const key = 'projectCommitGenerationUseEmojis_';
	return persisted(false, key + repositoryId);
}

export enum ListPRsFilter {
	All = 'ALL',
	ExcludeBots = 'EXCLUDE_BOTS',
	OnlyYours = 'ONLY_YOURS'
}

export function projectPullRequestListingFilter(repositoryId: string): Persisted<string> {
	const key = 'projectPullRequestListingFilter_';
	return persisted(ListPRsFilter.All, key + repositoryId);
}

export function projectAiGenEnabled(repositoryId: string): Persisted<boolean> {
	const key = 'projectAiGenEnabled_';
	return persisted(false, key + repositoryId);
}

export function projectAiGenAutoBranchNamingEnabled(repositoryId: string): Persisted<boolean> {
	const key = 'projectAiGenAutoBranchNamingEnabled_';
	return persisted(false, key + repositoryId);
}

export function projectRunCommitHooks(repositoryId: string): Persisted<boolean> {
	const key = 'projectRunCommitHooks_';
	return persisted(false, key + repositoryId);
}

export function projectLaneCollapsed(repositoryId: string): Persisted<boolean> {
	const key = 'projectLaneCollapsed_';
	return persisted(false, key + repositoryId);
}

export function persistedCommitMessage(repositoryId: string, branchId: string): Persisted<string> {
	return persisted('', 'projectCurrentCommitMessage_' + repositoryId + '_' + branchId);
}

import { getRemoteURL } from '$lib/git/remote';
import type { Repository } from '$lib/models/repository';

export async function setRepositoryURL(repository: Repository) {
	return getRemoteURL(repository, 'origin').then((url) => {
		if (url) {
			const regex = /(git@[\w.]+):(.*?)(\.git)(\/?|#[-\d\w._]+?)$/;
			const match = String(url.trim()).match(regex)?.slice(1);
			const [gitURL, repo] = match as string[];
			const extractUrl = gitURL.replace('git@', 'https://');
			const link = `${extractUrl}/${repo}`;
			return { link, repo, gitURL };
		}
		return null;
	});
}

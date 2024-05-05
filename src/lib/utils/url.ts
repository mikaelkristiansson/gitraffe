import type { Repository } from '$lib/models/repository';
import { open } from '@tauri-apps/api/shell';
import { setRepositoryURL } from './remote';
import { toast } from 'svelte-sonner';

export function openExternalUrl(href: string) {
	try {
		open(href);
	} catch (e) {
		if (typeof e == 'string' || e instanceof String) {
			const message = `
                Failed to open link in external browser:

                ${href}
            `;
			toast.error(message);
		}
		throw e;
	}
}

function setURLEnding(url: string) {
	switch (url) {
		case 'github':
			return 'pull/new/';
		case 'gitlab':
			return 'merge_requests/new?merge_request[source_branch]=';
		default:
			return '';
	}
}

export const createRequestUrl = async (repository: Repository, currentBranchName: string) => {
	const baseUrl = await setRepositoryURL(repository);
	const url = baseUrl
		? `${baseUrl.link}/${setURLEnding(baseUrl.gitURL.replace('git@', '').replace(/\..*/, ''))}${currentBranchName}`
		: null;
	if (url) {
		await open(url);
	} else {
		toast.error('Failed to create pull request');
	}
};

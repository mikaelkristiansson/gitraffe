import type { Repository } from '$lib/models/repository';
import { showToast } from '$lib/notifications/toasts';
import { open } from '@tauri-apps/api/shell';
import { setRepositoryURL } from './remote';
import { error } from './toasts';

export function openExternalUrl(href: string) {
	try {
		open(href);
	} catch (e) {
		if (typeof e == 'string' || e instanceof String) {
			const message = `
                Failed to open link in external browser:

                ${href}
            `;
			showToast({ title: 'External URL error', message, style: 'error' });
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
		error('Failed to create pull request');
	}
};

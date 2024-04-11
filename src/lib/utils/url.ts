import { showToast } from '$lib/notifications/toasts';
import { open } from '@tauri-apps/api/shell';

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

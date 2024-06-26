export async function on(combo: string, callback: (event: KeyboardEvent) => void) {
	const comboContainsControlKeys =
		combo.includes('Meta') || combo.includes('Alt') || combo.includes('Ctrl');

	//@ts-expect-error this will soon be fixed https://github.com/jamiebuilds/tinykeys/pull/192
	return await import('tinykeys').then(({ tinykeys }) =>
		tinykeys(window, {
			[combo]: (event: KeyboardEvent) => {
				const target = event.target as HTMLElement;
				const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
				if (isInput && !comboContainsControlKeys) return;

				event.preventDefault();
				event.stopPropagation();

				callback(event);
			}
		})
	);
}

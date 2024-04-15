export function hasUpdates(prev: object | undefined | null, current: object | null) {
	if (prev === null || current === null) {
		return true;
	}
	return JSON.stringify(prev) === JSON.stringify(current);
}

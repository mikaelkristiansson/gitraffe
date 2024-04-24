export function hasUpdates(prev: object | undefined | null, current: object | null) {
	if (prev === null || current === null) {
		return true;
	}
	return JSON.stringify(prev) === JSON.stringify(current);
}

/** Create a copy of an object by merging it with a subset of its properties. */
export function mergeObject<T extends {}, K extends keyof T>(
	obj: T | null | undefined,
	subset: Pick<T, K>
): T {
	const copy = Object.assign({}, obj);
	for (const k in subset) {
		copy[k] = subset[k];
	}
	return copy;
}

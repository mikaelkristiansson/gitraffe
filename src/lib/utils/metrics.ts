import { DiffLineType, type ITextDiff } from '$lib/models/diff';

export function computeAddedRemovedByDiff(diff: ITextDiff | null) {
	if (!diff) return { added: 0, removed: 0 };
	return diff.hunks.reduce(
		(acc, hunk) => ({
			added: acc.added + hunk.lines.filter((l) => l.type === DiffLineType.Add).length,
			removed: acc.removed + hunk.lines.filter((l) => l.type === DiffLineType.Delete).length
		}),
		{ added: 0, removed: 0 }
	);
}

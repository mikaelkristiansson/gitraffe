import { Commit } from '$lib/models/commit';
import { CommitIdentity } from '$lib/models/commit-identity';
import type { Repository } from '$lib/models/repository';
import { git } from './cli';
import { createLogParser } from './git-delimiter-parser';
import { parseRawUnfoldedTrailers } from './interpret-trailers';

/**
 * Get the repository's commits using `revisionRange` and limited to `limit`
 */
export async function getCommits(
	repository: Repository,
	revisionRange?: string,
	limit?: number,
	skip?: number,
	additionalArgs: ReadonlyArray<string> = []
): Promise<ReadonlyArray<Commit>> {
	const { formatArgs, parse } = createLogParser({
		sha: '%H', // SHA
		shortSha: '%h', // short SHA
		summary: '%s', // summary
		body: '%b', // body
		// author identity string, matching format of GIT_AUTHOR_IDENT.
		//   author name <author email> <author date>
		// author date format dependent on --date arg, should be raw
		author: '%an <%ae> %ad',
		committer: '%cn <%ce> %cd',
		parents: '%P', // parent SHAs,
		trailers: '%(trailers:unfold,only)',
		refs: '%D'
	});

	const args = ['log'];

	if (revisionRange !== undefined) {
		args.push(revisionRange);
	}

	args.push('--date=raw');

	if (limit !== undefined) {
		args.push(`--max-count=${limit}`);
	}

	if (skip !== undefined) {
		args.push(`--skip=${skip}`);
	}

	args.push(...formatArgs, '--no-show-signature', '--no-color', ...additionalArgs, '--');
	const result = await git(repository.path, args);

	// {
	//     successExitCodes: new Set([0, 128]),
	//   }

	// if the repository has an unborn HEAD, return an empty history of commits
	// if (result.exitCode === 128) {
	//   return new Array<Commit>()
	// }

	const parsed = parse(result.stdout);

	return parsed.map((commit) => {
		// Ref is of the format: (HEAD -> master, tag: some-tag-name, tag: some-other-tag,with-a-comma, origin/master, origin/HEAD)
		// Refs are comma separated, but some like tags can also contain commas in the name, so we split on the pattern ", " and then
		// check each ref for the tag prefix. We used to use the regex /tag: ([^\s,]+)/g)`, but will clip a tag with a comma short.
		const tags = commit.refs
			.split(', ')
			.flatMap((ref) => (ref.startsWith('tag: ') ? ref.substring(5) : []));

		return new Commit(
			commit.sha,
			commit.shortSha,
			commit.summary,
			commit.body,
			CommitIdentity.parseIdentity(commit.author),
			CommitIdentity.parseIdentity(commit.committer),
			commit.parents.length > 0 ? commit.parents.split(' ') : [],
			// We know for sure that the trailer separator will be ':' since we got
			// them from %(trailers:unfold) above, see `git help log`:
			//
			//   "key_value_separator=<SEP>: specify a separator inserted between
			//    trailer lines. When this option is not given each trailer key-value
			//    pair is separated by ": ". Otherwise it shares the same semantics as
			//    separator=<SEP> above."
			parseRawUnfoldedTrailers(commit.trailers, ':'),
			tags
		);
	});
}

/** Get the commit for the given ref. */
export async function getCommit(repository: Repository, ref: string): Promise<Commit | null> {
	const commits = await getCommits(repository, ref, 1);
	if (commits.length < 1) {
		return null;
	}

	return commits[0];
}

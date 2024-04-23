import type { IGitAccount } from '$lib/models/git-account';
import { IGitError } from '$lib/models/git-errors';

/** Get the environment for authenticating remote operations. */
export function envForAuthentication(auth: IGitAccount | null): object {
	const env = {
		// supported since Git 2.3, this is used to ensure we never interactively prompt
		// for credentials - even as a fallback
		GIT_TERMINAL_PROMPT: '0',
		GIT_TRACE: localStorage.getItem('git-trace') || '0'
	};

	if (!auth) {
		return env;
	}

	return {
		...env,
		GITFOX_USERNAME: auth.login,
		GITFOX_ENDPOINT: auth.endpoint
	};
}

/** The set of errors which fit under the "authentication failed" umbrella. */
export const AuthenticationErrors: ReadonlySet<IGitError> = new Set([
	IGitError.HTTPSAuthenticationFailed,
	IGitError.SSHAuthenticationFailed,
	IGitError.HTTPSRepositoryNotFound,
	IGitError.SSHRepositoryNotFound
]);

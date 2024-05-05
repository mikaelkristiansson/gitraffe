import * as env from '$env/static/public';
const envEndpoint = import.meta.env.PUBLIC_GITRAFFE_GITHUB_DOTCOM_API_ENDPOINT;

/** Get github.com's API endpoint. */
export function getDotComAPIEndpoint(): string {
	// NOTE:
	// `PUBLIC_GITRAFFE_GITHUB_DOTCOM_API_ENDPOINT` only needs to be set if you are
	// developing against a local version of GitHub the Website, and need to debug
	// the server-side interaction. For all other cases you should leave this
	// unset.
	if (envEndpoint && envEndpoint.length > 0) {
		return envEndpoint;
	}

	return 'https://api.github.com';
}

export const prerender = false;
export const ssr = false;

export async function load({ params }: { params: { repositoryId: string } }) {
	const repositoryId = params.repositoryId;

	return {
		repositoryId
	};
}

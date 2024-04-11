export const prerender = false;

export async function load({ params }: { params: { repositoryId: string } }) {
	const repositoryId = params.repositoryId;

	return {
		repositoryId
	};
}

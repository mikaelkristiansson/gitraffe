import { writable } from 'svelte/store';
import { open } from '@tauri-apps/api/dialog';
import { getStorageItem, setStorageItem } from './persisted';
import { Repository } from './models/repository';
import { getRepositoryType, type RepositoryType } from './git/repository';
import { matchExistingRepository } from './utils/repository-matching';

export interface Project {
	id: string;
	title: string;
	path: string;
}

function createRepositories() {
	const storedRepositories = getStorageItem('repositories') || [];
	const { subscribe, set, update } = writable(storedRepositories as Repository[] | []);

	return {
		subscribe,
		set,
		add: (repository: Repository) => {
			update((repositories) => {
				const newRepositories = [...repositories, repository];
				setStorageItem('repositories', newRepositories);
				return newRepositories;
			});
		},
		remove: (id: string) => {
			update((repositories) => {
				const newRepositories = repositories.filter((repo) => repo.id !== id);
				setStorageItem('repositories', newRepositories);
				return newRepositories;
			});
		}
	};
}

function createActiveRepository() {
	const storedActiveRepository = getStorageItem('activeRepository') || (null as Repository | null);
	const { subscribe, set, update } = writable(storedActiveRepository as Repository | null);

	return {
		subscribe,
		set,
		removeActive: () => {
			update(() => null);
			localStorage.removeItem('activeRepository');
		},
		setActive: (id: string) => {
			let newRepository: Repository | null = null;
			const unsub = repositories.subscribe((repos) =>
				repos.find((repo) => repo.id === id && (newRepository = repo))
			);
			if (!newRepository) return;
			update(() => {
				return newRepository;
			});
			unsub();
			setStorageItem('activeRepository', newRepository);
		}
	};
}

export const repositories = createRepositories();
export const activeRepository = createActiveRepository();
export const updatingRepositories = writable(false);

async function promptForDirectory(): Promise<string | undefined> {
	const defaultPath = await (await import('@tauri-apps/api/path')).homeDir();
	return open({ directory: true, recursive: true, defaultPath }).then((selectedPath) => {
		if (selectedPath === null) return;
		if (Array.isArray(selectedPath) && selectedPath.length !== 1) return;
		return Array.isArray(selectedPath) ? selectedPath[0] : selectedPath;
	});
}

export async function addRepository() {
	const path = await promptForDirectory();
	if (!path) return;
	const id = Math.random().toString(36).substr(2, 9);
	console.log('Adding project:', path);
	const title = path.split('/').pop() || path;
	const unsub = repositories.subscribe(async (repos) => {
		const repository = await addNewRepository(path, id, repos);
		console.log('🚀 ~ addRepository ~ repository:', repository);
		//TODO: show error message if repository is null
		if (!repository) return;
		repositories.add(repository);
		// repositories.add({ id, title, path });
		activeRepository.setActive(id);
	});
	unsub();
	return { id, title, path };
}

async function addNewRepository(
	path: Readonly<string>,
	id: string,
	repositories: Repository[]
): Promise<Repository | null> {
	// const addedRepositories = new Array<Repository>()
	// let repository: Repository | null = null;
	// const lfsRepositories = new Array<Repository>()
	const invalidPaths = new Array<string>();

	// for (const path of paths) {
	const repositoryType = await getRepositoryType(path).catch((e) => {
		console.error('Could not determine repository type', e);
		return { kind: 'missing' } as RepositoryType;
	});
	console.log('🚀 ~ repositoryType:', repositoryType);
	//TODO: later on, we can add a check for unsafe repositories
	//   if (repositoryType.kind === 'unsafe') {
	//     // const repository = await this.repositoriesStore.addRepository(path, {
	//     //   missing: true,
	//     // })
	//     const newRepo;

	//     repository = newRepo;
	//   }

	if (repositoryType.kind === 'regular') {
		const validatedPath = repositoryType.topLevelWorkingDirectory;
		console.info(`adding repository at ${validatedPath} to store`);

		// const repositories = this.repositories
		// let existing = undefined;
		// repositories.subscribe(async (repos) => {
		const existing = await matchExistingRepository(repositories, validatedPath);
		console.log('🚀 ~ repositories.subscribe ~ existing:', existing);
		if (existing !== undefined) {
			return existing;
		}
		const newRepo = new Repository(validatedPath, id, null, false);
		console.log('🚀 ~ repositories.subscribe ~ newRepo:', newRepo);
		return newRepo;
		// });

		// We don't have to worry about repositoryWithRefreshedGitHubRepository
		// and isUsingLFS if the repo already exists in the app.

		// const addedRepo = await this.repositoriesStore.addRepository(
		//   validatedPath
		// )

		// initialize the remotes for this new repository to ensure it can fetch
		// it's GitHub-related details using the GitHub API (if applicable)
		// const gitStore = this.gitStoreCache.get(addedRepo)
		// await gitStore.loadRemotes()

		// const [refreshedRepo, usingLFS] = await Promise.all([
		//   this.repositoryWithRefreshedGitHubRepository(addedRepo),
		//   this.isUsingLFS(addedRepo),
		// ])
		// addedRepositories.push(refreshedRepo)

		// if (usingLFS) {
		//   lfsRepositories.push(refreshedRepo)
		// }
	} else {
		invalidPaths.push(path);
	}

	if (invalidPaths.length > 0) {
		//   this.emitError(new Error(this.getInvalidRepoPathsMessage(invalidPaths)))
	}

	// if (lfsRepositories.length > 0) {
	//   this._showPopup({
	//     type: PopupType.InitializeLFS,
	//     repositories: lfsRepositories,
	//   })
	// }

	return null;
}

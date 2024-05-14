import { writable } from 'svelte/store';
import { open } from '@tauri-apps/api/dialog';
import { getStorageItem, setStorageItem } from '../persisted';
import { Repository } from '../models/repository';
import { getRepositoryType, type RepositoryType } from '../git/repository';
import { matchExistingRepository } from '../utils/repository-matching';
import { invoke } from '@tauri-apps/api/tauri';
import { emit } from '@tauri-apps/api/event';
import { toast } from 'svelte-sonner';
// import { Map } from 'svelte/reactivity';
import { defaultBranch } from './branch';

export interface Project {
	id: string;
	title: string;
	path: string;
}

let repositories = $state<Repository[]>((getStorageItem('repositories') as Repository[]) || []);
let activeRepository = $state<Repository | null>(
	(getStorageItem('activeRepository') as Repository) || null
);

// class RepositoryStore {
// 	repositories = $state<Map<string, Repository>>(new Map());
// 	activeRepository = $state<Repository | null>(null);
// }

export function createRepositories() {
	// if (hasContext(context)) {
	// 	return getContext<typeof params>(context);
	// }
	// const storedRepositories =
	// 	(getStorageItem('repositories') as Map<string, Repository>) || new Map();
	// const storedActiveRepository = (getStorageItem('activeRepository') as Repository) || null;
	// let { repositories, activeRepository } = new RepositoryStore();
	// repositories = storedRepositories;
	// activeRepository = storedActiveRepository;
	// let repositoryStore = $state(<Repository[]>(storedRepositories))
	// const { subscribe, set, update } = writable(storedRepositories as Repository[] | []);

	const addRepository = async () => {
		const path = await promptForDirectory();
		if (!path) return;
		const id = Math.random().toString(36).substr(2, 9);
		const title = path.split('/').pop() || path;
		const repository = await addNewRepository(path, id, repositories);
		if (!repository) {
			toast.error(`${title} is not an existing git repository.`);
			return;
		}
		repositories.push(repository);

		setStorageItem('repositories', repositories);
		setActive(repository);
		return activeRepository;
	};

	const removeRepository = (id: string) => {
		repositories = repositories.filter((repo) => repo.id !== id);
		setStorageItem('repositories', repositories);
	};

	const removeActive = () => {
		activeRepository = null;
		localStorage.removeItem('activeRepository');
	};
	const setActive = async (repository: Repository) => {
		activeRepository = repository;
		setStorageItem('activeRepository', activeRepository);
		await defaultBranch.setDefault(activeRepository);
		// This is needed to expand the scope of the repository in the main process
		invoke('expand_scope', { folderPath: activeRepository.path });
	};

	const params = {
		get repositories() {
			return repositories;
		},
		get activeRepository() {
			return activeRepository;
		},
		addRepository,
		removeRepository,
		removeActive,
		setActive
	};

	return params;
}

// function createActiveRepository() {
// 	const storedActiveRepository = getStorageItem('activeRepository') || (null as Repository | null);
// 	let activeRepositoryStore = $state(<Repository>(storedActiveRepository))
// 	// const { subscribe, set } = writable(storedActiveRepository as Repository | null);

// 	const removeActive = () => {
// 		activeRepositoryStore = null;
// 		localStorage.removeItem('activeRepository');
// 	}
// 	const setActive = (id: string) => {
// 		activeRepositoryStore =

// 	return {
// 		get activeRepository() {
// 			return activeRepositoryStore;
// 		},
// 		removeActive,
// 		// removeActive: () => {
// 		// 	set(null);
// 		// 	localStorage.removeItem('activeRepository');
// 		// },
// 		// setActive: (id: string) => {
// 		// 	let newRepository: Repository = getStorageItem('activeRepository') as Repository;
// 		// 	const unsub = repositories.subscribe((repos) =>
// 		// 		repos.find((repo) => repo.id === id && (newRepository = repo))
// 		// 	);
// 		// 	if (!newRepository) return;
// 		// 	set(newRepository);
// 		// 	unsub();
// 		// 	// // This is needed to expand the scope of the repository in the main process
// 		// 	invoke('expand_scope', { folderPath: newRepository.path });
// 		// 	setStorageItem('activeRepository', newRepository);
// 		// }
// 	};
// }

// export const repositoryStore = createRepositories();
// export const activeRepository = createActiveRepository();
export const updatingRepositories = writable(false);

async function promptForDirectory(): Promise<string | undefined> {
	const defaultPath = await (await import('@tauri-apps/api/path')).homeDir();
	return open({ directory: true, recursive: true, defaultPath }).then((selectedPath) => {
		if (selectedPath === null) return;
		if (Array.isArray(selectedPath) && selectedPath.length !== 1) return;
		return Array.isArray(selectedPath) ? selectedPath[0] : selectedPath;
	});
}

// export async function addRepository(repositories, setActiveRepository: (id: string) => void) {
// 	const path = await promptForDirectory();
// 	if (!path) return;
// 	const id = Math.random().toString(36).substr(2, 9);
// 	const title = path.split('/').pop() || path;

// 	// const unsub = repositories.subscribe(async (repos) => {
// 	// 	const repository = await addNewRepository(path, id, repos);
// 	// 	//TODO: show error message if repository is null
// 	// 	if (!repository) {
// 	// 		toast.error(`${title} is not an existing git repository.`);
// 	// 		return;
// 	// 	}
// 	// 	repositories.add(repository);
// 	// 	activeRepository.setActive(id);
// 	// });
// 	// unsub();
// 	return { id, title, path };
// }

async function addNewRepository(
	path: Readonly<string>,
	id: string,
	allRepositories: Repository[]
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
	//TODO: later on, we can add a check for unsafe repositories
	//   if (repositoryType.kind === 'unsafe') {
	//     // const repository = await this.repositoriesStore.addRepository(path, {
	//     //   missing: true,
	//     // })
	//     const newRepo;

	//     repository = newRepo;
	//   }

	if (repositoryType.kind === 'missing') {
		//TODO: add a modal to ask if the user wants to create a new repository
	} else if (repositoryType.kind === 'regular') {
		const validatedPath = repositoryType.topLevelWorkingDirectory;
		console.info(`adding repository at ${validatedPath} to store`);
		const existing = await matchExistingRepository(allRepositories, validatedPath);
		if (existing !== undefined) {
			return existing;
		}
		const newRepo = new Repository(validatedPath, id, null, false);
		return newRepo;

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
		emit('error', new Error(getInvalidRepoPathsMessage(invalidPaths)));
	}

	// if (lfsRepositories.length > 0) {
	//   this._showPopup({
	//     type: PopupType.InitializeLFS,
	//     repositories: lfsRepositories,
	//   })
	// }

	return null;
}

const MaxInvalidFoldersToDisplay = 3;

function getInvalidRepoPathsMessage(invalidPaths: ReadonlyArray<string>): string {
	if (invalidPaths.length === 1) {
		return `${invalidPaths} isn't a Git repository.`;
	}

	return `The following paths aren't Git repositories:\n\n${invalidPaths
		.slice(0, MaxInvalidFoldersToDisplay)
		.map((path) => `- ${path}`)
		.join('\n')}${
		invalidPaths.length > MaxInvalidFoldersToDisplay
			? `\n\n(and ${invalidPaths.length - MaxInvalidFoldersToDisplay} more)`
			: ''
	}`;
}

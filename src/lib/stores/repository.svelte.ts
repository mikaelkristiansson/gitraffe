import { open } from '@tauri-apps/api/dialog';
import { getStorageItem, setStorageItem } from '../persisted';
import { Repository } from '../models/repository';
import { getRepositoryType, type RepositoryType } from '../git/repository';
import { matchExistingRepository } from '../utils/repository-matching';
import { invoke } from '@tauri-apps/api/tauri';
import { emit } from '@tauri-apps/api/event';
import { toast } from 'svelte-sonner';
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
let isUpdating = $state(false);

export function createRepositories() {
	const addRepository = async () => {
		const path = await promptForDirectory();
		if (!path) return;
		const id = Math.random().toString(36).substring(2, 9);
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
		get isUpdating() {
			return isUpdating;
		},
		set isUpdating(newValue: boolean) {
			isUpdating = newValue;
		},
		addRepository,
		removeRepository,
		removeActive,
		setActive
	};

	return params;
}

async function promptForDirectory(): Promise<string | undefined> {
	const defaultPath = await (await import('@tauri-apps/api/path')).homeDir();
	return open({ directory: true, recursive: true, defaultPath }).then((selectedPath) => {
		if (selectedPath === null) return;
		if (Array.isArray(selectedPath) && selectedPath.length !== 1) return;
		return Array.isArray(selectedPath) ? selectedPath[0] : selectedPath;
	});
}

async function addNewRepository(
	path: Readonly<string>,
	id: string,
	allRepositories: Repository[]
): Promise<Repository | null> {
	const invalidPaths = new Array<string>();

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
	} else {
		invalidPaths.push(path);
	}

	if (invalidPaths.length > 0) {
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

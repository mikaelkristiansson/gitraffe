import { writable } from 'svelte/store';
import { open } from '@tauri-apps/api/dialog';

export interface Project {
	id: string;
	title: string;
	path: string;
}

function createProjects() {
	const storedProjects = typeof localStorage !== 'undefined' ? localStorage?.projects : null;
	const { subscribe, set, update } = writable(
		((storedProjects && JSON.parse(storedProjects)) || []) as Project[]
	);

	return {
		subscribe,
		set,
		add: (project: Project) => {
			update((projects) => {
				const newProjects = [...projects, project];
				localStorage.setItem('projects', JSON.stringify(newProjects));
				return newProjects;
			});
		},
		remove: (id: string) => {
			update((projects) => {
				const newProjects = projects.filter((project) => project.id !== id);
				localStorage.setItem('projects', JSON.stringify(newProjects));
				return newProjects;
			});
		}
	};
}

function createActiveProject() {
	const storedActiveProject =
		typeof localStorage !== 'undefined' ? localStorage?.activeProject : null;
	const { subscribe, set, update } = writable(
		((storedActiveProject && JSON.parse(storedActiveProject)) || null) as Project | null
	);

	return {
		subscribe,
		set,
		removeActive: () => {
			update(() => null);
			localStorage.removeItem('activeProject');
		},
		setActive: (id: string) => {
			let newProject: Project | null = null;
			projects.subscribe((prjs) =>
				prjs.find((project) => project.id === id && (newProject = project))
			);
			if (!newProject) return;
			update((prev) => {
				if (prev) {
					return {
						...prev,
						...newProject
					};
				}
				return newProject;
			});
			localStorage.setItem('activeProject', JSON.stringify(newProject));
		}
	};
}

export const projects = createProjects();

export const activeProject = createActiveProject();

async function promptForDirectory(): Promise<string | undefined> {
	const defaultPath = await (await import('@tauri-apps/api/path')).homeDir();
	return open({ directory: true, recursive: true, defaultPath }).then((selectedPath) => {
		if (selectedPath === null) return;
		if (Array.isArray(selectedPath) && selectedPath.length !== 1) return;
		return Array.isArray(selectedPath) ? selectedPath[0] : selectedPath;
	});
}

export async function addProject() {
	const path = await promptForDirectory();
	if (!path) return;
	const id = Math.random().toString(36).substr(2, 9);
	console.log('Adding project:', path);
	const title = path.split('/').pop() || path;
	projects.add({ id, title, path });
	activeProject.setActive(id);
	return { id, title, path };
}

<script lang="ts">
	import Icon from './Icon.svelte';
	import TimeAgo from './TimeAgo.svelte';
	import { tooltip } from '$lib/utils/tooltip';
	import { allBranches, defaultBranch, lastSynced, workingBranch } from '$lib/stores/branch';
	import { fetchAll } from '$lib/git/cli';
	import type { Repository } from '$lib/models/repository';
	import type { Branch } from '$lib/models/branch';
	import { error, success } from '$lib/utils/toasts';

	export let repository: Repository;

	let busy$ = false;
	let defaultBranch$: Branch | undefined = undefined;

	defaultBranch.subscribe((branch) => {
		defaultBranch$ = branch;
	});

	// $: base = defaultBranch$;

	// $: defaultBranch.subscribe((branch) => {
	// 	$defaultBranch = branch;
	// });
</script>

<button
	class="sync-btn"
	disabled={busy$}
	on:mousedown={async (e) => {
		e.preventDefault();
		e.stopPropagation();
		busy$ = true;
		try {
			await fetchAll(repository.path);
			const dBranch = await defaultBranch.setDefault(repository);
			await allBranches.fetch(repository, dBranch?.upstream || 'HEAD');
			workingBranch.setWorking(repository);
			lastSynced.set(new Date());
			success('Fetched from upstream');
		} catch (e) {
			console.error(e);
			error('Failed to fetch from upstream');
		} finally {
			busy$ = false;
		}
		// if (cloudEnabled) syncToCloud(repositoryId); // don't wait for this
		// await baseBranchService.fetchFromTarget();
		// if (githubService.isEnabled) {
		// 	await githubService.reload();
		// }
	}}
>
	<div class="sync-btn__icon">
		<Icon name="update-small" />
	</div>

	<span class="text-base-11 text-semibold sync-btn__label" use:tooltip={'Last fetch from upstream'}>
		{#if busy$}
			<div class="sync-btn__busy-label">busy…</div>
		{:else if $lastSynced}
			<TimeAgo date={$lastSynced} />
		{/if}
	</span>
</button>

<style lang="postcss">
	.sync-btn {
		display: flex;
		align-items: center;
		gap: var(--size-2);
		height: var(--size-20);
		padding-left: var(--size-2);
		padding-right: var(--size-4);
		background: var(--clr-theme-container-light);
		border: 1px solid var(--clr-theme-container-outline-light);
		border-radius: var(--radius-m);
		cursor: pointer;

		&.sync-btn-busy {
			cursor: default;
		}

		transition:
			background var(--transition-fast),
			border var(--transition-fast);

		&:hover {
			background: var(--clr-theme-container-light);
			border: 1px solid var(--clr-theme-container-outline-pale);
		}

		&:hover .sync-btn__icon {
			fill: var(--clr-theme-scale-ntrl-40);
		}

		&:hover .sync-btn__label {
			color: var(--clr-theme-scale-ntrl-40);
		}
	}

	.sync-btn__icon {
		display: flex;
		color: var(--clr-theme-scale-ntrl-40);
		transform-origin: center;
		transform: rotate(0deg);
		transition:
			fill var(--transition-fast),
			transform var(--transition-slow);
	}

	.sync-btn__label {
		display: block;
		line-height: 1;
		white-space: nowrap;
		color: var(--clr-theme-scale-ntrl-40);
		transition: color var(--transition-fast);
	}

	.sync-btn__busy-label {
		padding-left: var(--size-4);
	}
</style>

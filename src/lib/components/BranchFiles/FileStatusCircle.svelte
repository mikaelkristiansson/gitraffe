<script lang="ts">
	import type { AppFileStatusKind } from '$lib/models/status';

	export let status: AppFileStatusKind;
</script>

<div
	class="status"
	class:added={status == 'New' || status == 'Untracked'}
	class:modified={status == 'Modified'}
	class:deleted={status == 'Deleted'}
></div>

<style lang="postcss">
	.status {
		border-radius: 100%;
		width: var(--size-8);
		height: var(--size-8);
		border-radius: 100%;
		flex-shrink: 0;
	}
	.added {
		background: rgba(101, 199, 154, 0.5);
	}
	.modified {
		background: rgba(255, 184, 46, 0.5);
	}
	.deleted {
		background: rgba(255, 61, 78, 0.5);
	}
</style>

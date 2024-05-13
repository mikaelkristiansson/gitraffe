<script lang="ts">
	import type { AppFileStatusKind } from '$lib/models/status';

	export let status: AppFileStatusKind;
</script>

<div
	class="status"
	class:added={status == 'New'}
	class:untracked={status == 'Untracked'}
	class:modified={status == 'Modified'}
	class:deleted={status == 'Deleted'}
></div>

<style lang="postcss">
	.status {
		border-radius: 100%;
		@apply w-2 h-2;
		border-radius: 100%;
		flex-shrink: 0;
	}
	.added {
		@apply bg-green-200/80;
	}
	.untracked {
		@apply bg-purple-200/80;
	}
	.modified {
		@apply bg-orange-200/80;
	}
	.deleted {
		@apply bg-red-200/80;
	}
</style>

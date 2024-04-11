<script lang="ts">
	import { createTimeAgoStore } from '$lib/utils/timeAgo';

	export let date: string | undefined | Date;
	export let addSuffix = true;
	const isValidDate = (date: string) => !isNaN(new Date(date).getTime());
	const passDate =
		typeof date === 'string'
			? isValidDate(date)
				? createTimeAgoStore(new Date(date), addSuffix)
				: null
			: createTimeAgoStore(date, addSuffix);
	$: store = date ? passDate : null;
</script>

{#if store}
	{$store}
{/if}

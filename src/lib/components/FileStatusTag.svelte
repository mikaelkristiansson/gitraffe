<script lang="ts">
	import Tag from './Tag.svelte';
	import { AppFileStatusKind } from '$lib/models/status';

	export let status: AppFileStatusKind;

	function statusToColor(status: AppFileStatusKind) {
		switch (status) {
			case AppFileStatusKind.New:
				return 'success';
			case AppFileStatusKind.Modified:
				return 'warning';
			case AppFileStatusKind.Deleted:
			case AppFileStatusKind.Conflicted:
				return 'error';
			case AppFileStatusKind.Renamed:
				return 'pop';
			case AppFileStatusKind.Copied:
			case AppFileStatusKind.Untracked:
				return 'purple';
		}
	}
</script>

<Tag color={statusToColor(status)}>{status}</Tag>

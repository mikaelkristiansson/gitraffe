<script lang="ts">
	export let name: string | undefined;

	const colors = [
		'#E78D8D',
		'#62CDCD',
		'#EC90D2',
		'#7DC8D8',
		'#F1BC55',
		'#6B6B4C',
		'#9785DE',
		'#99CE63',
		'#636ECE',
		'#5FD2B0'
	];

	function nameToColor(name: string | undefined) {
		const trimmed = name?.replace(/\s/g, '');
		if (!trimmed) {
			return `linear-gradient(45deg, ${colors[0][0]} 15%, ${colors[0][1]} 90%)`;
		}

		const startHash = trimmed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
		return colors[startHash % colors.length];
	}

	function getFirstLetter(name: string | undefined) {
		return name ? name[0].toUpperCase() : '';
	}

	$: firstLetter = getFirstLetter(name);
</script>

<div class="flex-shrink-0 h-5 w-5 rounded-md" style:background-color={nameToColor(name)}>
	<svg class="w-full h-full" viewBox="0 0 24 24">
		<text
			class="leading-none text-sm font-extrabold fill-white"
			x="50%"
			y="54%"
			text-anchor="middle"
			alignment-baseline="middle"
		>
			{firstLetter.toUpperCase()}
		</text>
	</svg>
</div>

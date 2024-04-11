<script lang="ts" context="module">
	import { pxToRem } from '$lib/utils/pxToRem';
	export type IconColor = 'success' | 'error' | 'pop' | 'warn' | 'neutral' | undefined;
</script>

<script lang="ts">
	export let color: IconColor = undefined;
	export let opacity: number | undefined = 1;
	export let size = 16;
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	fill="none"
	viewBox="0 0 24 24"
	stroke-width="1.5"
	stroke="currentColor"
	class={`icon-wrapper ${$$restProps.class}`}
	class:success={color == 'success'}
	class:error={color == 'error'}
	class:pop={color == 'pop'}
	class:warn={color == 'warn'}
	class:default={!color}
	style:fill-opacity={opacity}
	style:width={pxToRem(size)}
	style:height={pxToRem(size)}
>
	<path
		stroke-linecap="round"
		stroke-linejoin="round"
		d="m9 12.75 3 3m0 0 3-3m-3 3v-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
	/>
</svg>

<style lang="postcss">
	.icon-wrapper {
		flex-shrink: 0;
		pointer-events: none;
		display: inline-block;
	}

	.success {
		color: var(--clr-theme-scale-succ-50);
	}
	.error {
		color: var(--clr-theme-scale-err-50);
	}
	.pop {
		color: var(--clr-theme-scale-pop-50);
	}
	.warn {
		color: var(--clr-theme-scale-warn-50);
	}
</style>

<script lang="ts" context="module">
	import { pxToRem } from '$lib/utils/pxToRem';
	export type IconColor =
		| 'success'
		| 'error'
		| 'pop'
		| 'warn'
		| 'neutral'
		| 'secondary'
		| undefined;
</script>

<script lang="ts">
	import iconsJson from '../icons/icons.json';

	let className: string | undefined | null = undefined;
	export let name: keyof typeof iconsJson;
	export let color: IconColor = undefined;
	export let opacity: number | undefined = 1;
	export let spinnerRadius: number | undefined = 5;
	export let size = 16;
	export { className as class };
</script>

<svg
	class="icon-wrapper {className}"
	viewBox="0 0 16 16"
	fill-rule="evenodd"
	class:success={color == 'success'}
	class:error={color == 'error'}
	class:pop={color == 'pop'}
	class:warn={color == 'warn'}
	class:neutral={color == 'neutral'}
	class:secondary={color == 'secondary'}
	style:fill-opacity={opacity}
	style:width={pxToRem(size)}
	style:height={pxToRem(size)}
	style="--spinner-radius: {spinnerRadius}"
>
	{#if name == 'spinner'}
		<g class:spinner={name == 'spinner'}>
			<circle class="spinner-path" cx="8" cy="8" r={spinnerRadius} fill="none" />
			<circle
				class="spinner-back-path"
				cx="8"
				cy="8"
				r={spinnerRadius}
				fill="none"
				vector-effect="non-scaling-stroke"
			/>
		</g>
	{:else}
		<path fill="currentColor" d={iconsJson[name]} />
	{/if}
</svg>

<style lang="postcss">
	.icon-wrapper {
		flex-shrink: 0;
		pointer-events: none;
		display: inline-block;
	}

	.success {
		@apply text-green-700 dark:text-green-300;
	}
	.error {
		@apply text-red-900 dark:text-red-300;
	}
	.pop {
		@apply text-purple-900 dark:text-purple-300;
	}
	.warn {
		@apply text-orange-400;
	}
	.neutral {
		@apply text-gray-500;
	}
	.secondary {
		@apply text-secondary-foreground dark:text-secondary;
	}

	.spinner {
		transform-origin: center;
		animation: spinning 1s infinite linear;
	}
	@keyframes spinning {
		100% {
			transform: rotate(360deg);
		}
	}
	.spinner-path {
		stroke-width: 2px;
		stroke: currentColor;
		animation: spinning-path 2s infinite ease-in-out;
	}

	.spinner-back-path {
		stroke-width: 2px;
		stroke: currentColor;
		opacity: 0.3;
	}
	@keyframes spinning-path {
		0% {
			stroke-dasharray: 1, 120;
			stroke-dashoffset: 0;
		}
		60% {
			stroke-dasharray: 60, 120;
			stroke-dashoffset: -10;
		}
		100% {
			stroke-dasharray: 60, 120;
			stroke-dashoffset: calc(-1 * var(--spinner-radius) * 5.5);
		}
	}
</style>

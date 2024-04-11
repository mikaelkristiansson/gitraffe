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
	viewBox="0 0 24 24"
	width={size}
	height={size}
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
		fill="currentColor"
		d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z"
		opacity="0.25"
	/>
	<path
		fill="currentColor"
		d="M10.14,1.16a11,11,0,0,0-9,8.92A1.59,1.59,0,0,0,2.46,12,1.52,1.52,0,0,0,4.11,10.7a8,8,0,0,1,6.66-6.61A1.42,1.42,0,0,0,12,2.69h0A1.57,1.57,0,0,0,10.14,1.16Z"
	>
		<animateTransform
			attributeName="transform"
			dur="0.75s"
			repeatCount="indefinite"
			type="rotate"
			values="0 12 12;360 12 12"
		/>
	</path>
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

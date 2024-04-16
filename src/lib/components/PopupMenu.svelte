<script lang="ts">
	import type { WorkingDirectoryFileChange } from '$lib/models/status';
	import { clickOutside } from '$lib/utils/clickOutside';

	let pos = { x: 0, y: 0 };
	let menu = { h: 0, w: 0 };
	let browser = { h: 0, w: 0 };
	let showMenu = false;
	let item: {
		files: WorkingDirectoryFileChange[];
		setSelected: (
			file: WorkingDirectoryFileChange | undefined
		) => WorkingDirectoryFileChange | undefined;
	};

	function onDismiss() {
		showMenu = false;
	}

	export function openByMouse(e: MouseEvent, item: any) {
		show(e.clientX, e.clientY, item);
	}

	export function openByElement(elt: HTMLElement, item: any) {
		const rect = elt.getBoundingClientRect();
		show(rect.left, rect.top + rect.height, item);
	}

	function show(x: number, y: number, newItem: any) {
		item = newItem;
		showMenu = true;
		browser = {
			w: window.innerWidth,
			h: window.innerHeight
		};
		pos = {
			x: x,
			y: y
		};

		if (browser.h - pos.y < menu.h) pos.y = pos.y - menu.h;
		if (browser.w - pos.x < menu.w) pos.x = pos.x - menu.w;
	}

	export function recordDimensions(node: HTMLDivElement) {
		let height = node.offsetHeight;
		let width = node.offsetWidth;
		menu = {
			h: height,
			w: width
		};
	}
</script>

{#if showMenu}
	<div
		class="popup-overlay"
		role="menu"
		tabindex="0"
		use:recordDimensions
		use:clickOutside={{ handler: () => onDismiss() }}
		style="position: absolute; top:{pos.y}px; left:{pos.x}px"
	>
		<slot {item} dismiss={onDismiss} />
	</div>
{/if}

<style>
	.popup-overlay {
		z-index: 50; /* Must be higher than scrollbar hover */
	}
</style>

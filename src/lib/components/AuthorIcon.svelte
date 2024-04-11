<script lang="ts">
	import { Md5 } from '$lib/utils/md5';

	export let email: string;

	const md5 = new Md5();
	const hash = Md5.hashStr(email);
	const url = `https://www.gravatar.com/avatar/${hash}?d=identicon`;
	let imgCaption = `Gravatar for ${email}`;
</script>

<img class="gravatar-image" title={imgCaption} alt={imgCaption} srcset="{url} 2x" on:error />

<style lang="postcss">
	.gravatar-image {
		width: var(--size-16);
		height: var(--size-16);
		border-radius: 50%;
		margin-left: calc(var(--size-4) * -1);

		&:first-child {
			margin-left: 0;
		}
	}
</style>

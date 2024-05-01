<script lang="ts">
	import { Md5 } from '$lib/utils/md5';
	import * as Avatar from './ui/avatar';

	export let email: string;

	const hash = Md5.hashStr(email);
	const url = `https://www.gravatar.com/avatar/${hash}?d=identicon`;
	let imgCaption = `Gravatar for ${email}`;
</script>

<Avatar.Root
	class="h-5 w-5 rounded-full border bg-muted text-xs font-bold uppercase text-muted-foreground"
>
	<Avatar.Image src={url} alt={imgCaption} />
	<Avatar.Fallback>{email.substring(0, 1)}</Avatar.Fallback>
</Avatar.Root>

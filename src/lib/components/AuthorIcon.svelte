<script lang="ts">
	import { Md5 } from '$lib/utils/md5';
	import * as Avatar from './ui/avatar';
	import * as Tooltip from '$lib/components/ui/tooltip';

	export let email: string;

	const hash = Md5.hashStr(email);
	const url = `https://www.gravatar.com/avatar/${hash}?d=identicon`;
	let imgCaption = `Gravatar for ${email}`;
</script>

<Tooltip.Root>
	<Tooltip.Trigger class="cursor-auto">
		<Avatar.Root
			delayMs={500}
			class="h-5 w-5 rounded-full bg-muted text-xs font-bold uppercase text-muted-foreground"
		>
			<div
				class="flex h-full w-full items-center justify-center overflow-hidden rounded-full border-2 border-muted"
			>
				<Avatar.Image src={url} alt={imgCaption} />
				<Avatar.Fallback>{email.substring(0, 1)}</Avatar.Fallback>
			</div>
		</Avatar.Root>
	</Tooltip.Trigger>
	<Tooltip.Content>
		<p>{email}</p>
	</Tooltip.Content>
</Tooltip.Root>

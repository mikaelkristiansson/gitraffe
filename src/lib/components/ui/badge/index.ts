import { type VariantProps, tv } from 'tailwind-variants';
export { default as Badge } from './badge.svelte';

export const badgeVariants = tv({
	base: 'inline-flex select-none items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
	variants: {
		variant: {
			default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
			secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
			destructive:
				'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
			outline: 'text-foreground',
			pop: 'border-transparent bg-purple-200 text-purple-900 hover:bg-purple-200/80'
		},
		size: {
			default: 'text-xs',
			sm: 'text-[0.66rem] px-1.5 py-0 h-4',
			lg: 'text-sm'
		}
	},
	defaultVariants: {
		variant: 'default'
	}
});

export type Variant = VariantProps<typeof badgeVariants>['variant'];
export type Size = VariantProps<typeof badgeVariants>['size'];

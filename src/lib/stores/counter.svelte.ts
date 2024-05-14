let count = $state(0);

export function createCounter() {
	function increment() {
		count += 1;
	}

	return {
		get count() {
			return count;
		},
		increment
	};
}

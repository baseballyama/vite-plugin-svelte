<script>
	/** @type {{ initialCount: number }} */
	const { initialCount } = $props();
</script>

{#if initialCount < 0}
	{#if initialCount < 0}
		Inner1-1
	{:else if initialCount > 0}
		Inner1-2
	{:else}
		Inner1-3
	{/if}
{:else if initialCount > 0}
	{#if initialCount < 0}
		Inner2-1
	{:else if initialCount > 0}
		Inner2-2
	{:else}
		Inner2-3
	{/if}
{:else}
	<p>Hello!</p>
{/if}

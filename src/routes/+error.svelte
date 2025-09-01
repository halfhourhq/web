<script>
	import { page } from '$app/state';
  import { TriangleAlert } from '@lucide/svelte'
  import { goto } from '$app/navigation'
</script>

<div class="flex flex-col justify-center w-full h-full items-center p-4">
  <figure class="w-full max-w-xs flex items-center justify-center">
    <img class="max-w-xs" width="320px" src="/friends.svg" alt="An illustration with the cancel icon">
  </figure>
  <span class="alert alert-soft alert-error mt-8 mb-12">
    <TriangleAlert />
    <h1 class="text-lg">{page.status}: {page.error.message}</h1>
  </span>
  <button onclick={() => goto('/')} class="btn btn-circle mt-8">
    <img src="/halfhour.svg" alt="Icon" class="w-[2.4rem]">
  </button>
</div>

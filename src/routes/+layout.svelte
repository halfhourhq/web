<script>
	import '../app.css'
	import '@fontsource-variable/inter'
  import '@fontsource-variable/jetbrains-mono'
	import favicon from '$lib/assets/halfhour-social.png'
	import { PUBLIC_CLIENT_URL } from '$env/static/public'
	import { page, navigating } from '$app/state'
	import { onMount } from 'svelte'
	import { browser } from '$app/environment'
	import { ArrowLeft } from '@lucide/svelte'
	
	let { children } = $props()

	let mounted = $state(false)

	const path = $derived(page.url.pathname)

	onMount(() => {
    requestAnimationFrame(() => {
      mounted = true
    })
  })
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>HalfHour - Private scheduled meetings</title>
	<meta name="description" content="Encrypted anonymous private scheduled meetings with no email and no trail." />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="HalfHour - Private scheduled meetings" />
	<meta name="twitter:description" content="Encrypted anonymous private scheduled meetings with no email and no trail." />
	<meta name="twitter:image" content="/elela-minimal-display.webp" />

	<meta property="og:title" content="HalfHour - Private scheduled meetings" />
	<meta property="og:description" content="Encrypted anonymous private scheduled meetings with no email and no trail." />
	<meta property="og:image" content="/elela-minimal-display.webp" />
	<meta property="og:image:width" content="1920" />
	<meta property="og:image:height" content="1920" />
	<meta property="og:url" content={`${PUBLIC_CLIENT_URL}`} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Elela" />
	<meta property="og:locale" content="en_ZA" />
</svelte:head>

{#if !page.url.pathname.startsWith('/meeting/')}
  <header class="w-full">
    <nav class="bg-base-200 p-4 flex items-center justify-center shadow-sm">
      {#if page.url.pathname !== '/'}
        <button onclick={() => history.back()} class="btn btn-circle btn-neutral btn-sm">
          <ArrowLeft />
        </button>
      {/if}
      <a class="text-xl flex-1 flex items-center justify-center" href="/">
        <img src="/halfhour.svg" alt="name logo" class="w-[2.25rem]">
      </a>
    </nav>
  </header>
{/if}

<main class={`flex-grow bg-base-200 pb-4 h-full overflow-y-auto pl-4 pr-4 scrollbar-hide ${page.url.pathname.startsWith('/meeting/') ? 'pt-4 mb-0' : ''}`}>
  {#if mounted && browser}
    {@render children?.()}
  {:else}
    <div class="flex flex-col justify-center items-center p-4 h-full">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>
  {/if}
</main>
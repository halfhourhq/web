<script>
  import { Calendar, Clock, Info } from '@lucide/svelte'
  import { enhance } from '$app/forms'
  import { toasts, add_toast, clean_toasts } from '$lib/toasts.svelte.js'
  import { onDestroy } from 'svelte'
  import { add_to_calendar } from '$lib/calendar'
  import { encodeHex } from '@std/encoding'
  import { argon2id } from 'hash-wasm'
  import { PUBLIC_SERVER_URL } from '$env/static/public'
  import { generate_organiser_keypair, hashAuthenticationPass, hashEncryptionPass } from '$lib/encryption'

  let organiser = $state(null)
  let loading = $state(false)
  let password = $state('')

  let date = $state(new Date(Date.now() + 1000*60*5))
  let date_string = $derived(date.toISOString().split('T')[0])
  let time_string = $derived(`${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`)

  function copy_tag(){
    navigator.clipboard.writeText(organiser.meeting_tag)
    add_toast({ message: 'Meeting tag successfully copied to clipboard', type: 'success', auto: true })
  }

  function save_event(){ add_to_calendar({
    title: `Meet with ${organiser.flare}`,
    start: new Date(organiser.start_time),
    end: new Date(organiser.end_time),
    location: 'Elela',
    description: `You have a meeting on the HalfHour app. Visit halfhour.online to attend your meeting.`
  }) }

  const date_formatter = new Intl.DateTimeFormat('en-ZA', { dateStyle: 'medium' })
  const time_formatter = new Intl.DateTimeFormat('en-ZA', { timeStyle: 'short' })

  onDestroy(() => {clean_toasts()})
</script>

<svelte:head>
  <title>HalfHour - Create Meeting Invitation</title>
	<meta name="description" content="Create a scheduled meeting." />
</svelte:head>

<div class="flex flex-col justify-items-start items-center">
  <div class="card card-border bg-base-100 border-base-300 max-w-sm w-full min-w-xs">
    <form class="card-body" method="POST" action="?/create" use:enhance={async ({formData, cancel}) => {
      loading = true
      if(password.length < 10){
        add_toast({ message: 'The password must be at least 10 characters long', type: 'error', auto: true }) 
        cancel()
        loading = false
      } else {
        const date_time = new Date( date_string+'T'+time_string )
        formData.append('date_time', date_time)

        const salt = crypto.getRandomValues(new Uint8Array(16))
        const hash_auth = await hashAuthenticationPass(password, salt)
        formData.append('password_hash', hash_auth)
        formData.append('password_salt', encodeHex(salt))

        const hash_encrypt = await hashEncryptionPass(password, salt)
        const gen_salt = encodeHex(crypto.getRandomValues(new Uint8Array(16)))
        const pair = generate_organiser_keypair(hash_encrypt, gen_salt)
        formData.append('public_key', encodeHex(pair.publicKey))
        formData.append('keypair_salt', gen_salt)
      }

      return async ({result, update}) => {
        if(result.data?.error){ 
          add_toast({ message: result.data.error, type: 'error', auto: true }) 
        }
        organiser = result.data?.organiser
        loading = false
        await update()
      }
    }}>
      {#if organiser}
        <h1 class="card-title">Share the meeting</h1>
        <div role="alert" class="alert alert-info">
          <Info />
          <span>Copy the meeting tag below as it is & share it with whomever you want to invite</span>
        </div>
        <span class="font-mono w-full p-4 bg-base-300 font-semibold text-center text-base border-dashed border-1 rounded-lg border-neutral">{organiser.meeting_tag}</span>
        <div class="card-actions flex-col">
          <button type="button" onclick={copy_tag} class="btn btn-accent w-full">Copy</button>
        </div>
        <div class="divider"></div>
        <div class="stats stats-vertical shadow">
          <div class="stat place-items-center">
            <div class="stat-figure text-neutral" >
              <Calendar />
            </div>
            <div class="stat-title">Date</div>
            <div class="stat-value">{date_formatter.format(new Date(organiser.start_time))}</div>
          </div>
          <div class="stat place-items-center">
            <div class="stat-figure text-neutral" >
              <Clock/>
            </div>
            <div class="stat-title">Time</div>
            <div class="stat-value">{time_formatter.format(new Date(organiser.start_time))}</div>
          </div>
        </div>
        <div class="card-actions">
          <button type="button" onclick={save_event} class="btn btn-primary flex-1">Calendar Event</button>
          <a href="/" onclick={() => organiser = null} class="btn btn-outline flex-1">Join Meeting</a>
        </div>
      {:else}
        <h1 class="card-title">Create meeting invitation</h1>
        <fieldset class="fieldset">
          <label for="name" class="fieldset-legend">Name</label>
          <span class="label text-wrap">It could be anything, get creative.</span>
          <input id="name" name="name" autocomplete="off" type="text" class="input w-full" placeholder="Worries Aplenty" />
          <div class="divider"></div>
          <label for="password" class="fieldset-legend">Password</label>
          <span class="label text-wrap">Keep safe, it's a secret.</span>
          <input id="password" bind:value={password} autocomplete="off" type="password" class="input w-full" placeholder="Password" />
          <div class="divider"></div>
          <p class="fieldset-legend">Schedule</p>
          <label for="date" class="label">Date</label>
          <input id="date" name="date" bind:value={date_string} type="date" class="input w-full" />
          <label for="time" class="label">Time</label>
          <input id="time" name="time" bind:value={time_string} type="time" class="input w-full" />
        </fieldset>
        <div class="card-actions justify-end">
          <button type="submit" class="btn btn-accent uppercase w-1/2">Create</button>
        </div>
      {/if}
    </form>
  </div>
</div>
<div class="toast toast-top toast-center">
  {#each toasts as toast (toast.id) }
    <div class={`alert alert-${toast.type}`}>
      <span class="font-bold">{toast.message}</span>
    </div>
  {/each}
</div>
{#if loading}
  <div class="toast toast-top toast-center">
    <div class={`btn btn-primary btn-circle`}>
      <span class="loading loading-spinner loading-md"></span>
    </div>
  </div>
{/if}
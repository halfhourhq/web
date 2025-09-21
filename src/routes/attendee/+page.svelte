<script>
  import { enhance } from '$app/forms'
  import { toasts, add_toast, clean_toasts } from '$lib/toasts.svelte.js'
  import { onDestroy, onMount } from 'svelte'
  import { Info, Calendar, Clock } from '@lucide/svelte'
  import { browser } from '$app/environment'
  import { get_cookie } from '$lib/cookie'
  import { invalidateAll } from '$app/navigation'
  import { argon2id } from 'hash-wasm'
  import { decodeHex } from '@std/encoding'
  import { PUBLIC_SERVER_URL } from '$env/static/public'
  import database from '$lib/surrealdb'
  import { hashAuthenticationPass, hashEncryptionPass } from '$lib/encryption.js'
  import { RecordId } from 'surrealdb'

  let { data } = $props()

  let queried = $state(false)
  let attendee = $state(data.attendee)
  let session = $state(null)
  let loading = $state(false)

  const date_formatter = new Intl.DateTimeFormat('en-ZA', { dateStyle: 'medium' })
  const time_formatter = new Intl.DateTimeFormat('en-ZA', { timeStyle: 'short' })

  onDestroy(() => { clean_toasts() })
</script>

<svelte:head>
  <title>HalfHour - Attendee</title>
	<meta name="description" content="Scheduled meeting attendee." />
</svelte:head>

<div class="flex flex-col justify-items-start items-center">
  <div class="card card-border border-base-300 bg-base-100 max-w-sm w-full min-w-xs">
    <section class="card-body">
      <h1 class="card-title">Response status</h1>
      <div class="w-full text-center mt-2 mb-2">
        <span class={`badge-xl badge ${data.attendee.approved === true ? 'badge-success' : 'badge-warning'}`}>
          {data.attendee.approved === true ? 'Approved' : 'Pending'}
        </span>
      </div>
      {#if new Date(data.attendee.start_time) > new Date()}
        <div class="stats stats-vertical shadow">
          <div class="stat place-items-center">
            <div class="stat-figure text-neutral" >
              <Calendar />
            </div>
            <div class="stat-title">Date</div>
            <div class="stat-value">{date_formatter.format(new Date(data.attendee.start_time))}</div>
          </div>
          <div class="stat place-items-center">
            <div class="stat-figure text-neutral" >
              <Clock/>
            </div>
            <div class="stat-title">Time</div>
            <div class="stat-value">{time_formatter.format(new Date(data.attendee.start_time))}</div>
          </div>
        </div>
      {:else if new Date(data.attendee.start_time) < new Date() && new Date(data.attendee.end_time > new Date())}
        <div class="stats stats-vertical shadow">
          <div class="stat place-items-center">
            <div class="stat-title">Ending in</div>
            <div class="stat-value"><span>{Math.ceil( (new Date(data.attendee.end_time).valueOf() - Date.now()) / (1000*60) )}</span></div>
            <div class="stat-desc">Minutes</div>
          </div>
        </div>
      {:else}
        <div class="stats stats-vertical shadow">
          <div class="stat place-items-center">
            <div class="stat-title">Ended</div>
            <div class="stat-value"><span>{Math.ceil( ( Date.now() - new Date(data.attendee.end_time).valueOf() ) / (1000*60) )}</span></div>
            <div class="stat-desc">Minutes ago</div>
          </div>
        </div>
      {/if}
      {#if data.attendee.approved}
        <form method="POST" action="?/logout" class="card-actions" use:enhance={({formData}) => {
          loading = true
          return async ({result, update}) => {
            if(result.data?.error){ 
              addToast({ message: result.data.error, type: 'error', auto: true }) 
            }
            if(result.data?.success){
              queried = false
              attendee = null
            }
            await update()
            loading = false
          }
        }}>
          <button type="submit" class="btn btn-outline">Leave session</button>
          {#if data.attendee.connection_id}
            <a href={`/meeting/${data.attendee.connection_id}`} class="btn btn-primary flex-1" >Join</a>
          {/if}
        </form>
      {/if}
    </section>
  </div>
</div>
<div class="toast toast-top toast-center">
  {#each toasts as toast (toast.id) }
    <div class={`alert alert-${toast.type}`}>
      <span>{toast.message}</span>
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
<script>
  import { Calendar, Clock, Info } from "@lucide/svelte"
  import { toasts, add_toast, clean_toasts } from '$lib/toasts.svelte.js'
  import { onDestroy } from 'svelte'
  import { add_to_calendar } from '$lib/calendar'
  import { enhance } from "$app/forms"

  let { data } = $props()
  let connect = $state(false) 
  let loading = $state(false)

  function copy_tag(){
    navigator.clipboard.writeText(data.organiser.meeting_tag)
    add_toast({ message: 'Meeting tag successfully copied to clipboard', type: 'success', auto: true })
  }

  const date_formatter = new Intl.DateTimeFormat('en-ZA', { dateStyle: 'medium' })
  const time_formatter = new Intl.DateTimeFormat('en-ZA', { timeStyle: 'short' })

  onDestroy(() => { clean_toasts() })
</script>

<svelte:head>
  <title>HalfHour - Organiser</title>
	<meta name="description" content="Scheduled meeting organiser." />
</svelte:head>

<div class="flex flex-col justify-items-start items-center gap-4">
  <div class="card card-border border-base-300 bg-base-100 max-w-md w-full min-w-xs">
    {#if connect ===  false}
      <section class="card-body">
        <h1 class="card-title">Meeting</h1>
        {#if new Date(data.organiser.start_time) < new Date() && new Date(data.organiser.end_time > new Date())}
          <div class="stats stats-vertical shadow">
            <div class="stat place-items-center">
              <div class="stat-title">Ending in</div>
              <div class="stat-value"><span>{Math.ceil( (new Date(data.organiser.end_time).valueOf() - Date.now()) / (1000*60) )}</span></div>
              <div class="stat-desc">Minutes</div>
            </div>
          </div>
        {:else}
          <div class="stats stats-vertical shadow">
            <div class="stat place-items-center">
              <div class="stat-figure text-neutral" >
                <Calendar />
              </div>
              <div class="stat-title">Date</div>
              <div class="stat-value">{date_formatter.format(new Date(data.organiser.start_time))}</div>
            </div>
            <div class="stat place-items-center">
              <div class="stat-figure text-neutral" >
                <Clock/>
              </div>
              <div class="stat-title">Time</div>
              <div class="stat-value">{time_formatter.format(new Date(data.organiser.start_time))}</div>
            </div>
          </div>
        {/if}
        {#if data.organiser.connections < 1}
          <div class="stats shadow">
            <div class="stat place-items-center">
              <div class="stat-title">Responses</div>
              <div class="stat-value">{data.organiser.responses}</div>
            </div>
          </div>
        {:else}
          <ul class="list bg-base-100 rounded-box shadow-md">
            <li class="list-row">
              <div><span class="text-4xl">{Array.from(data.organiser.connection.response_tag.split(' ')[0])[0]}</span></div>
              <div>
                <div>{data.organiser.connection.attendee_name}</div>
                <div class="text-xs uppercase font-semibold opacity-60">{data.organiser.connection.response_tag} is connected</div>
              </div>
              <a href={`/meeting/${data.organiser.connection.connection_id.split(':')[1]}`} class="btn btn-square btn-outline">
                Join
              </a>
            </li>
          </ul>
        {/if}
        <div class="card-actions">
          <button onclick={copy_tag} type="button" class="btn btn-accent flex-1">Share</button>
          {#if data.organiser.connections < 1}
            <button onclick={() => { connect = true }} type="button" class="btn btn-neutral flex-1">Connect</button>
          {/if}
        </div>
      </section>
    {:else}
      <form class="card-body" action="?/connect" method="POST" use:enhance={({formData}) => {
        loading = true
        return async ({result, update}) => {
          if(result.data?.error){ 
            add_toast({ message: result.data.error, type: 'error', auto: true }) 
          }
          if(result.data?.success === true){
            connect = false
          }
          await update()
          loading = false
        }
      }}>
        <h1 class="card-title">Connect</h1>
        <fieldset class="fieldset">
          <label for="response_tag" class="label">Response tag</label>
          <input name="response_tag" autocomplete="off" type="text" class="input w-full" placeholder="MX_IS_DK" />
          <div role="alert" class="alert alert-soft alert-info">
            <Info />
            <span>This must be the response tag that you want to establish connection with</span>
          </div>
        </fieldset>
        <div class="card-actions">
          <button type="button" onclick={() => connect = false} class="btn btn-outline">Cancel</button>
          <button type="submit" class="btn btn-accent flex-1">Approve</button>
        </div>
      </form>
    {/if}
  </div>

  <div class="card text-base-100 bg-neutral max-w-md w-full min-w-xs">
    <section class="card-body font-mono">
      <h1 class="card-title">{data.organiser.name}</h1>
      <span>Your meeting tag is <strong>{data.organiser.meeting_tag}</strong></span>
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
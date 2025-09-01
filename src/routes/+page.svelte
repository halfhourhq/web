<script>
  import { House, Info, ArrowBigRightDash, ClipboardPaste, Delete, ArrowLeft } from '@lucide/svelte'
  import { enhance } from '$app/forms'
  import { navigating } from '$app/state'
  import { get_cookie } from '$lib/cookie'
  import { browser } from '$app/environment'
  import { goto, invalidate } from '$app/navigation'
  import { add_toast, toasts } from '$lib/toasts.svelte.js'
  import { PUBLIC_CLIENT_URL, PUBLIC_SERVER_URL } from '$env/static/public'
  import { argon2id } from 'hash-wasm'
  import { decodeHex, encodeHex } from '@std/encoding'
  import { onDestroy } from 'svelte'
  import database from '$lib/surrealdb'
  import { RecordId } from 'surrealdb'
  import { hashAuthenticationPass, hashEncryptionPass } from '$lib/encryption.js'

  let { data } = $props()

  let tag = $state('')
  let salt = $state(null)
  let password = $state('')
  let sign_in = $state('')
  let loading = $state(false)

  async function get_organiser_salt(){
    loading = true
    const res = await fetch(`${PUBLIC_SERVER_URL}/organiser/auth/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meeting_tag: tag })
    })

    if(!res.ok){  
      loading = false
      add_toast({ message: await res.text(), type: 'error', auto: true }) 
    } else {
      const attendee = await res.json()
      salt = attendee.password_salt
      loading = false
    }
  }

  async function get_attendee_salt(){
    loading = true
    const res = await fetch(`${PUBLIC_SERVER_URL}/attendee/auth/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response_tag: tag })
    })

    if(!res.ok){  
      loading = false
      add_toast({ message: await res.text(), type: 'error', auto: true }) 
    } else {
      const attendee = await res.json()
      salt = attendee.password_salt
      loading = false
    }
  }

  function reset() {
    salt = null
    password = ''
    tag = ''
  }

  async function onExit(){
    loading = true
    await fetch(`/canal/settings/logout`, { method: 'POST' })
    await invalidate('get:refreshed')
    goto('/', { replaceState: true })
    loading = false
  }
  
  onDestroy(() => {
    reset()
  })
</script>

<div class="flex flex-col justify-items-start items-center">
  {#if data?.user}
    <div class="card card-border border-base-300 card-sm bg-base-100 max-w-sm w-full min-w-xs">
      <section class="card-body">
        <h2 class="card-title uppercase">{data.user.name}</h2>
        <span>You are currently logged in.</span>
        <form class="card-actions" method="POST" action="?/logout" use:enhance={async ({formData, cancel}) => {
            loading = true
            return async ({result, update}) => {
              if(result.data?.error){ 
                add_toast({ message: result.data.error, type: 'error', auto: true }) 
              } else {
                const db = await database()
                await db.delete(new RecordId('crypto', 'user'))
              }

              await update()
              loading = false
            }
          }}>
          <button class="btn btn-outline flex-1 uppercase">
            Leave session
          </button>
          <a href={`/${data.user.response_tag ? 'attendee' : 'organiser'}`} class="btn btn-primary uppercase flex-1" >Status</a>
        </form>
      </section>
    </div> 
  {:else}
    <div class="card card-border border-base-300 card-sm bg-base-100 max-w-sm w-full">
      <section class="card-body">
        <h1 class="card-title uppercase">Join Meeting</h1>

        {#if sign_in === 'organiser'}
          <form method="POST" action="?/organiser" use:enhance={async ({formData, cancel}) => {
            loading = true
            if(!tag || !salt || password.length === 0){
              add_toast({ message: 'Enter meeting tag and password', type: 'error', auto: true }) 
              cancel()
              loading = false
            } else {
              const saltBuffer = decodeHex(salt)

              const hash_auth = await hashAuthenticationPass(password, saltBuffer)
              formData.append('password_hash', hash_auth)
              formData.append('meeting_tag', tag)

              const hash_encrypt = await hashEncryptionPass(password, saltBuffer)
              const db = await database()
              await db.upsert(new RecordId('crypto', 'user'), {key: hash_encrypt}).catch(err => {
                add_toast({ message: 'Failed to save encryption keys', type: 'error', auto: true }) 
                cancel()
                loading = false
              })
            }
            
            return async ({result, update}) => {
              if(result.data?.error){ 
                const db = await database()
                await db.delete(new RecordId('crypto', 'user'))
                add_toast({ message: result.data.error, type: 'error', auto: true }) 
              }

              await update()
              loading = false
            }
          }}>
            <fieldset class="fieldset">
              {#if salt}
                <label for="password" class="fieldset-legend">Password</label>
                <input bind:value={password} autocomplete="off" type="password" class="input w-full" placeholder="Password" />
              {:else}
                <label for="meeting_tag" class="fieldset-legend">Meeting tag</label>
                <input id="meeting_tag" bind:value={tag} autocomplete="off" type="text" class="input w-full" placeholder="ZA_BW_CA" />
              {/if}
            </fieldset>
            <div class="card-actions justify-end">
                <button onclick={() => {sign_in = ''; reset();}} disabled={loading} class="btn btn-outline mt-4 flex-1" type="button" >Cancel</button>
              {#if salt}
                <button disabled={loading} class={`btn btn-accent mt-4 flex-1`} type="submit">Join</button>
              {:else}
                <button onclick={get_organiser_salt} disabled={loading} class={`btn btn-accent mt-4 flex-1`} type="button">Continue</button>
              {/if}
            </div>
          </form>
        {:else if sign_in === 'attendee'}
          <form method="POST" action="?/attendee" use:enhance={async ({formData, cancel}) => {
            loading = true
            if(!tag || !salt || password.length === 0){
              add_toast({ message: 'Enter meeting tag and password', type: 'error', auto: true }) 
              cancel()
              loading = false
            } else {
              const salt_buffer = decodeHex(salt)

              const hash_auth = await hashAuthenticationPass(password, salt_buffer)
              formData.append('password_hash', hash_auth)
              formData.append('response_tag', tag)

              const hash_encrypt = await hashEncryptionPass(password, salt_buffer)
              const db = await database()
              await db.upsert(new RecordId('crypto', 'user'), {key: hash_encrypt}).catch(err => {
                add_toast({ message: 'Failed to save encryption keys', type: 'error', auto: true }) 
                cancel()
                loading = false
              })
            }
            
            return async ({result, update}) => {
              if(result.data?.error){ 
                const db = await database()
                await db.delete(new RecordId('crypto', 'user'))
                add_toast({ message: result.data.error, type: 'error', auto: true }) 
              }

              await update()
              loading = false
            }
          }}>
            <fieldset class="fieldset">
              {#if salt}
                <label for="password" class="fieldset-legend">Password</label>
                <input id="password" bind:value={password} autocomplete="off" type="password" class="input w-full" placeholder="Password" />
              {:else}
                <label for="response_tag" class="fieldset-legend">Response tag</label>
                <input id="response_tag" bind:value={tag} autocomplete="off" type="text" class="input w-full" placeholder="GH_NG_RU" />
              {/if}
            </fieldset>
            <div class="card-actions justify-end">
              <button onclick={() => {sign_in = ''; reset();}} disabled={loading} class="btn btn-outline mt-4 flex-1" type="button" >Cancel</button>
              {#if salt}
                <button disabled={loading} class={`btn btn-accent mt-4 flex-1`} type="submit">Join</button>
              {:else}
                <button onclick={get_attendee_salt} disabled={loading} class={`btn btn-accent mt-4 flex-1`} type="button">Continue</button>
              {/if}
            </div>
          </form>
        {/if}
        
        {#if sign_in !== 'attendee' && sign_in !== 'organiser'}
          <div class="card-actions flex-col mt-2">
            <button onclick={() => {sign_in = 'organiser'}} type="button" class="btn btn-neutral w-full" >As Organiser</button>
            <div class="divider">OR</div>
            <button onclick={() => {sign_in = 'attendee'}} type="button" class="btn btn-neutral w-full">As Attendee</button>
          </div>
        {/if}
      </section>
    </div>
  {/if} 
  <div class="card card-border mt-4 card-sm bg-base-100 border-base-300 max-w-sm w-full min-w-xs">
    <div class="card-body">
      <h2 class="card-title uppercase">Meeting Invitation</h2>
      <div class="card-actions flex-row justify-evenly mt-4">
        <a href="/create" class="btn btn-accent w-auto flex-1">Create</a>
        <a href="/respond" class="btn btn-outline w-auto flex-1">Respond</a>
      </div>
    </div>
  </div>
</div>

{#if loading}
  <div class="toast toast-top toast-center">
    <div class={`btn btn-primary btn-circle`}>
      <span class="loading loading-spinner loading-md"></span>
    </div>
  </div>
{/if}


<div class="toast toast-top toast-center">
  {#each toasts as toast (toast.id) }
    <div class={`alert alert-${toast.type}`}>
      <span class="font-bold">{toast.message}</span>
    </div>
  {/each}
</div>
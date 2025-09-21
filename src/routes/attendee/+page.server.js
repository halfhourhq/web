import { error, fail, redirect } from '@sveltejs/kit'
import { PUBLIC_SERVER_URL, PUBLIC_APP_ENV, PUBLIC_COOKIE_DOMAIN } from '$env/static/public'
import { decodeJwt } from 'jose'

export async function load({ cookies }){
  const token = cookies.get('access_token')

  if(!token){ error(403, { message: 'Access denied' }) }

  const res = await fetch(`${PUBLIC_SERVER_URL}/attendee`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  })

  if(!res.ok){
    error(res.status, { message: await res.text() })
  }

  return { attendee: await res.json() }
}

export const actions = {
  logout: async ({cookies}) => {
    const token = cookies.get('access_token')

    const res = await fetch(`${PUBLIC_SERVER_URL}/session`,
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      }
    )

    if(!res.ok){ return fail(res.status, { error: await res.text()}) }

    cookies.delete('access_token', { path: '/' })
    cookies.delete('session_id', { path: '/' })

    redirect(302, '/')
  }
}
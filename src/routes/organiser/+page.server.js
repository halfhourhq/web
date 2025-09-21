import { error, fail, redirect } from '@sveltejs/kit'
import { PUBLIC_SERVER_URL, PUBLIC_APP_ENV, PUBLIC_COOKIE_DOMAIN } from '$env/static/public'
import { decodeJwt } from 'jose'

export async function load({ cookies }){
  const token = cookies.get('access_token')
  if(!token){ error(403, { message: 'Access denied' }) }

  const res = await fetch(`${PUBLIC_SERVER_URL}/organiser`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  })

  if(!res.ok){
    error(res.status, { message: await res.text() })
  }

  return { organiser: await res.json() }
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
  },
  connect: async ({ request, cookies, params }) => {
    const token = cookies.get('access_token')
    const id = params.id
    const data = await request.formData()
    const values = Object.fromEntries( Object.entries( Object.fromEntries(data.entries()) ).filter(([_, value]) => value != "") )
    const response_tag = values.response_tag
    
    const res = await fetch(`${PUBLIC_SERVER_URL}/meeting/connect`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          response_tag: response_tag
        })
      }
    )
    
    if(!res.ok){ return fail(res.status, { error: await res.text()}) }

    return { success: true }
  }
}
import { error, fail } from '@sveltejs/kit'
import { PUBLIC_SERVER_URL } from '$env/static/public'

export async function load({ cookies, params, request }){
  const token = cookies.get('access_token')

  if(!token){ error(403, { message: 'Access denied' }) }
  
  const id = params.id

  const res = await fetch(`${PUBLIC_SERVER_URL}/meeting/connection/${id}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}`, 'X-Forwarded-For': request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for') }
  })

  if(!res.ok){
    error(res.status, { message: await res.text() })
  }

  return { meeting: await res.json() }
}
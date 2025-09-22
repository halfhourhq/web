import { error, fail, redirect } from '@sveltejs/kit'
import { PUBLIC_SERVER_URL, PUBLIC_APP_ENV, PUBLIC_COOKIE_DOMAIN } from '$env/static/public'
import { decodeJwt } from 'jose'

export async function load({ cookies, params, request }){
  const id = params.id
  const res_meetings = await fetch(`${PUBLIC_SERVER_URL}/statistics/meetings`, {
    headers: {
      'X-Forwarded-For': request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')
    }
  })
  const res_jobs = await fetch(`${PUBLIC_SERVER_URL}/statistics/jobs`, {
    headers: {
      'X-Forwarded-For': request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')
    }
  })

  if(!res_meetings.ok){
    error(res_meetings.status, { message: await res_meetings.text() })
  }

  if(!res_jobs.ok){
    error(res_jobs.status, { message: await res_jobs.text() })
  }

  return { meetings: await res_meetings.json(), jobs: await res_jobs.json() }
}

export const actions = {
  organiser: async ({ request, cookies }) => {
    const token = cookies.get('access_token')

    const data = await request.formData()
    const values = Object.fromEntries( Object.entries( Object.fromEntries(data.entries()) ).filter(([_, value]) => value != "") )

    const meeting_tag = values.meeting_tag
    const password_hash = values.password_hash

    const res = await fetch(`${PUBLIC_SERVER_URL}/organiser/auth/finish`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 'User-Agent': request.headers.get('user-agent'),
          'X-Forwarded-For': request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')
        },
        body: JSON.stringify({
          meeting_tag: meeting_tag,
          password_hash: password_hash
        })
      }
    )
    
    if(!res.ok){ return fail(res.status, { error: await res.text()}) }

    const auth = await res.json()

    const claims = decodeJwt(auth.access_token)
    const cookieOptions = { 
      sameSite: 'strict', 
      path: '/', 
      expires: new Date(claims.exp*1000)
    }

    if(PUBLIC_APP_ENV === 'production'){ cookieOptions.domain = PUBLIC_COOKIE_DOMAIN }
    cookies.set('access_token', auth.access_token, cookieOptions)
    cookies.set('session_id', claims.sid, { sameSite: 'strict', path: '/', expires: new Date(claims.exp*1000), httpOnly: false })
    console.log(cookies.get('access_token'))

    if(auth.approved === true){
      redirect(302, `/meeting/${auth.connection_id}`)
    } else {
      redirect(302, '/organiser')
    }
  },
  attendee: async ({ request, cookies }) => {
    const token = cookies.get('access_token')

    const data = await request.formData()
    const values = Object.fromEntries( Object.entries( Object.fromEntries(data.entries()) ).filter(([_, value]) => value != "") )

    const response_tag = values.response_tag
    const password_hash = values.password_hash

    const res = await fetch(`${PUBLIC_SERVER_URL}/attendee/auth/finish`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 'User-Agent': request.headers.get('user-agent'),
          'X-Forwarded-For': request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')
        },
        body: JSON.stringify({
          response_tag: response_tag,
          password_hash: password_hash
        })
      }
    )
    
    if(!res.ok){ return fail(res.status, { error: await res.text()}) }

    const auth = await res.json()

    const claims = decodeJwt(auth.access_token)
    const cookieOptions = { 
      sameSite: 'strict', 
      path: '/', 
      expires: new Date(claims.exp*1000)
    }
    if(PUBLIC_APP_ENV === 'production'){ cookieOptions.domain = PUBLIC_COOKIE_DOMAIN }
    cookies.set('access_token', auth.access_token, cookieOptions)
    cookies.set('session_id', claims.sid, { sameSite: 'strict', path: '/', expires: new Date(claims.exp*1000), httpOnly: false })

    if(auth.approved === true){
      redirect(302, `/meeting/${auth.connection_id}`)
    } else {
      redirect(302, '/attendee')
    }
  },
  logout: async ({cookies, request}) => {
    const token = cookies.get('access_token')

    const res = await fetch(`${PUBLIC_SERVER_URL}/session`,
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'X-Forwarded-For': request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for') }
      }
    )

    if(!res.ok){ return fail(res.status, { error: await res.text()}) }

    cookies.delete('access_token', { path: '/' })
    cookies.delete('session_id', { path: '/' })

    return { success: true }
  }
}
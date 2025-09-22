import { PUBLIC_SERVER_URL } from '$env/static/public'
import { decodeJwt } from 'jose'

export async function load({ cookies, url, request }){
  const token = cookies.get('access_token')
  if(token){
    const claims = decodeJwt(token)
    const user = await fetch(`${PUBLIC_SERVER_URL}/${claims.role}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}`, 'X-Forwarded-For': request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')  }
    })

    if(!user.ok) {
      const session = await fetch(`${PUBLIC_SERVER_URL}/session`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'X-Forwarded-For': request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for') }
        }
      )

      if(session.ok){ cookies.delete('access_token', { path: '/' }) }
    } else {
      return { user: await user.json() }
    }
  }
}
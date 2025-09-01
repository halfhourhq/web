import { error, fail, redirect } from '@sveltejs/kit'
import { PUBLIC_SERVER_URL } from '$env/static/public'

export const actions = {
  create: async ({ request, cookies }) => {
    const token = cookies.get('access_token')
    const data = await request.formData()
    const values = Object.fromEntries( Object.entries( Object.fromEntries(data.entries()) ).filter(([_, value]) => value != "") )
    const name = values.name
    const date = values.date
    const time = values.time
    const public_key = values.public_key
    const keypair_salt = values.keypair_salt
    const password_hash = values.password_hash
    const password_salt = values.password_salt

    if(!date || !time){ return fail(400, { posterror: 'Please fill in both the date and time' }) }

    const start = new Date( date+'T'+time )
    const res = await fetch(`${PUBLIC_SERVER_URL}/organiser`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          name: name,
          start_time: start,
          public_key: public_key,
          keypair_salt: keypair_salt,
          password_salt: password_salt,
          password_hash: password_hash
        })
      }
    )
    
    if(!res.ok){ return fail(res.status, { error: await res.text()}) }

    return { organiser: await res.json() }
  }
}
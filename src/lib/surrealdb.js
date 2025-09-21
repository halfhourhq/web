import { Surreal } from 'surrealdb'
import { surrealdbWasmEngines } from '@surrealdb/wasm'

const db = new Surreal({
  engines: surrealdbWasmEngines(),
})

export default async function database(){
  await db.connect('indxdb://keys', {
    namespace: 'elela',
    database: 'keys'
  }).catch(err => {
    console.log(`Client database error: ${err.message}`)
  })
  return db
}
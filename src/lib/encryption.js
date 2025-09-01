import { x25519 } from '@noble/curves/ed25519'
import { hkdf } from '@noble/hashes/hkdf'
import { sha256 } from '@noble/hashes/sha2'
import { argon2id } from 'hash-wasm'
import { encodeHex, decodeHex } from '@std/encoding'

export async function encryptFileChunk(chunk, key, nonce, offset){
  const iv = new Uint8Array(16)
  iv.set(nonce)
  iv.set(uint32ToBytes(Math.floor(offset / 16)), 12)

  const content = await crypto.subtle.encrypt(
    { name: 'AES-CTR', counter: iv, length: 64 },
    key,
    chunk
  )

  return new Uint8Array([...iv, ...new Uint8Array(content)])
}

export async function encryptFile(chunk, key){
  const iv = crypto.getRandomValues(new Uint8Array(16))

  const content = await crypto.subtle.encrypt(
    { name: 'AES-CTR', counter: iv, length: 64 },
    key,
    chunk
  )

  return new Uint8Array([...iv, ...new Uint8Array(content)])
}

export async function decryptFile(chunk, key){
	const iv = chunk.slice(0, 16)
  const data = chunk.slice(16)

  return new Uint8Array(await crypto.subtle.decrypt(
    { name: 'AES-CTR', counter: iv, length: 64 },
    key,
    data
  ))
}

export async function deriveFileKey(hash, salt){
  const encoder = new TextEncoder()

  const material = await crypto.subtle.importKey(
    'raw',
    hash,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  )

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 10000,
      hash: 'SHA-256'
    },
    material,
    { name: 'AES-CTR', length: 128 },
    true,
    ['encrypt', 'decrypt']
  )
}

export async function hashAuthenticationPass(pass, salt){
  return await argon2id({
    password: authenticationPass(pass),
    salt: salt,
    memorySize: 64000,
    iterations: 3,
    hashLength: 32,
    outputType: 'hex',
    parallelism: 1
  })
}

export async function hashEncryptionPass(pass, salt){
  return await argon2id({
    password: encryptionPass(pass),
    salt: salt,
    memorySize: 64000,
    iterations: 3,
    hashLength: 32,
    outputType: 'hex',
    parallelism: 1
  })
}

export function generate_attendee_keypair(pass_hash, salt){
  const seed = hkdf(sha256, pass_hash, salt, 'attendee', 32)
  return x25519.keygen(seed)
}

export function generate_organiser_keypair(pass_hash, salt){
  const seed = hkdf(sha256, pass_hash, salt, 'organiser', 32)
  return x25519.keygen(seed)
}

export async function deriveSharedTextKey(material){
  return await crypto.subtle.importKey(
    'raw',
    material,
    { name: 'AES-GCM' },
    true,
    ['encrypt', 'decrypt']
  )
}

export async function deriveSharedFileKey(material){
  return await crypto.subtle.importKey(
    'raw',
    material,
    { name: 'AES-CTR' },
    true,
    ['encrypt', 'decrypt']
  )
}

export async function encryptText(text, key){
  const encoder = new TextEncoder()
  const iv = crypto.getRandomValues(new Uint8Array(12))

  const content =  await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encoder.encode(text)
  )

  const combined = new Uint8Array( [...iv, ...new Uint8Array(content)] )

  return encodeHex(combined)
}

export async function decryptText(text, key){
  const decoder = new TextDecoder()
  const content = decodeHex(text)
  const iv = content.subarray(0, 12)
  const slice = content.subarray(12)
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    slice
  )

  return decoder.decode(decrypted)
}

function authenticationPass(str){
  return str+' for authentication'
}

function encryptionPass(str){
  return str+' for encryption'
}

function uint32ToBytes(num) {
  const arr = new Uint8Array(4)
  
  arr[0] = (num >> 24) & 0xff
  arr[1] = (num >> 16) & 0xff
  arr[2] = (num >> 8)  & 0xff
  arr[3] = num         & 0xff
  return arr;
}
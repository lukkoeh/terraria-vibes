import { CHUNK_SIZE } from '../world/types'

export function rleEncode(arr: Uint16Array): number[] {
  const out: number[] = []
  let i = 0
  while (i < arr.length) {
    const val = arr[i]
    let count = 1
    while (i + count < arr.length && arr[i + count] === val && count < 0xffff) count++
    out.push(val, count)
    i += count
  }
  return out
}

export function rleDecode(data: number[]): Uint16Array {
  const out = new Uint16Array(CHUNK_SIZE * CHUNK_SIZE)
  let idx = 0
  for (let i=0;i<data.length;i+=2) {
    const val = data[i] | 0
    const count = data[i+1] | 0
    for (let c=0;c<count;c++) out[idx++] = val
  }
  return out
}


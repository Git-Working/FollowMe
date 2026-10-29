import { rooms, updateRooms } from '../utils/followEngine'
import { logActivity } from '../utils/activityLogger'

export default defineEventHandler(async (event) => {
  if (event.method === 'GET') {
    const list = Array.from(rooms.entries()).map(([id, entity]) => ({ id, entity }))
    return { ok: true, rooms: list }
  }

  if (event.method === 'POST') {
    const body = await readBody(event).catch(() => ({})) || {}
    const newRooms = body.rooms

    if (!newRooms || typeof newRooms !== 'object') {
      throw createError({ statusCode: 400, statusMessage: 'Ungültiges Format für rooms' })
    }

    updateRooms(newRooms)
    logActivity('system', `Räume aktualisiert: ${Object.keys(newRooms).join(', ')}`)

    const list = Array.from(rooms.entries()).map(([id, entity]) => ({ id, entity }))
    return { ok: true, rooms: list }
  }
})

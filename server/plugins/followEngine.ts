import { evaluateFollow, pruneUsers, rooms } from '../utils/followEngine'
import { logActivity } from '../utils/activityLogger'

export default defineNitroPlugin(() => {
  logActivity('system', `Nuxt/Nitro Server gestartet mit ${rooms.size} Räumen`)

  setInterval(() => {
    pruneUsers()
    evaluateFollow()
  }, 1000)
})

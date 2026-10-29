import { isTrackingActive, getFollowedMacs } from '../utils/followEngine'

export default defineEventHandler((event) => {
  setResponseHeader(event, 'content-type', 'text/plain')
  const lines = [`tracking=${isTrackingActive() ? 1 : 0}`]
  for (const mac of getFollowedMacs()) {
    lines.push(`mac=${mac}`)
  }
  return lines.join('\n') + '\n'
})

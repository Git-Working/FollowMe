import {
  activeUsers,
  isTrackingActive,
  rooms,
  isRoomLit,
  getLitRooms,
  getCalibration,
  getPathLighting,
} from '../utils/followEngine'
import { isHaConfigured, getHaUrl } from '../utils/haService'
import { getActivityLogs } from '../utils/activityLogger'

export default defineEventHandler(() => {
  const roomList = Array.from(rooms.entries()).map(([roomKey, entity]) => ({
    id: roomKey,
    entity,
    lit: isRoomLit(roomKey),
  }))

  return {
    active: isTrackingActive(),
    usersCount: activeUsers.size,
    users: Array.from(activeUsers.values()).map((u) => ({
      name: u.name,
      room: u.room,
      follow: u.follow,
    })),
    rooms: roomList,
    litRooms: getLitRooms(),
    calibration: getCalibration(),
    pathLighting: getPathLighting(),
    haConfigured: isHaConfigured(),
    haUrl: getHaUrl(),
    recentLogs: getActivityLogs(20),
  }
})

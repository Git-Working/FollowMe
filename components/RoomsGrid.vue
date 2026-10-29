<template>
  <section class="card">
    <div class="section-header">
      <div class="section-title">
        <svg viewBox="0 0 24 24">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
        <span>Räume & Beleuchtung</span>
      </div>
      <div class="header-right">
        <NuxtLink to="/rooms" class="manage-rooms-btn" title="Räume konfigurieren">
          Räume bearbeiten
        </NuxtLink>
        <span class="badge">{{ usersCount }} aktiv</span>
      </div>
    </div>

    <div class="rooms-grid">
      <div
        v-for="room in rooms"
        :key="room"
        class="room-tile"
        :class="{
          'is-occupied': active && currentRoom === room,
          'is-lit': litRooms.includes(room)
        }"
      >
        <div class="room-info">
          <div class="room-glyph">{{ getRoomIcon(room) }}</div>
          <div class="room-details">
            <div class="room-name">{{ formatRoomTitle(room) }}</div>
            <div class="room-signal-bar" :class="getSignalClass(room)">
              <div class="sig-meter">
                <div class="sig-bar"></div>
                <div class="sig-bar"></div>
                <div class="sig-bar"></div>
                <div class="sig-bar"></div>
              </div>
              <span>{{ getSignalText(room) }}</span>
            </div>
          </div>
        </div>

        <button
          class="light-toggle-btn"
          type="button"
          @click="$emit('toggleLight', room)"
        >
          <span>{{ litRooms.includes(room) ? '💡 AN' : '⚪ AUS' }}</span>
        </button>
      </div>

      <div v-if="rooms.length === 0" class="empty-text">
        Keine Räume konfiguriert
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { RoomSignal } from '../composables/useTracker'

const props = defineProps<{
  rooms: string[]
  active: boolean
  currentRoom: string | null
  litRooms: string[]
  signals: Record<string, RoomSignal>
  usersCount: number
}>()

defineEmits<{
  (e: 'toggleLight', room: string): void
}>()

function getRoomIcon(roomId: string) {
  const id = roomId.toLowerCase()
  if (id.includes('wohn')) return '🛋️'
  if (id.includes('kueche') || id.includes('küche')) return '🍳'
  if (id.includes('schlaf')) return '🛏️'
  if (id.includes('bad')) return '🚿'
  if (id.includes('buero') || id.includes('büro')) return '💻'
  if (id.includes('flur') || id.includes('diele')) return '🚪'
  return '🏠'
}

function formatRoomTitle(roomId: string) {
  return roomId.charAt(0).toUpperCase() + roomId.slice(1)
}

function getSignalText(room: string) {
  const sig = props.signals[room]
  const val = sig ? (sig.effectiveRssi || sig.rssi) : null
  return val !== null && val !== undefined ? `${val} dBm` : 'Kein Signal'
}

function getSignalClass(room: string) {
  const sig = props.signals[room]
  const val = sig ? (sig.effectiveRssi || sig.rssi) : null
  if (val === null || val === undefined) return ''
  if (val >= -65) return 'sig-good'
  if (val >= -80) return 'sig-med'
  return 'sig-low'
}
</script>

<style scoped>
.card {
  background: rgba(22, 30, 46, 0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 18px;
  box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.35);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.manage-rooms-btn {
  background: rgba(56, 189, 248, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.3);
  color: #38bdf8;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  transition: all 0.2s ease;
}

.manage-rooms-btn:active {
  transform: scale(0.95);
}

.section-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #94a3b8;
  letter-spacing: 0.02em;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title svg {
  width: 16px;
  height: 16px;
  fill: #64748b;
}

.badge {
  font-size: 0.75rem;
  color: #64748b;
}

.rooms-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.room-tile {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: rgba(15, 23, 42, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  transition: all 0.2s ease;
}

.room-tile.is-occupied {
  border-color: rgba(56, 189, 248, 0.45);
  background: rgba(56, 189, 248, 0.08);
}

.room-tile.is-lit {
  border-color: rgba(245, 158, 11, 0.45);
}

.room-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.room-glyph {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.room-tile.is-lit .room-glyph {
  background: rgba(245, 158, 11, 0.2);
  filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.5));
}

.room-details {
  text-align: left;
}

.room-name {
  font-weight: 600;
  font-size: 0.95rem;
  color: #f8fafc;
}

.room-signal-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: #64748b;
}

.sig-meter {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 12px;
}

.sig-bar {
  width: 3px;
  background: #334155;
  border-radius: 1px;
}
.sig-bar:nth-child(1) { height: 4px; }
.sig-bar:nth-child(2) { height: 7px; }
.sig-bar:nth-child(3) { height: 10px; }
.sig-bar:nth-child(4) { height: 13px; }

.sig-good .sig-bar { background: #10b981; }
.sig-med .sig-bar:nth-child(-n+3) { background: #f59e0b; }
.sig-low .sig-bar:nth-child(-n+2) { background: #ef4444; }

.light-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.05);
  color: #94a3b8;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.light-toggle-btn:active {
  transform: scale(0.95);
}

.room-tile.is-lit .light-toggle-btn {
  background: rgba(245, 158, 11, 0.2);
  border-color: rgba(245, 158, 11, 0.5);
  color: #fbbf24;
}

.empty-text {
  text-align: center;
  color: #64748b;
  font-size: 0.85rem;
  padding: 12px;
}
</style>

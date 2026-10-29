<template>
  <section class="card hero-card" :class="{ active }">
    <div class="power-btn-wrap">
      <div class="radar-ring"></div>
      <div class="radar-pulse"></div>
      <button class="power-btn" type="button" @click="$emit('toggle')">
        <svg viewBox="0 0 24 24">
          <path d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42A7.92 7.92 0 0 1 20 12c0 4.42-3.58 8-8 8s-8-3.58-8-8c0-2.45 1.1-4.64 2.85-6.13l-1.42-1.42A9.92 9.92 0 0 0 2 12c0 5.52 4.48 10 10 10s10-4.48 10-10c0-2.76-1.12-5.26-2.93-7.07l-.24-.76z"/>
        </svg>
        <span class="power-btn-label">{{ active ? 'STOP' : 'START' }}</span>
      </button>
    </div>

    <h2 class="hero-status-title">
      {{ active ? 'Tracking Aktiv' : 'Tracking Inaktiv' }}
    </h2>
    <p class="hero-status-desc">
      <template v-if="!active">
        Tippe auf START, um die automatische Licht-Steuerung zu starten
      </template>
      <template v-else-if="currentRoom">
        Licht folgt dir aktuell im <strong>{{ formatRoomTitle(currentRoom) }}</strong>
      </template>
      <template v-else>
        Suche Signal über ESP32-Beacons & Wi-Fi...
      </template>
    </p>

    <!-- Current Room Banner -->
    <div class="current-room-pill">
      <div class="room-label-group">
        <div class="room-icon-badge">
          {{ !active ? '🏠' : (currentRoom ? getRoomIcon(currentRoom) : '🔍') }}
        </div>
        <div>
          <div class="room-name-text">
            {{ !active ? 'Tracking Pausiert' : (currentRoom ? formatRoomTitle(currentRoom) : 'Raum wird gesucht...') }}
          </div>
          <div class="room-sub-text">
            {{ !active ? 'Tippe oben auf START' : (currentRoom ? 'Präsenz erkannt' : 'Nähere dich einem Raum-Sensor') }}
          </div>
        </div>
      </div>
      <span class="rssi-badge" :title="rssiTooltip">
        {{ currentRssiText }}
      </span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  active: boolean
  currentRoom: string | null
  currentRssi?: number | null
}>()

defineEmits<{
  (e: 'toggle'): void
}>()

function getRoomIcon(roomId: string | null) {
  const id = (roomId || '').toLowerCase()
  if (id.includes('wohn') || id.includes('living')) return '🛋️'
  if (id.includes('kueche') || id.includes('küche') || id.includes('kitchen')) return '🍳'
  if (id.includes('schlaf') || id.includes('bed')) return '🛏️'
  if (id.includes('bad') || id.includes('bath')) return '🚿'
  if (id.includes('buero') || id.includes('büro') || id.includes('office')) return '💻'
  if (id.includes('flur') || id.includes('hall') || id.includes('diele')) return '🚪'
  if (id.includes('balkon') || id.includes('garten')) return '🌿'
  return '🏠'
}

function formatRoomTitle(roomId: string | null) {
  if (!roomId) return 'Unbekannt'
  return roomId.charAt(0).toUpperCase() + roomId.slice(1)
}

const currentRssiText = computed(() => {
  if (!props.active) return '-- dBm'
  if (props.currentRssi !== undefined && props.currentRssi !== null) {
    return `${props.currentRssi} dBm`
  }
  return props.currentRoom ? 'Aktiv' : '-- dBm'
})

const rssiTooltip = computed(() => {
  if (!props.currentRssi) return 'Signalstärke in Dezibel-Milliwatt (dBm)'
  if (props.currentRssi >= -65) return 'Sehr starkes Signal (nahe am Sensor)'
  if (props.currentRssi >= -80) return 'Gutes Signal'
  return 'Schwaches Signal (durch Wände)'
})
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
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.hero-card {
  position: relative;
  text-align: center;
  padding: 24px 18px 20px;
  overflow: hidden;
}

.hero-card.active {
  border-color: rgba(16, 185, 129, 0.4);
}

.power-btn-wrap {
  position: relative;
  width: 140px;
  height: 140px;
  margin: 6px auto 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.radar-ring {
  position: absolute;
  inset: -12px;
  border-radius: 50%;
  border: 2px dashed rgba(56, 189, 248, 0.2);
  opacity: 0;
  pointer-events: none;
}

.active .radar-ring {
  opacity: 1;
  animation: spinRadar 12s linear infinite;
  border-color: rgba(16, 185, 129, 0.4);
}

.radar-pulse {
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  background: rgba(16, 185, 129, 0.3);
  opacity: 0;
  pointer-events: none;
}

.active .radar-pulse {
  animation: pulseWave 2.2s cubic-bezier(0.24, 0, 0.38, 1) infinite;
}

@keyframes spinRadar {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulseWave {
  0% { transform: scale(0.92); opacity: 0.8; }
  70% { transform: scale(1.3); opacity: 0; }
  100% { transform: scale(1.3); opacity: 0; }
}

.power-btn {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: none;
  outline: none;
  cursor: pointer;
  background: linear-gradient(145deg, #1e293b, #0f172a);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.15);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 2;
}

.power-btn:active {
  transform: scale(0.93);
}

.power-btn svg {
  width: 44px;
  height: 44px;
  fill: #64748b;
  transition: all 0.3s ease;
}

.power-btn-label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
}

.hero-card.active .power-btn {
  background: linear-gradient(145deg, #059669, #047857);
  box-shadow: 0 12px 30px -4px rgba(16, 185, 129, 0.5), inset 0 2px 2px rgba(255, 255, 255, 0.3);
}

.hero-card.active .power-btn svg {
  fill: #ffffff;
}

.hero-card.active .power-btn-label {
  color: #ffffff;
}

.hero-status-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.hero-status-desc {
  font-size: 0.88rem;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.current-room-pill {
  margin-top: 14px;
  padding: 10px 16px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.active .current-room-pill {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.3);
}

.room-label-group {
  display: flex;
  align-items: center;
  gap: 10px;
  text-align: left;
}

.room-icon-badge {
  font-size: 1.3rem;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
}

.room-name-text {
  font-size: 0.95rem;
  font-weight: 600;
  color: #f8fafc;
}

.room-sub-text {
  font-size: 0.75rem;
  color: #64748b;
}

.rssi-badge {
  font-size: 0.75rem;
  font-weight: 600;
  font-family: ui-monospace, SFMono-Regular, monospace;
  padding: 4px 8px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.3);
  color: #38bdf8;
}
</style>

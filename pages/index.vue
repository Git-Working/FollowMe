<template>
  <div class="dashboard-stack">
    <!-- 1. Hero Radar Controller -->
    <HeroRadar
      :active="active"
      :current-room="currentRoom"
      :current-rssi="currentRoomRssi"
      :has-mac="Boolean(mac.trim())"
      :signal-count="Object.keys(roomSignals).length"
      @toggle="toggleTracking"
    />

    <!-- Error Toast -->
    <div v-if="errorMsg" class="error-toast">
      {{ errorMsg }}
    </div>

    <!-- 2. Settings Card -->
    <SettingsCard
      v-model:name="name"
      v-model:mac="mac"
      v-model:follow="follow"
      v-model:keep-screen-awake="keepScreenAwake"
      :active="active"
      @change="saveLocalState"
    />

    <!-- 3. Path Lighting Card -->
    <PathLightingCard :rooms="knownRooms" />

    <!-- 4. Signal Calibration Card -->
    <CalibrationCard :rooms="knownRooms" :signals="roomSignals" />

    <!-- 5. Webhooks Card -->
    <WebhooksCard :name="name" :mac="mac" />

    <!-- 6. Widgets Card -->
    <WidgetsCard :name="name" :mac="mac" />

    <!-- 7. Rooms & Lighting Grid -->
    <RoomsGrid
      :rooms="knownRooms"
      :active="active"
      :current-room="currentRoom"
      :lit-rooms="litRooms"
      :signals="roomSignals"
      :users-count="usersCount"
      @toggle-light="toggleRoomLight"
    />

    <!-- 8. Quick Actions -->
    <QuickActions
      @clap="simulateClap"
      @refresh="fetchStatus"
    />

    <!-- 9. Activity Feed -->
    <ActivityFeed :logs="recentLogs" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTracker } from '../composables/useTracker'

const {
  active,
  currentRoom,
  knownRooms,
  litRooms,
  roomSignals,
  usersCount,
  recentLogs,
  errorMsg,
  name,
  mac,
  follow,
  keepScreenAwake,
  toggleTracking,
  fetchStatus,
  toggleRoomLight,
  simulateClap,
  saveLocalState,
} = useTracker()

const currentRoomRssi = computed(() => {
  if (!currentRoom.value) return null
  const sig = roomSignals[currentRoom.value]
  return sig ? (sig.effectiveRssi || sig.rssi) : null
})
</script>

<style scoped>
.dashboard-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.error-toast {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #fca5a5;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 0.85rem;
  text-align: left;
}
</style>

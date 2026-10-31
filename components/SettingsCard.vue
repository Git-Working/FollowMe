<template>
  <section class="card">
    <div class="section-header">
      <div class="section-title">
        <svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
        <span>Einstellungen</span>
      </div>
    </div>

    <div class="form-group">
      <!-- Nickname -->
      <div>
        <label class="field-label">Name oder Gerätename:</label>
        <div class="input-wrapper">
          <input
            v-model="name"
            class="text-input"
            type="text"
            maxlength="40"
            placeholder="z.B. Alex oder Mein iPhone"
            autocomplete="nickname"
            :disabled="active"
            @change="$emit('change')"
          />
        </div>
        <p class="field-hint">Wird im Aktivitäts-Feed und in der Raumübersicht angezeigt.</p>
      </div>

      <!-- Follow Me Toggle -->
      <label class="toggle-row">
        <div class="toggle-label">
          <span class="toggle-title">Licht folgt mir</span>
          <span class="toggle-desc">
            Schaltet im aktuellen Raum automatisch das Licht ein und beim Verlassen nach 5 Sekunden wieder aus.
          </span>
        </div>
        <div class="switch">
          <input
            v-model="follow"
            type="checkbox"
            :disabled="active"
            @change="$emit('change')"
          />
          <span class="slider"></span>
        </div>
      </label>

      <!-- MAC Configuration -->
      <div style="padding-top: 4px;">
        <label class="field-label">WLAN-MAC-Adresse deines Smartphones:</label>
        <div class="input-wrapper">
          <input
            :value="mac"
            class="text-input mac-input"
            type="text"
            inputmode="text"
            autocapitalize="characters"
            autocomplete="off"
            spellcheck="false"
            placeholder="AA:BB:CC:DD:EE:FF"
            maxlength="17"
            :disabled="active"
            @input="handleMacInput"
          />
        </div>
        <p class="field-hint">
          Die ESP32-Sensoren lauschen auf diese Adresse, um deine Entfernung zu messen.
        </p>

        <button type="button" class="guide-btn" @click="guideOpen = !guideOpen">
          Wie finde ich meine MAC-Adresse?
        </button>

        <div class="guide-box expandable" :class="{ open: guideOpen }">
          <div>
            <strong>iPhone (iOS):</strong><br />
            Einstellungen → WLAN → tippe auf das (i) neben deinem Heim-WLAN.<br />
            Wichtig: Schalte <em>„Private WLAN-Adresse"</em> aus — sonst ändert sich die Adresse täglich.
          </div>
          <div>
            <strong>Android:</strong><br />
            Einstellungen → WLAN → Zahnrad neben deinem Netzwerk → Erweitert → auf <em>„Geräte-MAC verwenden"</em> stellen.
          </div>
        </div>
      </div>

      <!-- Wake Lock Toggle -->
      <label class="toggle-row">
        <div class="toggle-label">
          <span class="toggle-title">Display wachhalten</span>
          <span class="toggle-desc">
            Verhindert, dass das Display in den Standby schaltet — nützlich wenn das Handy auf dem Tisch liegt.
          </span>
        </div>
        <div class="switch">
          <input
            v-model="keepScreenAwake"
            type="checkbox"
            @change="$emit('change')"
          />
          <span class="slider"></span>
        </div>
      </label>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  active: boolean
}>()

const emit = defineEmits<{
  (e: 'change'): void
}>()

const name = defineModel<string>('name', { default: '' })
const mac = defineModel<string>('mac', { default: '' })
const follow = defineModel<boolean>('follow', { default: true })
const keepScreenAwake = defineModel<boolean>('keepScreenAwake', { default: false })

const guideOpen = ref(false)

function handleMacInput(e: Event) {
  const target = e.target as HTMLInputElement
  let val = target.value.replace(/[^0-9a-fA-F]/g, '').toUpperCase()
  if (val.length > 12) val = val.slice(0, 12)
  const parts: string[] = []
  for (let i = 0; i < val.length; i += 2) {
    parts.push(val.slice(i, i + 2))
  }
  mac.value = parts.join(':')
  emit('change')
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

.form-group {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field-label {
  font-size: 0.78rem;
  color: #94a3b8;
  display: block;
  margin-bottom: 4px;
}

.field-hint {
  font-size: 0.72rem;
  color: #64748b;
  margin-top: 4px;
  line-height: 1.35;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.text-input {
  width: 100%;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 0.95rem;
  color: #f8fafc;
  outline: none;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.text-input:focus {
  border-color: #38bdf8;
  background: rgba(15, 23, 42, 0.9);
}

.mac-input {
  font-family: ui-monospace, SFMono-Regular, monospace;
  letter-spacing: 0.05em;
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
  cursor: pointer;
}

.toggle-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: left;
  flex: 1;
  padding-right: 12px;
}

.toggle-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #f8fafc;
}

.toggle-desc {
  font-size: 0.78rem;
  color: #64748b;
  line-height: 1.35;
}

.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 30px;
  flex-shrink: 0;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: #334155;
  transition: 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
  border-radius: 34px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 24px;
  width: 24px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

input:checked + .slider {
  background-color: #10b981;
}

input:checked + .slider:before {
  transform: translateX(20px);
}

.expandable {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: max-height 0.3s ease, opacity 0.3s ease;
}

.expandable.open {
  max-height: 600px;
  opacity: 1;
}

.guide-btn {
  background: transparent;
  border: none;
  color: #38bdf8;
  font-size: 0.78rem;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: 6px 0 2px;
}

.guide-box {
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 12px;
  margin-top: 8px;
  font-size: 0.8rem;
  color: #94a3b8;
  display: flex;
  flex-direction: column;
  gap: 8px;
  line-height: 1.4;
}

.guide-box strong {
  color: #f8fafc;
}
</style>

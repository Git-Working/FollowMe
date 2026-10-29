<template>
  <section class="card">
    <div class="section-header">
      <div class="section-title">
        <svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:#64748b;flex-shrink:0"><path d="M17 1H7c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zm0 18H7V5h10v14zm-5 2c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/></svg>
        <span>Homescreen-Shortcuts</span>
      </div>
      <button type="button" class="guide-btn" @click="isOpen = !isOpen">
        <span>{{ isOpen ? 'Schliessen ▲' : 'Anleitung ▼' }}</span>
      </button>
    </div>

    <p class="desc-text">Tracking und Modi direkt vom Startbildschirm steuern.</p>

    <div class="expandable" :class="{ open: isOpen }">
      <div class="tabs-bar">
        <button
          type="button"
          class="tab-btn"
          :class="{ active: currentTab === 'ios' }"
          @click="currentTab = 'ios'"
        >
          iPhone (iOS)
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: currentTab === 'android' }"
          @click="currentTab = 'android'"
        >
          Android
        </button>
      </div>

      <!-- iOS Guide -->
      <div v-if="currentTab === 'ios'" class="platform-content">
        <div class="step-card">
          <strong>1. Kurzbefehl erstellen</strong>
          <p>
            App <em>Kurzbefehle</em> oeffnen &rarr; oben rechts auf <strong>+</strong> tippen.<br />
            Aktion hinzufuegen: <em>Inhalte von URL abrufen</em> (Methode: GET).
          </p>
        </div>

        <div class="step-card">
          <strong>2. URL einfuegen</strong>
          <div class="widget-url-list">
            <div class="widget-row">
              <div class="widget-meta">
                <span class="widget-tag green">Tracking Start</span>
                <span class="widget-hint">Startet die Raumerkennung</span>
                <span v-if="!mac.trim()" class="inline-mac-warn">Keine MAC hinterlegt</span>
              </div>
              <button
                class="mini-copy-btn"
                :disabled="!mac.trim()"
                :class="{ 'btn-disabled': !mac.trim() }"
                @click="copy(startUrl, 'start')"
              >
                {{ copiedKey === 'start' ? 'Kopiert' : 'Kopieren' }}
              </button>
            </div>
            <div class="widget-row">
              <div class="widget-meta">
                <span class="widget-tag red">Tracking Stop</span>
                <span class="widget-hint">Pausiert die Raumerkennung</span>
              </div>
              <button class="mini-copy-btn" @click="copy(stopUrl, 'stop')">
                {{ copiedKey === 'stop' ? 'Kopiert' : 'Kopieren' }}
              </button>
            </div>
            <div class="widget-row">
              <div class="widget-meta">
                <span class="widget-tag blue">Pfad-Licht umschalten</span>
                <span class="widget-hint">Flur-Licht-Modus ein/aus</span>
              </div>
              <button class="mini-copy-btn" @click="copy(togglePathUrl, 'path')">
                {{ copiedKey === 'path' ? 'Kopiert' : 'Kopieren' }}
              </button>
            </div>
            <div class="widget-row">
              <div class="widget-meta">
                <span class="widget-tag orange">Klatsch-Test</span>
                <span class="widget-hint">Licht per simuliertem Klatsch schalten</span>
              </div>
              <button class="mini-copy-btn" @click="copy(clapUrl, 'clap')">
                {{ copiedKey === 'clap' ? 'Kopiert' : 'Kopieren' }}
              </button>
            </div>
          </div>
        </div>

        <div class="step-card">
          <strong>3. Als Widget auf den Homescreen</strong>
          <p>
            Homescreen gedrückt halten &rarr; oben links <em>Bearbeiten &rarr; Widget hinzufuegen</em> &rarr; <em>Kurzbefehle</em> waehlen. So entstehen echte 1-Klick-Tasten direkt auf dem Display.
          </p>
        </div>
      </div>

      <!-- Android Guide -->
      <div v-if="currentTab === 'android'" class="platform-content">
        <div class="step-card">
          <div class="step-card-header">
            <svg viewBox="0 0 24 24" class="step-card-icon green-icon"><path d="M17 1H7c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zm0 18H7V5h10v14z"/></svg>
            <strong>HTTP Shortcuts <span class="badge-recommended">empfohlen</span></strong>
          </div>
          <p class="step-intro">
            Die kostenlose Play-Store-App <em>HTTP Shortcuts</em> (von Waboodoo) erstellt echte Homescreen-Icons und Widgets — auch <strong>ohne HTTPS</strong>.
          </p>
          <ol class="step-list">
            <li><em>HTTP Shortcuts</em> im Play Store installieren.</li>
            <li>Neue Verknüpfung anlegen → Methode <strong>GET</strong> → URL unten kopieren &amp; einfügen.</li>
            <li>Verknüpfung gedrückt halten → <em>Zum Startbildschirm hinzufügen</em>.</li>
            <li>Für ein Widget: Homescreen gedrückt halten → Widgets → <em>HTTP Shortcuts</em>.</li>
          </ol>
        </div>

        <div class="note-card">
          <div class="note-header">
            <svg viewBox="0 0 24 24" class="note-icon"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
            <strong>Warum kein Shortcut-Menü?</strong>
          </div>
          <p>
            Über Chrome <span class="note-arrow">→</span> <em>Zum Startbildschirm hinzufügen</em> entsteht nur eine
            <strong>Verknüpfung auf die Website</strong> — kein vollständig installiertes App-Icon.
          </p>
          <p>
            Das Langdruck-Menü mit Start&nbsp;/&nbsp;Stop&nbsp;/&nbsp;Klatsch setzt eine echte
            <strong>PWA-Installation</strong> voraus, die der Browser nur über
            <strong>HTTPS</strong> erlaubt.
          </p>
        </div>

        <div class="step-card">
          <strong>URLs zum Einfuegen</strong>
          <div class="widget-url-list">
            <div class="widget-row">
              <div class="widget-meta">
                <span class="widget-tag green">Tracking Start</span>
                <span class="widget-hint">Startet die Raumerkennung</span>
                <span v-if="!mac.trim()" class="inline-mac-warn">Keine MAC hinterlegt</span>
              </div>
              <button
                class="mini-copy-btn"
                :disabled="!mac.trim()"
                :class="{ 'btn-disabled': !mac.trim() }"
                @click="copy(startUrl, 'start')"
              >
                {{ copiedKey === 'start' ? 'Kopiert' : 'Kopieren' }}
              </button>
            </div>
            <div class="widget-row">
              <div class="widget-meta">
                <span class="widget-tag red">Tracking Stop</span>
                <span class="widget-hint">Pausiert die Raumerkennung</span>
              </div>
              <button class="mini-copy-btn" @click="copy(stopUrl, 'stop')">
                {{ copiedKey === 'stop' ? 'Kopiert' : 'Kopieren' }}
              </button>
            </div>
            <div class="widget-row">
              <div class="widget-meta">
                <span class="widget-tag blue">Pfad-Licht umschalten</span>
                <span class="widget-hint">Flur-Licht-Modus ein/aus</span>
              </div>
              <button class="mini-copy-btn" @click="copy(togglePathUrl, 'path')">
                {{ copiedKey === 'path' ? 'Kopiert' : 'Kopieren' }}
              </button>
            </div>
            <div class="widget-row">
              <div class="widget-meta">
                <span class="widget-tag orange">Klatsch-Test</span>
                <span class="widget-hint">Licht per simuliertem Klatsch schalten</span>
              </div>
              <button class="mini-copy-btn" @click="copy(clapUrl, 'clap')">
                {{ copiedKey === 'clap' ? 'Kopiert' : 'Kopieren' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useHaptics } from '../composables/useHaptics'

const props = defineProps<{
  name: string
  mac: string
}>()

const isOpen = ref(false)
const currentTab = ref<'ios' | 'android'>('ios')
const copiedKey = ref<string | null>(null)
const { vibrate } = useHaptics()

const host = computed(() => {
  return typeof window !== 'undefined' ? window.location.host : 'localhost:3000'
})

const startUrl = computed(() => {
  const encodedName = encodeURIComponent(props.name.trim() || 'Handy')
  return `http://${host.value}/api/action/start?mac=${props.mac.trim()}&name=${encodedName}`
})

const stopUrl = computed(() => {
  return `http://${host.value}/api/action/stop?mac=${props.mac.trim()}`
})

const togglePathUrl = computed(() => {
  return `http://${host.value}/api/action/mode?type=path&toggle=1`
})

const clapUrl = computed(() => {
  return `http://${host.value}/api/action/simulate-clap`
})

async function copy(text: string, key: string) {
  vibrate(20)
  try {
    await navigator.clipboard.writeText(text)
    copiedKey.value = key
    setTimeout(() => { copiedKey.value = null }, 1600)
  } catch (_) {}
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
  margin-bottom: 8px;
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

.desc-text {
  font-size: 0.8rem;
  color: #64748b;
  margin-bottom: 8px;
}

.guide-btn {
  background: transparent;
  border: none;
  color: #38bdf8;
  font-size: 0.82rem;
  cursor: pointer;
  padding: 4px 0;
}

.tabs-bar {
  display: flex;
  gap: 8px;
  margin: 10px 0 14px;
}

.tab-btn {
  flex: 1;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(15, 23, 42, 0.6);
  color: #94a3b8;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn.active {
  background: rgba(56, 189, 248, 0.15);
  border-color: rgba(56, 189, 248, 0.4);
  color: #38bdf8;
}

.platform-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.step-card {
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 12px;
  font-size: 0.78rem;
  color: #94a3b8;
  line-height: 1.45;
}

.step-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.step-card-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.green-icon { fill: #10b981; }

.badge-recommended {
  font-size: 0.68rem;
  font-weight: 600;
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 4px;
  padding: 1px 6px;
  margin-left: 4px;
  vertical-align: middle;
}

.step-intro {
  margin: 0 0 10px 0;
  color: #94a3b8;
}

.step-list {
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  color: #94a3b8;
}

.step-list li {
  line-height: 1.45;
}

.note-card {
  background: rgba(251, 191, 36, 0.06);
  border: 1px solid rgba(251, 191, 36, 0.25);
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 0.78rem;
  color: #94a3b8;
  line-height: 1.5;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.note-header {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 2px;
}

.note-icon {
  width: 15px;
  height: 15px;
  fill: #fbbf24;
  flex-shrink: 0;
}

.note-card strong {
  color: #fbbf24;
  font-size: 0.82rem;
}

.note-card p {
  margin: 0;
}

.note-arrow {
  color: #64748b;
  font-size: 0.85rem;
}

.step-card strong {
  color: #f8fafc;
  display: block;
  margin-bottom: 4px;
}

.widget-url-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
}

.widget-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.widget-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.widget-tag { font-size: 0.78rem; font-weight: 600; }
.widget-tag.green  { color: #10b981; }
.widget-tag.red    { color: #ef4444; }
.widget-tag.blue   { color: #38bdf8; }
.widget-tag.orange { color: #f59e0b; }

.widget-hint {
  font-size: 0.68rem;
  color: #64748b;
}

.inline-mac-warn {
  font-size: 0.68rem;
  color: #fbbf24;
}

.btn-disabled {
  opacity: 0.4;
  cursor: not-allowed !important;
}

.mini-copy-btn {
  padding: 5px 10px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.08);
  color: #f8fafc;
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}
.mini-copy-btn:active { transform: scale(0.94); }

.expandable {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: max-height 0.3s ease, opacity 0.3s ease;
}

.expandable.open {
  max-height: 900px;
  opacity: 1;
}
</style>

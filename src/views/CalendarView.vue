<script setup>
import { computed, ref } from 'vue'
import { dateStr, fmtDateLabel, todayStr } from '../utils/format.js'
import { MONTHS_L, MONTHS_S } from '../utils/constants.js'
import MonthGrid from '../components/Calendar/MonthGrid.vue'
import WeekGrid from '../components/Calendar/WeekGrid.vue'
import DayEventsCard from '../components/Calendar/DayEventsCard.vue'
import CategoryManager from '../components/Calendar/CategoryManager.vue'

const now = new Date()
const calMode = ref('month')
const showCatMgr = ref(false)
const calSel = ref(null)

const calView = ref({ y: now.getFullYear(), m: now.getMonth() })
const monthLabel = computed(() => `${MONTHS_L[calView.value.m]} ${calView.value.y}`)

const initialWeekStart = new Date(now)
initialWeekStart.setDate(now.getDate() - now.getDay())
const calWeekStart = ref(initialWeekStart)
const weekLabel = computed(() => {
  const start = calWeekStart.value
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return `${MONTHS_S[start.getMonth()]} ${start.getDate()} – ${MONTHS_S[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`
})

const calDayDate = ref(new Date(now))
const dayModeDateStr = computed(() => dateStr(calDayDate.value))
const isToday = computed(() => dayModeDateStr.value === todayStr())
const dayModeLabel = computed(() => (isToday.value ? 'Today' : fmtDateLabel(dayModeDateStr.value).split(',')[0]))

function selectMode(mode) {
  calMode.value = mode
  showCatMgr.value = false
}

function selectDay(ds) {
  if (calMode.value === 'month') {
    calSel.value = calSel.value === ds ? null : ds
  } else {
    calSel.value = ds
  }
}

function navigate(dir) {
  if (calMode.value === 'month') {
    let { y, m } = calView.value
    m += dir
    if (m > 11) {
      m = 0
      y++
    }
    if (m < 0) {
      m = 11
      y--
    }
    calView.value = { y, m }
  } else if (calMode.value === 'week') {
    const d = new Date(calWeekStart.value)
    d.setDate(d.getDate() + dir * 7)
    calWeekStart.value = d
  } else {
    const d = new Date(calDayDate.value)
    d.setDate(d.getDate() + dir)
    calDayDate.value = d
  }
}
</script>

<template>
  <div class="view-tabs">
    <button
      v-for="m in ['month', 'week', 'day']"
      :key="m"
      class="mode-btn"
      :class="{ active: calMode === m && !showCatMgr }"
      @click="selectMode(m)"
    >
      {{ m.charAt(0).toUpperCase() + m.slice(1) }}
    </button>
    <div style="flex: 1"></div>
    <button class="mode-btn" :class="{ active: showCatMgr }" @click="showCatMgr = !showCatMgr">🎨 Categories</button>
  </div>

  <CategoryManager v-if="showCatMgr" />

  <template v-else-if="calMode === 'month'">
    <div class="nav-row">
      <button class="cal-nav-btn" @click="navigate(-1)">‹</button>
      <span class="nav-label">{{ monthLabel }}</span>
      <button class="cal-nav-btn" @click="navigate(1)">›</button>
    </div>
    <MonthGrid :year="calView.y" :month="calView.m" :selected-date="calSel" @select-day="selectDay" />
    <div v-if="calSel" class="card day-panel"><DayEventsCard :date-str="calSel" :title="fmtDateLabel(calSel)" /></div>
  </template>

  <template v-else-if="calMode === 'week'">
    <div class="nav-row">
      <button class="cal-nav-btn" @click="navigate(-1)">‹</button>
      <span class="nav-label" style="font-size: 14px">{{ weekLabel }}</span>
      <button class="cal-nav-btn" @click="navigate(1)">›</button>
    </div>
    <WeekGrid :week-start="calWeekStart" @select-day="selectDay" />
    <div v-if="calSel" class="card day-panel"><DayEventsCard :date-str="calSel" :title="fmtDateLabel(calSel)" /></div>
  </template>

  <template v-else>
    <div class="day-mode-nav">
      <button class="cal-nav-btn" @click="navigate(-1)">‹</button>
      <div class="day-mode-center">
        <div class="day-mode-num" :class="{ today: isToday }">{{ calDayDate.getDate() }}</div>
        <div class="day-mode-sub">{{ fmtDateLabel(dayModeDateStr) }}</div>
      </div>
      <button class="cal-nav-btn" @click="navigate(1)">›</button>
    </div>
    <div class="card"><DayEventsCard :date-str="dayModeDateStr" :title="dayModeLabel" /></div>
  </template>
</template>

<style scoped>
.view-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 14px;
  align-items: center;
}
.mode-btn {
  padding: 5px 14px;
  border-radius: var(--radius-full);
  font-size: 12px;
  background: var(--color-surface-raised);
  color: var(--color-text-muted);
}
.mode-btn.active {
  background: var(--color-primary);
  color: #fff;
  font-weight: 500;
}
.nav-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.nav-label {
  font-size: 15px;
  font-weight: 500;
}
.day-panel {
  margin-top: 12px;
}
.day-mode-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.day-mode-center {
  text-align: center;
}
.day-mode-num {
  font-size: 22px;
  font-weight: 600;
}
.day-mode-num.today {
  color: var(--color-primary);
}
.day-mode-sub {
  font-size: 12px;
  color: var(--color-text-muted);
}
</style>

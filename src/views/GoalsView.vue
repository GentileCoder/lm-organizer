<script setup>
import { computed, ref } from 'vue'
import { useOrganizerStore } from '../stores/organizer.js'
import GoalCard from '../components/Goals/GoalCard.vue'

const organizerStore = useOrganizerStore()
const newGoalText = ref('')
const activeGoalId = ref(null)

const goals = computed(() => organizerStore.data.goals)
const activeGoal = computed(() => goals.value.find(g => g.id === activeGoalId.value) || goals.value[0] || null)

function pctFor(goal) {
  const tasks = goal.tasks || []
  return tasks.length ? Math.round((tasks.filter(t => t.done).length / tasks.length) * 100) : 0
}

function addGoal() {
  const text = newGoalText.value.trim()
  if (!text) return
  const goal = organizerStore.addGoal(text)
  activeGoalId.value = goal.id
  newGoalText.value = ''
}
</script>

<template>
  <div class="add-row">
    <input v-model="newGoalText" type="text" placeholder="New goal…" @keydown.enter="addGoal" />
    <button class="pbtn" @click="addGoal">Add</button>
  </div>

  <p v-if="!goals.length" class="empty">No goals yet.</p>

  <template v-else>
    <div class="pill-tabs">
      <button
        v-for="goal in goals"
        :key="goal.id"
        class="pill-tab"
        :class="{ active: activeGoal && activeGoal.id === goal.id }"
        @click="activeGoalId = goal.id"
      >
        {{ goal.text }} <span class="pct">{{ pctFor(goal) }}%</span>
      </button>
    </div>

    <GoalCard v-if="activeGoal" :key="activeGoal.id" :goal="activeGoal" />
  </template>
</template>

<style scoped>
.pct {
  opacity: 0.75;
}
</style>

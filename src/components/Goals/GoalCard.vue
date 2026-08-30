<script setup>
import { computed, ref } from 'vue'
import { useOrganizerStore } from '../../stores/organizer.js'

const props = defineProps({ goal: { type: Object, required: true } })
const organizerStore = useOrganizerStore()

const newTaskText = ref('')
const doneCount = computed(() => props.goal.tasks.filter(t => t.done).length)
const pct = computed(() =>
  props.goal.tasks.length ? Math.round((doneCount.value / props.goal.tasks.length) * 100) : 0
)

function addTask() {
  const text = newTaskText.value.trim()
  if (!text) return
  organizerStore.addGoalTask(props.goal.id, text)
  newTaskText.value = ''
}

function onPlanBlur(e) {
  organizerStore.saveGoalPlan(props.goal.id, e.target.value)
}
</script>

<template>
  <div class="card">
    <div class="title-row">
      <span class="title">{{ goal.text }}</span>
      <button class="del-btn" @click="organizerStore.deleteGoal(goal.id)">✕</button>
    </div>

    <div class="progress-block">
      <div class="progress-label">
        <span class="section-label">Progress</span>
        <span class="progress-pct">{{ pct }}%</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: pct + '%' }"></div>
      </div>
      <div v-if="goal.tasks.length" class="progress-note">
        {{ doneCount }} of {{ goal.tasks.length }} tasks completed
      </div>
      <div v-else class="progress-note faint">Add tasks to track progress</div>
    </div>

    <div class="plan-block">
      <div class="section-label" style="margin-bottom: 6px">Plan</div>
      <textarea
        :value="goal.plan"
        placeholder="Describe your approach, milestones, key steps…"
        style="min-height: 90px"
        @blur="onPlanBlur"
      ></textarea>
    </div>

    <div class="section-label" style="margin-bottom: 10px">Tasks</div>
    <p v-if="!goal.tasks.length" class="no-tasks">No tasks yet.</p>
    <div v-for="task in goal.tasks" :key="task.id" class="task-row">
      <div class="check" :class="{ done: task.done }" @click="organizerStore.toggleGoalTask(goal.id, task.id)"></div>
      <span class="task-text" :class="{ done: task.done }">{{ task.text }}</span>
      <button class="del-btn" @click="organizerStore.deleteGoalTask(goal.id, task.id)">✕</button>
    </div>

    <div class="add-task-row">
      <input v-model="newTaskText" type="text" placeholder="Add task…" @keydown.enter="addTask" />
      <button class="sbtn" @click="addTask">Add</button>
    </div>
  </div>
</template>

<style scoped>
.title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 14px;
}
.title {
  font-weight: 600;
  font-size: 16px;
  flex: 1;
  line-height: 1.3;
}
.progress-block {
  margin-bottom: 16px;
}
.progress-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.progress-pct {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-primary);
}
.progress-track {
  background: var(--color-border);
  border-radius: 4px;
  height: 8px;
}
.progress-fill {
  background: var(--color-primary);
  height: 8px;
  border-radius: 4px;
  transition: width 0.3s ease;
}
.progress-note {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-top: 5px;
}
.progress-note.faint {
  color: var(--color-text-faint);
}
.plan-block {
  margin-bottom: 16px;
}
.no-tasks {
  font-size: 13px;
  color: var(--color-text-faint);
  margin-bottom: 4px;
}
.task-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border);
}
.check {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  cursor: pointer;
  flex-shrink: 0;
}
.check.done {
  border-color: var(--color-success);
  background: var(--color-success);
}
.task-text {
  flex: 1;
  font-size: 14px;
}
.task-text.done {
  text-decoration: line-through;
  color: var(--color-text-faint);
}
.add-task-row {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--color-border);
}
</style>

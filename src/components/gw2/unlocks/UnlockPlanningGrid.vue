<script setup lang="ts">
import { unlockFieldPlanningRows } from '@/content/unlockFieldPlanning'
</script>

<template>
  <section class="field-plan" aria-label="Unlock field planning grid">
    <h3>Unlock Field Planning Grid</h3>
    <p>Shared placement guide for all unlock categories.</p>

    <div class="field-plan__table-wrap">
      <table>
        <thead>
          <tr>
            <th>Property</th>
            <th>Applies To</th>
            <th>Source</th>
            <th>Placement</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="field in unlockFieldPlanningRows" :key="field.property">
            <td>{{ field.property }}</td>
            <td>{{ field.appliesTo }}</td>
            <td>{{ field.source }}</td>
            <td>{{ field.placement }}</td>
            <td>{{ field.notes }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.field-plan {
  display: grid;
  gap: 0.5rem;
  border: 1px solid var(--ui-border);
  border-radius: 12px;
  background: #fff;
  padding: 0.75rem;
}

.field-plan h3 {
  margin: 0;
  font-size: 1rem;
}

.field-plan p {
  margin: 0;
  color: var(--ui-muted);
  font-size: 0.9rem;
}

.field-plan__table-wrap {
  overflow-x: auto;
}

.field-plan table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}

.field-plan th,
.field-plan td {
  border: 1px solid var(--ui-border);
  padding: 0.4rem 0.5rem;
  text-align: left;
  vertical-align: top;
}

.field-plan th {
  background: #f6f9fc;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
</style>

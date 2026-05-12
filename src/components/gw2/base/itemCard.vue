<script setup lang="ts">
interface Props {
  name: string
  imageUrl?: string
  owned?: boolean
  costText?: string
}

defineProps<Props>()
</script>

<template>
  <article class="unlock-tile" :class="{ 'unlock-tile--locked': !owned }">
    <div class="unlock-tile__media">
      <div class="unlock-tile__frame">
        <img v-if="imageUrl" :src="imageUrl" :alt="name" class="unlock-tile__image" />
        <div v-else class="unlock-tile__image unlock-tile__image--empty" aria-hidden="true" />
      </div>

      <div class="unlock-tile__cost" aria-hidden="true">
        {{ costText ?? '' }}
      </div>
    </div>

    <div class="unlock-tile__hover">
      <slot name="hover" />
    </div>
  </article>
</template>

<style scoped>
.unlock-tile {
  position: relative;
  width: 100%;
  min-width: 0;
}

.unlock-tile:focus-within,
.unlock-tile:hover {
  z-index: 2;
}

.unlock-tile__media {
  display: grid;
  gap: 0;
  border: 3px solid #d4af37;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  transition:
    transform 140ms ease,
    box-shadow 140ms ease,
    opacity 140ms ease,
    filter 140ms ease;
}

.unlock-tile:hover .unlock-tile__media,
.unlock-tile:focus-within .unlock-tile__media {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgb(23 69 90 / 14%);
}

.unlock-tile--locked .unlock-tile__media {
  opacity: 0.38;
  filter: saturate(0.55);
}

.unlock-tile--locked:hover .unlock-tile__media,
.unlock-tile--locked:focus-within .unlock-tile__media {
  opacity: 1;
  filter: none;
}

.unlock-tile__frame {
  aspect-ratio: 1 / 1;
  background: linear-gradient(180deg, #f8f1d2, #e7d38f);
}

.unlock-tile__image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.unlock-tile__image--empty {
  background:
    linear-gradient(135deg, rgb(255 255 255 / 48%) 25%, transparent 25%) -8px 0 / 16px 16px,
    linear-gradient(225deg, rgb(255 255 255 / 48%) 25%, transparent 25%) -8px 0 / 16px 16px,
    linear-gradient(315deg, rgb(255 255 255 / 28%) 25%, transparent 25%) 0 0 / 16px 16px,
    linear-gradient(45deg, rgb(255 255 255 / 28%) 25%, #d4af37 25%) 0 0 / 16px 16px;
}

.unlock-tile__cost {
  min-height: 1.45rem;
  padding: 0.18rem 0.35rem;
  border-top: 3px solid #d4af37;
  background: #d4af37;
  color: #111;
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 1.1;
  text-align: center;
}

.unlock-tile__hover {
  position: absolute;
  left: 0;
  top: calc(100% + 0.45rem);
  z-index: 5;
  opacity: 0;
  transform: translateY(-2px);
  pointer-events: none;
  transition:
    opacity 140ms ease,
    transform 140ms ease;
}

.unlock-tile:hover .unlock-tile__hover,
.unlock-tile:focus-within .unlock-tile__hover {
  opacity: 1;
  transform: translateY(0);
}
</style>

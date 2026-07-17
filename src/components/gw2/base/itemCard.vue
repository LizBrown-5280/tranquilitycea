<script setup lang="ts">
interface Props {
  name: string
  imageUrl?: string
  swatchColor?: string
  owned?: boolean
  costText?: string
}

defineProps<Props>()
</script>

<template>
  <article class="item-tile" :class="{ 'item-tile--locked': !owned }">
    <div class="item-tile__media">
      <div class="item-tile__frame">
        <div
          v-if="swatchColor"
          class="item-tile__swatch"
          :style="{ background: swatchColor }"
          aria-hidden="true"
        />
        <img v-else-if="imageUrl" :src="imageUrl" :alt="name" class="item-tile__image" />
        <div v-else class="item-tile__image item-tile__image--empty" aria-hidden="true" />
      </div>

      <div class="item-tile__cost" aria-hidden="true">
        {{ costText ?? '' }}
      </div>
    </div>

    <div class="item-tile__hover">
      <slot name="hover" />
    </div>
  </article>
</template>

<style scoped>
.item-tile {
  position: relative;
  width: 100%;
  min-width: 0;
}

.item-tile:focus-within,
.item-tile:hover {
  z-index: 2;
}

.item-tile__media {
  display: grid;
  gap: 0;
  border: 3px solid #2a2a2a;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  transition:
    transform 140ms ease,
    box-shadow 140ms ease,
    opacity 140ms ease,
    filter 140ms ease;
}

.item-tile:hover .item-tile__media,
.item-tile:focus-within .item-tile__media {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgb(23 69 90 / 14%);
}

.item-tile--locked .item-tile__media {
  opacity: 0.38;
  filter: saturate(0.55);
}

.item-tile--locked:hover .item-tile__media,
.item-tile--locked:focus-within .item-tile__media {
  opacity: 1;
  filter: none;
}

.item-tile__frame {
  aspect-ratio: 1 / 1;
  background: linear-gradient(180deg, #f8f1d2, #e7d38f);
}

.item-tile__image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-tile__swatch {
  width: 100%;
  height: 100%;
}

.item-tile__image--empty {
  background:
    linear-gradient(135deg, rgb(255 255 255 / 48%) 25%, transparent 25%) -8px 0 / 16px 16px,
    linear-gradient(225deg, rgb(255 255 255 / 48%) 25%, transparent 25%) -8px 0 / 16px 16px,
    linear-gradient(315deg, rgb(255 255 255 / 28%) 25%, transparent 25%) 0 0 / 16px 16px,
    linear-gradient(45deg, rgb(255 255 255 / 28%) 25%, #2a2a2a 25%) 0 0 / 16px 16px;
}

.item-tile__cost {
  min-height: 1.45rem;
  padding: 0.18rem 0.35rem;
  border-top: 3px solid #2a2a2a;
  background: #2a2a2a;
  color: #eee;
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 1.1;
  text-align: center;
}

.item-tile__hover {
  position: absolute;
  left: 0;
  top: calc(100% - 0.3rem);
  z-index: 5;
  opacity: 0;
  transform: translateY(-8px);
  pointer-events: none;
  transition:
    opacity 140ms ease,
    transform 140ms ease;
}

.item-tile:hover .item-tile__hover,
.item-tile:focus-within .item-tile__hover {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}
</style>

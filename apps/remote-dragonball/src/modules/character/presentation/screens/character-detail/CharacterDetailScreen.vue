<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { useCharacterDetailViewModel } from './useCharacterDetailViewModel'

const route = useRoute()
const { detail, isLoading, error } = useCharacterDetailViewModel(Number(route.params.id))
</script>

<template>
  <section class="mx-auto max-w-2xl p-6">
    <RouterLink :to="{ name: 'character-list' }" class="text-sm text-orange-600 hover:underline">
      ← Back to Dragon Ball
    </RouterLink>

    <p v-if="isLoading" class="mt-6 text-gray-500">Loading…</p>
    <p v-else-if="error" role="alert" class="mt-6 rounded bg-red-50 p-4 text-red-700">
      {{ error }}
    </p>

    <article
      v-else-if="detail"
      class="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
    >
      <header class="flex items-start gap-6">
        <img :src="detail.imageUrl" :alt="detail.name" class="h-48 w-32 object-contain" />
        <div>
          <h1 class="text-3xl font-bold">{{ detail.name }}</h1>
          <ul class="mt-2 flex flex-wrap gap-2">
            <li
              v-for="tag in [detail.race, detail.gender, detail.affiliation]"
              :key="tag"
              class="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700"
            >
              {{ tag }}
            </li>
          </ul>
          <p class="mt-3 text-sm text-gray-600">{{ detail.kiLabel }} · {{ detail.maxKiLabel }}</p>
        </div>
      </header>

      <p class="mt-6 text-sm leading-relaxed text-gray-700">{{ detail.description }}</p>

      <template v-if="detail.originPlanet">
        <h2 class="mt-6 mb-2 text-lg font-semibold">Origin planet</h2>
        <div class="flex items-center gap-4">
          <img
            :src="detail.originPlanet.imageUrl"
            :alt="detail.originPlanet.name"
            class="h-16 w-16 object-contain"
          />
          <div>
            <p class="font-semibold">{{ detail.originPlanet.name }}</p>
            <p class="text-xs text-gray-500">{{ detail.originPlanet.statusLabel }}</p>
          </div>
        </div>
      </template>

      <template v-if="detail.transformations.length">
        <h2 class="mt-6 mb-2 text-lg font-semibold">Transformations</h2>
        <ul class="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <li
            v-for="transformation in detail.transformations"
            :key="transformation.id"
            class="rounded border border-gray-200 p-3 text-center"
          >
            <img
              :src="transformation.imageUrl"
              :alt="transformation.name"
              class="mx-auto h-24 w-20 object-contain"
              loading="lazy"
            />
            <p class="mt-2 text-sm font-semibold">{{ transformation.name }}</p>
            <p class="text-xs text-gray-400">{{ transformation.kiLabel }}</p>
          </li>
        </ul>
      </template>
    </article>
  </section>
</template>

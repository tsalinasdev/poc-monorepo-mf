<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { usePokemonDetailViewModel } from './usePokemonDetailViewModel'

const route = useRoute()
const { detail, isLoading, error } = usePokemonDetailViewModel(route.params.name as string)
</script>

<template>
  <section class="mx-auto max-w-2xl p-6">
    <RouterLink :to="{ name: 'pokemon-list' }" class="text-sm text-red-600 hover:underline">
      ← Back to Pokédex
    </RouterLink>

    <p v-if="isLoading" class="mt-6 text-gray-500">Loading…</p>
    <p v-else-if="error" role="alert" class="mt-6 rounded bg-red-50 p-4 text-red-700">
      {{ error }}
    </p>

    <article
      v-else-if="detail"
      class="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
    >
      <header class="flex items-center gap-6">
        <img :src="detail.imageUrl" :alt="detail.name" class="h-40 w-40 object-contain" />
        <div>
          <p class="text-sm text-gray-400">{{ detail.numberLabel }}</p>
          <h1 class="text-3xl font-bold">{{ detail.name }}</h1>
          <ul class="mt-2 flex gap-2">
            <li
              v-for="type in detail.types"
              :key="type"
              class="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700"
            >
              {{ type }}
            </li>
          </ul>
          <p class="mt-3 text-sm text-gray-600">
            {{ detail.heightLabel }} · {{ detail.weightLabel }}
          </p>
        </div>
      </header>

      <h2 class="mt-6 mb-2 text-lg font-semibold">Base stats</h2>
      <ul class="space-y-2">
        <li v-for="stat in detail.stats" :key="stat.label" class="flex items-center gap-3">
          <span class="w-20 shrink-0 text-sm text-gray-500">{{ stat.label }}</span>
          <span class="w-10 shrink-0 text-right text-sm font-semibold">{{ stat.value }}</span>
          <div class="h-2 grow rounded bg-gray-100">
            <div class="h-2 rounded bg-red-500" :style="{ width: `${stat.percent}%` }" />
          </div>
        </li>
      </ul>
    </article>
  </section>
</template>

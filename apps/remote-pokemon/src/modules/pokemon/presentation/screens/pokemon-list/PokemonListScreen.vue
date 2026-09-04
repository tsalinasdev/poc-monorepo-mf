<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { usePokemonListViewModel } from './usePokemonListViewModel'

const { cards, page, totalPages, isLoading, error, nextPage, prevPage } = usePokemonListViewModel()
</script>

<template>
  <section class="mx-auto max-w-5xl p-6">
    <h1 class="mb-6 text-3xl font-bold text-red-600">Pokédex</h1>

    <p v-if="isLoading" class="text-gray-500">Loading…</p>
    <p v-else-if="error" role="alert" class="rounded bg-red-50 p-4 text-red-700">{{ error }}</p>

    <template v-else>
      <ul class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        <li v-for="card in cards" :key="card.id">
          <RouterLink
            :to="{ name: 'pokemon-detail', params: { name: card.slug } }"
            class="block rounded-lg border border-gray-200 bg-white p-4 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <img
              :src="card.imageUrl"
              :alt="card.name"
              class="mx-auto h-24 w-24 object-contain"
              loading="lazy"
            />
            <p class="mt-2 text-xs text-gray-400">{{ card.numberLabel }}</p>
            <p class="font-semibold">{{ card.name }}</p>
          </RouterLink>
        </li>
      </ul>

      <footer class="mt-8 flex items-center justify-center gap-4">
        <button
          class="rounded bg-red-600 px-4 py-2 text-white disabled:opacity-40"
          :disabled="page <= 1"
          @click="prevPage"
        >
          ← Prev
        </button>
        <span class="text-sm text-gray-600">Page {{ page }} of {{ totalPages }}</span>
        <button
          class="rounded bg-red-600 px-4 py-2 text-white disabled:opacity-40"
          :disabled="totalPages > 0 && page >= totalPages"
          @click="nextPage"
        >
          Next →
        </button>
      </footer>
    </template>
  </section>
</template>

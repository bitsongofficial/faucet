<script setup lang="ts">
const props = defineProps<{ error: { statusCode: number; message: string } }>()

const handleClear = () => clearError({ redirect: '/' })
</script>

<template>
  <div>
    <h1>{{ props.error.statusCode }}</h1>
    <p>{{ props.error.message }}</p>
    <button @click="handleClear">Go home</button>
  </div>
</template>

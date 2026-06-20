<script setup lang="ts">
import { computed } from 'vue';
import { useFEAStore } from '../store/fea';
import type { ElementWarning } from '../types';

const store = useFEAStore();

const selectedEl = computed(() => {
  if (store.selectedElement === null) return null;
  return store.model.elements.find((e) => e.id === store.selectedElement) || null;
});

const node1 = computed(() => {
  if (!selectedEl.value) return null;
  return store.model.nodes.find((n) => n.id === selectedEl.value!.nodeIds[0]) || null;
});

const node2 = computed(() => {
  if (!selectedEl.value) return null;
  return store.model.nodes.find((n) => n.id === selectedEl.value!.nodeIds[1]) || null;
});

const length = computed(() => {
  if (!node1.value || !node2.value) return 0;
  const dx = node2.value.x - node1.value.x;
  const dy = node2.value.y - node1.value.y;
  return Math.sqrt(dx * dx + dy * dy);
});

const angle = computed(() => {
  if (!node1.value || !node2.value) return 0;
  const dx = node2.value.x - node1.value.x;
  const dy = node2.value.y - node1.value.y;
  return (Math.atan2(dy, dx) * 180) / Math.PI;
});

const color = computed(() => {
  if (store.selectedElement === null) return '#6b7280';
  return store.elementColors.get(store.selectedElement) || '#6b7280';
});

const warnings = computed<ElementWarning[]>(() => {
  if (store.selectedElement === null) return [];
  return store.elementWarnings.get(store.selectedElement) || [];
});

function warningLabel(type: string): string {
  switch (type) {
    case 'stress': return '应力';
    case 'strain': return '应变';
    case 'force': return '轴力';
    default: return type;
  }
}

function warningUnit(type: string): string {
  switch (type) {
    case 'stress': return 'MPa';
    case 'strain': return '%';
    case 'force': return 'kN';
    default: return '';
  }
}

function formatWarningValue(type: string, value: number): string {
  switch (type) {
    case 'stress': return (value / 1e6).toFixed(2);
    case 'strain': return (value * 100).toFixed(4);
    case 'force': return (value / 1000).toFixed(2);
    default: return value.toFixed(2);
  }
}

function isOverThreshold(type: string, value: number): boolean {
  if (!store.result) return false;
  const el = selectedEl.value;
  if (!el) return false;
  const absVal = Math.abs(value);
  switch (type) {
    case 'stress':
      return store.thresholds.stressEnabled && absVal > store.thresholds.stress;
    case 'strain':
      return store.thresholds.strainEnabled && absVal > store.thresholds.strain;
    case 'force':
      return store.thresholds.forceEnabled && absVal > store.thresholds.force;
    default:
      return false;
  }
}
</script>

<template>
  <div class="bg-slate-800 rounded-lg p-4">
    <h3 class="text-sm font-bold text-slate-200 border-b border-slate-700 pb-2 mb-3">
      单元详情
    </h3>

    <div v-if="!selectedEl" class="text-xs text-slate-500 text-center py-6">
      点击一个单元查看详情
    </div>

    <div v-else class="space-y-2 text-xs">
      <!-- Warning banner -->
      <div v-if="warnings.length > 0" class="bg-red-950/60 border border-red-700 rounded-lg p-2.5 mb-2 animate-pulse">
        <div class="text-[11px] font-bold text-red-400 mb-1.5 flex items-center gap-1">
          <span>⚠️</span>
          <span>危险！超出阈值</span>
        </div>
        <div class="space-y-1">
          <div v-for="w in warnings" :key="w.type" class="text-[10px] text-red-300 flex justify-between items-center">
            <span>{{ warningLabel(w.type) }}</span>
            <span class="font-mono font-bold">
              {{ formatWarningValue(w.type, w.value) }} {{ warningUnit(w.type) }}
              <span class="text-red-500/80 font-normal">/ {{ formatWarningValue(w.type, w.threshold) }}</span>
            </span>
          </div>
        </div>
      </div>

      <!-- Color indicator -->
      <div class="flex items-center gap-2 mb-3">
        <div class="w-4 h-4 rounded" :style="{ backgroundColor: warnings.length > 0 ? '#ef4444' : color }" />
        <span class="text-slate-300 font-medium">单元 #{{ selectedEl.id }}</span>
        <span v-if="warnings.length > 0" class="ml-auto text-[10px] px-1.5 py-0.5 bg-red-900/60 text-red-400 rounded font-bold">
          DANGER
        </span>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <div class="bg-slate-900 rounded p-2">
          <div class="text-slate-400">连接节点</div>
          <div class="text-sm font-mono text-slate-200">
            {{ selectedEl.nodeIds[0] }} → {{ selectedEl.nodeIds[1] }}
          </div>
        </div>
        <div class="bg-slate-900 rounded p-2">
          <div class="text-slate-400">长度 / 角度</div>
          <div class="text-sm font-mono text-slate-200">
            {{ length.toFixed(3) }}m / {{ angle.toFixed(1) }}°
          </div>
        </div>
        <div class="bg-slate-900 rounded p-2">
          <div class="text-slate-400">截面积</div>
          <div class="text-sm font-mono text-slate-200">
            {{ (selectedEl.area * 1e6).toFixed(0) }} mm²
          </div>
        </div>
        <div class="bg-slate-900 rounded p-2">
          <div class="text-slate-400">弹性模量</div>
          <div class="text-sm font-mono text-slate-200">
            {{ (selectedEl.youngsModulus / 1e9).toFixed(0) }} GPa
          </div>
        </div>
      </div>

      <div class="border-t border-slate-700 pt-2 mt-2">
        <div class="text-slate-400 mb-1">计算结果</div>
        <div class="grid grid-cols-3 gap-2">
          <div
            class="rounded p-2 transition-colors"
            :class="isOverThreshold('stress', selectedEl.stress) ? 'bg-red-950/60 border border-red-700' : 'bg-slate-900'"
          >
            <div class="text-[10px]" :class="isOverThreshold('stress', selectedEl.stress) ? 'text-red-400 font-bold' : 'text-slate-500'">
              应力
              <span v-if="isOverThreshold('stress', selectedEl.stress)"> ⚠</span>
            </div>
            <div class="text-sm font-bold" :class="isOverThreshold('stress', selectedEl.stress) ? 'text-red-400' : ''" :style="!isOverThreshold('stress', selectedEl.stress) ? { color } : {}">
              {{ (selectedEl.stress / 1e6).toFixed(2) }}
              <span class="text-[10px]" :class="isOverThreshold('stress', selectedEl.stress) ? 'text-red-500/80' : 'text-slate-500'">MPa</span>
            </div>
          </div>
          <div
            class="rounded p-2 transition-colors"
            :class="isOverThreshold('strain', selectedEl.strain) ? 'bg-red-950/60 border border-red-700' : 'bg-slate-900'"
          >
            <div class="text-[10px]" :class="isOverThreshold('strain', selectedEl.strain) ? 'text-red-400 font-bold' : 'text-slate-500'">
              应变
              <span v-if="isOverThreshold('strain', selectedEl.strain)"> ⚠</span>
            </div>
            <div class="text-sm font-bold" :class="isOverThreshold('strain', selectedEl.strain) ? 'text-red-400' : 'text-sky-400'">
              {{ (selectedEl.strain * 100).toFixed(4) }}
              <span class="text-[10px]" :class="isOverThreshold('strain', selectedEl.strain) ? 'text-red-500/80' : 'text-slate-500'">%</span>
            </div>
          </div>
          <div
            class="rounded p-2 transition-colors"
            :class="isOverThreshold('force', selectedEl.force) ? 'bg-red-950/60 border border-red-700' : 'bg-slate-900'"
          >
            <div class="text-[10px]" :class="isOverThreshold('force', selectedEl.force) ? 'text-red-400 font-bold' : 'text-slate-500'">
              轴力
              <span v-if="isOverThreshold('force', selectedEl.force)"> ⚠</span>
            </div>
            <div class="text-sm font-bold" :class="isOverThreshold('force', selectedEl.force) ? 'text-red-400' : 'text-amber-400'">
              {{ (selectedEl.force / 1000).toFixed(2) }}
              <span class="text-[10px]" :class="isOverThreshold('force', selectedEl.force) ? 'text-red-500/80' : 'text-slate-500'">kN</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

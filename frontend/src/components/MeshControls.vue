<script setup lang="ts">
import { useFEAStore } from '../store/fea';

const store = useFEAStore();
</script>

<template>
  <div class="bg-slate-800 rounded-lg p-4 space-y-3">
    <h3 class="text-sm font-bold text-slate-200 border-b border-slate-700 pb-2">
      网格控制
    </h3>

    <!-- Preset buttons -->
    <div>
      <div class="text-xs text-slate-400 mb-1">预设模型</div>
      <div class="grid grid-cols-3 gap-1">
        <button
          @click="store.loadPreset('cantilever')"
          :class="store.selectedPreset === 'cantilever' ? 'bg-sky-700 text-white' : 'bg-slate-700 text-slate-400'"
          class="py-1.5 rounded text-[10px] font-medium hover:opacity-90 transition"
        >
          悬臂梁
        </button>
        <button
          @click="store.loadPreset('bridge')"
          :class="store.selectedPreset === 'bridge' ? 'bg-sky-700 text-white' : 'bg-slate-700 text-slate-400'"
          class="py-1.5 rounded text-[10px] font-medium hover:opacity-90 transition"
        >
          桥梁桁架
        </button>
        <button
          @click="store.loadPreset('frame')"
          :class="store.selectedPreset === 'frame' ? 'bg-sky-700 text-white' : 'bg-slate-700 text-slate-400'"
          class="py-1.5 rounded text-[10px] font-medium hover:opacity-90 transition"
        >
          简单框架
        </button>
      </div>
    </div>

    <!-- Solve button -->
    <button
      @click="store.solve()"
      class="w-full py-2 rounded text-xs font-bold bg-green-700 text-white hover:bg-green-600 transition"
    >
      ⚙ 求解 FEA
    </button>

    <!-- Deformed mesh toggle -->
    <label class="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        :checked="store.showDeformed"
        @change="store.toggleDeformed()"
        class="accent-sky-500"
      />
      <span class="text-xs text-slate-300">显示变形网格</span>
    </label>

    <!-- Deformation scale -->
    <div>
      <div class="flex justify-between text-xs text-slate-400 mb-1">
        <span>变形缩放</span>
        <span class="text-sky-400 font-mono">{{ store.deformationScale }}x</span>
      </div>
      <input
        type="range"
        min="1"
        max="100"
        :value="store.deformationScale"
        @input="store.deformationScale = Number(($event.target as HTMLInputElement).value)"
        class="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
      />
    </div>

    <!-- Heatmap mode -->
    <div>
      <div class="text-xs text-slate-400 mb-1">热力图模式</div>
      <div class="grid grid-cols-3 gap-1">
        <label class="cursor-pointer">
          <input type="radio" value="stress" v-model="store.heatmapMode" class="hidden peer" />
          <div class="text-center py-1.5 rounded text-[10px] font-medium peer-checked:bg-purple-700 peer-checked:text-white bg-slate-700 text-slate-400 transition">
            应力
          </div>
        </label>
        <label class="cursor-pointer">
          <input type="radio" value="strain" v-model="store.heatmapMode" class="hidden peer" />
          <div class="text-center py-1.5 rounded text-[10px] font-medium peer-checked:bg-purple-700 peer-checked:text-white bg-slate-700 text-slate-400 transition">
            应变
          </div>
        </label>
        <label class="cursor-pointer">
          <input type="radio" value="force" v-model="store.heatmapMode" class="hidden peer" />
          <div class="text-center py-1.5 rounded text-[10px] font-medium peer-checked:bg-purple-700 peer-checked:text-white bg-slate-700 text-slate-400 transition">
            轴力
          </div>
        </label>
      </div>
    </div>

    <!-- Display stats -->
    <div class="border-t border-slate-700 pt-2">
      <div class="grid grid-cols-2 gap-2 text-xs">
        <div class="bg-slate-900 rounded p-2">
          <div class="text-slate-400">最大应力</div>
          <div class="text-sm font-bold text-red-400">
            {{ store.result ? (store.maxStress / 1e6).toFixed(2) + ' MPa' : '—' }}
          </div>
        </div>
        <div class="bg-slate-900 rounded p-2">
          <div class="text-slate-400">最大位移</div>
          <div class="text-sm font-bold text-amber-400">
            {{ store.result ? (store.maxDisplacement * 1000).toFixed(3) + ' mm' : '—' }}
          </div>
        </div>
        <div class="bg-slate-900 rounded p-2">
          <div class="text-slate-400">单元数</div>
          <div class="text-sm font-bold text-slate-300">{{ store.model.elements.length }}</div>
        </div>
        <div class="bg-slate-900 rounded p-2">
          <div class="text-slate-400">节点数</div>
          <div class="text-sm font-bold text-slate-300">{{ store.model.nodes.length }}</div>
        </div>
      </div>
    </div>

    <!-- Danger thresholds -->
    <div class="border-t border-slate-700 pt-3">
      <h4 class="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1">
        <span>⚠️</span>
        <span>危险阈值告警</span>
      </h4>

      <!-- Stress threshold -->
      <div class="mb-3">
        <div class="flex items-center justify-between mb-1">
          <label class="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              :checked="store.thresholds.stressEnabled"
              @change="store.toggleThresholdEnabled('stress')"
              class="accent-red-500"
            />
            <span class="text-xs text-slate-300">应力上限</span>
          </label>
          <span class="text-[10px] text-slate-500">MPa</span>
        </div>
        <input
          type="number"
          step="10"
          min="0"
          :disabled="!store.thresholds.stressEnabled"
          :value="(store.thresholds.stress / 1e6).toFixed(0)"
          @input="store.setThreshold('stress', Number(($event.target as HTMLInputElement).value) * 1e6)"
          class="w-full px-2 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-red-400 font-mono focus:border-red-500 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
        />
      </div>

      <!-- Strain threshold -->
      <div class="mb-3">
        <div class="flex items-center justify-between mb-1">
          <label class="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              :checked="store.thresholds.strainEnabled"
              @change="store.toggleThresholdEnabled('strain')"
              class="accent-red-500"
            />
            <span class="text-xs text-slate-300">应变上限</span>
          </label>
          <span class="text-[10px] text-slate-500">%</span>
        </div>
        <input
          type="number"
          step="0.01"
          min="0"
          :disabled="!store.thresholds.strainEnabled"
          :value="(store.thresholds.strain * 100).toFixed(3)"
          @input="store.setThreshold('strain', Number(($event.target as HTMLInputElement).value) / 100)"
          class="w-full px-2 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-red-400 font-mono focus:border-red-500 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
        />
      </div>

      <!-- Force threshold -->
      <div class="mb-2">
        <div class="flex items-center justify-between mb-1">
          <label class="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              :checked="store.thresholds.forceEnabled"
              @change="store.toggleThresholdEnabled('force')"
              class="accent-red-500"
            />
            <span class="text-xs text-slate-300">轴力上限</span>
          </label>
          <span class="text-[10px] text-slate-500">kN</span>
        </div>
        <input
          type="number"
          step="10"
          min="0"
          :disabled="!store.thresholds.forceEnabled"
          :value="(store.thresholds.force / 1000).toFixed(0)"
          @input="store.setThreshold('force', Number(($event.target as HTMLInputElement).value) * 1000)"
          class="w-full px-2 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-red-400 font-mono focus:border-red-500 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
        />
      </div>

      <!-- Warning summary -->
      <div v-if="store.hasWarnings" class="mt-3 bg-red-950/40 border border-red-800/50 rounded p-2">
        <div class="text-[11px] font-bold text-red-400 mb-1">
          ⚠️ {{ store.elementWarnings.size }} 个单元超出阈值
        </div>
        <div class="text-[10px] text-red-300/80">
          请检查高亮显示的危险单元
        </div>
      </div>
    </div>
  </div>
</template>

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { FEAModel, FEAResult, ThresholdConfig, ElementWarning, ThresholdType } from '../types';
import {
  solve as feaSolve,
  presetCantileverBeam,
  presetBridgeTruss,
  presetSimpleFrame,
  jetColormap,
} from '../utils/fea-solver';

export const useFEAStore = defineStore('fea', () => {
  const model = ref<FEAModel>({ nodes: [], elements: [], loads: [] });
  const result = ref<FEAResult | null>(null);
  const selectedPreset = ref<string>('cantilever');
  const showDeformed = ref(false);
  const deformationScale = ref(10);
  const selectedElement = ref<number | null>(null);
  const heatmapMode = ref<'stress' | 'strain' | 'force'>('stress');

  const thresholds = ref<ThresholdConfig>({
    stress: 250e6,
    strain: 0.002,
    force: 100000,
    stressEnabled: false,
    strainEnabled: false,
    forceEnabled: false,
  });

  // ─── Actions ──────────────────────────────────────────────────────────────
  function loadPreset(name: string) {
    selectedPreset.value = name;
    result.value = null;
    selectedElement.value = null;
    switch (name) {
      case 'cantilever':
        model.value = presetCantileverBeam();
        break;
      case 'bridge':
        model.value = presetBridgeTruss();
        break;
      case 'frame':
        model.value = presetSimpleFrame();
        break;
      default:
        model.value = presetCantileverBeam();
    }
  }

  function solve() {
    result.value = feaSolve(model.value);
  }

  function toggleDeformed() {
    showDeformed.value = !showDeformed.value;
  }

  function selectElement(id: number | null) {
    selectedElement.value = id;
  }

  function setHeatmapMode(mode: 'stress' | 'strain' | 'force') {
    heatmapMode.value = mode;
  }

  function addLoad(nodeId: number, fx: number, fy: number) {
    model.value.loads.push({ nodeId, fx, fy });
  }

  function toggleFixed(nodeId: number) {
    const node = model.value.nodes.find((n) => n.id === nodeId);
    if (node) node.fixed = !node.fixed;
  }

  function setThreshold(type: ThresholdType, value: number) {
    thresholds.value[type] = value;
  }

  function toggleThresholdEnabled(type: ThresholdType) {
    const key = `${type}Enabled` as keyof ThresholdConfig;
    thresholds.value[key] = !thresholds.value[key] as any;
  }

  function setThresholds(config: Partial<ThresholdConfig>) {
    Object.assign(thresholds.value, config);
  }

  // ─── Computed ─────────────────────────────────────────────────────────────
  const maxStress = computed(() => {
    if (!result.value) return 0;
    return result.value.maxStress;
  });

  const maxDisplacement = computed(() => {
    if (!result.value) return 0;
    return result.value.maxDisplacement;
  });

  const elementColors = computed(() => {
    const colors = new Map<number, string>();
    if (!result.value || model.value.elements.length === 0) {
      for (const el of model.value.elements) {
        colors.set(el.id, '#6b7280');
      }
      return colors;
    }

    let values: number[];
    switch (heatmapMode.value) {
      case 'stress':
        values = result.value.stresses.map(Math.abs);
        break;
      case 'strain':
        values = result.value.strains.map(Math.abs);
        break;
      case 'force':
        values = model.value.elements.map((e) => Math.abs(e.force));
        break;
      default:
        values = result.value.stresses.map(Math.abs);
    }

    const min = Math.min(...values);
    const max = Math.max(...values);

    for (let i = 0; i < model.value.elements.length; i++) {
      colors.set(
        model.value.elements[i].id,
        jetColormap(values[i], min, max)
      );
    }
    return colors;
  });

  const elementWarnings = computed<Map<number, ElementWarning[]>>(() => {
    const warnings = new Map<number, ElementWarning[]>();
    if (!result.value) return warnings;

    for (let i = 0; i < model.value.elements.length; i++) {
      const el = model.value.elements[i];
      const elWarnings: ElementWarning[] = [];

      if (thresholds.value.stressEnabled) {
        const stressVal = Math.abs(result.value.stresses[i]);
        if (stressVal > thresholds.value.stress) {
          elWarnings.push({
            elementId: el.id,
            type: 'stress',
            value: stressVal,
            threshold: thresholds.value.stress,
          });
        }
      }

      if (thresholds.value.strainEnabled) {
        const strainVal = Math.abs(result.value.strains[i]);
        if (strainVal > thresholds.value.strain) {
          elWarnings.push({
            elementId: el.id,
            type: 'strain',
            value: strainVal,
            threshold: thresholds.value.strain,
          });
        }
      }

      if (thresholds.value.forceEnabled) {
        const forceVal = Math.abs(el.force);
        if (forceVal > thresholds.value.force) {
          elWarnings.push({
            elementId: el.id,
            type: 'force',
            value: forceVal,
            threshold: thresholds.value.force,
          });
        }
      }

      if (elWarnings.length > 0) {
        warnings.set(el.id, elWarnings);
      }
    }
    return warnings;
  });

  const hasWarnings = computed(() => {
    return elementWarnings.value.size > 0;
  });

  const warningElementIds = computed(() => {
    return new Set(elementWarnings.value.keys());
  });

  return {
    model,
    result,
    selectedPreset,
    showDeformed,
    deformationScale,
    selectedElement,
    heatmapMode,
    thresholds,
    maxStress,
    maxDisplacement,
    elementColors,
    elementWarnings,
    hasWarnings,
    warningElementIds,
    loadPreset,
    solve,
    toggleDeformed,
    selectElement,
    setHeatmapMode,
    addLoad,
    toggleFixed,
    setThreshold,
    toggleThresholdEnabled,
    setThresholds,
  };
});

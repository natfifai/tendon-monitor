import { Builder } from '@builder.io/react'
import FrequencyRing from '../components/FrequencyRing.jsx'
import BarChart from '../components/BarChart.jsx'
import RecordControls from '../components/RecordControls.jsx'
import StatusBar from '../components/StatusBar.jsx'
import { isBuilderConfigured } from '../services/builderSetup.js'

export function registerBuilderComponents() {
  if (!isBuilderConfigured) return

  Builder.registerComponent(FrequencyRing, {
    name: 'FrequencyRing',
    inputs: [
      { name: 'value', type: 'number', defaultValue: 0 },
      { name: 'maxValue', type: 'number', defaultValue: 2000 },
      { name: 'size', type: 'number', defaultValue: 240 },
      { name: 'strokeWidth', type: 'number', defaultValue: 20 },
      { name: 'label', type: 'string', defaultValue: 'Hz' },
    ],
    image: 'https://cdn.builder.io/api/v1/image/ring-placeholder.svg',
  })

  Builder.registerComponent(BarChart, {
    name: 'BarChart',
    inputs: [
      { name: 'readings', type: 'list', subFields: [
        { name: 'frequencyHz', type: 'number' },
        { name: 'createdAt', type: 'string' },
      ]},
      { name: 'maxValue', type: 'number', defaultValue: 2000 },
      { name: 'height', type: 'number', defaultValue: 120 },
    ],
  })

  Builder.registerComponent(RecordControls, {
    name: 'RecordControls',
    inputs: [
      { name: 'isRecording', type: 'boolean', defaultValue: false },
    ],
  })

  Builder.registerComponent(StatusBar, {
    name: 'StatusBar',
    inputs: [
      {
        name: 'status',
        type: 'string',
        defaultValue: 'online',
        enum: ['online', 'offline', 'checking'],
      },
      { name: 'isRecording', type: 'boolean', defaultValue: false },
    ],
  })
}

import { ConnInfo } from 'hono/conninfo'
import { ConnectorType, Impedance, Port, PortDirection, SignalLevel, StageDevice } from '../../domain/stage/Stage'
import { ActiveSpeaker15, Subwoofer18 } from '../../domain/stage/entities/outputs'
import { Mixer } from '../../domain/stage/entities/processors'
import {
  AudioPlayer,
  CondenserMicrophone,
  DynamicMicrophone,
  Guitar,
  Keyboard,
} from '../../domain/stage/entities/sources'

export type DeviceCatalogCategory = 'sources' | 'outputs' | 'processors'

export interface DevicePortSummary {
  id: string
  name: string
  connector: ConnectorType
  acceptedConnectors?: ConnectorType[]
  direction: PortDirection
  channels?: number
  signalLevel?: SignalLevel | SignalLevel[]
  impedance?: Impedance | Impedance[]
  providesPhantomPower?: boolean
  requiresPhantomPower?: boolean
}

export interface DeviceSummary {
  id: string
  name: string
  category: DeviceCatalogCategory
  ports: DevicePortSummary[]
  physicalPorts: DevicePortSummary[]
}

export interface DeviceCatalog {
  sources: DeviceSummary[]
  outputs: DeviceSummary[]
  processors: DeviceSummary[]
}

function summarizePortNames(names: string[]): string {
  const numberedNames = names.map((name) => {
    const match = name.match(/^(.*?)(\d+)$/)
    return match
      ? { prefix: match[1].trim(), number: Number(match[2]) }
      : null
  })

  const numberedGroups = new Map<string, number[]>()
  const plainNames: string[] = []

  numberedNames.forEach((numberedName, index) => {
    if (numberedName) {
      const numbers = numberedGroups.get(numberedName.prefix) ?? []
      numbers.push(numberedName.number)
      numberedGroups.set(numberedName.prefix, numbers)
    } else {
      plainNames.push(names[index])
    }
  })

  const summarizedGroups = [...numberedGroups].map(([prefix, numbers]) => {
    const sortedNumbers = numbers.sort((first, second) => first - second)
    const isConsecutive = sortedNumbers.every(
      (number, index) => index === 0 || number === sortedNumbers[index - 1] + 1,
    )

    return isConsecutive && sortedNumbers.length > 1
      ? `${prefix} ${sortedNumbers[0]} to ${sortedNumbers[sortedNumbers.length - 1]}`
      : sortedNumbers.map((number) => `${prefix} ${number}`).join(', ')
  })

  if (plainNames.length || summarizedGroups.length) {
    return [...plainNames, ...summarizedGroups].join(', ')
  }

  return names.join(', ')
}

function summarizePorts(ports: Port[]): DevicePortSummary[] {
  const groups = new Map<string, { summary: DevicePortSummary; names: string[] }>()

  for (const port of ports) {
    const summary: DevicePortSummary = {
      id: port.id,
      name: port.name,
      connector: port.connector,
      acceptedConnectors: port.acceptedConnectors,
      direction: port.direction,
      channels: port.maxChannels,
      signalLevel: port.signalLevel,
      impedance: port.impedance,
      providesPhantomPower: port.providesPhantomPower,
      requiresPhantomPower: port.requiresPhantomPower,
    }
    const signature = JSON.stringify({ ...summary, name: undefined })
    const group = groups.get(signature)

    if (group) {
      group.names.push(port.name)
    } else {
      groups.set(signature, { summary, names: [port.name] })
    }
  }

  return [...groups.values()].map(({ summary, names }) => ({
    ...summary,
    name: summarizePortNames(names),
  }))
}

function summarizePhysicalPorts(ports: Port[]): DevicePortSummary[] {
  return ports.map((port) => ({
    id: port.id,
    name: port.name,
    connector: port.connector,
    acceptedConnectors: port.acceptedConnectors,
    direction: port.direction,
    channels: port.maxChannels,
    signalLevel: port.signalLevel,
    impedance: port.impedance,
    providesPhantomPower: port.providesPhantomPower,
    requiresPhantomPower: port.requiresPhantomPower,
  }))
}

function summarizeDevice(device: StageDevice, category: DeviceCatalogCategory): DeviceSummary {
  const physicalPorts = [...device.inputs, ...device.outputs]

  return {
    id: device.id,
    name: device.name,
    category,
    ports: summarizePorts(physicalPorts),
    physicalPorts: summarizePhysicalPorts(physicalPorts),
  }
}

export function buildDeviceCatalog(): DeviceCatalog {
  const sources = [
    new Guitar('catalog-guitar'),
    new Keyboard('catalog-keyboard'),
    new AudioPlayer('catalog-audio-player'),
    new DynamicMicrophone('catalog-dynamic-microphone'),
    new CondenserMicrophone('catalog-condenser-microphone'),
  ]
  const outputs = [
    new Subwoofer18('catalog-subwoofer-18'),
    new ActiveSpeaker15('catalog-active-speaker-15'),
  ]
  const processors = [new Mixer('catalog-mixer')]

  return {
    sources: sources.map((device) => summarizeDevice(device, 'sources')),
    outputs: outputs.map((device) => summarizeDevice(device, 'outputs')),
    processors: processors.map((device) => summarizeDevice(device, 'processors')),
  }
}

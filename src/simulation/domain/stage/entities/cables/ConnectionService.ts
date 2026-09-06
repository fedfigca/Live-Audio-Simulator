import {
  ConnectorType,
  ConnectionState,
  PortDirection,
} from '../../Stage'
import { AudioCable, CableEndpoint } from './AudioCable'

const analogConnectors = new Set([
  ConnectorType.XLR,
  ConnectorType.TS,
  ConnectorType.TRS,
  ConnectorType.Combo,
  ConnectorType.RCA,
  ConnectorType.Custom,
])

export interface AudioPortLike {
  id: string
  deviceId?: string
  connector: ConnectorType
  acceptedConnectors?: Array<ConnectorType>
  direction: PortDirection
  signalLevel?: string
  state?: ConnectionState
}

function canReceive(port: AudioPortLike, source: AudioPortLike): boolean {
  if (port.direction === PortDirection.Output) return false
  if (port.acceptedConnectors?.length && !port.acceptedConnectors.includes(source.connector)) {
    return false
  }

  return !port.signalLevel || !source.signalLevel || port.signalLevel.includes(source.signalLevel)
}

function isSourcePort(port: AudioPortLike, other: AudioPortLike): boolean {
  return port.direction === PortDirection.Output && other.direction !== PortDirection.Output
}

export function canConnectAudioPorts(first: AudioPortLike, second: AudioPortLike): boolean {
  if (first.id === second.id && (!first.deviceId || !second.deviceId || first.deviceId === second.deviceId)) return false
  if (!analogConnectors.has(first.connector) || !analogConnectors.has(second.connector)) return false
  if (first.state === ConnectionState.Connected || second.state === ConnectionState.Connected) return false

  const source = isSourcePort(first, second) ? first : second
  const destination = source === first ? second : first

  if (source.direction !== PortDirection.Output && source.direction !== PortDirection.Bidirectional) return false
  if (destination.direction !== PortDirection.Input && destination.direction !== PortDirection.Bidirectional) return false

  return canReceive(destination, source)
}

export function createAudioCable(
  id: string,
  first: CableEndpoint,
  second: CableEndpoint,
  firstPort: AudioPortLike,
  secondPort: AudioPortLike,
): AudioCable | null {
  return canConnectAudioPorts(firstPort, secondPort)
    ? new AudioCable(id, first, second)
    : null
}

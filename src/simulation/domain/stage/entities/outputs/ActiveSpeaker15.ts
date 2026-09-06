import {
  ConnectorType,
  Impedance,
  PortDirection,
  SignalLevel,
  StagePosition,
} from '../../Stage'
import { OutputDevice } from './OutputDevice'

export class ActiveSpeaker15 extends OutputDevice {
  constructor(
    id: string,
    name = '15" Active Speaker',
    position?: StagePosition,
  ) {
    super(id, name, position)
    this.addAudioInput({
      name: 'Combo Input',
      connector: ConnectorType.Combo,
      acceptedConnectors: [ConnectorType.XLR, ConnectorType.TRS],
      direction: PortDirection.Input,
      maxChannels: 1,
      signalLevel: SignalLevel.Line,
      impedance: Impedance.High,
    })
  }

  processSignal(input: Float32Array | null): Float32Array | null {
    return this.passThroughSignal(input)
  }
}

import {
  ConnectorType,
  Impedance,
  PortDirection,
  SignalLevel,
  StagePosition,
} from '../../../Stage'
import { AudioSource } from '../AudioSource'

export class Keyboard extends AudioSource {
  constructor(
    id: string,
    name = 'Keyboard',
    position?: StagePosition,
  ) {
    super(id, name, position)
    this.addAudioOutput({
      name: 'Left Output',
      connector: ConnectorType.TRS,
      direction: PortDirection.Output,
      maxChannels: 1,
      signalLevel: SignalLevel.Line,
      impedance: Impedance.Low,
    })
    this.addAudioOutput({
      name: 'Right Output',
      connector: ConnectorType.TRS,
      direction: PortDirection.Output,
      maxChannels: 1,
      signalLevel: SignalLevel.Line,
      impedance: Impedance.Low,
    })
  }

  processSignal(input: Float32Array | null): Float32Array {
    return this.createSilentSignal(input)
  }
}

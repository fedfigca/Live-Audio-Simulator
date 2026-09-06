import {
  ConnectorType,
  Impedance,
  SignalLevel,
  StagePosition,
} from '../../../Stage'
import { AudioSource } from '../AudioSource'

export class DynamicMicrophone extends AudioSource {
  constructor(
    id: string,
    name = 'Dynamic Microphone',
    position?: StagePosition,
  ) {
    super(id, name, position)
    this.addAudioOutput(
      this.configureOutput(
        'Mono Output',
        ConnectorType.XLR,
        SignalLevel.Microphone,
        Impedance.Low,
      ),
    )
  }

  processSignal(input: Float32Array | null): Float32Array {
    return this.createSilentSignal(input)
  }
}

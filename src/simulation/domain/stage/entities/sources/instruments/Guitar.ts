import {
  ConnectorType,
  Impedance,
  StagePosition,
  SignalLevel,
} from '../../../Stage'
import { AudioSource } from '../AudioSource'

export class Guitar extends AudioSource {
  constructor(
    id: string,
    name = 'Guitar',
    position?: StagePosition,
  ) {
    super(id, name, position)
    this.addAudioOutput(
      this.configureOutput(
        'Mono Output',
        ConnectorType.TRS,
        SignalLevel.Instrument,
        Impedance.High,
      ),
    )
  }

  processSignal(input: Float32Array | null): Float32Array {
    return this.createSilentSignal(input)
  }
}

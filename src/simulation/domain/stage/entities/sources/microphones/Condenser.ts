import {
  ConnectorType,
  Impedance,
  PortDirection,
  SignalLevel,
  StagePosition,
} from '../../../Stage'
import { AudioSource } from '../AudioSource'

export class CondenserMicrophone extends AudioSource {
  constructor(
    id: string,
    name = 'Condenser Microphone',
    position?: StagePosition,
  ) {
    super(id, name, position)
    this.addAudioOutput({
      name: 'Mono Output',
      connector: ConnectorType.XLR,
      direction: PortDirection.Output,
      maxChannels: 1,
      signalLevel: SignalLevel.Microphone,
      impedance: Impedance.Low,
      requiresPhantomPower: true,
    })
  }

  processSignal(input: Float32Array | null): Float32Array {
    return this.createSilentSignal(input)
  }
}

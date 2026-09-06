import {
  ConnectorType,
  DeviceRole,
  Impedance,
  PortDirection,
  SignalLevel,
  StagePosition,
} from '../../Stage'
import { ProcessorDevice } from './ProcessorDevice'

export class Mixer extends ProcessorDevice {
  constructor(
    id: string,
    name = 'Mixer',
    position?: StagePosition,
  ) {
    super(id, name, DeviceRole.Mixer, position)

    for (let channel = 1; channel <= 8; channel += 1) {
      this.addAudioInput({
        name: `Input ${channel}`,
        connector: ConnectorType.Combo,
        acceptedConnectors: [ConnectorType.XLR, ConnectorType.TRS],        
        direction: PortDirection.Input,
        maxChannels: 1,
        signalLevel: [SignalLevel.Microphone, SignalLevel.Line, SignalLevel.Instrument],
        impedance: Impedance.High,
        providesPhantomPower: true,
      })
    }

    this.addLineOutput('Main Left')
    this.addLineOutput('Main Right')

    for (let aux = 1; aux <= 4; aux += 1) {
      this.addLineOutput(`Aux ${aux}`)
    }
  }

  processSignal(input: Float32Array | null): Float32Array | null {
    return this.passThroughSignal(input)
  }

  private addLineOutput(name: string): void {
    this.addAudioOutput({
      name,
      connector: ConnectorType.XLR,
      direction: PortDirection.Output,
      maxChannels: 1,
      signalLevel: SignalLevel.Line,
      impedance: Impedance.Low,
    })
  }
}

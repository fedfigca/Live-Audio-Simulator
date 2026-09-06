import {
  DeviceRole,
  Impedance,
  Port,
  PortDirection,
  SignalLevel,
  StageDevice,
  StagePosition,
} from '../../Stage'

export abstract class AudioSource extends StageDevice {
  protected constructor(
    id: string,
    name: string,
    position?: StagePosition,
  ) {
    super(id, name, DeviceRole.Source, position)
  }

  protected addAudioOutput(
    port: Omit<Port, 'id' | 'state' | 'connectedTo'>,
  ): Port {
    return this.addOutput(port)
  }

  protected createSilentSignal(input: Float32Array | null): Float32Array {
    return input ?? new Float32Array(128)
  }

  protected configureOutput(
    name: string,
    connector: Port['connector'],
    signalLevel: SignalLevel,
    impedance: Impedance,
  ): Omit<Port, 'id' | 'state' | 'connectedTo'> {
    return {
      name,
      connector,
      direction: PortDirection.Output,
      maxChannels: 1,
      signalLevel,
      impedance,
    }
  }
}

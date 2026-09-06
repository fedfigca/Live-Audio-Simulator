import {
  DeviceRole,
  Port,
  StageDevice,
  StagePosition,
} from '../../Stage'

/**
 * A system output device, such as a speaker or headphones.
 *
 * Its physical ports are inputs because signal flows into the device, even
 * though the device is an output of the audio system.
 */
export abstract class OutputDevice extends StageDevice {
  protected constructor(
    id: string,
    name: string,
    position?: StagePosition,
  ) {
    super(id, name, DeviceRole.Sink, position)
  }

  protected addAudioInput(
    port: Omit<Port, 'id' | 'state' | 'connectedTo'>,
  ): Port {
    return this.addInput(port)
  }

  protected passThroughSignal(input: Float32Array | null): Float32Array | null {
    return input
  }
}

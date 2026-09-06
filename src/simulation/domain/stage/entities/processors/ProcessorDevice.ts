import {
  DeviceRole,
  Port,
  StageDevice,
  StagePosition,
} from '../../Stage'

/** Base for devices that receive, modify, and/or route audio. */
export abstract class ProcessorDevice extends StageDevice {
  protected constructor(
    id: string,
    name: string,
    role: DeviceRole = DeviceRole.Processor,
    position?: StagePosition,
  ) {
    super(id, name, role, position)
  }

  protected addAudioInput(
    port: Omit<Port, 'id' | 'state' | 'connectedTo'>,
  ): Port {
    return this.addInput(port)
  }

  protected addAudioOutput(
    port: Omit<Port, 'id' | 'state' | 'connectedTo'>,
  ): Port {
    return this.addOutput(port)
  }

  protected passThroughSignal(input: Float32Array | null): Float32Array | null {
    return input
  }
}

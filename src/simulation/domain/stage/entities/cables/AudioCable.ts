import { PortReference } from '../../Stage'

export interface CableEndpoint extends PortReference {
  deviceInstanceId: string
}

export interface CableConnection {
  readonly id: string
  readonly from: CableEndpoint
  readonly to: CableEndpoint
}

export class AudioCable implements CableConnection {
  readonly id: string
  readonly from: CableEndpoint
  readonly to: CableEndpoint

  constructor(id: string, from: CableEndpoint, to: CableEndpoint) {
    this.id = id
    this.from = from
    this.to = to
  }
}

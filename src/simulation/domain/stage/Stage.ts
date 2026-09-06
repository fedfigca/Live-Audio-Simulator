// ============================================================
// Live Audio Stage Simulator – Base Proto-Object
// ============================================================

/** Unique identifier for every device on the stage */
export type DeviceId = string;

/** Port identifier */
export type PortId = string;

/** Common connector types found on stage gear */
export enum ConnectorType {
  XLR = "xlr",
  TS = "ts",           // 1/4" mono
  TRS = "trs",         // 1/4" stereo / balanced
  SpeakON = "speakon",
  RCA = "rca",
  MIDI = "midi",
  PowerIEC = "power_iec",
  PowerEdison = "power_edison",
  Optical = "optical",
  USB = "usb",
  Combo = "combo",
  Custom = "custom"
}

/** Direction of a port */
export enum PortDirection {
  Input = "input",
  Output = "output",
  Bidirectional = "bidirectional"   // rare, but useful (e.g. some DI / insert points)
}

/** High-level role in the signal chain */
export enum DeviceRole {
  Source = "source",       // instruments, mics, playback
  Processor = "processor", // pedals, EQ, compressors, DI (active)
  Mixer = "mixer",
  Cable = "cable",
  Sink = "sink",           // speakers, headphones, recording interfaces
  Utility = "utility"      // pure passive DI, power strips, etc.
}

/** Current connection / operational state of a port or device */
export enum ConnectionState {
  Disconnected = "disconnected",
  Connected = "connected",
  Partial = "partial",     // e.g. only one end of a cable plugged
  Faulty = "faulty",       // short, open circuit, bad contact
  Overloaded = "overloaded"
}

/** Simple 2-D stage position (can be extended later for 3-D) */
export interface StagePosition {
  x: number;
  y: number;
  rotation?: number;       // degrees
  zIndex?: number;
}

/** Represents a single physical connection point on a device */
export enum SignalLevel {
  Instrument = "instrument",
  Line = "line",
  Microphone = "microphone"
}

export enum Impedance {
  High = "high",
  Low = "low"
}

export interface Port {
  readonly id: PortId;
  name: string;                    // e.g. "Input 1", "Send", "Thru"
  connector: ConnectorType;
  direction: PortDirection;
  maxChannels?: number;            // 1 = mono, 2 = stereo, etc.
  isPowered?: boolean;             // phantom power, etc.
  signalLevel?: SignalLevel;
  signalValue?: number;             // current level in dB (runtime)
  impedance?: Impedance;
  requiresPhantomPower?: boolean;
  providesPhantomPower?: boolean;
  acceptedConnectors?: ConnectorType[];
  connectedTo?: PortReference | null;
  state: ConnectionState;
}

/** Lightweight reference used when a port is connected to another */
export interface PortReference {
  deviceId: DeviceId;
  portId: PortId;
}

/**
 * ============================================================
 * BASE PROTO-OBJECT
 * Every console, cable, pedal, DI, instrument, speaker, etc.
 * will inherit from this abstract class.
 * ============================================================
 */
export abstract class StageDevice {
  // ---------- Identity ----------
  readonly id: DeviceId;
  name: string;
  readonly category: string;          // free-form or use an enum in subclasses
  role: DeviceRole;

  // ---------- Physical presence on stage ----------
  position: StagePosition;
  isVisible: boolean = true;
  isLocked: boolean = false;          // prevent accidental moves in UI

  // ---------- Power & operational state ----------
  isPowered: boolean = false;         // true when receiving power
  isEnabled: boolean = true;          // bypass / mute / engaged
  batteryLevel?: number;              // 0-100 for battery-powered gear
  temperature?: number;               // optional thermal monitoring

  // ---------- Signal ports ----------
  readonly inputs: Port[] = [];
  readonly outputs: Port[] = [];

  // ---------- Connection tracking ----------
  protected connections: Map<PortId, PortReference> = new Map();

  // ---------- Constructor ----------
  constructor(
    id: DeviceId,
    name: string,
    role: DeviceRole,
    position: StagePosition = { x: 0, y: 0 }
  ) {
    this.id = id;
    this.name = name;
    this.role = role;
    this.position = position;
    this.category = this.constructor.name; // or override in subclass
  }

  // ---------- Port helpers ----------
  addInput(port: Omit<Port, "id" | "state" | "connectedTo">): Port {
    const fullPort: Port = {
      ...port,
      id: `${this.id}-in-${this.inputs.length + 1}`,
      state: ConnectionState.Disconnected,
      connectedTo: null
    };
    this.inputs.push(fullPort);
    return fullPort;
  }

  addOutput(port: Omit<Port, "id" | "state" | "connectedTo">): Port {
    const fullPort: Port = {
      ...port,
      id: `${this.id}-out-${this.outputs.length + 1}`,
      state: ConnectionState.Disconnected,
      connectedTo: null
    };
    this.outputs.push(fullPort);
    return fullPort;
  }

  getPort(portId: PortId): Port | undefined {
    return [...this.inputs, ...this.outputs].find(p => p.id === portId);
  }

  // ---------- Connection management ----------
  /**
   * Connect one of this device's ports to another device's port.
   * Returns true if the connection was successful.
   */
  connect(localPortId: PortId, remote: PortReference): boolean {
    const localPort = this.getPort(localPortId);
    if (!localPort) return false;

    // Basic compatibility check (can be made much stricter later)
    if (localPort.state === ConnectionState.Connected) {
      console.warn(`Port ${localPortId} is already connected`);
      return false;
    }

    localPort.connectedTo = remote;
    localPort.state = ConnectionState.Connected;
    this.connections.set(localPortId, remote);
    return true;
  }

  disconnect(localPortId: PortId): void {
    const port = this.getPort(localPortId);
    if (!port) return;

    port.connectedTo = null;
    port.state = ConnectionState.Disconnected;
    this.connections.delete(localPortId);
  }

  /** Returns true if at least one port is connected */
  get isAnyConnected(): boolean {
    return this.connections.size > 0;
  }

  /** Returns overall health of the device’s connections */
  get connectionHealth(): ConnectionState {
    if (this.connections.size === 0) return ConnectionState.Disconnected;

    const states = [...this.inputs, ...this.outputs].map(p => p.state);
    if (states.includes(ConnectionState.Faulty)) return ConnectionState.Faulty;
    if (states.includes(ConnectionState.Overloaded)) return ConnectionState.Overloaded;
    if (states.every(s => s === ConnectionState.Connected || s === ConnectionState.Disconnected)) {
      return ConnectionState.Connected;
    }
    return ConnectionState.Partial;
  }

  // ---------- Signal path helpers (to be overridden) ----------
  /**
   * Process an incoming audio buffer / signal.
   * Sources generate, processors transform, sinks consume.
   * Cables usually just pass-through.
   */
  abstract processSignal(input: Float32Array | null, portId?: PortId): Float32Array | null;

  /** Optional: called every simulation tick */
  update(deltaTime: number): void {
    // base implementation does nothing – subclasses can animate meters, heat, etc.
  }

  // ---------- Serialization / debugging ----------
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      role: this.role,
      category: this.category,
      position: this.position,
      isPowered: this.isPowered,
      isEnabled: this.isEnabled,
      connectionHealth: this.connectionHealth,
      inputs: this.inputs,
      outputs: this.outputs
    };
  }
}

// Concrete devices belong in domain/stage/entities. See
// domain/stage/entities/sources/index.ts for the current source objects.
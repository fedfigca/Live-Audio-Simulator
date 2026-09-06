# Simulation domain

This directory contains the object-oriented TypeScript model for the stage simulator. It is framework-independent and must not import React, Hono, Vite, or browser-only APIs.

The model describes the physical and electrical facts of a stage. The React application will eventually visualize and interact with these objects, but the domain objects should remain usable without a browser.

## Structure

```text
simulation/
  domain/
    stage/
      Stage.ts                 # Master stage object: paste the provided implementation here
      entities/                 # Stage elements created from or attached to Stage
        sources/
          instruments/          # Guitar, keyboard, and future instrument sources
          microphones/          # Dynamic, condenser, and future microphone sources
          players/              # Audio playback sources
        outputs/                 # Speakers, headphones, and future system outputs
        processors/              # Mixers, EQs, and future signal processors
      value-objects/            # Immutable domain values such as dimensions, positions, and channels
    shared/                     # Domain primitives shared by multiple stage areas
  application/
    simulation/                 # Use cases and orchestration of domain objects
  infrastructure/
    persistence/                # Loading and saving simulation state
    adapters/                   # Runtime or external-system integrations
```

## Master object: `StageDevice`

`domain/stage/Stage.ts` contains the base `StageDevice` class. The file is the master object definition for stage devices: every instrument, microphone, processor, mixer, cable, and sink should eventually extend it directly or through a more specific domain base class.

### Identity and stage state

- `id` is the stable device identifier used by `PortReference` and connection tracking.
- `name` is the user-facing device name and may be customized by the constructor.
- `category` defaults to the concrete class name.
- `role` identifies the device's place in the signal chain, such as `DeviceRole.Source` or `DeviceRole.Processor`.
- `position`, `isVisible`, and `isLocked` describe placement and editor behavior.
- `isPowered`, `isEnabled`, `batteryLevel`, and `temperature` describe operational state.

### Ports

Devices expose `inputs` and `outputs`, each containing `Port` objects. Subclasses should create ports in their constructor using `addInput()` or `addOutput()` rather than manually assigning IDs or connection state.

Each port contains:

- `name`: human-readable label such as `Left Output` or `Mono Output`.
- `connector`: physical connector from `ConnectorType`, such as `XLR` or `TRS`.
- `direction`: `Input`, `Output`, or `Bidirectional`.
- `maxChannels`: channel count; use `1` for mono and `2` for a stereo port.
- `signalLevel`: nominal signal class: `Instrument`, `Line`, or `Microphone`.
- `impedance`: `High` or `Low`, when relevant to the source or connection problem.
- `requiresPhantomPower`: `true` for devices such as condenser microphones that need phantom power.
- `signalValue`: runtime level in dB; this is separate from the nominal `signalLevel` classification.
- `state` and `connectedTo`: managed connection state, initialized by `StageDevice`.

`addInput()` and `addOutput()` generate IDs in the form `<device-id>-in-<number>` or `<device-id>-out-<number>`, initialize the port as disconnected, and append it to the correct collection.

### Connections

`connect(localPortId, remote)` records a local port's reference to another device port and marks it connected. The current base implementation only prevents a port from being connected twice; it does not yet validate connector, direction, signal level, impedance, or phantom-power compatibility. That stricter validation belongs in a future connection service or expanded domain rule.

`disconnect(localPortId)` clears the local reference. `isAnyConnected` reports whether the device has a tracked connection, and `connectionHealth` summarizes the device's port states as disconnected, connected, partial, faulty, or overloaded.

### Signal lifecycle

Every concrete device implements `processSignal(input, portId?)`. Sources generate a signal, processors transform one, cables pass one through, and sinks consume one. `update(deltaTime)` is an optional simulation-tick hook for meters, thermal behavior, animation, or other time-based state.

The current source classes return the incoming buffer or a silent 128-sample buffer. This is an intentional placeholder until signal generation and problem-solving scenarios are defined.

## Current source objects

The first source objects are available from `domain/stage/entities/sources/index.ts`:

- `Guitar`: one mono TRS output, instrument level, high impedance.
- `Keyboard`: independent left and right mono TRS outputs, line level, low impedance.
- `AudioPlayer`: independent left and right mono TRS outputs, line level, low impedance; stereo file playback will be added later.
- `DynamicMicrophone`: one mono XLR output, microphone level, low impedance.
- `CondenserMicrophone`: the dynamic microphone output contract plus `requiresPhantomPower: true`.

## Output and processor devices

The domain distinguishes a device's role in the audio system from the direction of its physical jacks:

- `OutputDevice` represents a system output such as a speaker. It is a `DeviceRole.Sink` and contains input ports because audio physically enters the speaker.
- `ProcessorDevice` represents a device that receives and transforms or routes audio. It can contain both inputs and outputs and defaults to `DeviceRole.Processor`.
- A class may override the processor role when the model has a more specific role, as `Mixer` does with `DeviceRole.Mixer`.

The current output devices are:

- `Subwoofer18`: one input-only combo port accepting XLR or TRS, line level, high impedance.
- `ActiveSpeaker15`: one input-only combo port accepting XLR or TRS, line level, high impedance.

The current processor is:

- `Mixer`: eight XLR microphone-level inputs, each marked `providesPhantomPower: true`; two XLR main outputs and four XLR aux outputs, all line level and low impedance.

`ConnectorType.Combo` identifies the physical combo jack, while `acceptedConnectors` records the plugs it accepts. This keeps the physical jack distinct from the compatible connector types.

The source hierarchy is:

```text
StageDevice
└── AudioSource
    ├── Guitar
    ├── Keyboard
    ├── AudioPlayer
    ├── DynamicMicrophone
    └── CondenserMicrophone
```

`AudioSource` fixes the role to `DeviceRole.Source`, provides `addAudioOutput()`, and provides the temporary `createSilentSignal()` behavior. Concrete classes are responsible for declaring their own physical outputs.

## Creating a new source

Create the file in the folder matching the source family, extend `AudioSource`, and declare the output contract in the constructor. Use the shared enums instead of string literals:

```ts
import {
  ConnectorType,
  Impedance,
  SignalLevel,
  StagePosition,
} from '../../../Stage'
import { AudioSource } from '../AudioSource'

export class ExampleInstrument extends AudioSource {
  constructor(
    id: string,
    name = 'Example Instrument',
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
```

For multiple mono outputs, call `addAudioOutput()` once per physical output and give each port a meaningful name, as `Keyboard` does for `Left Output` and `Right Output`. For a special requirement such as phantom power, use the full port object instead of `configureOutput()` and add the relevant metadata.

Finally, export the class from `domain/stage/entities/sources/index.ts`. Do not duplicate domain logic in React components or Hono route handlers.

For output devices, extend `OutputDevice` and add physical inputs with `addAudioInput()`. For processors, extend `ProcessorDevice`, add inputs and outputs as required, and implement the routing or transformation in `processSignal()`. Export new classes from the matching `outputs/index.ts` or `processors/index.ts` barrel.

## Frontend device catalog

The backend routine in `application/catalog/DeviceCatalog.ts` instantiates every currently available source, output device, and processor, then converts them to frontend-safe summaries. Hono exposes those summaries at `GET /api/devices`.

The catalog deliberately sends metadata rather than live class instances. Each device summary contains its `id`, display `name`, concrete `category`, and a flattened list of port summaries. The React sidebar uses this route to render the Sources, Outputs, and Process devices accordions.

Port summaries with identical characteristics are grouped before they reach the frontend. Numbered runs are compressed into ranges such as `Input 1 to 8` and `Aux 1 to 4`; the underlying domain device still retains every individual port.

When adding a new device, register it in `buildDeviceCatalog()` so it appears in the frontend catalog. Keep the catalog instantiation separate from the React UI and keep device behavior in the domain classes.

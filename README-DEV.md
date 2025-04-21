# KVM Control - Developer Documentation

## Overview

KVM Control is an Electron-based application for controlling RS232-capable KVM switches. It's built with TypeScript, React, and TailwindCSS, providing a modern, responsive interface for configuring and controlling KVM switches via serial connections.

## Project Structure

```
kvm-control/
├── electron/             # Electron main process code
│   ├── main.ts           # Main entry point for Electron
│   ├── preload.ts        # Preload script to expose APIs to renderer
│   ├── config.ts         # Application configuration handling
│   ├── config-handlers.ts # IPC handlers for configuration
│   ├── wol-handler.ts    # Wake-on-LAN functionality
│   └── configManager.ts  # Configuration file management
├── shared/               # Shared code between main and renderer
│   ├── types.ts          # Type definitions
│   └── utils.ts          # Utility functions
├── src/                  # React application (renderer process)
│   ├── components/       # React components
│   ├── contexts/         # React context providers
│   ├── types/            # TypeScript type definitions
│   ├── App.tsx           # Main application component
│   ├── index.tsx         # React entry point
│   └── index.css         # Global styles
├── public/               # Public assets
├── .vscode/              # VS Code configuration
├── package.json          # Project dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── webpack.config.js     # Webpack configuration
└── tailwind.config.js    # TailwindCSS configuration
```

## Technology Stack

- **Electron**: Cross-platform desktop application framework
- **TypeScript**: Type-safe JavaScript
- **React**: UI library
- **TailwindCSS**: Utility-first CSS framework
- **SerialPort**: Serial port communication library
- **Webpack**: Module bundler

## Setup Development Environment

### Prerequisites

- Node.js 16.x or later
- pnpm (recommended) or npm
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/kvm-control.git
   cd kvm-control
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Create a `.env` file in the project root:
   ```
   DEV_SERVER_HOST=localhost
   DEV_SERVER_PORT=3000
   ```

4. Start the development server:
   ```bash
   pnpm dev
   ```

## Key Components

### Main Process (Electron)

- **main.ts**: Handles application lifecycle, window creation, and serial port communication
- **configManager.ts**: Manages configuration persistence and validation
- **wol-handler.ts**: Implements Wake-on-LAN functionality
- **preload.ts**: Safely exposes APIs to the renderer process

### Renderer Process (React)

- **Contexts**:
  - `SerialContext`: Manages serial port connection and communication
  - `ConfigContext`: Handles application configuration
  - `WolContext`: Provides Wake-on-LAN functionality

- **Components**:
  - `ConnectionPanel`: Serial port connection settings
  - `ComputersPanel`: Displays computer switching buttons
  - `ComputersConfigPanel`: Configuration interface for computers
  - `AutoSwitchPanel`: Controls for automatic switching

## IPC Communication

The application uses Electron's IPC (Inter-Process Communication) to enable communication between the renderer process (React) and the main process (Electron).

APIs are exposed via the preload script:

- `serialApi`: Serial port operations
- `configApi`: Configuration management
- `wolApi`: Wake-on-LAN functionality

## Serial Communication

The application uses the `serialport` library to communicate with KVM switches. Default command format:

```
X<port_number>,1$
```

Where `<port_number>` is 1-9 for ports 1-9, or 'A' for port 10.

Custom command formats can be specified in the computer configuration.

## Building for Production

1. Build the application:
   ```bash
   pnpm build:prod
   ```

2. Find the packaged application in the `dist` directory.

## Customization and Extension

### Adding New KVM Command Formats

To add support for different KVM command formats:

1. Modify the `generateDefaultCommandPayload` function in `shared/utils.ts`
2. Update the command format in the UI to reflect the new options

### Supporting Additional Features

To add new features to the KVM Control application:

1. Implement the necessary functionality in the main process
2. Expose the functionality via the preload script
3. Create React components to interact with the new functionality
4. Update the UI to include the new features

## Debugging

The project includes VS Code launch configurations:

- `Run Dev`: Runs the development server and Electron
- `Attach to Electron Main`: Attaches the debugger to the Electron main process
- `Attach to Electron Renderer`: Attaches the debugger to the Electron renderer process
- `Dev → Run & Attach All`: Runs all of the above

## Testing

TODO: Add testing documentation

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request
s
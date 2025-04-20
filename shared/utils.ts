/**
 * Generates the default command payload for a given port number
 * @param portNumber The KVM port number
 * @returns The formatted command string
 */
export function generateDefaultCommandPayload(portNumber: number): string {
  const code = portNumber <= 9 ? portNumber.toString() : 'A';
  return `X${code},1$`;
}
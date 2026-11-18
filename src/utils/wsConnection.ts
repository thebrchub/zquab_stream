type WSStatusListener = (open: boolean) => void;

// wsConnection is the app's one WebSocket, shared by everything that needs it
// (one connection per tab, never two). WebSocketProvider opens and reopens the
// socket and attaches it here; code outside React, like the stranger chat
// client, sends through it and hears when it opens or closes.
class WSConnection {
  private socket: WebSocket | null = null;
  private statusListeners = new Set<WSStatusListener>();

  isOpen() {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  // Sends an already encoded Envelope. Returns false if the socket isn't open.
  sendBytes(bytes: Uint8Array): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return false;
    const buffer = bytes.buffer instanceof ArrayBuffer
      ? bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
      : new Uint8Array(bytes).slice().buffer;
    this.socket.send(buffer);
    return true;
  }

  // Calls listener(true) each time the socket opens and listener(false) each time it closes.
  onStatus(listener: WSStatusListener) {
    this.statusListeners.add(listener);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  // attach records a socket that just opened and tells the listeners.
  attach(socket: WebSocket) {
    this.socket = socket;
    this.statusListeners.forEach(l => l(true));
  }

  // detach forgets a socket that closed (ignored if a newer one is attached) and tells the listeners.
  detach(socket: WebSocket) {
    if (this.socket !== socket) return;
    this.socket = null;
    this.statusListeners.forEach(l => l(false));
  }
}

export const wsConnection = new WSConnection();

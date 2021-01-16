import notification from 'antd/lib/notification';
import SocketIOClient from 'socket.io-client';
import {SocketEvent} from 'src/config/socket-event';

export class ScraperClient {
  protected socket: SocketIOClient.Socket | undefined;

  constructor(url?: string) {
    if (url) {
      this.createConnection(url);
    }
  }

  public createConnection(url: string): SocketIOClient.Socket {
    const socket: SocketIOClient.Socket = SocketIOClient(url, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect_error', () => {
      // eslint-disable-next-line no-console
      console.log('error');

      setTimeout(() => {
        socket.connect();
      }, 1000);
    });

    socket.on(SocketEvent.CONNECT, () => {
      notification.info({
        message: 'Connected',
        description: 'Paste the story URL to scrape',
      });
    });

    socket.on(SocketEvent.DISCONNECT, () => {
      notification.warning({
        message: 'Client disconnected',
      });
    });

    this.socket = socket;
    return socket;
  }
}

export const scraperSocket: ScraperClient = new ScraperClient();

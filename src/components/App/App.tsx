import React from 'react';
import './App.scss';
import Input from 'antd/lib/input';
import Button, {ButtonProps} from 'antd/lib/button';
import Form from 'antd/lib/form';
import Typography from 'antd/lib/typography';
import message from 'antd/lib/message';
import SocketIOClient from 'socket.io-client';
import {scraperSocket} from 'src/config/socket';
import {SERVER_URL} from 'src/config/env';
import {Controlled as CodeMirror} from 'react-codemirror2';
import {SocketEvent} from 'src/config/socket-event';
import 'web-streams-polyfill/ponyfill';
import {logOptions} from 'src/config/codemirror';
import {useMultilineString} from 'src/hooks/use-multiline-string';
import {useUrl} from 'src/hooks/use-url';
import {getStoryFilename} from 'src/helpers/get-story-filename';

const {Item: FormItem} = Form;

function handleBeforeChange() {}

function App() {
  const [loading, setLoading] = React.useState<boolean>(false);

  const [socket, setSocket] = React.useState<SocketIOClient.Socket | null>(
    null,
  );

  const [logs, handleResetLog, handleAppendLog] = useMultilineString();

  const [result, handleResetResult, handleAppendResult] = useMultilineString();

  const [url, handleChangeURL] = useUrl();

  React.useEffect(() => {
    const socket = scraperSocket.createConnection(SERVER_URL);

    setSocket(socket);

    socket.on(SocketEvent.DISCONNECT, () => {
      setLoading(false);
    });

    socket.on(SocketEvent.SCRAPING_FINISHED, () => {
      setLoading(false);
    });

    return () => {
      socket?.close();
    };
  }, []);

  React.useEffect(() => {
    socket?.on(SocketEvent.LOG, (message: string) => {
      handleAppendLog(message);
    });
  }, [socket, handleAppendLog]);

  const handleSubmit: ButtonProps['onClick'] = React.useCallback(async () => {
    if (!url) {
      await message.error('Enter URL first');
      return;
    }

    handleResetLog();
    handleResetResult();
    setLoading(true);

    socket.on(SocketEvent.SCRAPING_NEW_CONTENT, (html: string) => {
      handleAppendResult(html);
    });

    socket.on(SocketEvent.SCRAPING_FINISHED, () => {});

    socket?.emit('scrape', url);
  }, [handleAppendResult, socket, url, handleResetLog, handleResetResult]);

  const logValue: string = React.useMemo(() => logs.join('\n'), [logs]);

  const handleDownload = React.useCallback(async () => {
    if (loading) {
      message.error('Please wait until the scraping process done');
      return;
    }
    if (result.length === 0) {
      message.error('File empty');
      return;
    }
    const uInt8 = new Blob(result, {
      type: 'text/plain; charset=UTF-8',
    });
    const fileUrl = window.URL.createObjectURL(uInt8);
    const anchor: HTMLAnchorElement = document.createElement('a');
    anchor.href = fileUrl;
    anchor.download = getStoryFilename(url);
    anchor.click();
    window.URL.revokeObjectURL(fileUrl);
  }, [result, loading, url]);

  return (
    <div className="container py-4">
      <Typography.Title>Wattpad scraper</Typography.Title>
      <Form>
        <FormItem label="Story URL">
          <Input
            disabled={loading}
            value={url}
            onChange={handleChangeURL}
            placeholder="https://www.wattpad.com/xxxxxxxxx-story-title"
          />
        </FormItem>
        <div className="d-flex justify-content-between">
          <Button
            type="primary"
            htmlType="button"
            onClick={handleSubmit}
            disabled={loading}
            loading={loading}>
            Submit
          </Button>
          <Button
            type="primary"
            htmlType="button"
            onClick={handleDownload}
            disabled={result.length === 0}
            loading={loading}>
            Download
          </Button>
        </div>
      </Form>
      <div className="my-2">
        <CodeMirror
          options={logOptions}
          onBeforeChange={handleBeforeChange}
          value={logValue}
        />
      </div>
    </div>
  );
}

export default App;

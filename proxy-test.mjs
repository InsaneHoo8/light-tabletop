import net from 'node:net';
import tls from 'node:tls';

const PROXY = { host: '209.127.142.202', port: 8000, user: 'hgqswk', pass: '7YQaXw' };

const useProxy = process.argv.includes('--proxy');
const target = process.argv[2] || 'www.youtube.com';
const timeoutMs = 20000;

function finish(code, msg) {
  console.log(msg);
  process.exit(code);
}

function tlsCheck(socket) {
  const t = tls.connect({ socket, servername: target, rejectUnauthorized: false }, () => {
    const c = t.getPeerCertificate();
    console.log(`TLS OK proto=${t.getProtocol()} cipher=${t.getCipher()?.name}`);
    console.log(`CERT subject=${c.subject?.CN} issuer=${c.issuer?.O} / ${c.issuer?.CN}`);
    t.write(`GET / HTTP/1.1\r\nHost: ${target}\r\nUser-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)\r\nConnection: close\r\n\r\n`);
  });
  t.setTimeout(timeoutMs, () => finish(1, 'TLS TIMEOUT'));
  let body = Buffer.alloc(0);
  t.on('data', (d) => { body = Buffer.concat([body, d]); });
  t.on('end', () => {
    const s = body.toString('latin1');
    console.log('HTTP:', s.split('\r\n')[0]);
    const i = s.indexOf('\r\n\r\n');
    console.log('BODY:', s.slice(i + 4, i + 200).replace(/\s+/g, ' '));
    finish(0, 'OK');
  });
  t.on('error', (e) => finish(1, `TLS ERROR ${e.code}: ${e.message}`));
}

if (!useProxy) {
  const s = net.connect(443, target);
  s.setTimeout(timeoutMs, () => finish(1, 'TCP TIMEOUT'));
  s.on('connect', () => tlsCheck(s));
  s.on('error', (e) => finish(1, `TCP ERROR ${e.code}: ${e.message}`));
} else {
  const s = net.connect(PROXY.port, PROXY.host);
  s.setTimeout(timeoutMs, () => finish(1, 'PROXY TCP TIMEOUT'));
  s.on('error', (e) => finish(1, `PROXY TCP ERROR ${e.code}: ${e.message}`));
  let buf = Buffer.alloc(0);
  const onData = (d) => {
    buf = Buffer.concat([buf, d]);
    const txt = buf.toString('latin1');
    const end = txt.indexOf('\r\n\r\n');
    if (end === -1) return;
    s.removeListener('data', onData);
    const head = txt.slice(0, end).split('\r\n');
    console.log('CONNECT:', head[0]);
    if (!/ 2\d\d /.test(head[0])) finish(1, 'CONNECT REJECTED');
    const rest = buf.subarray(end + 4);
    if (rest.length) finish(1, `UNEXPECTED ${rest.length} BYTES AFTER CONNECT`);
    tlsCheck(s);
  };
  s.on('data', onData);
  s.on('connect', () => {
    const auth = Buffer.from(`${PROXY.user}:${PROXY.pass}`).toString('base64');
    s.write(`CONNECT ${target}:443 HTTP/1.1\r\nHost: ${target}:443\r\nProxy-Authorization: Basic ${auth}\r\n\r\n`);
  });
}

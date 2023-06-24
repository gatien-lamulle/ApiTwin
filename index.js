const {default: MITMProxy} = require('mitmproxy');
const process = require('node:process');

const allIntercept = [];
// Returns Promise<MITMProxy>
async function makeProxy() {
  // Note: Your interceptor can also be asynchronous and return a Promise!
  return MITMProxy.Create(function(interceptedMsg) {
    const reqHeader = interceptedMsg.request;
    const resHeader = interceptedMsg.response;
    const reqBody  = interceptedMsg.requestBody.toString('utf-8');
    const resBody  = interceptedMsg._responseBody.toString('utf-8');
    allIntercept.push({
        request: {
            rawUrl: reqHeader.rawUrl,
            method: reqHeader.method,
            url: reqHeader.url, 
            headers: Object.fromEntries(reqHeader._headers),
            body: reqBody,
            bodyBuffer: interceptedMsg.requestBody
        },
        response: {
            status: resHeader.statusCode,
            headers: Object.fromEntries(resHeader._headers),
            body: resBody,
            bodyBuffer: interceptedMsg._responseBody
        }
    });
  }, [] /* list of paths to directly intercept -- don't send to server */,
  true /* Be quiet; turn off for debug messages */,
  true /* Only intercept text or potentially-text requests (all mime types with *application* and *text* in them, plus responses with no mime type) */
  );
}

async function main() {
  const proxy = await makeProxy();
  // when done:
  process.on('SIGINT', async () => {
    await proxy.shutdown();
    process.exit();
  });
}

main();
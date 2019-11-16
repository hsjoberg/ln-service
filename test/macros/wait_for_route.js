const asyncRetry = require('async/retry');

const {getRoutes} = require('./../../');

const interval = retryCount => 50 * Math.pow(2, retryCount);
const times = 15;

/** Wait for lnd to return a route

  {
    destination: <Destination Public Key Hex String>
    lnd: <Authenticated LND gRPC API Object>
    [routes]: [[{
      [base_fee_mtokens]: <Base Routing Fee In Millitokens String>
      [channel]: <Standard Format Channel Id String>
      [channel_capacity]: <Channel Capacity Tokens Number>
      [cltv_delta]: <CLTV Delta Blocks Number>
      [fee_rate]: <Fee Rate In Millitokens Per Million Number>
      public_key: <Forward Edge Public Key Hex String>
    }]]
    tokens: <Tokens to Send Number>
  }

  @returns via cbk
  {
    routes: [{
      fee: <Route Fee Tokens Number>
      fee_mtokens: <Route Fee Millitokens String>
      hops: [{
        channel: <Standard Format Channel Id String>
        channel_capacity: <Channel Capacity Tokens Number>
        fee: <Fee Number>
        fee_mtokens: <Fee Millitokens String>
        forward: <Forward Tokens Number>
        forward_mtokens: <Forward Millitokens String>
        public_key: <Forward Edge Public Key Hex String>
        timeout: <Timeout Block Height Number>
      }]
      mtokens: <Total Fee-Inclusive Millitokens String>
      timeout: <Route Timeout Height Number>
      tokens: <Total Fee-Inclusive Tokens Number>
    }]
  }
*/
module.exports = ({destination, lnd, routes, tokens}, cbk) => {
  if (!destination) {
    return cbk([400, 'ExpectedDestinationToWaitForRoute']);
  }

  if (!lnd || !lnd.default) {
    return cbk([400, 'ExpectedAuthenticatedLndToWaitForRoute']);
  }

  if (!tokens) {
    return cbk([400, 'ExpectedTokensToWaitForRoute']);
  }

  return asyncRetry({interval, times}, cbk => {
    return getRoutes({destination, lnd, routes, tokens}, (err, res) => {
      if (!!err) {
        return cbk(err);
      }

      if (!res.routes.length) {
        return cbk([503, 'ExpectedRoutesToBeReturned']);
      }

      return cbk(null, {routes: res.routes});
    });
  },
  cbk);
};

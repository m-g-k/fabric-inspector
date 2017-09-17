'use strict';

/*
 * Hyperledger Fabric Inspector Program
 */

import * as hfc from 'fabric-client';
import * as path from 'path';
import * as fs from 'fs';
import 'source-map-support/register'
import { Argv, argv } from 'yargs'

//do work
processChain();
async function processChain() {
  var outputFile;
  try {
    outputFile = await inspectChain();
    console.log("Finished, see: '" + outputFile + "' for results.")
  } catch (err) {
    console.error("Caught Error: " + err);
  }
  ;
  process.exit(0);
}

async function inspectChain() {
  //set up the default options
  var options = {
    wallet_path: path.normalize(path.join(__dirname, '../creds/id')),
    user_id: 'admin',
    channel_name: 'mychannel',
    peer_url: 'grpc://localhost:7051',
    tls_cert: ""
  };

  //override defaults with values from the command line
  if (argv.wallet_path) {
    options.wallet_path = path.join(__dirname, argv.wallet_path);
  }

  if (argv.user_id) {
    options.user_id = argv.user_id;
  }

  if (argv.channel) {
    options.channel_name = argv.channel;
  }

  if (argv.peer_url) {
    options.peer_url = argv.peer_url;
  }

  if (argv.tls_cert) {
    var tls_cert = fs.readFileSync(path.normalize(path.join(__dirname, argv.tls_cert))).toString();
    options.tls_cert = tls_cert;
  } else if (fs.existsSync(path.join(__dirname, '../creds/tls/peer.cert'))) {
    //default as cert exists
    var tls_cert = fs.readFileSync(path.join(__dirname, '../creds/tls/peer.cert')).toString();
    options.tls_cert = tls_cert;
  }

  var outputFile = path.normalize(__dirname + "/../output.json");
  if (argv.output) {
    outputFile = path.normalize(path.normalize(path.join(__dirname, argv.output)));
  }

  console.log("Creating the client and setting the wallet location to: '" + options.wallet_path + "'");
  var client = new hfc();
  var wallet = await hfc.newDefaultKeyValueStore({ path: options.wallet_path });

  console.log("Associating user '" + options.user_id + "' with application");
  client.setStateStore(wallet);
  var user = await client.getUserContext(options.user_id, true);

  console.log("Checking user is enrolled");
  if (!user || user.isEnrolled() === false) {
    console.error("User not defined, or not enrolled - error");
    throw ("User not defined, or not enrolled");
  }
  console.log("Attaching to channel: '" + options.channel_name + "'");
  var channel = await client.newChannel(options.channel_name);
  var peer;
  //use tls if we have a tls cert
  if (options.tls_cert.length === 0) {
    console.log("Creating peer at: " + options.peer_url);
    peer = await client.newPeer(options.peer_url);
  } else {
    console.log("Creating peer with TLS at: '" + options.peer_url + "'");
    peer = await client.newPeer(options.peer_url, {
      pem: options.tls_cert
    });
  }
  console.log("Adding peer to channel");
  await channel.addPeer(peer);

  //get MSP info. TODO extract more data...
  var MSPMgr = await channel.getMSPManager();
  var msp = MSPMgr.getMSP();
  var channels = await client.queryChannels(peer, true);
  var chaincodes = "undefined"; //default incase of exception
  try {
    chaincodes = await channel.queryInstantiatedChaincodes(peer);
    //chaincodes = await client.queryInstalledChaincodes(peer); //this throws with HSBN - unless you upload the cert!
  } catch (ex) {
    console.error("Ignoring Error", ex);
  }

  console.log("Querying blockchain...");
  var blockchainInfo = await channel.queryInfo();
  console.log("Blockchain height: " + blockchainInfo.height.low + " (blocks 0-" + (blockchainInfo.height.low -1) + ")");
  //console.log("Blockchain currentHash: " + blockchainInfo.currentBlockHash);
  //console.log("Blockchain previousHash: "+ blockchainInfo.previousBlockHash);
  var chainHeight = blockchainInfo.height.low; //TODO handle full range of blocks (uInt64)

  var result = {
    "mychannel": {
      "summary": {
        "network_url": options.peer_url,
        "Chain Height": chainHeight
      },
      "chaincodes": chaincodes,
      "MSPManager": msp,
      "channels": channels,
      "chain": {}
    }
  };

  try {
    //delete old file if it exists
    fs.unlinkSync(outputFile);
  } catch (e) {
    //ignore errors as it may not exist at all
  }

  //build output for the blocks
  for (let i = 0; i < chainHeight; i++) {
    var block = await channel.queryBlock(i);
    var newBlock;
    if (i === 0) {
      result.mychannel.chain["Block0 (Genesis)"] = block;
    } else {
      result.mychannel.chain["Block" + i] = block;
    }

  };

  //create output file
  var err = fs.appendFileSync(outputFile, JSON.stringify(result, replacer, 2));
  if (err) {
    console.error("Caught Error", err);
  }

  return outputFile;
};


///Utility function
function replacer(key, value) {
  // Filtering out properties
  if (key === 'data') {
    if (value instanceof Array) {
      var arrLen = value.length;
      if (arrLen === 1) {
        return value;
      }
      var str = "";
      for (var i = 0; i < arrLen; i++) {
        var tmp = value[i].toString(16);
        str += tmp;
      }
      return str;
    }
    return value;
  }
  return value;
}
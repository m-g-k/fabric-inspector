# Hyperledger Fabric Inspector

Hyperledger Fabric Inspector is a tool to inspect a Fabric blockchain. It produces a detailed JSON output document giving the contents of the chain for a given channel.


## Manual Build and Run

```
git clone the repository and cd into the folder
npm install
npm run build
cd out
node inspect.js <options>
```

## Setup

You will need to provide your Fabric ID and TLS certs. By default the ID cert is expected in
```../creds/id``` and the TLS certs are expected in ```../creds/tls/peer.cert``` but this can be overridden on the cmd line.
The TLS certs are optional and are only required if the peer is using TLS.

## Options
Depending on your preferences you can simply edit "```inspect.ts```" to hard code your settings into the ```options``` structure or provide them on the command line. 

The currently supported options are:

```--wallet_path``` : The path to the user ID cert. Default to '```../creds/id```'

```--user_id``` : The name of the user. Default to '```admin```'

```--channel``` : The name of the channel to connect to. Defaults to '```mychannel```'

```--peer_url``` : The address of the peer. Defaults to '```grpc://localhost:7051```'

```--tls_cert``` : The location of the TLS certs. Defaults to '```../creds/tls/peer.cert```'. If the the option is not given and the default cert does not exist then it assumes that TLS is not being used.

```output``` : The location of the output JSON file. Defaults to '```../output.json```'

## Examples

All options provided:
```
node inspect.js --wallet_path ../creds/id --user_id admin --channel fabcar --peer_url grpcs://fft-xxx.4.secure.blockchain.ibm.com:31580 --tls_cert ../creds/tls/peer.cert --output ../output.json
```

Allowing some defaults:
```
node inspect.js --channel myfabcar --peer_url grpcs://fft-xxx.4.secure.blockchain.ibm.com:31580
```
Assuming all defaults:
```
node inspect
```

## Notes
You can also run the Fabric Inspector, ```inspect.ts``` in the VSCode debugger by editing ```launch.json``` to include your options and pressing ```F5``` if you want to see even more details of the structures in a debugger.

## Acknowledgements
This code was originally developed from the Hyperledger Fabric Fabcar ```query.js``` sample by Anthony O'Dowd. It was then repurposed by David Gorman to display the blockchain contents before I converted it to typescript and extended it.



var StellarSdk = require('stellar-sdk');
const fetch = require('node-fetch');
StellarSdk.Network.useTestNetwork();
var server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
var sourceKeys = StellarSdk.Keypair
  .fromSecret('SDE7F6AV4R7GBNMZAL43VJXMJUY2DOPWZ4VXXAZKN7OFPPSXWLJ7XRL4');
var destinationId = 'GCFW3WDOYTJSKXDUXNV6QVRUP4WF7GAAOBZ3FI37K42OJW65VYSONKG6';
// Transaction will hold a built transaction we can resubmit if the result is unknown.
var transaction;



//creating keys for creating account
const pair = StellarSdk.Keypair.random();

pair.secret();
console.log(" Secret " + pair.secret());
pair.publicKey();
console.log(" Public Key " + pair.publicKey());
const sourcePublicKey =pair.publicKey();

//creating keys for destination account

const pairDest = StellarSdk.Keypair.random();

pairDest.secret();
console.log(" Dest Secret " + pairDest.secret());
pairDest.publicKey();
console.log("Dest Public Key " + pairDest.publicKey());
const receiverPublicKey = pairDest.publicKey();


(async function main() {
    try {
      const response = await fetch(
        `https://friendbot.stellar.org?addr=${encodeURIComponent(pair.publicKey())}`
      );
      const responseJSON = await response.json();
      console.log("SUCCESS! You have a new account :)\n", responseJSON);

      //the JS SDK uses promises for most actions, such as retrieving an account
      const account = await server.loadAccount(pair.publicKey());
        console.log("Balances for account: " + pair.publicKey());
        account.balances.forEach(function(balance) {
          console.log("Type:", balance.asset_type, ", Balance:", balance.balance);
        });


        //transfer funds
        const fee = await server.fetchBaseFee();


        const transaction = new StellarSdk.TransactionBuilder(account, { fee })
          // Add a payment operation to the transaction
          .addOperation(StellarSdk.Operation.payment({
            destination: receiverPublicKey,
            // The term native asset refers to lumens
            asset: StellarSdk.Asset.native(),
            // Specify 350.1234567 lumens. Lumens are divisible to seven digits past
            // the decimal. They are represented in JS Stellar SDK in string format
            // to avoid errors from the use of the JavaScript Number data structure.
            amount: '8.5',
          }))
          // Make this transaction valid for the next 30 seconds only
          .setTimeout(30)
          // Uncomment to add a memo (https://www.stellar.org/developers/learn/concepts/transactions.html)
          .addMemo(StellarSdk.Memo.text('memoId=18'))
          .build();
      
        // Sign this transaction with the secret key
        // NOTE: signing is transaction is network specific. Test network transactions
        // won't work in the public network. To switch networks, use the Network object
        // as explained above (look for StellarSdk.Network).
        transaction.sign(pair);
      
        // Let's see the XDR (encoded in base64) of the transaction we just built
        console.log(transaction.toEnvelope().toXDR('base64'));
      
        // Submit the transaction to the Horizon server. The Horizon server will then
        // submit the transaction into the network for us.
        try {
          const transactionResult = await server.submitTransaction(transaction);
          console.log(JSON.stringify(transactionResult, null, 2));
          console.log('\nSuccess! View the transaction at: ');
          console.log(transactionResult._links.transaction.href);
          console.log(JSON.stringify(transactionResult.data.detail));
        } catch (e) {
          console.log('An error has occured:');
          console.log(e);
        }

        } catch (e) {
      console.error("ERROR!", e);
    }
  })()

// First, check to make sure that the destination account exists.
// You could skip this, but if the account does not exist, you will be charged
// the transaction fee when the transaction fails.
// server.loadAccount(pairDest.publicKey())
// // If the account is not found, surface a nicer error message for logging.
// .catch(StellarSdk.NotFoundError, function (error) {
//   console.log("Error encountered "+  error);
//   throw new Error('The destination account does not exist!');
// })
//   // If there was no error, load up-to-date information on your account.
// .then(function() {
//       console.log("Destination Account was found");
//   }) 


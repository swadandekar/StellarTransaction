var StellarSdk = require('stellar-sdk');
const fetch = require('node-fetch');
StellarSdk.Network.useTestNetwork();
var server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
var sourceSecretKey = 'SDIX3QZYKMQAEOE4MKJXECDILBZYBS34EZRO5TQWSN2PI24VEJ74AORD';
// 'i0GNqEs1Kh7jc6Vw';

// Transaction will hold a built transaction we can resubmit if the result is unknown
//var receiverSecretKey = 'SDIX3QZYKMQAEOE4MKJXECDILBZYBS34EZRO5TQWSN2PI24VEJ74AORD';
//var receiverKeyPair = StellarSdk.Keypair.fromSecret(receiverSecretKey);
//var receiverPublicKey =receiverKeyPair.publicKey(); ;
var receiverPublicKey = 'GCFW3WDOYTJSKXDUXNV6QVRUP4WF7GAAOBZ3FI37K42OJW65VYSONKG6';
var transaction;


const sourceKeypair = StellarSdk.Keypair.fromSecret(sourceSecretKey);
const sourcePublicKey = sourceKeypair.publicKey();



(async function main() {
    try {

      //the JS SDK uses promises for most actions, such as retrieving an account
      const account = await server.loadAccount(sourcePublicKey);

        //transfer funds
      const fee = await server.fetchBaseFee();

      console.log("Balances for account: " + sourcePublicKey);
      account.balances.forEach(function(balance) {
        console.log("Type:", balance.asset_type, ", Balance:", balance.balance);
      });

      //const destAccount = await server.loadAccount(receiverPublicKey);

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
          .setTimeout(0)
          // Uncomment to add a memo (https://www.stellar.org/developers/learn/concepts/transactions.html)
          .addMemo(StellarSdk.Memo.text('memoId=18'))
          .build();
      
        // Sign this transaction with the secret key
        // NOTE: signing is transaction is network specific. Test network transactions
        // won't work in the public network. To switch networks, use the Network object
        // as explained above (look for StellarSdk.Network).
        transaction.sign(sourceKeypair);
      
        // Let's see the XDR (encoded in base64) of the transaction we just built
        console.log(transaction.toEnvelope().toXDR('base64'));
        const signedTransaction = transaction.toEnvelope().toXDR().toString('base64');
      
        // Submit the transaction to the Horizon server. The Horizon server will then
        // submit the transaction into the network for us.
        try {
          const transactionResult = await server.submitTransaction(transaction);
          console.log(JSON.stringify(transactionResult, null, 2));
          console.log('\nSuccess! View the transaction at: ');
          console.log(transactionResult._links.transaction.href);
          console.log(signedTransaction);
        } catch (e) {
          console.log('An error has occured:');
          console.log(e);
          console.log(JSON.stringify(e.data));
        }

        } catch (e) {
      console.error("ERROR Thrown", e);
      
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


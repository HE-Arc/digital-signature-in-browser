document.addEventListener("DOMContentLoaded", function() {
  console.log("DOMContentLoaded");
  "use strict";
  var openpgp = window.openpgp;
  //openpgp.initWorker({ path:'openpgp.worker.js' });
  var keyPair;    // Used by several handlers later
  var pr;
  var pu;

  var encrypted;

  createAndSaveAKeyPair().then(function() {
    console.log("keyPair generated");
    document.getElementById("sign").addEventListener("click", signTheFile);
    document.getElementById("verify").addEventListener("click", verifyTheFile);
  }).catch(function(err) {
    alert("Could not create a keyPair or enable buttons: " + err.message + "\n" + err.stack);
  });
//--------------------
  function createAndSaveAKeyPair() { // Paul: Garder la fonction mais changer le contenu
    console.log("Creating and saving a key pair...");
    var options = {
        userIds: [{ name:'Jon Smith', email:'jon@example.com' }], // multiple user IDs
        numBits: 4096,                                            // RSA key size
        passphrase: 'super long and hard to guess secret'         // protects the private key
    };
    return openpgp.generateKey(options).then(function(key) {
      pr = key.privateKeyArmored; // '-----BEGIN PGP PRIVATE KEY BLOCK ... '
      console.log("Private key :", pr);
      pu = key.publicKeyArmored;   // '-----BEGIN PGP PUBLIC KEY BLOCK ... '
      console.log("Public key :", pu);
      var revocationCertificate = key.revocationCertificate; // '-----BEGIN PGP PUBLIC KEY BLOCK ... '
      keyPair = key;
      return key;
    });
  }
//--------------------
  async function signTheFile() {
    var sourceFile = document.getElementById("source-file").files[0];
    if(sourceFile == undefined){
      alert("No file selected !");
    }
    else {
      console.log("File signature begins...");
    }
    var reader = new FileReader();
    reader.onload = processTheFile;
    reader.readAsText(sourceFile);
    //--------------------
    async function processTheFile() {
      console.log("Processing the file...");
      //var privkey = keyPair.privateKeyArmored; // '-----BEGIN PGP PRIVATE KEY BLOCK ... '
      //var pubkey = keyPair.publicKeyArmored;   // '-----BEGIN PGP PUBLIC KEY BLOCK ... '
      var passphrase = 'secret passphrase'; //what the privKey is encrypted with
      var reader = this;              // Was invoked by the reader object
      var plaintext = reader.result;

      console.log("plaintext :", plaintext);
      await sign_message(pu, pr, passphrase, plaintext);
      //console.log("signed :", signed);
    } // end of processTheFile
  } // end of signTheFile click handler
//--------------------
  function verifyTheFile() {
    var sourceFile = document.getElementById("source-file").files[0];
    var reader = new FileReader();
    reader.onload = processTheFile;
    reader.readAsArrayBuffer(sourceFile);
    //--------------------
    function processTheFile() {
      var reader = this;              // Invoked by the reader object
      var data = reader.result;
      var signatureLength = new Uint16Array(data, 0, 2)[0];   // First 16 bit integer
      var signature       = new Uint8Array( data, 2, signatureLength);
      var plaintext       = new Uint8Array( data, 2 + signatureLength);
      verify(plaintext, signature, keyPair.publicKeyArmored).
      then(function(blob) { // Paul: peut virer, cf code de la doc (y'a une ligne if(validity){...})
        if (blob === null) {alert("Invalid signature!");}
        else {
          alert("Signature is valid.");
          var url = URL.createObjectURL(blob);
          document.getElementById("download-links").insertAdjacentHTML(
              'beforeEnd','<li><a href="' + url + '">Verified file</a></li>');
        }
      }).catch(function(err) {
        alert("Something went wrong verifying: " + err.message + "\n" + err.stack);
      });
      //--------------------
      function verify(plaintext, signature, publicKey) {
        options = {
            message: openpgp.cleartext.readArmored(cleartext),            // parse armored message
            publicKeys: openpgp.key.readArmored(publicKey).keys,        // for verification
        };
        return openpgp.verify(options).then(handleVerification(verified));
        function handleVerification(verified) {
          if (verified.signatures[0].valid) {
              console.log(verified.signatures);
              console.log(signature);
              return new Blob([plaintext], {type: "application/octet-stream"});
          } else {
              return null;
          }
        }
      } // end of verify
    } // end of processTheFile
  } // end of decryptTheFile
});



function stringToUint(string) {
    var string = btoa(unescape(encodeURIComponent(string))),
        charList = string.split(''),
        uintArray = [];
    for (var i = 0; i < charList.length; i++) {
        uintArray.push(charList[i].charCodeAt(0));
    }
    return new Uint8Array(uintArray);
}

function uintToString(uintArray) {
    var encodedString = String.fromCharCode.apply(null, uintArray),
        decodedString = decodeURIComponent(escape(atob(encodedString)));
    return decodedString;
}

async function sign_message(pubkey, privkey, passphrase, message){
	var priv = await openpgp.key.readArmored(privkey);
	var pub = await openpgp.key.readArmored(pubkey);
  console.log("priv",priv);
  console.log("pub",pub);

  var privKeyObj = priv.keys[0];
  passphrase = "secret";
  await privKeyObj.decrypt(passphrase);
  console.log("privKeyObj",privKeyObj);
  options = {
    message: openpgp.cleartext.fromText(message), // CleartextMessage or Message object
    privateKeys: [privKeyObj]                             // for signing
  };

  openpgp.sign(options).then(function(signed) {
      cleartext = signed.data; // '-----BEGIN PGP SIGNED MESSAGE ... END PGP SIGNATURE-----'
  });
	return signed;
	}

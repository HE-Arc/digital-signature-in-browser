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

  function createAndSaveAKeyPair() {
    console.log("Creating and saving a key pair...");
    var options = {
        userIds: [{ name:'Jon Smith', email:'jon@example.com' }],
        numBits: 4096,
        passphrase: 'super long and hard to guess secret'
    };
    return openpgp.generateKey(options).then(function(key) {
      pr = key.privateKeyArmored;
      console.log("Private key :", pr);
      pu = key.publicKeyArmored;
      console.log("Public key :", pu);
      var revocationCertificate = key.revocationCertificate;
      keyPair = key;
      test();
      return key;
    });
  }

  async function test()
  {
    var msg = "hi";
    var cleartext, validity;
    var pubkey = pu;
    console.log(pubkey);
    var privkey = pr;
    console.log(privkey);
    var passphrase = 'super long and hard to guess secret'; //what the privKey is encrypted with

    var privKeyObj = (await openpgp.key.readArmored(privkey)).keys[0];
    await privKeyObj.decrypt(passphrase);
    console.log("privKey read");
    var options_sign = {
      message: openpgp.cleartext.fromText(msg),
      privateKeys: [privKeyObj]
    };
    console.log("options sign");

    await openpgp.sign(options_sign).then(function(signed) {
        cleartext = signed.data; // '-----BEGIN PGP SIGNED MESSAGE ... END PGP SIGNATURE-----'
    });

    console.log("options verify");
    var options_verify = {
        message: await openpgp.cleartext.readArmored(cleartext), // parse armored message
        publicKeys: (await openpgp.key.readArmored(pubkey)).keys // for verification
    };

    console.log("sign");
    await openpgp.verify(options_verify).then(function(verified) {
      validity = verified.signatures[0].valid; // true
      if (validity) {
          console.log('signed by key id ' + verified.signatures[0].keyid.toHex());
      }
    });
    console.log("verify");
  }
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

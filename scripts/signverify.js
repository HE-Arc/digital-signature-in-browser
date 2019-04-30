document.addEventListener("DOMContentLoaded", function() {
  console.log("DOMContentLoaded");
  "use strict";
  var encrypted;

  async function test()
  {
    var msg = "hi";
    var cleartext, validity;
    var pubkey = keyPair.publicKeyArmored;
    var privkey = keyPair.privateKeyArmored;
    var passphrase = 'super long and hard to guess secret'; //what the privKey is encrypted with

    var privKeyObj = (await openpgp.key.readArmored(privkey)).keys[0];
    await privKeyObj.decrypt(passphrase);
    var options_sign = {
      message: openpgp.cleartext.fromText(msg),
      privateKeys: [privKeyObj]
    };
    await openpgp.sign(options_sign).then(function(signed) {
        cleartext = signed.data; // '-----BEGIN PGP SIGNED MESSAGE ... END PGP SIGNATURE-----'
    });
    var options_verify = {
        message: await openpgp.cleartext.readArmored(cleartext), // parse armored message
        publicKeys: (await openpgp.key.readArmored(pubkey)).keys // for verification
    };
    await openpgp.verify(options_verify).then(function(verified) {
      validity = verified.signatures[0].valid; // true
      if (validity) {
          console.log('signed by key id ' + verified.signatures[0].keyid.toHex());

      }
    });
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

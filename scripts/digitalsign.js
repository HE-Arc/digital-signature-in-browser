// Will create a random key pair for digital signing and
// verification. A file can be selected and then signed, or
// a signed file can be verified, with that key pair.

document.addEventListener("DOMContentLoaded", function() {
    "use strict";

    var openpgp = window.openpgp;
    var keyPair;    // Used by several handlers later

    // Only enable the cryptographic operation buttons if a key pair can be created
    document.getElementById("sign").addEventListener("click", signTheFile);
    document.getElementById("verify").addEventListener("click", verifyTheFile);
    document.getElementById("openPGPGenerateKeys").addEventListener("click", function()
    {keyPair = createAndSaveAKeyPair().
    catch(function(err) {
        alert("Could not create a keyPair or enable buttons: " + err.message + "\n" + err.stack);
    });});
    document.getElementById("openPGPTest").addEventListener("click", test);

    async function test()
    {
      document.getElementById("openpgp_test_waiting").hidden = false;
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
            document.getElementById("openpgp_test_result").innerHTML = "<span class=\"badge badge-success\">Success : Signed by key ID " + verified.signatures[0].keyid.toHex()+"</span>";
        }
        else {
          document.getElementById("openpgp_test_result").innerHTML = "<span class=\"badge badge-danger\">Failed</span>";
        }
      });
      document.getElementById("openpgp_test_waiting").hidden = true;
    }

    function createAndSaveAKeyPair() {
      document.getElementById("openpgp_genkey_waiting").hidden = false;
      console.log("Generating key pair");
        // Returns a promise.
        // Takes no input, yields a key pair to the then handler.
        // Side effect: updates keyPair in enclosing scope with new value.

        // Data used to generate keys
        var options = {
            userIds: [{ name:'Jon Smith', email:'jon@example.com' }], // multiple user IDs
            numBits: 4096,                                            // key size
            passphrase: 'super long and hard to guess secret'         // protects the private key
        };

        return openpgp.generateKey(options).then(function(key) {
            var privkey = key.privateKeyArmored; // '-----BEGIN PGP PRIVATE KEY BLOCK ... '
            var pubkey = key.publicKeyArmored;   // '-----BEGIN PGP PUBLIC KEY BLOCK ... '
            document.getElementById("privkey_openpgp").innerHTML = privkey;
            document.getElementById("pubkey_openpgp").innerHTML = pubkey;
            document.getElementById("openPGPTest").disabled = false;
            document.getElementById("sign").disabled = false;
            document.getElementById("verify").disabled = false;
            var revocationCertificate = key.revocationCertificate; // '-----BEGIN PGP PUBLIC KEY BLOCK ... '
            document.getElementById("openpgp_genkey_waiting").hidden = true;
            keyPair = key;
            return key;
        });
    }



    // Click handlers to sign or verify the given file:

    function signTheFile() {
        // Click handler. Reads the selected file, then signs it to
        // the random key pair's private key. Creates a Blob with the result,
        // and places a link to that Blob in the download-results section.
        var sourceFile = document.getElementById("source-file").files[0];

        var reader = new FileReader();
        reader.onload = processTheFile;
        reader.readAsBinaryString(sourceFile);

        // Asynchronous handler:
        async function processTheFile() {
            // Load handler for file reader. Needs to reference keyPair from
            // enclosing scope.

            var reader = this;              // Was invoked by the reader object
            var plaintext = reader.result;

            var privateKey = (await openpgp.key.readArmored(keyPair.privateKeyArmored)).keys[0];
            await privateKey.decrypt("super long and hard to guess secret");

            sign(plaintext, privateKey).
            then(function(blob) {
                var url = URL.createObjectURL(blob);
                document.getElementById("download-links").insertAdjacentHTML(
                    'beforeEnd',
                    '<li><a href="' + url + '">Signed file</a></li>');
            }).
            catch(function(err) {
                alert("Something went wrong signing: " + err.message + "\n" + err.stack);
            });


            async function sign(plaintext, privateKey) {
                // Returns a Promise that yields a Blob to its
                // then handler. The Blob points to an signed
                // representation of the file. The structure of the
                // Blob's content's structure:
                //    16 bit integer length of the digital signature
                //    Digital signature
                //    Original plaintext

                var options = {
                    message: openpgp.cleartext.fromText(plaintext),         // CleartextMessage or Message object
                    privateKeys: [privateKey]                               // for signing
                };

                return openpgp.sign(options).then(
                    function packageResults(signature) {
                        // Returns a Blob representing the package of
                        // the signature it is provided and the original
                        // plaintext (in an enclosing scope).
                        var length = new Uint16Array([signature.byteLength]);

                        return new Blob(
                            [
                                //length,     // Always a 2 byte unsigned integer
                                signature.data,  // "length" bytes long
                                //plaintext   // Remainder is the original plaintext
                            ],
                            {type: "application/octet-stream"}
                        );
                    }
                );

            } // End of sign
        } // end of processTheFile
    } // end of signTheFile click handler




    function verifyTheFile() {
        // Click handler. Reads the selected file, then verify the digital
        // signature using the random key pair's public key. Shows an alert
        // saying whether the signature is valid or not. If the signature is
        // valid, it also creates a Blob with the original file
        // and places a link to that Blob in the download-results section.

        var sourceFile = document.getElementById("source-file").files[0];

        var reader = new FileReader();
        reader.onload = processTheFile;
        reader.readAsBinaryString(sourceFile);


        function processTheFile() {
            // Load handler for file reader. Needs to reference keyPair from
            // enclosing scope.
            var reader = this;              // Invoked by the reader object
            var data = reader.result;

            verify(data, keyPair.publicKeyArmored).
            then(function(blob) { // Paul: peut virer, cf code de la doc (y'a une ligne if(validity){...})
                if (blob === null) {
                    alert("Invalid signature!");
                } else {
                    alert("Signature is valid.");
                    var url = URL.createObjectURL(blob);
                    document.getElementById("download-links").insertAdjacentHTML(
                        'beforeEnd',
                        '<li><a href="' + url + '">Verified file</a></li>');
                }
            }).
            catch(function(err) {
                alert("Something went wrong verifying: " + err.message + "\n" + err.stack);
            });


            async function verify(plaintext, publicKey) {
                // Shows an alert stating whether the signature is
                // valid or not, and returns a Promise the yields
                // either a Blob containing the original plaintext
                // or null if the signature was invalid.

                var message = await openpgp.cleartext.readArmored(plaintext);
                var pk = (await openpgp.key.readArmored(publicKey)).keys; // for verification

                var options = {
                    message: message,
                    publicKeys: pk
                };

                return openpgp.verify(options).then(

                    function handleVerification(verified) {

                        if(verified.signatures.length == 0) return null;
                        if (verified.signatures[0].valid) {
                            return new Blob([plaintext], {type: "application/octet-stream"});
                        } else {
                            return null;
                        }
                    }

                );

            } // end of verify
        } // end of processTheFile
    } // end of decryptTheFile

});

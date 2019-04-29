// Will create a random key pair for digital signing and
// verification. A file can be selected and then signed, or
// a signed file can be verified, with that key pair.

document.addEventListener("DOMContentLoaded", function() {
    "use strict"; // Paul: à quoi sert le use strict

    var openpgp = window.openpgp;
    openpgp.initWorker({ path:'openpgp.worker.js' });

    var keyPair;    // Used by several handlers later

    createAndSaveAKeyPair().
    then(function() { // Paul: à garder tel quel, changer contenu de fonction bien évidemment
        // Only enable the cryptographic operation buttons if a key pair can be created
        document.getElementById("sign").addEventListener("click", signTheFile);
        document.getElementById("verify").addEventListener("click", verifyTheFile);
    }).
    catch(function(err) {
        alert("Could not create a keyPair or enable buttons: " + err.message + "\n" + err.stack);
    });



    // Key pair creation:

    function createAndSaveAKeyPair() { // Paul: Garder la fonction mais changer le contenu
        // Returns a promise.
        // Takes no input, yields a key pair to the then handler.
        // Side effect: updates keyPair in enclosing scope with new value.

		// Paul: 2 possibilité, insérer la section Generate new key pair de la doc officiel
        //ou générer clé depuis site(https://pgpkeygen.com/) et les charger ici

        // RSA
        var options = {
            userIds: [{ name:'Jon Smith', email:'jon@example.com' }], // multiple user IDs
            numBits: 4096,                                            // RSA key size
            passphrase: 'super long and hard to guess secret'         // protects the private key
        };

        return openpgp.generateKey(options).then(function(key) {
            var privkey = key.privateKeyArmored; // '-----BEGIN PGP PRIVATE KEY BLOCK ... '
            var pubkey = key.publicKeyArmored;   // '-----BEGIN PGP PUBLIC KEY BLOCK ... '
            var revocationCertificate = key.revocationCertificate; // '-----BEGIN PGP PUBLIC KEY BLOCK ... '

            keyPair = key;
            return key;
        });
    }



    // Click handlers to sign or verify the given file:

    function signTheFile() {
        // Click handler. Reads the selected file, then signs it to
        // the random key pair's private key. Creates a Blob with the result,
        // and places a link to that Blob in the download-results section.

		// Paul: garder tel quel
        var sourceFile = document.getElementById("source-file").files[0];

        var reader = new FileReader();
        reader.onload = processTheFile;
        reader.readAsArrayBuffer(sourceFile);

        // Asynchronous handler:
        function processTheFile() {
            // Load handler for file reader. Needs to reference keyPair from
            // enclosing scope.

            var reader = this;              // Was invoked by the reader object
            var plaintext = reader.result;

			// Paul: ici sign vas générer un blob qui sera utilisé dans la ligne après elle
            sign(plaintext, keyPair.privateKeyArmored).
            then(function(blob) { // Paul: pourrait garder la structure tel ou changer le type d'objet manipulé si blob pas maitrisé
                var url = URL.createObjectURL(blob);
                document.getElementById("download-links").insertAdjacentHTML(
                    'beforeEnd',
                    '<li><a href="' + url + '">Signed file</a></li>');
            }).
            catch(function(err) {
                alert("Something went wrong signing: " + err.message + "\n" + err.stack);
            });


            function sign(plaintext, privateKey) {
                // Returns a Promise that yields a Blob to its
                // then handler. The Blob points to an signed
                // representation of the file. The structure of the
                // Blob's content's structure:
                //    16 bit integer length of the digital signature
                //    Digital signature
                //    Original plaintext

				// Paul: remplacer cf section "Sign and verify cleartext messages" de doc

                options = {
                    message: openpgp.cleartext.fromText(plaintext),         // CleartextMessage or Message object
                    privateKeys: [privateKey]                               // for signing
                };

                return openpgp.sign(options).then(packageResults(signature));

                function packageResults(signature) { // Paul: doit surement changer ça surtout avec changement du type blob
                    // Returns a Blob representing the package of
                    // the signature it is provided and the original
                    // plaintext (in an enclosing scope).

                    var length = new Uint16Array([signature.byteLength]);
                    return new Blob(
                        [
                            length,     // Always a 2 byte unsigned integer
                            signature,  // "length" bytes long
                            plaintext   // Remainder is the original plaintext
                        ],
                        {type: "application/octet-stream"}
                    );
                }

            } // End of sign
        } // end of processTheFile
    } // end of signTheFile click handler




    function verifyTheFile() {
        // Click handler. Reads the selected file, then verify the digital
        // signature using the random key pair's public key. Shows an alert
        // saying whether the signature is valid or not. If the signature is
        // valid, it also creates a Blob with the original file
        // and places a link to that Blob in the download-results section.

		// Paul: garder tel quel
        var sourceFile = document.getElementById("source-file").files[0];

        var reader = new FileReader();
        reader.onload = processTheFile;
        reader.readAsArrayBuffer(sourceFile);


        function processTheFile() {
            // Load handler for file reader. Needs to reference keyPair from
            // enclosing scope.
            var reader = this;              // Invoked by the reader object
            var data = reader.result;

            // First, separate out the relevant pieces from the file.
			// Paul: pas besoin de séparer il me semble
            var signatureLength = new Uint16Array(data, 0, 2)[0];   // First 16 bit integer
            var signature       = new Uint8Array( data, 2, signatureLength);
            var plaintext       = new Uint8Array( data, 2 + signatureLength);

            verify(plaintext, signature, keyPair.publicKeyArmored).
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


            function verify(plaintext, signature, publicKey) {
                // Shows an alert stating whether the signature is
                // valid or not, and returns a Promise the yields
                // either a Blob containing the original plaintext
                // or null if the signature was invalid.

                // Paul: ouais tout changer et se référencer de nouveaux à la section Sign and verify cleartext messages

                options = {
                    message: openpgp.cleartext.readArmored(cleartext),            // parse armored message
                    publicKeys: openpgp.key.readArmored(publicKey).keys,        // for verification
                };

                return openpgp.verify(options).then(handleVerification(verified));

                function handleVerification(verified) {
                    // Returns either a Blob containing the original plaintext
                    // (if verification was successful) or null (if not).
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

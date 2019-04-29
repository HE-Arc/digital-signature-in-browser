# Signature électronique dans le navigateur

## PGP (Pretty Good Privacy)
PGP est un programme d'encryption qui fourni des outils de secret cryptographique et d'authentification pour le transfert de données. PGP est utilisé pour signer des documents, encrypter et décrypter des emails, du text, des fichiers, des dossiers and des partitions de disque pour augmenter la sécurité de la communication par email.

PGP suit le RFC [OpenPGP Message Format](https://tools.ietf.org/html/rfc4880)

<sub> - Traduit de https://en.wikipedia.org/wiki/Pretty_Good_Privacy</sub>

### OpenPGP.js
> This project aims to provide an Open Source OpenPGP library in JavaScript so it can be used on virtually every device. Instead of other implementations that are aimed at using native code, OpenPGP.js is meant to bypass this requirement (i.e. people will not have to install gpg on their machines in order to use the library). The idea is to implement all the needed OpenPGP functionality in a JavaScript library that can be reused in other projects that provide browser extensions or server applications. It should allow you to sign, encrypt, decrypt, and verify any kind of text - in particular e-mails - as well as managing keys.

#### Support de la plateforme
Cette bibliothèque JavaScript est supportée par tous les navigateurs populaires. Elle fonctionne effectivement bien sur les versions récentes de Chrome, Firefox, Safari et Edge.
Il est même possible de l'utiliser avec Node.js 8+.

Il existe également des version du script supporté par IE 11 et des vielles version de Safari. L'utilisation de ce bundle n'est cependant pas recommandée car sert uniquement dans des cas de compatibilité restreinte.

#### Installation
L'installation se fait au moyen de la commande NPM :
```
npm install --save openpgp
```
ou pour Bower :
```
bower install --save openpgp
```

#### Utilisation et fonctionnalités
Afin d'utiliser la bibliothèque, il suffit de déclarer un objet :
```js
var openpgp = require('openpgp'); // use as CommonJS, AMD, ES6 module or via window.openpgp

openpgp.initWorker({ path:'openpgp.worker.js' }) // set the relative web worker path
```

Il va ensuite être simple d'encrypter et de décrypter des données.

Par exemple ici pour encrypter un `Uint8Array`:
```js
var options, encrypted;

options = {
    message: openpgp.message.fromBinary(new Uint8Array([0x01, 0x01, 0x01])), // input as Message object
    passwords: ['secret stuff'],                                             // multiple passwords possible
    armor: false                                                             // don't ASCII armor (for Uint8Array output)
};

openpgp.encrypt(options).then(function(ciphertext) {
    encrypted = ciphertext.message.packets.write(); // get raw encrypted packets as Uint8Array
});
```
et pour le décrypter :
```js
options = {
    message: await openpgp.message.read(encrypted), // parse encrypted bytes
    passwords: ['secret stuff'],              // decrypt with password
    format: 'binary'                          // output as Uint8Array
};

openpgp.decrypt(options).then(function(plaintext) {
    return plaintext.data // Uint8Array([0x01, 0x01, 0x01])
});
```

Il va être également possible de :
- Encrypter des `String` avec des clé PGP ;
- Encrypter avec compression (au moyen de l'attribut `compression: openpgp.enums.compression.zip `dans les options) ;
- Encrypter par flux de `Uint8Array` avec un mot de passe ;
- Encrypter par flux de `String`avec des clés PGP ;
- Générer de nouvelles paires de clés (RSA, ECC) ;
- Révoquer un clé ;
- Rechercher une clé publique sur un server HKP ;
- Uploader une clé sur un server HKP ;
- Signer et vérifier des messages en texte clair ;
- Créer et vérifier des signature détachées ;
- Signer et vérifier par flux des données en `Uint8Array`.

#### Licence
GNU Lesser General Public License (3.0 or any later version).

## Digital Bazaar
> Leaders in the creation of open payments, identity, and blockchain solutions for the Web.

### Projet "Forge"
https://github.com/digitalbazaar/forge
> A native implementation of TLS (and various other cryptographic tools) in JavaScript.
> https://github.com/digitalbazaar/forge#tls


## GnuPG

https://www.gnupg.org/


## Sources
- https://en.wikipedia.org/wiki/Pretty_Good_Privacy
- https://openpgpjs.org/
- https://digitalbazaar.com/2010/javascript-tls-1/
- https://blog.engelke.com/2014/08/26/digital-signatures-in-the-browser/
- https://techblog.bozho.net/electronic-signatures-using-the-browser/
- https://github.com/infotechinc/digital-signature-in-browser

document.addEventListener("DOMContentLoaded", function() {
  var rawPubKey = "-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDlOJu6TyygqxfWT7eLtGDwajtNFOb9I5XRb6khyfD1Yt3YiCgQWMNW649887VGJiGr/L5i2osbl8C9+WJTeucF+S76xFxdU6jE0NQ+Z+zEdhUTooNRaY5nZiu5PgDB0ED/ZKBUSLKL7eibMxZtMlUDHjm4gwQco1KRMDSmXSMkDwIDAQAB\n-----END PUBLIC KEY-----";
  var rawPrivKey = "-----BEGIN RSA PRIVATE KEY-----\nMIICXQIBAAKBgQDlOJu6TyygqxfWT7eLtGDwajtNFOb9I5XRb6khyfD1Yt3YiCgQWMNW649887VGJiGr/L5i2osbl8C9+WJTeucF+S76xFxdU6jE0NQ+Z+zEdhUTooNRaY5nZiu5PgDB0ED/ZKBUSLKL7eibMxZtMlUDHjm4gwQco1KRMDSmXSMkDwIDAQABAoGAfY9LpnuWK5Bs50UVep5c93SJdUi82u7yMx4iHFMc/Z2hfenfYEzu+57fI4fvxTQ//5DbzRR/XKb8ulNv6+CHyPF31xk7YOBfkGI8qjLoq06V+FyBfDSwL8KbLyeHm7KUZnLNQbk8yGLzB3iYKkRHlmUanQGaNMIJziWOkN+N9dECQQD0ONYRNZeuM8zd8XJTSdcIX4a3gy3GGCJxOzv16XHxD03GW6UNLmfPwenKu+cdrQeaqEixrCejXdAFz/7+BSMpAkEA8EaSOeP5Xr3ZrbiKzi6TGMwHMvC7HdJxaBJbVRfApFrE0/mPwmP5rN7QwjrMY+0+AbXcm8mRQyQ1+IGEembsdwJBAN6az8Rv7QnD/YBvi52POIlRSSIMV7SwWvSK4WSMnGb1ZBbhgdg57DXaspcwHsFV7hByQ5BvMtIduHcT14ECfcECQATeaTgjFnqE/lQ22Rk0eGaYO80cc643BXVGafNfd9fcvwBMnk0iGX0XRsOozVt5AzilpsLBYuApa66NcVHJpCECQQDTjI2AQhFc1yRnCU/YgDnSpJVm1nASoRUnU8Jfm3Ozuku7JUXcVpt08DFSceCEX9unCuMcT72rAQlLpdZir876\n-----END RSA PRIVATE KEY-----";
  document.getElementById('pubkey').innerHTML = rawPubKey;
  document.getElementById('privkey').innerHTML = rawPrivKey;
  document.getElementById("jsEcryptTest").addEventListener("click", checkJSEncrypt);
  function checkJSEncrypt(){
      var pubKey = document.getElementById('pubkey').value;
      var priKey = document.getElementById('privkey').value;
      var input = document.getElementById('input').value;
      console.log("public key :", pubKey);
      console.log("private key :", priKey);

      var encrypt = new JSEncrypt();
      encrypt.setPublicKey(pubKey);
      var encrypted = encrypt.encrypt(input);
      document.getElementById('encrypted').innerHTML = "<span style=\"color:blue;\">" + encrypted+"</span>";

      var decrypt = new JSEncrypt();
      decrypt.setPrivateKey(priKey);
      var uncrypted = decrypt.decrypt(encrypted);
      document.getElementById('uncrypted').innerHTML = "<span style=\"color:blue;\">" + uncrypted+"</span>";

      if (uncrypted == input) {
        document.getElementById('result').innerHTML = "<h3><span class=\"badge badge-success\">Success</span></h3>";
      }
      else {
        document.getElementById('result').innerHTML = "<h3><span class=\"badge badge-danger\"Fail !</span></h3>";
      }
  }
});

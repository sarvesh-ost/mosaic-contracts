

Prerequisite: 
1. Docker 

Steps to run: 
1. ``` docker pull trailofbits/echidna ```
2. ``````docker run -e LC_ALL=C.UTF-8 -v `pwd`:/src trailofbits/echidna echidna-test /src/security/echidna/test/Sample.sol
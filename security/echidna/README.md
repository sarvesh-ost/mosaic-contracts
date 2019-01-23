

Prerequisite: 
1. Docker 

Steps to run: 
1. ``` docker pull trailofbits/echidna ```
2. ```docker run -e LC_ALL=C.UTF-8 -v `pwd`:/src trailofbits/echidna echidna-test /src/security/echidna/test/Sample.sol```      
    
    
    docker run -e LC_ALL=C.UTF-8 -v `pwd`:/src trailofbits/eth-security-toolbox  echidna-test /src/security/echidna/test/Sample.sol
    
    ```docker run -v `pwd`:/src trailofbits/eth-security-toolbox echidna-test /src/security/echidna/test/Sample.sol```
    
    
    docker run -it -v "$PWD":/src  trailofbits/eth-security-toolbox
    
    docker exec -it <container-name/ID> bash
    
    docker exec -it 25297052d578 echidna-test


docker run --entrypoint "echidna-test" -v `pwd`:/src trailofbits/eth-security-toolbox /src


docker run --entrypoint "echidna-test /src/security/echidna/test/Sample.sol" -v `pwd`:/src trailofbits/eth-security-toolbox


  docker run  --entrypoint "echidna-test" -v `pwd`:/home/ethsec/mosaic-contracts trailofbits/eth-security-toolbox /home/ethsec/mosaic-contracts/security/echidna/test/Sample.sol 
  
  
  
  docker run  --entrypoint "echidna-test" -v `pwd`:/home/ethsec/mosaic-contracts trailofbits/eth-security-toolbox mosaic-contracts/security/echidna/test/Sample.sol 
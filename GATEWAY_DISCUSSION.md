- Revert flow
- ConfirmIntent flow




***Option 1:***

```

    struct ProtocolStorage {
        mapping(address /* sha3(requester,nonce)  */ => Request) requests;
        mapping(bytes32 /* requestHash */ => IntentDeclared) intents;
        mapping(bytes32 /* intentHash */ => IntentConfirmed) confirmations;
    }

    struct Request {
        address requester;
        uint256 nonce;
        bytes32 data;        
    }

    struct IntentDeclared {
        bytes32 proposedHash; //sha3(requester,nonce)
        bytes32 hashLock;
    }

    struct IntentConfirmed {
        bytes32 intentHash;
        bytes32 hashLock;
    }
```
**Pros:**
	
- All states are linked, easy to determine the states	
- revertRequest is possible
	
**Cons:**
    
- 

***Option 2:***
```
    struct ProtocolStorage {
        mapping(address /* requestHash */ => Request) requests;
        mapping(bytes32 /* requestHash */ => Intent) intents;
        mapping(bytes32 /* requestHash */ => Intent) confirmations;
    }
    struct Request {
        address requester;
        uint256 nonce;
        bytes32 data;        
    }

    struct Intent{
        bytes32 hashLock;
    }

```

**Pros:**
- all states are linked, easy to determine the states
- single address can do multiple requests.
- less hashing

**Cons:**
-  no feel good
	

***Option 3:***
```
 struct ProtocolStorage {
        mapping(address /* requestHash */ => Request) requests;
        mapping(bytes32 /* intentHash */ => IntentDeclared) intents;
        mapping(bytes32 /* intentHash */ => IntentConfirmed) confirmations;
    }
   

    struct Request {
        address requester;
        uint256 nonce;
        bytes32 data;
        bytes32 intentHash;
    }

    struct IntentDeclared {
        bytes32 requestHash;
        bytes32 hashLock;
    }

    struct IntentConfirmed {
        bytes32 intentDeclaredHash;
        bytes32 hashLock;
    }
```    
**Pros:**

- all states are linked, easy to determine the states
- single address can do multiple requests.

**Cons:**    

- extra storage is used

***Option 4:***
```
struct ProtocolStorage {
        mapping(address /*sha3(requester,nonce) */ => Transpose) transposes;        
    }

    enum State {
        REQUESTED,
        INTENT_DECLARED,
        INTENT_CONFIRMED
        }
  
    struct Transpose {
        address requester;
        uint256 nonce;
        bytes32 data;
        bytes32 hashLock;
        State state;
    }

```
**Pros:**

- All states are linked, easy to determine the states
- Single address can do multiple requests.

**Cons:**    
- IntentDeclared and intentConfirmed can be messed up (Can be solved by having chainId.)


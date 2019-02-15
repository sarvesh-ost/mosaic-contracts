const CoGateway = artifacts.require('EIP20CoGateway');
const MockAnchor = artifacts.require('MockAnchor');
const BN = require('bn.js');
const rlp = require('rlp');

contract('prove outbox()', (accounts) => {
    let cogateway;
    it('should pass', () => {

    });


    function _serializeProof(proof) {
        const serializedProof = [];
        proof.forEach(p => serializedProof.push(rlp.decode(p)));
        return `0x${rlp.encode(serializedProof).toString('hex')}`;
    }

    function encodedAccountValue(accountProof) {
        const decodedProof = rlp.decode(accountProof);
        const leafElement = decodedProof[decodedProof.length - 1];
        return `0x${leafElement[leafElement.length - 1].toString('hex')}`;
    }

    function proofFormater() {
        const accountProof = ['0xf90211a0f0f1c2273127a3aeef0c6acff9f87dd7b9eece4b4ac974a2a52d713ee7b14c8ea006702d6379d8c112885fafdec4fda66c4e7fae07a50dda35d2dd007da3c0d836a0f5308f806e0c2b0fe608e9b7ec814905a4d1fb4923f5dbb02f082365dec253a4a09e36c547d3b84cee344ba6f83665dc700a7eac58ab75adb1517406a577cb55bca00b7f4ade3e3a06f748f4650611f4a004b86e415d2918e236b006961c2d79a215a0fcedce4fbcfd46af82b6a37f99a9927b6a8df54fd79e9fd9a396103c4d954c64a0c3f4da0ba5eb63f2dba48021e76f107ef08b5a8af1c2758807aaac330942422da0426909b91787a5ec05344ae1fd9134b0be0d630ffd5b450f8bafadcd71bbfca7a036938a4b11ab27d95c49bc995f1d8528e71c406497988263fa6a68230db69186a08033bfa69047a85fe5056ed2aefa5e642f011581574eacc6712073265e353835a0389dfda1fab12f2ebaff9fff28dc83271c22c2a82f976904fc0093d2c0e21d20a0a258c5242e768b0469b763f84bacc17b7e2c27c1fc1cf1800205413588baee6ba048679b4aa7de9aafc9c99217182f9b368702b6aeb833f402eac79dd5cbc5d88ea0f25aea79b31b70ec80791acc4d5a6bc52bd9317b5f397ebe65e3cec233097efca0ecc1f1c81de5c82ec03bb09f669651f9079df91dccaf6aafd8044d22c4173e1aa01462cce1fdb23207b49c14220e2a3a84389d4230d2447b9ad83db2bfe9f163b180', '0xf90211a0b56263fbfa02a69616a3f7e85f1b49a57d8179603a652222494f9765fcd33d4ba097b981137b62395e6ec181f5756893fbd09fb0aa838df392c01235dd7438b395a0b265c3a4836f1c458c7ac31aad734f52f1aa1625ca6fc938c3181dfd5a7f1acea03064ecc2be0e2efffd96c1deac296c5afe8b040eb1348e1d4c14dc16483c50c6a0d8b9e3066238550f104b607766bee4270efbf9b73be9405fe42cb9ad98f71141a0b9c05db35d65a3e0326538012dc49ea8e431fd4367bfd6ed3cbc0eb47605bd64a03dcd95ac041fec5dadde6cf8ed779d984f8b3e9c0d6ec3d8a470381cfe0382f0a0dcd8cb65eea9cac9cd087ad20da894613601bda72231d7c65715575fd09c07afa0b5164930ba080c4b21591bee72945b718e18dc0b7c176cad2b0435a2b6f48c8ba00609a74ee3fdd6bcea4ccfbe99d737b2d2125822088e546211ae46efce410575a029e4c7f5053d529373f779195f51a169a6d1073b20bd39e5afd0b2d578e95134a0be7f23264dbabf5eccef097dce638f691141c0ec18dbb21f16e735a70a342e77a042c84a418925cea0f50100eac97d978765c5e2e44020beb5265b7acf4b19c29ba037ad286128e947cb8b811aebec372a477a794dee8b9f35c18fffbfb45064fb72a0e0a463a68303f1250936f22a32a967845bc5bedacf55677419832d4a7a2efe9da0391b8de81b9621d2167daaec313c626c70045b47648aaa83041bb2dca633201680', '0xf90211a03caa5ecf1a168e633fee251ceb85c2d77ebff13987e5fd418d651f3bee2ffaada0e7e45057ce0b7087cc91468409d3631fa2321dfb1d525962db06a42a1c0acf7aa0aa197e1949d2a872037341ac6e953a9b276d3e8b9f4939870dc581e0d0e15324a0d2ce06973587033ee29b72d71c186469f3fb6658965186f821fea5ffe9616456a0abd7063db6a7790f74b1cf5b8c50ddbb95555cfc15afa97a5865345933ab4857a09f81b9ed6503b325362176960773e84bfaa0d7dde6233c4fa2e3d49ed80da0eaa0e21ddc7cdaa0aa6eda2bc814c0b2a232c85bb9001885712c3450e5ea06496af5a068aa9375cbe2baa5b63c02ec8ab0039a0bb5930e369935ca72ec72c64d36abc3a0b975463e399d37a2ae1002f6dfb034446ab4c000305b12529336ac76a5512708a0b54c646452c47ed6d98affb64cac0d6595f72eaeb27fb55dfb199028834a8a64a00c75549ebe200b6e4e9749d995b64da25b28d3bc2e9aa2af2cf41d8324cf7072a06da08a2c1a5cadb18dde373924354f837b1797cd88c0e487c15435a87d325585a0eef4ead0ec5f8fcd057b1da79c9998513e4ea484aef3074490b29b09dd262beca02b7b32d348a3a505c1ba2fd35f8019fdfc9bc4fdbd5c55fbf9bdc9ea320eaaf3a011ce8e7989fe576aca0361a0bebc85778593ae3dd95bb938870b3699cbff2d8ca0752a9074592f48361781920c67ddff1fb0cd138ce39a7e9951ad66e6b10a48b580', '0xf90211a07bd86cbdf02a00c6e30392ebfaf3e0625ee540e7b23dcd14d71681fe8b1c375aa0575cff378ffc4ee5c0e87d4777b4cd50dafeb41d7b8d28ee83c732f244a6cca6a08f47e287aaaf76e77ac45033b18ca41806adcffd86af444cce9c8d8ded5ca7b2a0f6fb8d367bb079b365840c23b8c9662c1aac52db9575c6097c94b2383adee3b0a0593a48c634557c19f03bedc404f49bc2822c8bd84ad43b62fd66a3c8c0a53a0ca0a9cc9525c4d4c47b9ff87202ba1dc520b697f84d19e7af3642d203394a16cc95a0f259a4df8eca499c0e930996639fb3f5472636ef007557d35e91febe9f6a00dea0728f25b3056f49a6b9b208e9eec7f437ab0e8c3089671dada795b19406689637a0d04267107baa98bbac714b880470455bc327698708c85a68ad88478235280cc3a07d1d258b4ef929281fc2bd456cbfeb745b716d068b44ecddbc9b3118061fef2da0a3179c22dd6663ae3eba120961afc49fe63eda97b4f54b1e5e8ff15e6695a223a0925af7dc398638655f0d98f02754f58d59478f610b392cbd31eeaa2988d7b83aa0780e8b7b43d9113e460c4a0dfcacc86be6c1efb506e65a0db406e8bb344433eea0ed6af8553ce014ad4dd55c6ec94b89377272202b9b8ae2d3633564d0d55ae479a0871d3366bb6a4d2cbfdf5fc840fff795a76d5434346cf41b56cf02d62c326e94a0182a3de028c243190aafc8c10f2691cddfbfc7039a163efce533054a5ac41bfe80', '0xf90211a01d22f1757be9e4351576f378d620aade7accca90a1742b6923a874a178d38f56a0a369994c23bdd9c9f014a344bb3d2db7132e6b9002492200f46a7a90c205a61ba094f5c5f935c10932dfbc3020ed280e036e82d6088dc7a51582287e15dd46499ea0791582abe6f6da3de47bae3dcd34b7f185c0cb1675bb7e5cd2501fe51df41d1ca0b9a81d534681c4b327103b0ca73db10c2c0f79d16e6cb010ed6345294126ae7da0595e9f7c7a63f7cd13aa099b53fc4361905cc118b8d2bc6028cd2f5128fb0578a04a04a90f92ac341ecd714f86964d1ee5d43e4ab1689f9937e5c0a014d2d3cc32a01aaf81c3d3b798c83919630704c16e67c174ca6fc554eaeaddb541607587d25da05a973d33c6ceb4d7eee67eec58196d2d3d0ae377c59aa060b5615585b5dbe318a0bacfacd6198897a1c2ff25cf7e1adc23a3eb5bf7a030e32c25edc18166500506a032ec3eb9adba02a23e07d903711ab24d688fe2a94b4f8753551b6a4f6dbb7412a0556b766f98c69e066fbcb6d3993ad9e9b799e823e79c61bb7cb531a4f9d4ab18a0924b89079f003424a8d6a04e93be978c0ad394dda2e903491105ee8f2d9cad88a0421293219f1684066993b87557e6d2c7cb68fd892a0dcabcf7550ce001ceae04a008e0ca827034b8b64ab835d65825ea302b624009dd338d0bb8390cdbbc5061f8a034f313f5d5f2475f2b71d5e74e248db2a14b68f494232383f4e1cabeaf908b4b80', '0xf90171a0a8baea8b4bbddc5f24e5cb087137b9b0963221670621ab99adcf9b90816dd385a001303ed32041d67d7a5489970da4aaad90e30e1df564fdfb7fd680b98cdf7ef6a0f0536b641f4d5dbdc92b56d1950f0196db76b7231dc989b60169587d9f2da39da09d58a55601fe8fe2f77ba47515466c8364fa0208f96e1f92b73d9270cdd4e312808080a0a6aea67cdba59e3d21ee3f5226057fac070dd5234055b15db36261bdc162cadea0a5447405c314f086d1d38136757d1e3085c39adc0990deb9eb9935dda1ee159380a026b562c411b011cfee8e12e935925bd0b442516129c200c6fcc4a1cead3f7f70a028e911ee0363e516e224811f5ed1e073cd1353a8eae8fdb733728a1d99f29642a05cbe8ffb6695981a46dfa5fa89239d651b9644abca4ddf4cd959315890fcec0c80a079b3e1abead45b977374cf8df308e0109b9b72d826fdbd5cb65fb167b2d55c16a04269a7a1d625890b4fb813616051174b1ad0d0a09624bb9f06fe1ec0c4cb53a980', '0xf85180808080a0208993f3de76e7843aa61cfcb62bc73ce349784362b49e03e0827d85c7ebd00b8080808080808080a0731390bfe00c9e0402dca333593f203b054a6c2d3e0a926fabb16db45629b387808080', '0xf8669d3903e057c9c4809101e1667de09aa59043d16d57b44494bcf70221b26fb846f8440280a0a506e7e444fc636360bb593a808f41f126a8813ea71410d4515987eacc594380a01bc7f26ca818080374995fd5eea0b581997a82128fc914d9a4f295522010af23'];

        const rlpParentNodes = _serializeProof(accountProof);
        const rlpAccount = encodedAccountValue(rlpParentNodes);
        return { rlpAccount, rlpParentNodes };
    }

    it('prove gateway should work', async () => {
        const gatewayAddress = web3.utils.toChecksumAddress('0x4afb38b909efec5ce2447b0bd2a7e1e00aed6f74');
        const blockHeight = 5022146;
        const stateRoot = '0x493c4acaa49946c92d3b4428f8269b44230acccb0526693078357b06b26b29a7';
        const proofData = proofFormater();
        const { rlpAccount } = proofData;
        const { rlpParentNodes } = proofData;

        console.log('old rlp account  ', rlpAccount);
        console.log('old parent nodes  ', rlpParentNodes);

        console.log('rlp parent nodes ', rlpParentNodes);
        console.log('encoded account', rlpAccount);
        console.log('gateway address ', gatewayAddress);

        console.log('sha3 encoded account  ', web3.utils.sha3(rlpAccount));
        console.log('state root  ', stateRoot);
        const mockAnchor = await MockAnchor.new(
            1,
            blockHeight,
            stateRoot,
            10,
            accounts[0],
        );

        cogateway = await CoGateway.new(
            accounts[0],
            accounts[1],
            mockAnchor.address,
            new BN(0),
            accounts[2],
            gatewayAddress,
            accounts[4],
        );
        const encodedPath = await cogateway.encodedGatewayPath.call();

        console.log('encodedPath  ', encodedPath);
        console.log('expected encodedPath  ', web3.utils.sha3(gatewayAddress));

        const tx = await cogateway.proveGateway(
            blockHeight,
            rlpAccount,
            rlpParentNodes,
        );

        console.log('tx  ', tx);
    });

    it('should prove outbox storage', async () => {
        const storageProof = ['0xf9019180a0320ce86e317f7e61e7890a6671338aa79374e5ec3206fc38496b5b3719788fc4a07642cb37fbbc28c4c2e8367a93bb491013223d266543c0e42db6a580cc274beea0ad8732b76b5befaa3c523633abdafb8b410b8e1140526255c839a7225e2b2f3ea060b926526a0a95873151f96f0c4aa7746dd1cc51242b4893d43554acd2716cda80a03e819a317d72fa7445677a4104b74899547b424aec05ae303b605f7d78aa9dc4a0c9980a15de3258be2f1dcf5d0657c256f7e7aebe83b736aada89aa02dee3853ea0747f61b4309342612ee827a5930678c61bd54a2c85e207144c265912351d46f4a070256c377a27b7c7cdf605559f21f20f54d147abce914c3b1ac36815fd8f2b8080a0b7a25a664618fb58b0754dd3c9665402787704d11169240bccf8e7c34feb0167a0e78c6966deeb91437d0c2cbf66bde64fd4dbb76d22a9885679a3cf9e5fd84394a02a74dc63db6f6f5f79d6cadbb2b348771d3bcd1913f9319cfa0c5fea4353db47a0e53cc96cd3fe0910d63b48800ac824d7f0e094548d259d6342da2189ca3c0e238080', '0xe210a0094e521c10bbb9291d38d4aebd6c6722a4763451011f97f24709b28611831699', '0xf8518080808080a0460b29d4cbb31e3680769b8ece024e6e35e9c9c3d9c7c207873e93b8c43cff1980a0fe9627f9a9fb3323465824fc6fdfd87f907332a17f6ed39bfdcd94c76b548eee808080808080808080', '0xe19f369c9cc6db1aff35e37923897950227d2a87c95ef0101b2a0233740f2ce00d01'];

        const params = {
            _staker: '0x2d0f1f8e1080f600c1cc00f76f8a54629b3e6f23',
            _stakerNonce: '1',
            _beneficiary: '0x2d0f1f8e1080f600c1cc00f76f8a54629b3e6f23',
            _amount: '100000000000000000000001',
            _gasPrice: 0,
            _gasLimit: '0',
            _hashLock: '0xa637077f40c1aacffbcf74d0b293ef74a905ca46adb2b501bb4aaae9791052e5',
            _blockHeight: '5022146',
            _rlpParentNodes: _serializeProof(storageProof),
        };

        console.log('params  proof  ', params._rlpParentNodes);
        const tx = await cogateway.confirmStakeIntent(
            params._staker,
            params._stakerNonce,
            params._beneficiary,
            params._amount,
            params._gasPrice,
            params._gasLimit,
            params._hashLock,
            params._blockHeight,
            params._rlpParentNodes,
        );

        console.log('tx  ', JSON.stringify(tx));
    });

});

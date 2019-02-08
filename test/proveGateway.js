const CoGateway = artifacts.require('EIP20CoGateway');
const MockAnchor = artifacts.require('MockAnchor');
const BN = require('bn.js');
const rlp = require('rlp');

contract('proveGateway()', (accounts) => {
    it('should work', async () => {
        const gatewayAddress = '0xdef0f57a707c0753abbe8160be315b975b26d00e';
        const blockHeight = 2630;
        const stateRoot = '0x633b9ffe8496172f21824dbfc72d54312236ca5c487f26e9b5525ac2b366bb05';
        const rlpAccount = '0xf8440280a0fc4518e9aaa31685ec476d16f1f42265ab8eb67605d9f065ea549bac53b5d3fea0901d47b7752ce01179f7a957dbe341bacfa8ff2ce4e288c59c69a2f7c5f9e29f';
        const rlpParentNodes = '0xf90214f901318080a079fb08360be32d153888ece4d1ede8daccef65445a9eef5f9661105921fdc9f1a0aa7ada131dbb27da67d7818be119e978d0b5ae15d7622cc5f16117d87415aaeda0cd58433cd04958bb692927ea2ac2a17cc77876b4657ff8500eba6c2f96466e8180a0cd9cbf5d58fa1b9ef563424160a8df200de591330db40fc0841ba5ab9b1a3d95a08b52ed33f34d54179128c0964038a0ea63b9b80aae0d08b45d22806d187ba5ea808080a0debea5022fc20ae39192fc2fd4687cca7f0e04d9f177e5062422843eb499476280a0d1a8a7c8b4a6c4cefb044f77c13fd58821b157a714d5e5f581e6977033692464a063f2061ed50fd24168a37f9e039d10ac50f25bedf265103b165cc88d15dd2535a055ef10ed5853dc743d996b154ff57d689869294e7b724a6fb9110d186e197a1380e215a0dd7d36f682e2143373c1c844cb7326fb9ba0f1273f6cb950ef3bb5ede7168684f85180808080808080a0579c81b389d67b5cb3123c4a341506e3d82058362b8db3780518d48f68af95eb8080a097df18002916dfef40256f4a250b345c076ca77d0de236bc834a4e7f1637b69c808080808080f8689f35aa090dec238086b8c146091e13edc88e17527560780ac5832a0fc64dc76cb846f8440280a0fc4518e9aaa31685ec476d16f1f42265ab8eb67605d9f065ea549bac53b5d3fea0901d47b7752ce01179f7a957dbe341bacfa8ff2ce4e288c59c69a2f7c5f9e29f';


        console.log('rlp account ', rlp.decode(rlpAccount));
        const mockAnchor = await MockAnchor.new(
            1,
            blockHeight,
            stateRoot,
            10,
            accounts[0],
        );

        const cogateway = await CoGateway.new(
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

        const tx = await cogateway.proveGateway(
            blockHeight,
            rlpAccount,
            rlpParentNodes,
        );

        console.log('tx  ', tx);
    });
});

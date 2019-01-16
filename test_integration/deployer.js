const chai = require('chai');
const Web3 = require('web3');
const childProcess = require('child_process');
const waitPort = require('wait-port');
const {
    tryDeployNewToken,
    getChainInfo,
    deployAnchorAndGateway,
    deployAnchorAndCoGateway,
} = require('../tools/blue_deployment/step1');

const { assert } = chai;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const dockerNodesSetup = () => {
    const dockerCompose = childProcess.spawn('docker-compose', ['-f', '/Users/hobofan/ost/chains-utils/docker-compose-testing.yml', 'up', '--force-recreate']);

    if (process.env.TEST_STDOUT) {
        dockerCompose.stdout.on('data', (data) => {
            process.stdout.write(data);
        });
        dockerCompose.stderr.on('data', (data) => {
            process.stderr.write(data);
        });
    }

    const waitForOriginNode = waitPort({ port: 8545, output: 'silent' });
    const waitForAuxiliaryNode = waitPort({ port: 8546, output: 'silent' });
    return Promise.all([waitForOriginNode, waitForAuxiliaryNode]);
};

const dockerNodesTeardown = () => {
    const dockerComposeDown = childProcess.spawnSync('docker-compose', ['-f', '/Users/hobofan/ost/chains-utils/docker-compose-testing.yml', 'down']);
    if (process.env.TEST_STDOUT) {
        process.stdout.write(dockerComposeDown.stdout);
        process.stderr.write(dockerComposeDown.stderr);
    }
};

describe('Deployer', () => {
    const rpcEndpointOrigin = 'http://localhost:8545';
    const rpcEndpointAuxiliary = 'http://localhost:8546';

    let web3Origin;
    let accountsOrigin;
    let web3Auxiliary;
    let accountsAuxiliary;

    before(async () => {
        await dockerNodesSetup();
        // wait for a little bit to allow the ethereum nodes to come online
        await sleep(5000);

        web3Origin = new Web3(rpcEndpointOrigin);
        web3Auxiliary = new Web3(rpcEndpointAuxiliary);
        accountsOrigin = await web3Origin.eth.getAccounts();
        accountsAuxiliary = await web3Auxiliary.eth.getAccounts();
    });

    after(() => {
        dockerNodesTeardown();
    });

    let tokenAddressOrigin;
    let baseTokenAddressOrigin;
    it('correctly deploys token and base token on Origin', async () => {
        const deployerAddressOrigin = accountsOrigin[0];

        tokenAddressOrigin = await tryDeployNewToken(rpcEndpointOrigin, deployerAddressOrigin, 'new');
        assert(
            Web3.utils.isAddress(tokenAddressOrigin),
            'Did not correctly deploy token on Origin.',
        );

        baseTokenAddressOrigin = await tryDeployNewToken(rpcEndpointOrigin, deployerAddressOrigin, 'new');
        assert(
            Web3.utils.isAddress(baseTokenAddressOrigin),
            'Did not correctly deploy base token on Origin.',
        );
    });

    it('correctly deploys Gateway and CoGateway', async () => {
        const deployerAddressOrigin = accountsOrigin[0];
        const deployerAddressAuxiliary = accountsAuxiliary[0];

        const bountyOrigin = '100'; // TODO
        const bountyAuxiliary = '100'; // TODO

        const originInfo = await getChainInfo(rpcEndpointOrigin);
        const auxiliaryInfo = await getChainInfo(rpcEndpointAuxiliary);

        const originAddresses = await deployAnchorAndGateway(
            rpcEndpointOrigin,
            deployerAddressOrigin,
            tokenAddressOrigin,
            baseTokenAddressOrigin,
            bountyOrigin,
            auxiliaryInfo.chainId,
            auxiliaryInfo.blockHeight,
            auxiliaryInfo.stateRoot,
        );

        const gatewayAddressOrigin = originAddresses.EIP20Gateway;
        const auxiliaryAddresses = await deployAnchorAndCoGateway(
            rpcEndpointAuxiliary,
            deployerAddressAuxiliary,
            tokenAddressOrigin,
            gatewayAddressOrigin,
            bountyAuxiliary,
            originInfo.chainId,
            originInfo.blockHeight,
            originInfo.stateRoot,
        );
    });
});
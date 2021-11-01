require("dotenv").config();
const fs = require('fs');
const { ethers, network, upgrades } = require("hardhat");

const BRIDGE_CONFIG_ADDRESSES_FILE = './plazaBridgeAddresses.json';
const ADDRESSES_FILE = './addresses.json';

const main = async () => {
    const configJson = fs.readFileSync(BRIDGE_CONFIG_ADDRESSES_FILE);
    const BRIDGE_CONFIG_ADDRESSES = JSON.parse(configJson)
    const config = BRIDGE_CONFIG_ADDRESSES[network.name]
    if (!config) {
        console.error(`config does not exist for ${network.name}`) 
        return  
    }
    const plazaBridge = await ethers.getContractFactory("PaymentBridge");
    console.log('Deploying Plaza bridge...');
    const deployedBridge = await plazaBridge.deploy()
    console.log(`Intializing plaza bridge...${deployedBridge}`);
    console.log(config);
    console.log(config.treasuryAddress, config.wrapAndZapAddress, config.omnibridgeAddress, config.xdaibridgeAddress, config.daiAddress, config.wethAddress)
    await deployedBridge.initialize(config.treasuryAddress, config.wrapAndZapAddress, config.omnibridgeAddress, config.xdaibridgeAddress, config.daiAddress, config.wethAddress);
    await deployedBridge.deployTransaction.wait(40)

    const plazeBridgeTemplate = await ethers.getContractFactory("PaymentBridge");
    console.log('Deploying bridge template...');
    const deployedTemplate = await plazeBridgeTemplate.deploy()

    const plazaBridgeFactory = await ethers.getContractFactory("PaymentBridgeFactory");
    console.log('Deploying bridge factory...');
    const deployedFactory = await plazaBridgeFactory.deploy()
    console.log('Intializing bridge factory...');
    await deployedFactory.initialize(deployedTemplate.address, deployedBridge.address, 100)

    console.log('Finishing deployment...');
    const json = fs.readFileSync(ADDRESSES_FILE);
    const addresses = JSON.parse(json.length > 0 ? json : "{}");
    addresses[network.name] = {
        PaymentBridge: deployedTemplate.address,
        PaymentBridgeFactory: deployedFactory.address,
    };
    fs.writeFileSync(ADDRESSES_FILE, JSON.stringify(addresses, null, 4));
    
    console.log(`Deployed contract addresses can be found at ${ADDRESSES_FILE}.\nDone!`);
}


main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
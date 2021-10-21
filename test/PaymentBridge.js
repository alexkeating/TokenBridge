const { expect } = require("chai");
// Test cases
//
// 1. Make sure payee, feeAmount, template are set
// 2. Make sure fee can be updated
// 3. Make sure Pay goes to the bridge
// 4. Make sure poke releases stuck funds
// 5. Make sure receive sends to correct bridge

const IWETH = require('../artifacts/contracts/IWETH.sol/IWETH.json');
const ERC20 = require('../artifacts/@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol/IERC20Upgradeable.json');

describe("PaymentBridge", () => {
    let dai;
    let weth;
    let omnibridge;
    let xdaibridge;
    let plazaBridge;
    let bridgeTemplate;
    let paymentBridgeFactory;
    
    before(async () => {
        const factory = await ethers.getContractFactory("PaymentBridgeFactory");
        paymentBridgeFactory = await factory.deploy();
        const plazaBridgeFactory = await ethers.getContractFactory("PaymentBridge");
        plazaBridge = await plazaBridgeFactory.deploy();

        // Mock bridge setup
        const omnibridgeFactory = await ethers.getContractFactory("OmniBridgeMock");
        omnibridge = await omnibridgeFactory.deploy();
        const xdaibridgeFactory = await ethers.getContractFactory("OmniBridgeMock");
        xdaibridge = await xdaibridgeFactory.deploy();
        // Mock Token setup
        weth = await ethers.getContractFactory("WethMock")
        dai = await ethers.getContractFactory("DaiMock")


        // plazaBridge intialize
        const bridgeTemplateFactory = await ethers.getContractFactory("PaymentBridge");
        bridgeTemplate = await bridgeTemplateFactory.deploy();
 
    })
    it("Make sure contract variables are set", async function () {
        await paymentBridgeFactory.initialize(bridgeTemplate.address, plazaBridge.address, 10);
        expect(await paymentBridgeFactory.template()).to.equal(bridgeTemplate.address);
        expect(await paymentBridgeFactory.payeeBridge()).to.equal(plazaBridge.address);
        expect(await paymentBridgeFactory.feeAmount()).to.equal(10);
      });

    it("Payment bridge is created", async function () {
        // put together calldata call create

        await paymentBridgeFactory.initialize(bridgeTemplate.address, plazaBridge.address, 10);
        expect(await paymentBridgeFactory.template()).to.equal(bridgeTemplate.address);
        expect(await paymentBridgeFactory.payeeBridge()).to.equal(plazaBridge.address);
        expect(await paymentBridgeFactory.feeAmount()).to.equal(10);
      });

})
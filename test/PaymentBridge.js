const { expect } = require("chai");
const PaymentBridgeABI = require("../artifacts/contracts/PaymentBridge.sol/PaymentBridge.json").abi;
const WethMock = require("../artifacts/contracts/test/WethMock.sol/WethMock.json").abi;
// Test cases
//
// 1. Make sure payee, feeAmount, template are set
// 2. Make sure fee can be updated
// 3. Make sure Pay goes to the bridge
// 4. Make sure poke releases stuck funds
// 5. Make sure receive sends to correct bridge

describe("PaymentBridge", () => {
    let dai;
    let weth;
    let omnibridge;
    let xdaibridge;
    let plazaBridge;
    let bridgeTemplate;
    let paymentBridgeFactory;
    let alice;
    let bob;
    
    before(async () => {
        [alice, bob] = await ethers.getSigners();
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
        const wethFactory = await ethers.getContractFactory("WethMock")
        weth = await wethFactory.deploy()

        const daiFactory = await ethers.getContractFactory("DaiMock")
        dai = await daiFactory.deploy()

        resp = await plazaBridge.initialize(alice.address, ethers.constants.AddressZero, omnibridge.address, xdaibridge.address, dai.address, weth.address)
        await resp.wait()


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

    // TODO: It may rever because the account has no eth
    it("Payment bridge is created", async function () {
        // put together calldata call create
        const initData = await bridgeTemplate.populateTransaction.initialize(alice.address, ethers.constants.AddressZero, omnibridge.address, xdaibridge.address, dai.address, weth.address)
        const resp = await paymentBridgeFactory.createPaymentBridge(initData.data)
        const receipt = await resp.wait()

        const [bridgeOwner, bridge] = receipt.events.find(e => e.event === 'NewPaymentBridge').args;
        expect(bridgeOwner).to.equal(alice.address);

        // Everything is set properly
        const deployedBridge = new ethers.Contract(bridge, PaymentBridgeABI, alice);
        expect(await deployedBridge.treasuryAddress()).to.equal(alice.address);
        expect(await deployedBridge.initialized()).to.equal(true);
        expect(await deployedBridge.wrapAndZapAddress()).to.equal(ethers.constants.AddressZero);
        expect(await deployedBridge.omnibridgeAddress()).to.equal(omnibridge.address);
        expect(await deployedBridge.xdaibridgeAddress()).to.equal(xdaibridge.address);
        expect(await deployedBridge.daiAddress()).to.equal(dai.address)
        expect(await deployedBridge.weth()).to.equal(weth.address)

        // Make sure weth is properly approved
        const deployedWeth = new ethers.Contract(deployedBridge.weth(), WethMock, alice);
        const approved = await deployedWeth.allowance(bridge, omnibridge.address);
        expect(approved.toString()).to.equal("115792089237316195423570985008687907853269984665640564039457584007913129639935")

      });

    //it("Pay DAI on bridge", async function () {
    //    // Make sure alice has DAI
    //    // Pay DAI
    //    // Make sure the payment bridge has approval
    //    // Make sure there is DAI in the mock omnibridge 

    //    // put together calldata call create
    //    const initData = await bridgeTemplate.populateTransaction.initialize(alice.address, ethers.constants.AddressZero, omnibridge.address, xdaibridge.address, dai.address, weth.address)
    //    const resp = await paymentBridgeFactory.createPaymentBridge(initData.data)
    //    const receipt = await resp.wait()

    //    const [bridgeOwner, bridge] = receipt.events.find(e => e.event === 'NewPaymentBridge').args;
    //    expect(bridgeOwner).to.equal(alice.address);

    //    // Everything is set properly
    //    const deployedBridge = new ethers.Contract(bridge, PaymentBridgeABI, alice);
    //    expect(await deployedBridge.treasuryAddress()).to.equal(alice.address);
    //    expect(await deployedBridge.initialized()).to.equal(true);
    //    expect(await deployedBridge.wrapAndZapAddress()).to.equal(ethers.constants.AddressZero);
    //    expect(await deployedBridge.omnibridgeAddress()).to.equal(omnibridge.address);
    //    expect(await deployedBridge.xdaibridgeAddress()).to.equal(xdaibridge.address);
    //    expect(await deployedBridge.daiAddress()).to.equal(dai.address)
    //    expect(await deployedBridge.weth()).to.equal(weth.address)

    //    // Make sure weth is properly approved
    //    const deployedWeth = new ethers.Contract(deployedBridge.weth(), WethMock, alice);
    //    const approved = await deployedWeth.allowance(bridge, omnibridge.address);
    //    expect(approved.toString()).to.equal("115792089237316195423570985008687907853269984665640564039457584007913129639935")

    //  });


})
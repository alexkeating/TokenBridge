const { expect } = require("chai");
const PaymentBridgeABI = require("../artifacts/contracts/PaymentBridge.sol/PaymentBridge.json").abi;
const WethMock = require("../artifacts/contracts/test/WethMock.sol/WethMock.json").abi;

describe("PaymentBridge", () => {
    let dai;
    let usdc;
    let weth;
    let omnibridge;
    let xdaibridge;
    let plazaBridge;
    let bridgeTemplate;
    let paymentBridgeFactory;
    let alice;
    let bob;
    let bridge
    let bridgeOwner
    
    before(async () => {
        [admin, alice, bob, greg] = await ethers.getSigners();
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
        dai = await daiFactory.connect(admin).deploy()
        resp = await dai.initialize("Fake Dai", "fDAI")
        await resp.wait()

        await dai.connect(admin).mint(alice.address, ethers.utils.parseEther("100"));

        const usdcFactory = await ethers.getContractFactory("DaiMock")
        usdc = await usdcFactory.connect(admin).deploy()
        resp = await usdc.initialize("Fake USDC", "fUSDC")
        await resp.wait()

        await usdc.connect(admin).mint(alice.address, ethers.utils.parseEther("100"));

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

    it("Payment bridge is created", async function () {
        const initData = await bridgeTemplate.populateTransaction.initialize(alice.address, ethers.constants.AddressZero, omnibridge.address, xdaibridge.address, dai.address, weth.address)
        const resp = await paymentBridgeFactory.createPaymentBridge(initData.data, {value: 10})
        const receipt = await resp.wait()

        const [bridgeOwner, bridgeAddress] = receipt.events.find(e => e.event === 'NewPaymentBridge').args;
        bridge = bridgeAddress
        expect(bridgeOwner).to.equal(admin.address);

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

    it("Pay DAI on bridge", async function () {
        const deployedBridge = new ethers.Contract(bridge, PaymentBridgeABI, alice);
        await dai.connect(alice).approve(bridge, 10);
        
        const resp = await deployedBridge.pay(10, dai.address)
        const receipt = await resp.wait()

        const balance = await dai.balanceOf(xdaibridge.address)
        expect(balance.toString()).to.equal("10")

        const bridgeBalance = await dai.balanceOf(bridge)
        expect(bridgeBalance.toString()).to.equal("0")

        const aliceBalance = await dai.balanceOf(alice.address)
        expect(aliceBalance.toString()).to.equal("99999999999999999990")
      });

    it("Pay Random ERC20 on bridge", async function () {
        const deployedBridge = new ethers.Contract(bridge, PaymentBridgeABI, alice);
        await usdc.connect(alice).approve(bridge, 10);
        
        const resp = await deployedBridge.pay(10, usdc.address)
        const receipt = await resp.wait()

        const balance = await usdc.balanceOf(omnibridge.address)
        expect(balance.toString()).to.equal("10")

        const bridgeBalance = await usdc.balanceOf(bridge)
        expect(bridgeBalance.toString()).to.equal("0")

        const aliceBalance = await usdc.balanceOf(alice.address)
        expect(aliceBalance.toString()).to.equal("99999999999999999990")
      });

    it("Pay Eth to bridge", async function () {
        const deployedBridge = new ethers.Contract(bridge, PaymentBridgeABI, alice);
        
        const resp = await deployedBridge.pay(10, ethers.constants.AddressZero, {value: 10})
        const receipt = await resp.wait()

        const balance = await weth.balanceOf(omnibridge.address)
        expect(balance.toString()).to.equal("20")

        const bridgeBalance = await weth.balanceOf(bridge)
        expect(bridgeBalance.toString()).to.equal("0")
      });

    it("Poke stuck erc20", async function () {
        const deployedBridge = new ethers.Contract(bridge, PaymentBridgeABI, admin);
        await usdc.connect(alice).transfer(bridge, 10);

        const balance = await usdc.balanceOf(bridge)
        expect(balance.toString()).to.equal("10")
        
        const resp = await deployedBridge.poke(10, usdc.address)
        const receipt = await resp.wait()

        const omniBalance = await usdc.balanceOf(omnibridge.address)
        expect(omniBalance.toString()).to.equal("20")

        const bridgeBalance = await usdc.balanceOf(bridge)
        expect(bridgeBalance.toString()).to.equal("0")

        const aliceBalance = await usdc.balanceOf(alice.address)
        expect(aliceBalance.toString()).to.equal("99999999999999999980")
      });
    it("Poke stuck weth", async function () {
        const transactionHash = await alice.sendTransaction({
          to: bridge,
          value: 10,
        });
        const balance = await weth.balanceOf(omnibridge.address)
        expect(balance.toString()).to.equal("30")

        const bridgeBalance = await weth.balanceOf(bridge)
        expect(bridgeBalance.toString()).to.equal("0")
      });

      it("Payment bridge is created with wrapNZap", async function () {
        const initData = await bridgeTemplate.populateTransaction.initialize(alice.address, admin.address, omnibridge.address, xdaibridge.address, dai.address, weth.address)
        const resp = await paymentBridgeFactory.createPaymentBridge(initData.data, {value: 10})
        const receipt = await resp.wait()

        const [bridgeOwner, bridgeAddress] = receipt.events.find(e => e.event === 'NewPaymentBridge').args;
        expect(bridgeOwner).to.equal(admin.address);

        // Everything is set properly
        const deployedBridge = new ethers.Contract(bridgeAddress, PaymentBridgeABI, alice);
        await deployedBridge.pay(10, ethers.constants.AddressZero, {value: 10})

        const receiver = await omnibridge.receiver()
        expect(receiver).to.equal(admin.address)
      });
})
const { ethers } = require("hardhat");
const { network } = require("hardhat");
const { networkConfig, developmentChains } = require("../helper-hardhat-config");
module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();

    const chainId = network.config.chainId;
    const FUND_AMOUNT = ethers.utils.parseUnits("30", "ether");

    let vrfCoordinatorV2Address, vrfCoordinatorV2Mock, subscriptionId;
    if (chainId == 31337) {
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address;
        transactionResponse = await vrfCoordinatorV2Mock.createSubscription();
        transactionReceipt = await transactionResponse.wait(1);

        subscriptionId = transactionReceipt.events[0].args.subId;
        vrfCoordinatorV2Mock.fundSubscription(subscriptionId, FUND_AMOUNT);
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId]["vrfCoordinator"];
        subscriptionId = networkConfig[chainId]["subscriptionId"];
    }

    const gasLane = networkConfig[chainId]["gasLane"];
    const entranceFee = networkConfig[chainId]["entranceFee"];
    const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"];
    const interval = networkConfig[chainId]["interval"];
    const args = [
        vrfCoordinatorV2Address,
        subscriptionId,
        gasLane,
        interval,
        entranceFee,
        callbackGasLimit,
    ];

    const raffle = await deploy("Raffle", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: 1,
    });
};

module.exports.tags = ["all", "raffle"];

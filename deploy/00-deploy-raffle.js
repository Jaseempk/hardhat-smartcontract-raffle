const { ethers } = require("hardhat");
const { network } = require("hardhat");
const { networkConfig, developmentChains } = require("../helper-hardhat-config");
module.exports = async ({ getNamedAccounts, deployments }) => {
    const [deploy, log] = deployments;
    const [deployer] = await getNamedAccounts();

    const chainId = network.config.chainId;
    const FUND_AMOUNT = ethers.utils.parseUnits("1", "ether");

    let vrfCoordinatorV2Address, vrfCoordinatorV2Mock;
    if (developmentChains.includes(network.name)) {
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
    const args = [vrfCoordinatorV2Address, gasLane, entranceFee, callbackGasLimit, interval];

    const raffle = await deploy("Raffle", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    });
    if (developmentChains.includes(network.name)) {
        const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
        await vrfCoordinatorV2Mock.addConsumer(subscriptionId, raffle.address);
    }
};

module.exports.tags = ["all", "raffle"];

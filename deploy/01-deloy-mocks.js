const { developmentChains } = require("../helper-hardhat-config");
const { network } = require("hardhat");

async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();

    const BASE_FEE = 0.25;
    const GAS_LINK = 1e9;

    args = [BASE_FEE, GAS_LINK];
    if (developmentChains.includes(network.name)) {
        console.log("localhost detected!deploying.......");
        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            args: args,
            log: true,
        });
    }
};

module.exports.tags = ["all", "mocks"];

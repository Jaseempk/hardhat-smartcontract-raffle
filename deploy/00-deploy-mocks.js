const { network } = require("hardhat");
const { networkConfig, developmentChains } = require("../helper-hardhat-config");

const BASE_FEE = "250000000000000000";
const GAS_LINK = 1e9;
module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();

    const chainId = network.config.chainId;

    const args = [BASE_FEE, GAS_LINK];
    if (chainId == 31337) {
        console.log("localhost detected!deploying.......");
        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            log: true,
            args: args,
        });
    }
};

module.exports.tags = ["all", "mocks"];

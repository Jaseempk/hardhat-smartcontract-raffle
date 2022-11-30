const { ethers } = require("hardhat");

const networkConfig = {
    default: {
        name: "hardhat",
    },
    5: {
        name: "goerli",
        vrfCoordinator: "0x2ca8e0c643bde4c2e08ab1fa0da3401adad7734d",
        subscriptionId: "0",
        gasLane: "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
        callbackGasLimit: "2500000",
        interval: "30",
        entranceFee: ethers.utils.parseUnits("0.01", "ether"),
    },
    31337: {
        name: "localhost",
        subscriptionId: "588",
        gasLane: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc", // 30 gwei
        interval: "30",
        entranceFee: ethers.utils.parseUnits("0.01", "ether"), // 0.01 ETH
        callbackGasLimit: "2500000", // 500,000 gas
    },
};

const developmentChains = ["hardhat", "localhost"];
module.exports = { networkConfig, developmentChains };

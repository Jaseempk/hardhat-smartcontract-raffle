const { ethers } = require("hardhat");

const networkConfig = {
    5: {
        vrfCoordinator: "0x2ca8e0c643bde4c2e08ab1fa0da3401adad7734d",
        gasLane: "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
        callbackGasLimit: "2500000",
        interval: "30",
        entranceFee: ethers.utils.parseUnits("0.01","ether"),
        subscriptionId: "0",
    },
    31337: {
        //vrfCoordinator: 0x2ca8e0c643bde4c2e08ab1fa0da3401adad7734d,
        gasLane: 0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15,
        calllbackGasLimit: "2500000",
        entranceFee: ethers.utils.parseUnits("0.01","ether"),
    },
};

const developmentChains = ["hardhat", "localhost"];
module.exports = { networkConfig, developmentChains };

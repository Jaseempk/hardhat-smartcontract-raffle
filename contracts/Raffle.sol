//Raffle
//Enter the raffle
//Pick a random winner
//make this automated using chainlink keepers,by selecting winner after a particular nterval

//SPDX-License-Identifier:MIT

pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AutomationCompatibleInterface.sol";

error Raffle___notEnoughFee();
error Raffle__notOpen();
error Raffle_withdrawalFailed();
error Raffle__upkeepFailed();

contract Raffle is VRFConsumerBaseV2, AutomationCompatibleInterface, VRFCoordinatorV2Interface {
    //type
    enum RaffleState {
        OPEN,
        CALCULATING
    }

    /**state variables */

    VRFCoordinatorV2Interface private immutable vrfCoordinator;
    bytes32 private immutable i_gasLane;
    uint64 private immutable i_subscriptionId;
    uint32 private s_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint16 private constant NUM_WORDS = 1;

    //raffle variables
    uint256 private immutable i_entranceFee;
    address payable[] private s_players;
    uint256 private immutable i_interval;
    RaffleState private s_raffleState;
    address private s_recentWinner;
    uint256 private s_lastTimestamp;

    /**Events */
    event RaffleEnter(address indexed player);
    event getRecentWinner(address indexed player);
    event RequestedRaffleWinner(uint256 indexed requestId);

    /**FUNCTIONS */

    constructor(
        address vrfCoordinatorV2,/**interacting with outside contract */
        uint64 subscriptionId,
        bytes32 gasLane,
        uint256 interval,
        uint32 callbackGasLimit,
        uint256 entranceFee
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_subscriptionId=subscriptionId ;
        i_gasLane=gasLane;
        i_interval = interval;
        callbackGasLimit = s_callbackGasLimit;
        i_entranceFee = entranceFee;
        s_lastTimestamp = block.timestamp;
        s_raffleState = RaffleState.OPEN;
    }

    function enterRaffle() public payable {
        if (msg.value < i_entranceFee) {
            revert Raffle___notEnoughFee();
        }
        if (s_raffleState != RaffleState.OPEN) {
            revert Raffle__notOpen();
        }
        s_players.push(payable(msg.sender));
        emit RaffleEnter(msg.sender);
    }
    /**this  function is a chainlink VRF V2
     * checkUpkeep checks whether there is the basic requirements to keep this contract functional
     * performUpkeep performs the function of finding the randomNumber and it automates the process of finding randomnumber
     */

    function checkUpkeep(
        bytes memory /**checkData */
    )
        public
        view
        override
        returns (
            bool upkeepNeeded,
            bytes memory /**performData */
        )
    {
        bool isOpen = s_raffleState == RaffleState.OPEN;
        bool hasPlayers = s_players.length > 0;
        bool hasBalance = address(this).balance > 0;
        bool isTime = (block.timestamp - s_lastTimestamp) > i_interval;
        upkeepNeeded = (isOpen && hasPlayers && isTime && hasBalance);
        return (upkeepNeeded,"0x0");
    }

    function performUpkeep(
        bytes calldata /**performData */
    ) external override {
        (bool upkeepNeeded, ) = checkUpkeep("");
        if (!upkeepNeeded) {
            revert Raffle__upkeepFailed();
        }
        s_raffleState = RaffleState.OPEN;
        uint256 requestId = vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            s_callbackGasLimit,
            NUM_WORDS
        );
        emit RequestedRaffleWinner(requestId);
    }
    /**this function  is responsible for choosing the winner once the random number is found
     * this process will be repeated after particular time-intervals
     */

    function fulfillRandomWords(uint256 /**requestId */, uint256[] memory randomWords) internal override {
        uint256 indexOfWinner = randomWords[0] % s_players.length;
        address payable recentWinner = s_players[indexOfWinner];
        s_recentWinner = recentWinner;
        s_raffleState = RaffleState.OPEN;
        s_lastTimestamp = block.timestamp;
        s_players = new address payable[](0);
        (bool success, ) = recentWinner.call{value: address(this).balance}("");
        if (!success) {
            revert Raffle_withdrawalFailed();
        }
        emit getRecentWinner(s_recentWinner);
    }

    function getRequestConfig()
        external
        view
        override
        returns (
            uint16,
            uint32,
            bytes32[] memory
        )
    {}

    function requestRandomWords(
        bytes32 keyHash,
        uint64 subId,
        uint16 minimumRequestConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords
    ) external override returns (uint256 requestId) {}

    function createSubscription() external override returns (uint64 subId) {}

    function getSubscription(uint64 subId)
        external
        view
        override
        returns (
            uint96 balance,
            uint64 reqCount,
            address owner,
            address[] memory consumers
        )
    {}

    function requestSubscriptionOwnerTransfer(uint64 subId, address newOwner) external override {}

    function acceptSubscriptionOwnerTransfer(uint64 subId) external override {}

    function addConsumer(uint64 subId, address consumer) external override {}

    function removeConsumer(uint64 subId, address consumer) external override {}

    function cancelSubscription(uint64 subId, address to) external override {}

    function pendingRequestExists(uint64 subId) external view override returns (bool) {}
}

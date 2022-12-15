const { developmentChains, networkConfig } = require("../helper-hardhat-config");
const { getNamedAccounts, deployments, ethers, network } = require("hardhat");
const { assert, expect } = require("chai");

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("raffle unit tests", function () {
          let vrfCoordinatorV2Mock,
              Raffle,
              interval,
              enterRaffle,
              raffleEntranceFee,
              deployer,
              raffleState;

          const chainId = network.config.chainId;
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer;
              await deployments.fixture(["all"]);
              Raffle = await ethers.getContract("Raffle", deployer);
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer);
              interval = await Raffle.getInterval();
              //enterRaffle = await Raffle.enterRaffle();
              raffleEntranceFee = networkConfig[chainId]["entranceFee"];
              raffleState = await Raffle.getRaffleState();
          });
          describe("Constructor", function () {
              it("testing for the rafflestate", async function () {
                  assert.equal(raffleState.toString(), "0");
              });
              it("testing for the interval", async function () {
                  assert.equal(interval.toString(), networkConfig[chainId]["interval"]);
              });
          });
          describe("EnterRaffle", function () {
              it("checking if sending insufficient eth throws an error", async function () {
                  await expect(Raffle.enterRaffle()).to.be.revertedWith("Raffle__notEnoughFee");
              });
              it("checks whether the players array is being updated", async function () {
                  await Raffle.enterRaffle({ value: raffleEntranceFee });
                  const firstSender = await Raffle.getPlayer(0);
                  assert.equal(firstSender, deployer);
              });
              it("checks whether the events are emitted properly", async function () {
                  await expect(Raffle.enterRaffle({ value: raffleEntranceFee })).to.emit(
                      Raffle,
                      "RaffleEnter"
                  );
              });
              it("doesnt allow entrance when the raffle is calculating", async function () {
                  await Raffle.enterRaffle({ value: raffleEntranceFee });
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                  await network.provider.send("evm_mine", []);
                  //we simulate being chainlink keeper
                  await Raffle.callStatic.performUpkeep([]);
                  await expect(Raffle.enterRaffle({ value: raffleEntranceFee })).to.be.revertedWith(
                      "Raffle__notOpen"
                  );
              });
          });
          describe("checkUpkeep", function () {
              it("throws error if no fee is send", async function () {
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                  await network.provider.send("evm_mine", []);
                  //simulate calling performUpkeep
                  const { upkeepNeeded } = await Raffle.callStatic.checkUpkeep([]);
                  assert(!upkeepNeeded);
              });
              it("throws error when the raffleState is calculating", async function () {
                  await Raffle.enterRaffle({ value: raffleEntranceFee });
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                  await network.provider.send("evm_mine", []);
                  await Raffle.performUpkeep([]);
                  const raffleState = await Raffle.getRaffleState();
                  const { upkeepNeeded } = await Raffle.callStatic.checkUpkeep([]);
                  assert.equal(raffleState.toString(), "1");
                  assert.equal(upkeepNeeded, false);
              });
              /**
               * 
              it("returns false when the time hasn't passed yet ", async function () {
                  await Raffle.enterRaffle({ value: raffleEntranceFee });
                  await network.provider.send("evm_increaseTime", [interval.toNumber() - 1]);
                  await network.provider.send("evm_mine", []);
                  const { upkeepNeeded } = await Raffle.callStatic.checkUpkeep([]);
                  assert(!upkeepNeeded);
              });
               */
              it("returns true when its time", async function () {
                  await Raffle.enterRaffle({ value: raffleEntranceFee });
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                  await network.provider.send("evm_mine", []);
                  const { upkeepNeeded } = await Raffle.callStatic.checkUpkeep([]);
                  assert(upkeepNeeded);
              });
          });
          describe("performUpkeep", function () {
              it("throws error if checkUpkeep is not true", async function () {
                  await Raffle.enterRaffle({ value: raffleEntranceFee });
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                  await network.provider.send("evm_mine", []);
                  const tx = await Raffle.performUpkeep([]);
                  assert(tx);
              });
              it("throws error when checkUpkeep is false", async function () {
                  await expect(Raffle.performUpkeep([])).to.be.revertedWith("Raffle__upkeepFailed");
              });
              it("it changes the raffleState,emits the event& calls vrf coordinator", async function () {
                  await Raffle.enterRaffle({ value: raffleEntranceFee });
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                  await network.provider.send("evm_mine", []);
                  const txResponse = await Raffle.performUpkeep([]);
                  const txReceipt = await txResponse.wait(1);
                  const requestId = txReceipt.events[1].args.requestId;
                  const raffleState = await Raffle.getRaffleState();
                  assert(requestId.toNumber() > 0);
                  assert(raffleState.toString() == 1);
              });
          });
          describe("fullfilRandomWords", function () {
              beforeEach(async function () {
                  await Raffle.enterRaffle({ value: raffleEntranceFee });
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                  await network.provider.send("evm_mine", []);
              });
              it("reverts back if fulfillRandomWOrds is not called", async function () {
                  await expect(
                      vrfCoordinatorV2Mock.fulfillRandomWords(0, Raffle.address)
                  ).to.be.revertedWith("nonexistent request");
                  await expect(
                      vrfCoordinatorV2Mock.fulfillRandomWords(1, Raffle.address)
                  ).to.be.revertedWith("nonexistent request");
              });
              it("selects the winner,resets the players array & transfers the price", async function () {
                  const additionalEntrants = 3;
                  const startingAccountIndex = 2;
                  const accounts = await ethers.getSigners();
                  console.log("saathanam kayyilundo?");
                  for (
                      let i = startingAccountIndex;
                      i < startingAccountIndex + additionalEntrants;
                      i++
                  ) {
                      const accountConnectedRaffle = Raffle.connect(accounts[i]);
                      await accountConnectedRaffle.enterRaffle({ value: raffleEntranceFee });
                  }
                  const startingTimestamp = await Raffle.getLatestTimestamp();

                  await new Promise(async (resolve, reject) => {
                      Raffle.once("getRecentWinner", async () => {
                          console.log("event found");
                          try {
                              const endingTimestamp = await Raffle.getLatestTimestamp();
                              const recentWinner = await Raffle.getWinner();
                              const raffleState = await Raffle.getRaffleState();
                              const numPlayers = await Raffle.getPlayers();
                              assert.equal(numPlayers.toString(), "0");
                              assert.equal(raffleState.toString(), "0");
                              assert(endingTimestamp > startingTimestamp);
                              resolve();
                          } catch (error) {
                              reject(error);
                          }
                      });
                      const tx = await Raffle.performUpkeep([]);
                      const txReceipt = await tx.wait(1);
                      await vrfCoordinatorV2Mock.fulfillRandomWords(
                          txReceipt.events[1].args.requestId,
                          Raffle.address
                      );
                  });
              });
          });
      });

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Chainlink Handler", function () {
  it("Should return the userId from the API called", async function () {
    console.log("Getting the deployed chainlink handler contract")
    const Handler = await ethers.getContractFactory("Handler");
    const handler = await Handler.attach("0x575718731AA34410685d4Df26aDE38C75d070C5a")

    // call the fetch data function
    const fetchDataTx = await handler.fetchData();
    console.log("Fetch Data Transaction Mined");

    //wait 30 secs for oracle to callback
    console.log("Waiting for oracle to fulfill the response")
    await new Promise(resolve => setTimeout(resolve, 10000))

    const id = await handler.getId();
    console.log("ID set: ", id);
  });
});

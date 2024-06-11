const {applyTemplate} = require("../utils/templates");
const enquirer = require("enquirer");
const path = require("path");
const {cantripsScope, inputUntil} = require("./common");
const {parseAddress, parseAccount} = require("../utils/accounts");
const {parseAmount} = require("../utils/amounts");


cantripsScope.task("transfer", "Sends ETH from an account (by index) to another account (by index or address)")
    .addParam("fromAccount", "The index (0 to number of accounts - 1) of the account to send ETH from")
    .addParam("amount", "The amount to send, e.g. 1eth, 2.5eth or 3000000000000000000")
    .addParam("toAccount", "The index (0 to number of accounts - 1), or address, of the account to send ETH to")
    .setAction(async ({ fromAccount, amount, toAccount }, hre, runSuper) => {
        try {
            const fromAddress = await parseAccount(fromAccount, hre);
            const toAddress = await parseAddress(toAccount, hre);
            const nativeAmount = parseAmount(amount, hre);
            await (await hre.ethers.getSigners())[parseInt(fromAccount)].sendTransaction({
                to: toAddress, value: nativeAmount
            })
            console.log(`Transferred from ${fromAddress} to ${toAddress} an amount of ${nativeAmount} wei successfully.`);
        } catch(e) {
            console.log(e);
        }
    });
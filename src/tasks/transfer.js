const {cantripsScope, inputUntil} = require("./common");
const {parseSmartAddress, parseAccount} = require("../utils/accounts");
const {parseAmount} = require("../utils/amounts");


cantripsScope.task("transfer", "Sends ETH from an account (by index) to another account (by index or address)")
    .addOptionalParam("amount", "The amount to send, e.g. 1eth, 2.5eth or 3000000000000000000")
    .addOptionalParam("toAddress", "The index (0 to number of accounts - 1), or address, of the account to send ETH to")
    .addOptionalParam("usingAccount", "The index (0 to number of accounts - 1) of the account to send ETH from")
    .addFlag("forceNonInteractive", "Raise an error if one or more params were not specified and the action would become interactive")
    .setAction(async ({usingAccount, amount, toAddress, forceNonInteractive}, hre, runSuper) => {
        try {
            const usingAccount_ = await parseAccount(usingAccount || "0", hre);
            const toAddress_ = await parseSmartAddress(toAddress || await inputUntil(
                "0", "Insert checksum address or account index:", (v) => {
                    return /^(\d+)|(0x[a-fA-F0-9]{40})$/.test(v);
                }, "The value is not a valid address or account index", forceNonInteractive
            ), hre);
            const nativeAmount = parseAmount(amount || await inputUntil(
                "1eth", "Insert amount (e.g. 1500000000000000000 or 1.5eth)", (v) => {
                    return /^(\d+(\.\d+)?)\s*eth$/i.test(v.trim());
                }, "The given amount is not valid", forceNonInteractive
            ), hre);
            await usingAccount_.sendTransaction({
                to: toAddress_, value: nativeAmount
            })
            console.log(`Transferred from ${usingAccount_.address} to ${toAddress_} an amount of ${nativeAmount} wei successfully.`);
        } catch(e) {
            console.log(e);
        }
    });

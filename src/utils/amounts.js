/**
 * Parses an ETH amount from wei or expressions like "1.5eth" or "2 eth".
 * @param amount The amount to parse.
 * @param hre The hardhat runtime environment.
 * @returns {bigint} The parsed amount.
 */
function parseAmount(amount, hre) {
    amount = (amount || "").trim();
    if (!amount) return 0n;

    if (/^\d+$/.test(amount)) {
        return BigInt(amount);
    }

    // Check if input is in the format "X eth" where X is a non-negative number
    const ethPattern = /^(\d+(\.\d+)?)\s*eth$/i;
    const match = amount.match(ethPattern);
    if (match) {
        const valueInEth = match[1];
        const valueInWei = hre.ethers.parseEther(valueInEth);
        return BigInt(valueInWei.toString());
    }

    throw new Error("The specified amount is not valid.");
}


module.exports = {
    parseAmount
}
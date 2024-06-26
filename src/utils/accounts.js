/**
 * Parses a specific index and returns the associated account.
 * @param account The index of the account.
 * @param hre The hardhat runtime environment.
 * @returns {Promise<*>} The account object (async function).
 */
async function parseAccount(account, hre) {
    const accounts = await hre.ethers.getSigners();
    account = (account || "").trim();

    if (/^[\d+]$/.test(account)) {
        let index = parseInt(account);
        if (index < 0 || index >= accounts.length) {
            throw new Error("The chosen index is not among the allowed signers.");
        }
        return accounts[index];
    } else {
        throw new Error("The chosen account is not valid. Specify a valid index.");
    }
}


/**
 * Parses a specific index/address and returns the associated address.
 * @param account The account index, or address, to parse/validate.
 * @param hre The hardhat runtime environment.
 * @returns {Promise<*>} The resulting address (obtained or validated; async function).
 */
async function parseSmartAddress(account, hre) {
    const accounts = await hre.ethers.getSigners();
    account = (account || "").trim();

    if (/^[\d+]$/.test(account)) {
        let index = parseInt(account);
        if (index < 0 || index >= accounts.length) {
            throw new Error("The chosen index is not among the allowed signers.");
        }
        return accounts[index].getAddress();
    } else if (/^0x[a-fA-F0-9]$/.test(account)) {
        try {
            return hre.ethers.getAddress(account);
        } catch(e) {
            throw new Error("The chosen checksum address is not valid.");
        }
    } else {
        throw new Error("The chosen account is not valid. Either specify an index or an address.");
    }
}


/**
 * Parses an address and returns it as a checksum one.
 * @param address The address to validate and parse.
 * @param hre The hardhat runtime environment.
 * @returns {*|string}
 */
function parseAddress(address, hre) {
    if (/^0x[a-fA-F0-9]{40}$/.test(address)) {
        try {
            return hre.ethers.getAddress(address);
        } catch(e) {
            throw new Error("The chosen checksum address is not valid.");
        }
    } else {
        throw new Error("The chosen address is not valid. Specify a valid lowercase or checksum address.")
    }
}


module.exports = {
    parseSmartAddress, parseAccount, parseAddress
}
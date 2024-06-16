/**
 * Parses a chain id (from a positive integer).
 * @param chainId The chain id as text.
 * @returns {number} The chain id as number.
 */
function parseChainId(chainId) {
    if (/^[1-9]\d*$/.test(chainId)) {
        return parseInt(chainId);
    } else {
        throw new Error("Invalid chain id. Must be a base-10 positive number.");
    }
}


module.exports = {
    parseChainId
}
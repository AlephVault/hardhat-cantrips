/**
 * Coerces a value to a number of 0.
 * @param value The value to convert.
 * @param allowNegative Whether to allow negative values.
 * @returns {number} The value.
 */
function toNumber(value, allowNegative = false) {
    if (typeof value === "bigint") value = Number(value);
    if (typeof value !== "number" || (value < 0 && !allowNegative)) value = 0;
    return value;
}


/**
 * Repeats the same string N times.
 * @param value The string to repeat.
 * @param times The amount of times.
 * @returns {string} The repeated string.
 */
function repeat(value, times) {
    times = toNumber(times);
    let result = "";
    for(let x = 0; x < times; x++) {
        result += value;
    }
    return result;
}


/**
 * Trims trailing zeroes of a fractional part.
 * @param fractional The fractional part.
 * @returns {string} The trimmed fractional part.
 */
function trimFractional(fractional) {
    while(true) {
        if (fractional === ".") {
            return "";
        } else if (fractional.endsWith("0")) {
            fractional = fractional.substring(0, fractional.length - 1);
        } else {
            return fractional;
        }
    }
}

/**
 * Loads a string value as a bigint with a certain decimal precision.
 * @param value The value
 * @param decimals The amount of decimals
 */
function load(value, decimals) {
    value = (value || "").toString().trim();
    decimals = toNumber(decimals);
    if (typeof decimals === "bigint") decimals = Number(decimals);
    if (typeof decimals !== "number" || decimals < 0) decimals = 0;
    if (/^\d+$/.test(value)) {
        return BigInt(value + repeat("0", decimals));
    } else if (/^\d+.\d+$/.test(value)) {
        const parts = value.split(".");
        const fracLength = parts[1].length;
        const integerPart = parts[0];
        const fractionalPart = fracLength > decimals
            ? parts[1].substring(0, decimals)
            : parts[1] + repeat("0", decimals - fracLength)
        return BigInt(`${integerPart}${fractionalPart}`);
    } else {
        throw new Error("Invalid numeric value");
    }
}


/**
 * Dumps a string value from a bigint with a certain decimal precision.
 * @param value The value to dump.
 * @param decimals The amount of decimals to consider.
 */
function dump(value, decimals) {
    value = toNumber(value, true).toString();
    decimals = toNumber(decimals, false);
    if (value === "0") {
        return 0;
    } else if (value.length === decimals) {
        return "0." + trimFractional(value);
    } else if (value.length < decimals) {
        return "0." + repeat("0", decimals - value.length) + trimFractional(value);
    } else {
        return value.substring(0, value.length - decimals) + trimFractional(
            "." + value.substring(value.length - decimals)
        );
    }
}


module.exports = {
    load, dump
}